# backend/model/models.py — ИСПРАВЛЕНО: добавлены coordinates + color

import datetime
from sqlalchemy import (
    Column, Date, Integer, String, DateTime, Boolean,
    Enum, JSON, func, Float, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from database.db import Base


class User(Base):
    __tablename__ = "users"

    id               = Column(Integer, primary_key=True, index=True)
    full_name        = Column(String(255), nullable=False)
    phone            = Column(String(50), unique=True, nullable=False)
    email            = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password  = Column(String(255), nullable=False)
    account_type     = Column(
        Enum("farmer", "admin", name="account_type_v2"),
        nullable=False, default="farmer",
    )
    is_active        = Column(Boolean, default=True, nullable=False)
    country          = Column(String(100), nullable=False)
    city             = Column(String(100), nullable=False)
    created_at       = Column(DateTime, server_default=func.now())
    profile_photo    = Column(String(500), nullable=True)
    photo_mime_type  = Column(String(50),  nullable=True)

    farms = relationship("Farm", foreign_keys="Farm.owner_id", back_populates="owner")
    ai_chat_sessions = relationship(
        "AIChatSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    @property
    def is_admin(self) -> bool:
        return self.account_type == "admin"


class Farm(Base):
    __tablename__ = "farms"

    id               = Column(Integer, primary_key=True, index=True)
    owner_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    name             = Column(String, nullable=False)
    address          = Column(String)
    region           = Column(String, nullable=False)
    area             = Column(Float, nullable=False)
    description      = Column(Text)
    coordinates_lat  = Column(Float)    # центроид — авто из полигона
    coordinates_lng  = Column(Float)
    
    # ── НОВЫЕ ПОЛЯ ──────────────────────────────────────────
    coordinates      = Column(JSON, nullable=True)           # [{lat, lng}, ...] полигон
    color            = Column(String(20), nullable=True, default="#22c55e")
    # ────────────────────────────────────────────────────────
    
    phone            = Column(String)
    owner_name       = Column(String)
    owner_iin        = Column(String(12))
    farm_type        = Column(String)
    established_date = Column(Date)
    crops            = Column(JSON)
    equipment        = Column(JSON)
    translations     = Column(JSON, nullable=True)
    status           = Column(String, default="active")
    photos           = Column(JSON)
    created_at       = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at       = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    owner    = relationship("User", foreign_keys=[owner_id], back_populates="farms")
    pastures = relationship("Pasture", back_populates="farm", cascade="all, delete-orphan")
    drones   = relationship("Drone",   back_populates="farm", cascade="all, delete-orphan")


class Pasture(Base):
    __tablename__ = "pastures"

    id              = Column(Integer, primary_key=True, index=True)
    farm_id         = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name            = Column(String, nullable=False)
    area            = Column(Float, nullable=False)
    pasture_type    = Column(String)
    coordinates_lat = Column(Float)
    coordinates_lng = Column(Float)
    coordinates     = Column(JSON, nullable=True)
    color           = Column(String(20), nullable=True, default="#22c55e")
    description     = Column(Text)
    translations    = Column(JSON, nullable=True)
    status          = Column(String, default="active")
    created_at      = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at      = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    farm         = relationship("Farm", back_populates="pastures")
    # ↓ ДОБАВИТЬ — SQLAlchemy будет каскадно удалять измерения
    measurements = relationship("Measurement", back_populates="pasture",
                                cascade="all, delete-orphan")


class Drone(Base):
    __tablename__ = "drones"

    id            = Column(Integer, primary_key=True, index=True)
    farm_id       = Column(Integer, ForeignKey("farms.id"), nullable=False)
    model         = Column(String, nullable=False)
    serial_number = Column(String, unique=True, nullable=False)
    status        = Column(String, default="active")
    description   = Column(Text)
    created_at    = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at    = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )
    farm = relationship("Farm", back_populates="drones")


class Measurement(Base):
    __tablename__ = "measurements"

    id               = Column(Integer, primary_key=True, index=True)
    # ↓ ИЗМЕНИТЬ — добавить ondelete="CASCADE" на уровне БД (страховка)
    pasture_id       = Column(Integer, ForeignKey("pastures.id", ondelete="CASCADE"),
                               nullable=False, index=True)
    drone_id         = Column(Integer, ForeignKey("drones.id"), nullable=True)
    method           = Column(String(50), nullable=False)
    status           = Column(String(20), default="processing", nullable=False)
    biomass_value    = Column(Float, nullable=True)
    ndvi_value       = Column(Float, nullable=True)
    coverage_percent = Column(Float, nullable=True)
    quality_score    = Column(Float, nullable=True)
    description      = Column(Text, nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # ↓ ДОБАВИТЬ
    pasture = relationship("Pasture", back_populates="measurements")


class SiteSuggestion(Base):
    __tablename__ = "site_suggestions"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(120), nullable=True)
    email      = Column(String(255), nullable=True, index=True)
    category   = Column(String(40), nullable=False, default="general", index=True)
    message    = Column(Text, nullable=False)
    status     = Column(String(30), nullable=False, default="new", index=True)
    admin_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class AIChatSession(Base):
    __tablename__ = "ai_chat_sessions"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title      = Column(String(160), nullable=False, default="New chat")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="ai_chat_sessions")
    messages = relationship(
        "AIChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="AIChatMessage.created_at",
    )


class AIChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role       = Column(String(20), nullable=False)
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("AIChatSession", back_populates="messages")
