# backend/database/models.py
from sqlalchemy import Column, Integer, String, DateTime, Enum, JSON, func
from sqlalchemy.dialects.postgresql import UUID

from database.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    account_type = Column(Enum("farmer", "agronomist", name="account_type"), nullable=False)
    country = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Для агронома
    education = Column(String(100))
    specializations = Column(JSON)  # JSONB for array of specializations, e.g. ["agronomy", "livestock"]

    # Мультиязычность: храним ключи, переводы на фронте
    # Если нужно хранить переводы в БД, можно добавить JSON поля, но по умолчанию ключи