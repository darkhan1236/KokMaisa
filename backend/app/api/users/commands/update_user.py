# backend/app/api/users/commands/update_user.py

from sqlalchemy.orm import Session
from app.api.users.schemas.user_schemas import UserUpdate
from app.api.users.crud.user_crud import get_user_by_id, update_user

def execute(db: Session, user_id: int, user_data: UserUpdate):
    # Получаем пользователя
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("Пользователь не найден")
    
    return update_user(db, user, user_data)