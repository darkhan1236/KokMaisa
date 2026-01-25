# backend/app/api/users/crud/user_crud.py
from sqlalchemy.orm import Session

from core.security import get_password_hash
from model.models import User
from app.api.users.schemas.user_schemas import UserCreate, UserRead


def create_user(db: Session, user_data: UserCreate):
    db_user = User(
        full_name=user_data.full_name,
        phone=user_data.phone,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        account_type=user_data.account_type,
        country=user_data.country,
        city=user_data.city,
        education=user_data.education if user_data.account_type == "agronomist" else None,
        specializations=user_data.specializations if user_data.account_type == "agronomist" else None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def update_password(db: Session, user: User, new_password: str):
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user