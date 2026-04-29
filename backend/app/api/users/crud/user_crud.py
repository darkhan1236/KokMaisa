# backend/app/api/users/crud/user_crud.py
# КокМайса 2025 — только farmer / admin

from sqlalchemy.orm import Session
from core.security import get_password_hash
from model.models import User, Farm
from app.api.users.schemas.user_schemas import UserCreate, UserUpdate


def create_user(db: Session, user_data: UserCreate) -> User:
    db_user = User(
        full_name       = user_data.full_name,
        phone           = user_data.phone,
        email           = user_data.email,
        hashed_password = get_password_hash(user_data.password),
        account_type    = user_data.account_type,
        country         = user_data.country,
        city            = user_data.city,
        is_active       = True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def update_user(db: Session, user_id: int, data: UserUpdate) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    update_data = data.model_dump(exclude_none=True)

    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


def update_password(db: Session, user_or_id: User | int, new_password: str) -> User:
    """
    Принимает user_id (int) ИЛИ объект User напрямую.
    reset_password.py передаёт User-объект — оба варианта теперь работают.
    """
    if isinstance(user_or_id, User):
        user = user_or_id
    else:
        user = db.query(User).filter(User.id == user_or_id).first()
        if not user:
            raise ValueError("User not found")

    user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user


def update_user_photo(db: Session, user_id: int, photo_url: str, mime_type: str) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    user.profile_photo   = photo_url
    user.photo_mime_type = mime_type
    db.commit()
    db.refresh(user)
    return user


def delete_user_with_related_data(db: Session, user: User) -> None:
    farms = db.query(Farm).filter(Farm.owner_id == user.id).all()
    for farm in farms:
        db.delete(farm)
    db.delete(user)
    db.commit()
