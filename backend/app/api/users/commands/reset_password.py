# backend/app/api/users/commands/reset_password.py
from datetime import timedelta
from fastapi import HTTPException, status
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from core.config import settings
from core.security import create_access_token
from app.api.users.schemas.user_schemas import PasswordResetRequest, PasswordReset
from app.api.users.crud.user_crud import get_user_by_email, get_user_by_id, update_password

conf = ConnectionConfig(
    MAIL_USERNAME=settings.EMAIL_USERNAME,
    MAIL_PASSWORD=settings.EMAIL_PASSWORD,
    MAIL_FROM=settings.EMAIL_FROM,
    MAIL_PORT=settings.EMAIL_PORT,
    MAIL_SERVER=settings.EMAIL_HOST,
    MAIL_FROM_NAME=settings.EMAIL_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_reset_email(email: str, token: str):
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2f855a;">Сброс пароля в KokMaisa</h2>
        <p>Здравствуйте!</p>
        <p>Вы запросили сброс пароля. Перейдите по ссылке ниже, чтобы установить новый пароль:</p>
        <p style="margin: 20px 0;">
          <a href="{reset_link}" style="background-color: #2f855a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Сбросить пароль
          </a>
        </p>
        <p>Ссылка действительна <strong>30 минут</strong>.</p>
        <p>Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>
        <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
          С уважением,<br>
          Команда KokMaisa
        </p>
      </body>
    </html>
    """

    message = MessageSchema(
        subject="Сброс пароля — KokMaisa",
        recipients=[email],
        body=html,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def request_reset(db: Session, reset_request: PasswordResetRequest):
    user = get_user_by_email(db, reset_request.email)
    if not user:
        raise ValueError("Пользователь с таким email не найден")

    reset_token_expires = timedelta(minutes=30)
    reset_token = create_access_token(
        data={"sub": "reset", "user_id": user.id},
        expires_delta=reset_token_expires
    )

    await send_reset_email(reset_request.email, reset_token)

    return {"message": "Ссылка для сброса пароля отправлена на email"}


def execute_reset(db: Session, reset_data: PasswordReset):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Недействительный или просроченный токен"
    )

    try:
        payload = jwt.decode(
            reset_data.token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: int = payload.get("user_id")
        sub: str = payload.get("sub")
        if user_id is None or sub != "reset":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("Пользователь не найден")

    update_password(db, user, reset_data.new_password)
    return {"message": "Пароль успешно обновлён"}