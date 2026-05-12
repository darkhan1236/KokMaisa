from datetime import timedelta

from fastapi import HTTPException, status
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.api.users.crud.user_crud import get_user_by_email, get_user_by_id, update_password
from app.api.users.schemas.user_schemas import PasswordReset, PasswordResetRequest
from core.config import settings
from core.security import create_access_token

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
    VALIDATE_CERTS=True,
)

_used_reset_token_ids: set[str] = set()


async def send_reset_email(email: str, token: str):
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2f855a;">KokMaisa password reset</h2>
        <p>Use the button below to set a new password. The link is valid for 30 minutes.</p>
        <p style="margin: 20px 0;">
          <a href="{reset_link}" style="background-color: #2f855a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset password
          </a>
        </p>
        <p>If you did not request this, ignore this email.</p>
      </body>
    </html>
    """

    message = MessageSchema(
        subject="Password reset - KokMaisa",
        recipients=[email],
        body=html,
        subtype="html",
    )
    await FastMail(conf).send_message(message)


async def request_reset(db: Session, reset_request: PasswordResetRequest):
    user = get_user_by_email(db, reset_request.email)
    if user and user.is_active:
        reset_token = create_access_token(
            data={"sub": "password_reset", "user_id": user.id},
            expires_delta=timedelta(minutes=30),
            token_type="password_reset",
        )
        await send_reset_email(reset_request.email, reset_token)

    return {"message": "If the email exists, a password reset link has been sent"}


def execute_reset(db: Session, reset_data: PasswordReset):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    )

    try:
        payload = jwt.decode(
            reset_data.token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: int = payload.get("user_id")
        token_id: str = payload.get("jti")
        if (
            user_id is None
            or not token_id
            or token_id in _used_reset_token_ids
            or payload.get("sub") != "password_reset"
            or payload.get("token_type") != "password_reset"
        ):
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise credentials_exception

    update_password(db, user, reset_data.new_password)
    _used_reset_token_ids.add(token_id)
    return {"message": "Password updated successfully"}
