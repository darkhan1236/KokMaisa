from datetime import datetime
from enum import Enum
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.security import AdminUser
from database.db import get_db
from model.models import SiteSuggestion


router = APIRouter(prefix="/suggestions", tags=["suggestions"])


class SuggestionCategory(str, Enum):
    general = "general"
    usability = "usability"
    feature = "feature"
    bug = "bug"
    content = "content"


class SuggestionStatus(str, Enum):
    new = "new"
    in_review = "in_review"
    planned = "planned"
    done = "done"
    rejected = "rejected"


def _clean_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = " ".join(value.strip().split())
    return cleaned or None


class SuggestionCreate(BaseModel):
    name: Optional[str] = Field(None, max_length=120)
    email: Optional[EmailStr] = None
    category: SuggestionCategory = SuggestionCategory.general
    message: str = Field(..., min_length=10, max_length=2000)

    @field_validator("name", mode="before")
    @classmethod
    def clean_name(cls, value):
        return _clean_text(value)

    @field_validator("message")
    @classmethod
    def clean_message(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 10:
            raise ValueError("Suggestion is too short")
        return cleaned


class SuggestionRead(BaseModel):
    id: int
    name: Optional[str]
    email: Optional[EmailStr]
    category: SuggestionCategory
    message: str
    status: SuggestionStatus
    admin_note: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SuggestionUpdate(BaseModel):
    status: Optional[SuggestionStatus] = None
    admin_note: Optional[str] = Field(None, max_length=2000)

    @field_validator("admin_note", mode="before")
    @classmethod
    def clean_admin_note(cls, value):
        return _clean_text(value)


@router.post("", response_model=SuggestionRead, status_code=201)
def create_suggestion(data: SuggestionCreate, db: Session = Depends(get_db)):
    suggestion = SiteSuggestion(
        name=data.name,
        email=str(data.email) if data.email else None,
        category=data.category.value,
        message=data.message,
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    return suggestion


@router.get("", response_model=List[SuggestionRead])
def list_suggestions(
    admin: AdminUser,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    status: Optional[SuggestionStatus] = None,
    category: Optional[SuggestionCategory] = None,
    search: Optional[str] = Query(None, max_length=120),
):
    q = db.query(SiteSuggestion)
    if status:
        q = q.filter(SiteSuggestion.status == status.value)
    if category:
        q = q.filter(SiteSuggestion.category == category.value)
    if search:
        like = f"%{search.strip()}%"
        q = q.filter(
            SiteSuggestion.message.ilike(like)
            | SiteSuggestion.name.ilike(like)
            | SiteSuggestion.email.ilike(like)
        )
    return q.order_by(SiteSuggestion.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/stats")
def get_suggestion_stats(admin: AdminUser, db: Session = Depends(get_db)):
    rows = (
        db.query(SiteSuggestion.status, func.count(SiteSuggestion.id))
        .group_by(SiteSuggestion.status)
        .all()
    )
    by_status = {status: count for status, count in rows}
    return {
        "total": db.query(func.count(SiteSuggestion.id)).scalar(),
        "new": by_status.get("new", 0),
        "in_review": by_status.get("in_review", 0),
        "planned": by_status.get("planned", 0),
        "done": by_status.get("done", 0),
        "rejected": by_status.get("rejected", 0),
    }


@router.put("/{suggestion_id}", response_model=SuggestionRead)
def update_suggestion(
    suggestion_id: int,
    data: SuggestionUpdate,
    admin: AdminUser,
    db: Session = Depends(get_db),
):
    suggestion = db.query(SiteSuggestion).filter(SiteSuggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(404, "Suggestion not found")
    payload = data.model_dump(exclude_unset=True)
    if "status" in payload and payload["status"] is not None:
        suggestion.status = payload["status"].value
    if "admin_note" in payload:
        suggestion.admin_note = payload["admin_note"]
    db.commit()
    db.refresh(suggestion)
    return suggestion


@router.delete("/{suggestion_id}")
def delete_suggestion(suggestion_id: int, admin: AdminUser, db: Session = Depends(get_db)):
    suggestion = db.query(SiteSuggestion).filter(SiteSuggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(404, "Suggestion not found")
    db.delete(suggestion)
    db.commit()
    return {"ok": True}
