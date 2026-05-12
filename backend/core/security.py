# backend/core/security.py
# КокМайса 2025 — добавлен require_admin

from datetime import datetime, timedelta, timezone
from re import search
from secrets import token_urlsafe
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.config import settings
from database.db import get_db
from model.models import User

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")


class Token(BaseModel):
    access_token : str
    token_type   : str


class TokenData(BaseModel):
    user_id : int | None = None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password.encode("utf-8")[:72], hashed_password)


def validate_password_strength(password: str) -> str:
    if not isinstance(password, str):
        raise ValueError("Password is required")
    password_bytes = password.encode("utf-8")
    weak_values = {"admin123", "password", "password123", "changeme", "qwerty123"}
    if len(password) < 10:
        raise ValueError("Password must be at least 10 characters")
    if len(password_bytes) > 72:
        raise ValueError("Password must be at most 72 bytes")
    if password.lower() in weak_values:
        raise ValueError("Password is too weak")
    if not search(r"[A-Za-z]", password) or not search(r"\d", password):
        raise ValueError("Password must contain letters and digits")
    return password


def get_password_hash(password: str) -> str:
    password = validate_password_strength(password)
    return pwd_context.hash(password.encode("utf-8"))


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
    token_type: str = "access",
):
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=15)
    )
    to_encode.setdefault("iat", int(now.timestamp()))
    to_encode.setdefault("jti", token_urlsafe(24))
    to_encode["token_type"] = token_type
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db   : Session = Depends(get_db),
) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None or payload.get("token_type") != "access":
            raise exc
    except JWTError:
        raise exc

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise exc
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


# ── Admin guard ──────────────────────────────────────────────────────────────

async def require_admin(current_user: CurrentUser) -> User:
    """Dependency — пускает только admin-пользователей."""
    if current_user.account_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


AdminUser = Annotated[User, Depends(require_admin)]
