from datetime import datetime, timedelta, timezone
import hmac
from hashlib import sha256
from secrets import randbelow, token_urlsafe
from typing import Dict

from fastapi import HTTPException, status
from fastapi_mail import FastMail, MessageSchema
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.api.users.crud.user_crud import delete_user_with_related_data, get_user_by_id
from app.api.users.schemas.user_schemas import DeleteAccountConfirm, DeleteAccountRequest
from app.api.users.commands.reset_password import conf
from core.config import settings


DELETE_CONFIRMATION_TTL_MINUTES = 15
_pending_delete_requests: Dict[str, dict] = {}


def _hash_code(code: str) -> str:
    return hmac.new(settings.JWT_SECRET_KEY.encode("utf-8"), code.encode("utf-8"), sha256).hexdigest()


def _cleanup_expired_requests() -> None:
    now = datetime.now(timezone.utc)
    expired_tokens = [
        token
        for token, payload in _pending_delete_requests.items()
        if payload["expires_at"] <= now
    ]
    for token in expired_tokens:
        _pending_delete_requests.pop(token, None)


async def send_delete_email(email: str, code: str) -> None:
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #b91c1c;">Подтверждение удаления аккаунта KokMaisa</h2>
        <p>Здравствуйте!</p>
        <p>Мы получили запрос на удаление вашего аккаунта. Для подтверждения введите этот код на странице настроек:</p>
        <p style="margin: 24px 0; font-size: 32px; font-weight: 700; letter-spacing: 0.18em; color: #111827;">
          {code}
        </p>
        <p>Код действует <strong>{DELETE_CONFIRMATION_TTL_MINUTES} минут</strong>.</p>
        <p>Если это были не вы, просто проигнорируйте письмо. Аккаунт не будет удалён без ввода кода.</p>
        <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
          С уважением,<br>
          Команда KokMaisa
        </p>
      </body>
    </html>
    """

    message = MessageSchema(
        subject="Подтверждение удаления аккаунта — KokMaisa",
        recipients=[email],
        body=html,
        subtype="html",
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def request_delete_account(current_user, delete_request: DeleteAccountRequest):
    if delete_request.email.lower() != current_user.email.lower():
        raise ValueError("Email не совпадает с текущим аккаунтом")

    _cleanup_expired_requests()

    code = f"{randbelow(1_000_000):06d}"
    confirmation_token = token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=DELETE_CONFIRMATION_TTL_MINUTES)

    _pending_delete_requests[confirmation_token] = {
        "user_id": current_user.id,
        "code_hash": _hash_code(code),
        "expires_at": expires_at,
    }

    await send_delete_email(current_user.email, code)

    return {
        "message": "Код подтверждения отправлен на email",
        "confirmation_token": confirmation_token,
        "expires_in_minutes": DELETE_CONFIRMATION_TTL_MINUTES,
    }


def confirm_delete_account(db: Session, current_user, delete_confirm: DeleteAccountConfirm):
    _cleanup_expired_requests()

    pending = _pending_delete_requests.get(delete_confirm.confirmation_token)
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Запрос на удаление не найден или истёк",
        )

    if pending["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Этот код подтверждения принадлежит другому аккаунту",
        )

    if not hmac.compare_digest(_hash_code(delete_confirm.code), pending["code_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный код подтверждения",
        )

    user = get_user_by_id(db, current_user.id)
    if not user:
        raise ValueError("Пользователь не найден")

    delete_user_with_related_data(db, user)
    _pending_delete_requests.pop(delete_confirm.confirmation_token, None)

    return {"message": "Аккаунт успешно удалён"}
