# backend/app/api/users/commands/login_user.py
# КокМайса 2025 — только farmer / admin (education и specializations удалены)

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from core.security import verify_password, create_access_token
from app.api.users.crud.user_crud import get_user_by_email
from app.api.users.schemas.user_schemas import UserLogin
from datetime import timedelta

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 дней


def execute(db: Session, login_data: UserLogin) -> dict:
    user = get_user_by_email(db, login_data.email)

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token = create_access_token(
        data={"user_id": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": access_token,
        "token_type":   "bearer",
        "user": {
            "id":            user.id,
            "full_name":     user.full_name,
            "email":         user.email,
            "phone":         user.phone,
            "account_type":  user.account_type,
            "country":       user.country,
            "city":          user.city,
            "profile_photo": user.profile_photo,
            "is_active":     user.is_active,
        },
    }