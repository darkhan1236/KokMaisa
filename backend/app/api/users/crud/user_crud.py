from sqlalchemy.orm import Session

from core.security import get_password_hash
from model.models import User
from app.api.users.schemas.user_schemas import UserCreate, UserRead, UserUpdate


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


def update_user(db: Session, user: User, user_data: UserUpdate):
    # Обновляем только разрешенные поля
    update_data = user_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "password" and value:
            # Хешируем новый пароль
            user.hashed_password = get_password_hash(value)
        elif hasattr(user, field):
            setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user


def update_user_photo(db: Session, user_id: int, photo_url: str, mime_type: str):
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("Пользователь не найден")
    
    user.profile_photo = photo_url
    user.photo_mime_type = mime_type
    db.commit()
    db.refresh(user)
    return user


def delete_user_photo(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("Пользователь не найден")
    
    user.profile_photo = None
    user.photo_mime_type = None
    db.commit()
    db.refresh(user)
    return user


def get_user_profile(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    return UserRead.model_validate(user)