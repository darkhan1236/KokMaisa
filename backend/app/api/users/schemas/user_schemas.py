from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from enum import Enum


class AccountType(str, Enum):
    farmer = "farmer"
    agronomist = "agronomist"


class UserBase(BaseModel):
    full_name: str = Field(..., max_length=255)
    phone: str = Field(..., max_length=50)
    email: EmailStr
    country: str = Field(..., max_length=100)
    city: str = Field(..., max_length=100)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    account_type: AccountType

    # Для агронома
    education: Optional[str] = None
    specializations: Optional[List[str]] = None


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
    profile_photo: Optional[str] = None  # Добавляем фото профиля
    education: Optional[str]
    specializations: Optional[List[str]]
    
    model_config = ConfigDict(from_attributes=True)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)
    

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)
    country: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    profile_photo: Optional[str] = None  # Добавляем обновление фото
    education: Optional[str] = None
    specializations: Optional[List[str]] = None
    
    model_config = ConfigDict(from_attributes=True)


class ProfilePhotoUpdate(BaseModel):
    photo_base64: str  
    mime_type: str  