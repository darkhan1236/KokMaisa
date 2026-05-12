import base64
import binascii
import io
import uuid
from datetime import timedelta
from pathlib import Path

import sqlalchemy
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.api.users.commands.create_user import execute as create_user_execute
from app.api.users.commands.delete_account import (
    confirm_delete_account,
    request_delete_account,
)
from app.api.users.commands.login_user import execute as login_execute
from app.api.users.commands.reset_password import execute_reset, request_reset
from app.api.users.commands.update_user import execute as update_user_execute
from app.api.users.crud.user_crud import update_user_photo
from app.api.users.schemas.user_schemas import (
    AccountType,
    DeleteAccountConfirm,
    DeleteAccountRequest,
    PasswordChange,
    PasswordReset,
    PasswordResetRequest,
    ProfilePhotoUpdate,
    UserCreate,
    UserLogin,
    UserRead,
    UserRegister,
    UserUpdate,
)
from core.config import settings
from core.security import CurrentUser, Token, create_access_token, verify_password
from database.db import get_db

router = APIRouter()

MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
}


def _validate_image_bytes(contents: bytes, declared_mime_type: str | None) -> tuple[str, str]:
    if len(contents) > MAX_PROFILE_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="File is too large. Maximum size is 5MB")
    if declared_mime_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type")
    try:
        with Image.open(io.BytesIO(contents)) as image:
            image.verify()
            image_format = (image.format or "").lower()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Invalid image file")

    format_to_mime = {
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
    }
    detected_mime = format_to_mime.get(image_format)
    if detected_mime != declared_mime_type:
        raise HTTPException(status_code=400, detail="Image content does not match declared MIME type")
    return detected_mime, ALLOWED_IMAGE_TYPES[detected_mime]


def _save_profile_photo(contents: bytes, mime_type: str) -> str:
    _, extension = _validate_image_bytes(contents, mime_type)
    filename = f"{uuid.uuid4()}.{extension}"
    upload_dir = Path("uploads/profile_photos")
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / filename
    with open(file_path, "wb") as f:
        f.write(contents)
    return f"/uploads/profile_photos/{filename}"


@router.post("/register", response_model=Token)
def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    try:
        create_data = UserCreate(**user_data.model_dump(), account_type=AccountType.farmer)
        user = create_user_execute(db, create_data)
        access_token = create_access_token(
            data={"user_id": user.id},
            expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        return Token(access_token=access_token, token_type="bearer")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except sqlalchemy.exc.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="User with this email or phone already exists")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/login", response_model=Token)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    return login_execute(db, login_data)


@router.post("/password-reset-request")
async def password_reset_request(reset_request: PasswordResetRequest, db: Session = Depends(get_db)):
    return await request_reset(db, reset_request)


@router.post("/password-reset")
def password_reset(reset_data: PasswordReset, db: Session = Depends(get_db)):
    return execute_reset(db, reset_data)


@router.post("/me/delete-request")
async def delete_account_request(delete_request: DeleteAccountRequest, current_user: CurrentUser):
    try:
        return await request_delete_account(current_user, delete_request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Could not send confirmation code")


@router.post("/me/delete-confirm")
def delete_account_confirm(
    delete_confirm: DeleteAccountConfirm,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    return confirm_delete_account(db, current_user, delete_confirm)


@router.get("/me", response_model=UserRead)
def get_current_user_info(current_user: CurrentUser):
    return UserRead.model_validate(current_user)


@router.put("/me", response_model=UserRead)
def update_current_user(
    user_data: UserUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    try:
        updated_user = update_user_execute(db, current_user.id, user_data)
        return UserRead.model_validate(updated_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Profile update failed")


@router.put("/me/password")
def change_password(
    password_data: PasswordChange,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    try:
        if not verify_password(password_data.old_password, current_user.hashed_password):
            raise ValueError("Invalid old password")
        from app.api.users.crud.user_crud import update_password

        update_password(db, current_user, password_data.new_password)
        return {"message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Password change failed")


@router.post("/me/photo", response_model=UserRead)
async def upload_profile_photo(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        contents = await file.read()
        photo_url = _save_profile_photo(contents, file.content_type)
        updated_user = update_user_photo(db, current_user.id, photo_url, file.content_type)
        return UserRead.model_validate(updated_user)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Photo upload failed")


@router.post("/me/photo-base64", response_model=UserRead)
async def upload_profile_photo_base64(
    current_user: CurrentUser,
    photo_data: ProfilePhotoUpdate,
    db: Session = Depends(get_db),
):
    try:
        try:
            image_data = base64.b64decode(photo_data.photo_base64, validate=True)
        except (binascii.Error, ValueError):
            raise HTTPException(status_code=400, detail="Invalid base64 image")
        photo_url = _save_profile_photo(image_data, photo_data.mime_type)
        updated_user = update_user_photo(db, current_user.id, photo_url, photo_data.mime_type)
        return UserRead.model_validate(updated_user)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Photo upload failed")


@router.delete("/me/photo", response_model=UserRead)
async def delete_profile_photo(current_user: CurrentUser, db: Session = Depends(get_db)):
    try:
        from app.api.users.crud.user_crud import delete_user_photo

        old_photo = current_user.profile_photo
        updated_user = delete_user_photo(db, current_user.id)
        if old_photo and old_photo.startswith("/uploads/"):
            try:
                file_path = Path(old_photo.lstrip("/")).resolve()
                upload_root = Path("uploads").resolve()
                if upload_root in file_path.parents and file_path.exists():
                    file_path.unlink()
            except OSError:
                pass
        return UserRead.model_validate(updated_user)
    except Exception:
        raise HTTPException(status_code=500, detail="Photo deletion failed")
