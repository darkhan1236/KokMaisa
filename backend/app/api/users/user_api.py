# backend/app/api/users/user_api.py
import sqlalchemy
import base64
import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pathlib import Path

from app.api.users.commands.create_user import execute as create_user_execute
from app.api.users.commands.login_user import execute as login_execute
from app.api.users.commands.reset_password import request_reset, execute_reset
from app.api.users.commands.update_user import execute as update_user_execute
from app.api.users.schemas.user_schemas import UserCreate, UserLogin, PasswordResetRequest, PasswordReset, UserRead, UserUpdate, ProfilePhotoUpdate
from app.api.users.crud.user_crud import get_user_by_id, update_user_photo
from database.db import get_db
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
def get_current_user_info(current_user: CurrentUser):
    return UserRead.model_validate(current_user)

@router.put("/me", response_model=UserRead)
def update_current_user(
    user_data: UserUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    try:
        updated_user = update_user_execute(db, current_user.id, user_data)
        return UserRead.model_validate(updated_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при обновлении профиля")


@router.put("/me/password")
def change_password(
    password_data: dict,
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """
    Изменение пароля
    Пример тела запроса: {"old_password": "old", "new_password": "new"}
    """
    try:
        from core.security import verify_password
        
        # Проверяем старый пароль
        if not verify_password(password_data.get("old_password", ""), current_user.hashed_password):
            raise ValueError("Неверный старый пароль")
        
        # Обновляем пароль
        from app.api.users.crud.user_crud import update_password
        update_password(db, current_user, password_data["new_password"])
        
        return {"message": "Пароль успешно изменен"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при изменении пароля")
    

@router.post("/me/photo")
async def upload_profile_photo(
    current_user: CurrentUser,      # Без значения по умолчанию - идет первым
    file: UploadFile = File(...),   # Со значением по умолчанию
    db: Session = Depends(get_db)   # Со значением по умолчанию
):
    """
    Загрузка фото профиля
    """
    try:
        # Проверяем размер файла (максимум 5MB)
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(status_code=400, detail="Файл слишком большой. Максимум 5MB")
        
        # Проверяем MIME тип
        allowed_mime_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_mime_types:
            raise HTTPException(status_code=400, detail="Неподдерживаемый тип файла. Разрешены: JPEG, PNG, GIF, WebP")
        
        # Генерируем уникальное имя файла
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Создаем директорию для фото, если её нет
        upload_dir = Path("uploads/profile_photos")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Сохраняем файл
        file_path = upload_dir / filename
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Сохраняем путь к файлу в базе данных
        photo_url = f"/uploads/profile_photos/{filename}"
        from app.api.users.crud.user_crud import update_user_photo
        updated_user = update_user_photo(db, current_user.id, photo_url, file.content_type)
        
        return UserRead.model_validate(updated_user)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке фото: {str(e)}")


@router.post("/me/photo-base64")
async def upload_profile_photo_base64(
    current_user: CurrentUser,  # Без значения по умолчанию - идет первым
    photo_data: ProfilePhotoUpdate,  # Без значения по умолчанию - идет вторым
    db: Session = Depends(get_db)    # Со значением по умолчанию
):
    """
    Загрузка фото профиля в формате base64
    """
    try:
        # Декодируем base64 строку
        try:
            image_data = base64.b64decode(photo_data.photo_base64)
        except:
            raise HTTPException(status_code=400, detail="Некорректный формат base64")
        
        # Проверяем размер (максимум 5MB)
        if len(image_data) > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(status_code=400, detail="Изображение слишком большое. Максимум 5MB")
        
        # Определяем расширение файла по MIME типу
        mime_to_extension = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/gif": "gif",
            "image/webp": "webp"
        }
        
        if photo_data.mime_type not in mime_to_extension:
            raise HTTPException(status_code=400, detail="Неподдерживаемый MIME тип")
        
        extension = mime_to_extension[photo_data.mime_type]
        
        # Генерируем уникальное имя файла
        filename = f"{uuid.uuid4()}.{extension}"
        
        # Создаем директорию для фото, если её нет
        upload_dir = Path("uploads/profile_photos")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Сохраняем файл
        file_path = upload_dir / filename
        with open(file_path, "wb") as f:
            f.write(image_data)
        
        # Сохраняем путь к файлу в базе данных
        photo_url = f"/uploads/profile_photos/{filename}"
        from app.api.users.crud.user_crud import update_user_photo
        updated_user = update_user_photo(db, current_user.id, photo_url, photo_data.mime_type)
        
        return UserRead.model_validate(updated_user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке фото: {str(e)}")


@router.delete("/me/photo")
async def delete_profile_photo(
    current_user: CurrentUser,  # Без значения по умолчанию - идет первым
    db: Session = Depends(get_db)  # Со значением по умолчанию
):
    """
    Удаление фото профиля
    """
    try:
        from app.api.users.crud.user_crud import delete_user_photo
        updated_user = delete_user_photo(db, current_user.id)
        
        # Удаляем файл с диска, если он существует
        if current_user.profile_photo and current_user.profile_photo.startswith("/uploads/"):
            try:
                file_path = Path(current_user.profile_photo.lstrip("/"))
                if file_path.exists():
                    file_path.unlink()
            except:
                pass  # Игнорируем ошибки при удалении файла
        
        return UserRead.model_validate(updated_user)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении фото: {str(e)}")