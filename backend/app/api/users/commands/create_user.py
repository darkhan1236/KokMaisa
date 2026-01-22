# backend/app/api/users/commands/create_user.py
from sqlalchemy.orm import Session

from app.api.users.schemas.user_schemas import UserCreate
from app.api.users.crud.user_crud import create_user, get_user_by_email


def execute(db: Session, user_data: UserCreate):
    # Check if user exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise ValueError("User with this email already exists")

    return create_user(db, user_data)