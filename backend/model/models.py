# backend/model/models.py
import datetime
from sqlalchemy import Column, Date, Integer, String, DateTime, Enum, JSON, func, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from database.db import Base


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

    profile_photo = Column(String(500), nullable=True)  # URL или путь к файлу
    photo_mime_type = Column(String(50), nullable=True)  # MIME тип изображения

    # Для агронома
    education = Column(String(100))
    specializations = Column(JSON)  # массив специализаций, например ["agronomy", "livestock"]

    # Связи
    farms = relationship("Farm", foreign_keys="Farm.owner_id", back_populates="owner")
    consulting_farms = relationship("Farm", foreign_keys="Farm.agronomist_id", back_populates="agronomist")


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)          # владелец — фермер
    agronomist_id = Column(Integer, ForeignKey("users.id"), nullable=True)      # консультирующий агроном (опционально)

    name = Column(String, nullable=False)
    address = Column(String)
    region = Column(String, nullable=False)
    area = Column(Float, nullable=False)  # площадь в га (вводится вручную)
    description = Column(Text)

    coordinates_lat = Column(Float)   # центральная точка фермы
    coordinates_lng = Column(Float)

    phone = Column(String)
    owner_name = Column(String)
    owner_iin = Column(String(12))

    farm_type = Column(String)
    established_date = Column(Date)
    crops = Column(JSON)
    equipment = Column(JSON)
    status = Column(String, default="active")

    photos = Column(JSON)  # массив URL фотографий

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Связи
    owner = relationship("User", foreign_keys=[owner_id], back_populates="farms")
    agronomist = relationship("User", foreign_keys=[agronomist_id], back_populates="consulting_farms")
    pastures = relationship("Pasture", back_populates="farm", cascade="all, delete-orphan")
    drones = relationship("Drone", back_populates="farm", cascade="all, delete-orphan")


class Pasture(Base):
    __tablename__ = "pastures"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)

    name = Column(String, nullable=False)
    area = Column(Float, nullable=False)  # площадь в га
    pasture_type = Column(String)         # тип пастбища
    coordinates_lat = Column(Float)       # центральная точка
    coordinates_lng = Column(Float)
    description = Column(Text)
    status = Column(String, default="active")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    farm = relationship("Farm", back_populates="pastures")


class Drone(Base):
    __tablename__ = "drones"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)

    model = Column(String, nullable=False)
    serial_number = Column(String, unique=True, nullable=False)
    status = Column(String, default="active")
    description = Column(Text)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    farm = relationship("Farm", back_populates="drones")