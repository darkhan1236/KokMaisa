# backend/app/api/users/schemas/user_schemas.py
# КокМайса 2025 — роли: farmer | admin

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from enum import Enum


class AccountType(str, Enum):
    farmer = "farmer"
    admin  = "admin"


class UserBase(BaseModel):
    full_name : str = Field(..., max_length=255)
    phone     : str = Field(..., max_length=50)
    email     : EmailStr
    country   : str = Field(..., max_length=100)
    city      : str = Field(..., max_length=100)


class UserCreate(UserBase):
    password     : str = Field(..., min_length=6)
    account_type : AccountType = AccountType.farmer  # дефолт — фермер


class UserLogin(BaseModel):
    email    : EmailStr
    password : str


class UserRead(BaseModel):
    id            : int
    full_name     : str
    phone         : str
    email         : EmailStr
    account_type  : AccountType
    country       : str
    city          : str
    created_at    : datetime
    profile_photo : Optional[str]  = None
    is_active     : bool           = True

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    full_name     : Optional[str]      = Field(None, max_length=255)
    phone         : Optional[str]      = Field(None, max_length=50)
    email         : Optional[EmailStr] = None
    password      : Optional[str]      = Field(None, min_length=6)
    country       : Optional[str]      = Field(None, max_length=100)
    city          : Optional[str]      = Field(None, max_length=100)
    profile_photo : Optional[str]      = None
    is_active     : Optional[bool]     = None

    model_config = ConfigDict(from_attributes=True)


class PasswordResetRequest(BaseModel):
    email : EmailStr


class PasswordReset(BaseModel):
    token        : str
    new_password : str = Field(..., min_length=6)


class DeleteAccountRequest(BaseModel):
    email : EmailStr


class DeleteAccountConfirm(BaseModel):
    confirmation_token : str
    code               : str = Field(..., min_length=6, max_length=6)


class ProfilePhotoUpdate(BaseModel):
    photo_base64 : str
    mime_type    : str


# ── Схемы для Admin Panel ────────────────────────────────────────────────────

class AdminUserList(BaseModel):
    id           : int
    full_name    : str
    email        : EmailStr
    phone        : str
    account_type : AccountType
    country      : str
    city         : str
    is_active    : bool
    created_at   : datetime

    model_config = ConfigDict(from_attributes=True)


class AdminUserUpdate(BaseModel):
    full_name    : Optional[str]       = None
    account_type : Optional[AccountType] = None
    is_active    : Optional[bool]      = None
    city         : Optional[str]       = None
    country      : Optional[str]       = None
