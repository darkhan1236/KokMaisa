# backend/app/api/users/commands/login_user.py
from datetime import timedelta
from sqlalchemy.orm import Session

from core.security import verify_password, create_access_token
from core.config import settings
from app.api.users.schemas.user_schemas import UserLogin, UserRead
from app.api.users.crud.user_crud import get_user_by_email


def execute(db: Session, login_data: UserLogin):
    user = get_user_by_email(db, login_data.email)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise ValueError("Invalid email or password")

    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": user.id}, expires_delta=access_token_expires
    )

    user_read = UserRead(
        id=user.id,
        full_name=user.full_name,
        phone=user.phone,
        email=user.email,
        account_type=user.account_type,
        country=user.country,
        city=user.city,
        created_at=user.created_at.isoformat(),
        education=user.education,
        specializations=user.specializations
    )

    return {"access_token": access_token, "token_type": "bearer", "user": user_read}