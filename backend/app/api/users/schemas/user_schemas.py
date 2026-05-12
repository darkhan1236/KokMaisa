from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class AccountType(str, Enum):
    farmer = "farmer"
    admin = "admin"


class UserBase(BaseModel):
    full_name: str = Field(..., max_length=255)
    phone: str = Field(..., max_length=50)
    email: EmailStr
    country: str = Field(..., max_length=100)
    city: str = Field(..., max_length=100)


def _validate_password(value: str) -> str:
    from core.security import validate_password_strength

    return validate_password_strength(value)


class UserCreate(UserBase):
    password: str = Field(..., min_length=10, max_length=72)
    account_type: AccountType = AccountType.farmer

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password(value)


class UserRegister(UserBase):
    password: str = Field(..., min_length=10, max_length=72)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password(value)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: int
    full_name: str
    phone: str
    email: EmailStr
    account_type: AccountType
    country: str
    city: str
    created_at: datetime
    profile_photo: Optional[str] = None
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=10, max_length=72)
    country: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    profile_photo: Optional[str] = None
    is_active: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return _validate_password(value)


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=10, max_length=72)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return _validate_password(value)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=10, max_length=72)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password(value)


class DeleteAccountRequest(BaseModel):
    email: EmailStr


class DeleteAccountConfirm(BaseModel):
    confirmation_token: str
    code: str = Field(..., min_length=6, max_length=6)


class ProfilePhotoUpdate(BaseModel):
    photo_base64: str
    mime_type: str


class AdminUserList(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    account_type: AccountType
    country: str
    city: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    account_type: Optional[AccountType] = None
    is_active: Optional[bool] = None
    city: Optional[str] = None
    country: Optional[str] = None
