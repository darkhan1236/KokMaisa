# backend/app/api/users/user_api.py
import sqlalchemy

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.users.commands.create_user import execute as create_user_execute
from app.api.users.commands.login_user import execute as login_execute
from app.api.users.commands.reset_password import request_reset, execute_reset
from app.api.users.schemas.user_schemas import UserCreate, UserLogin, PasswordResetRequest, PasswordReset, UserRead
from app.api.users.crud.user_crud import get_user_by_id
from database.base import get_db
from core.security import CurrentUser, Token, create_access_token
from core.config import settings

router = APIRouter()


@router.post("/register", response_model=Token)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    try:
        user = create_user_execute(db, user_data)
        
        access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"user_id": user.id},
            expires_delta=access_token_expires
        )
        
        return Token(access_token=access_token, token_type="bearer")
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except sqlalchemy.exc.IntegrityError as e:
        # Обработка уникального нарушения (телефон или email уже занят)
        db.rollback()  # откатываем транзакцию
        if "ix_users_phone" in str(e):
            raise HTTPException(status_code=400, detail="Пользователь с таким номером телефона уже существует")
        elif "ix_users_email" in str(e):
            raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
        else:
            raise HTTPException(status_code=400, detail="Ошибка уникальности данных")
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")


@router.post("/login", response_model=Token)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    try:
        token_data = login_execute(db, login_data)
        return token_data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/password-reset-request")
async def password_reset_request(
    reset_request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    try:
        return await request_reset(db, reset_request)  # ← await
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/password-reset")
def password_reset(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    try:
        return execute_reset(db, reset_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=UserRead)
def get_current_user_info(current_user_id: CurrentUser, db: Session = Depends(get_db)):
    user = get_user_by_id(db, current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserRead.model_validate(user)