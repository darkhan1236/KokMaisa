# backend/app/api/ai/ai_api.py
import json
import os
import re
from datetime import datetime, timezone
from typing import AsyncIterator, List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session
from database.db import get_db
from app.services.rag.analytics_context import build_analytics_context
from app.services.rag.assistant import UNKNOWN_RAG_ANSWER_RU, build_rag_context
from app.services.rag.user_context import build_user_context

from core.config import settings
from core.security import get_current_user
from model.models import AIChatMessage, AIChatSession, User

router = APIRouter(prefix="/ai", tags=["AI"])

SYSTEM_PROMPT = """
You are the KokMaisa agricultural AI consultant for farmers in Kazakhstan.

Always answer in the same language as the current user message: Russian, Kazakh, or English.
Use clean Markdown when it helps readability: short headings, bold key terms, bullet lists, and numbered lists are allowed.
Do not use emoji.
Avoid large LaTeX blocks unless the user specifically asks for mathematical notation.
For personal dashboard questions, answer briefly in 120-250 words.
For educational agronomy questions, answer in 300-700 words if needed.

Answer format:
1. Short conclusion.
2. Clear explanation.
3. Practical recommendation.

The answer must be complete. Do not stop in the middle of a sentence.
Do not invent private user data, farms, pastures, measurements, email, phone, or data from other users.
If private farm context is not provided, say that you do not have access to that data yet.
If you are not sure, say that you do not know the exact answer yet and explain what data is needed.
If the user asks about KokMaisa documentation, platform behavior, agronomy knowledge, or project knowledge that is not present in the retrieved knowledge-base context, answer exactly: "Пока не знаю точного ответа по этой теме в моей базе знаний."
Knowledge priority:
- First use the authenticated user's KokMaisa database context for private farms, pastures, and measurements.
- Then use the KokMaisa RAG knowledge-base context for documentation, Kazakhstan pasture background, and agronomy reference points.
- Do not use random web knowledge as a substitute for missing RAG evidence. Web search is a later fallback only after RAG retrieval has been attempted and explicitly provided.

For personal farm, pasture, and biomass measurement questions:
- Focus only on data present in the user context.
- Do not mention NDVI unless the user explicitly asks about NDVI.
- Do not mention drones unless the user has drone data in the context or explicitly asks about drones.
- Do not show internal database IDs in the final answer.
- Refer to measurements as "latest measurement", "previous measurement", "first measurement", or by date.
- Focus on biomass, plant coverage, AI quality score, pasture name, farm name, date, and trend.
- Do not invent causes such as rain, wind, overgrazing, or undergrazing unless they are present in the context.

Agriculture reference points:
- Pasture monitoring is usually useful every 7-14 days during the active season.
- Safe grazing often uses no more than 50-60% of available biomass, but the exact norm depends on region, season, livestock type, and pasture load.
""".strip()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    session_id: Optional[int] = None
    page_context: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    session_id: Optional[int] = None


class ChatSessionCreate(BaseModel):
    title: Optional[str] = None


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: str


class ChatSessionOut(BaseModel):
    id: int
    title: str
    created_at: str
    updated_at: str
    messages: list[ChatMessageOut] = []


class ChatSessionSummary(BaseModel):
    id: int
    title: str
    created_at: str
    updated_at: str
    last_message: Optional[str] = None


def detect_response_language(text: str) -> str:
    kazakh_codepoints = {
        0x04D9,  # ә
        0x0493,  # ғ
        0x049B,  # қ
        0x04A3,  # ң
        0x04E9,  # ө
        0x04B1,  # ұ
        0x04AF,  # ү
        0x04BB,  # һ
        0x0456,  # і
    }
    lower_text = text.lower()
    if any(ord(ch) in kazakh_codepoints for ch in lower_text):
        return "Kazakh"

    latin_letters = sum(ch.isascii() and ch.isalpha() for ch in text)
    cyrillic_letters = sum("а" <= ch.lower() <= "я" or ch.lower() == "ё" for ch in text)

    if latin_letters > cyrillic_letters:
        return "English"

    return "Russian"


def clean_ai_answer(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def clean_stream_delta(text: str) -> str:
    return text


def clean_page_context(text: str | None) -> str:
    if not text:
        return "No frontend page context was provided."

    cleaned = re.sub(r"\s+", " ", text).strip()
    return cleaned[:1200]


def get_ai_settings() -> tuple[str, str, str]:
    api_key = getattr(settings, "openai_api_key", "") or os.getenv("OPENAI_API_KEY", "")
    model = getattr(settings, "openai_model", "") or os.getenv(
        "OPENAI_MODEL",
        "meta-llama/llama-3.1-8b-instruct:free",
    )
    base_url = getattr(settings, "openai_base_url", "") or os.getenv(
        "OPENAI_BASE_URL",
        "https://openrouter.ai/api/v1",
    )

    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set")

    return api_key, model, base_url.rstrip("/")


def _chat_title(message: str) -> str:
    title = " ".join((message or "").strip().split())
    if not title:
        return "New chat"
    return title[:80]


def _serialize_chat_message(message: AIChatMessage) -> ChatMessageOut:
    return ChatMessageOut(
        id=message.id,
        role=message.role,
        content=message.content,
        created_at=message.created_at.isoformat() if message.created_at else "",
    )


def _get_owned_session(db: Session, session_id: int, user_id: int) -> AIChatSession:
    session = (
        db.query(AIChatSession)
        .filter(AIChatSession.id == session_id, AIChatSession.user_id == user_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session


def _get_or_create_session(db: Session, user_id: int, first_message: str, session_id: int | None) -> AIChatSession:
    if session_id:
        return _get_owned_session(db, session_id, user_id)

    session = AIChatSession(user_id=user_id, title=_chat_title(first_message))
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _save_chat_exchange(db: Session, session: AIChatSession, user_message: str, assistant_message: str) -> None:
    db.add(AIChatMessage(session_id=session.id, role="user", content=user_message))
    db.add(AIChatMessage(session_id=session.id, role="assistant", content=assistant_message))
    session.title = session.title or _chat_title(user_message)
    session.updated_at = datetime.now(timezone.utc)
    db.add(session)
    db.commit()


def build_messages(
    req: ChatRequest,
    user: User,
    user_context: str = "",
    analytics_context: str = "",
    rag_context: str = "",
    rag_has_results: bool = False,
) -> list[dict[str, str]]:
    msg = (req.message or "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Empty message")

    user_name = getattr(user, "full_name", "") or ""
    user_role = getattr(user, "account_type", "") or ""
    response_language = detect_response_language(msg)
    page_context = clean_page_context(req.page_context)

    history = req.history or []
    recent_history = history[-10:] if len(history) > 10 else history

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "system",
            "content": f"Current user name: {user_name}. Current user role: {user_role}.",
        },
        {
            "role": "system",
            "content": (
                "Current authenticated user's KokMaisa database context:\n"
                f"{user_context}\n\n"
                "Current authenticated user's precomputed KokMaisa analytics:\n"
                f"{analytics_context}\n\n"
                "Prefer the precomputed analytics for trends, averages, strongest pasture, "
                "weakest pasture, and latest-vs-previous comparisons. "
                "Use only this context for private farms, pastures, drones, and measurements. "
                "If the answer requires private user data and it is not present here, "
                "say that you do not have enough data yet."
            ),
        },
        {
            "role": "system",
            "content": (
                "Current frontend page context:\n"
                f"{page_context}\n\n"
                "Use this to understand where the user is asking from. "
                "If the user says 'this page', 'here', 'these measurements', or similar, "
                "interpret it through this page context and the authenticated database context."
            ),
        },
        {
            "role": "system",
            "content": (
                "Current retrieved KokMaisa RAG knowledge-base context:\n"
                f"{rag_context}\n\n"
                f"RAG snippets found: {rag_has_results}. "
                "For KokMaisa documentation or project-knowledge questions, use this RAG context first. "
                f'If no relevant snippet was found and the answer depends on the knowledge base, answer exactly: "{UNKNOWN_RAG_ANSWER_RU}"'
            ),
        },
        {
            "role": "system",
            "content": (
                f"The current user message language is {response_language}. "
                f"Answer only in {response_language}. Do not switch languages."
            ),
        },
        *[{"role": m.role, "content": m.content} for m in recent_history],
        {"role": "user", "content": f"/no_think\nAnswer only in {response_language}.\n\n{msg}"},
    ]


def provider_headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kokmaisa.kz",
        "X-Title": "KokMaisa AI Consultant",
    }


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    req: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    api_key, model, base_url = get_ai_settings()
    msg = (req.message or "").strip()
    session = _get_or_create_session(db, user.id, msg, req.session_id)
    user_context = build_user_context(db, user.id)
    analytics_context = build_analytics_context(db, user.id)
    page_context = clean_page_context(req.page_context)
    rag = build_rag_context(msg, page_context=page_context)
    messages = build_messages(req, user, user_context, analytics_context, rag.context, rag.has_results)

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 1600,
    }

    try:
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(
                f"{base_url}/chat/completions",
                json=payload,
                headers=provider_headers(api_key),
            )

        if resp.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=f"AI provider error {resp.status_code}",
            )

        data = resp.json()
        answer = (
            (data.get("choices", [{}])[0].get("message", {}) or {})
            .get("content", "")
            .strip()
        )

        if not answer:
            return ChatResponse(
                answer="AI returned an empty answer. Please rephrase the question.",
                session_id=session.id,
            )

        answer = clean_ai_answer(answer)
        _save_chat_exchange(db, session, msg, answer)
        return ChatResponse(answer=answer, session_id=session.id)

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="AI did not answer in time. Please try again.",
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="AI request failed")


async def stream_chat_completion(payload: dict, api_key: str, base_url: str) -> AsyncIterator[str]:
    try:
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream(
                "POST",
                f"{base_url}/chat/completions",
                json=payload,
                headers=provider_headers(api_key),
            ) as resp:
                if resp.status_code >= 400:
                    yield f"\nAI provider error {resp.status_code}"
                    return

                async for line in resp.aiter_lines():
                    if not line:
                        continue

                    if line.startswith("data: "):
                        line = line[6:]

                    if line.strip() == "[DONE]":
                        return

                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    choice = (data.get("choices") or [{}])[0]
                    delta = choice.get("delta") or {}
                    message = choice.get("message") or {}
                    content = delta.get("content") or message.get("content") or ""

                    if content:
                        yield clean_stream_delta(content)
    except Exception:
        yield "\nAI stream failed. Please try again."


async def stream_and_persist_chat_completion(
    payload: dict,
    api_key: str,
    base_url: str,
    db: Session,
    session: AIChatSession,
    user_message: str,
) -> AsyncIterator[str]:
    full_text = ""
    async for chunk in stream_chat_completion(payload, api_key, base_url):
        full_text += chunk
        yield chunk

    answer = clean_ai_answer(full_text)
    if answer:
        _save_chat_exchange(db, session, user_message, answer)


@router.post("/chat/stream")
async def ai_chat_stream(
    req: ChatRequest, 
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),):
    api_key, model, base_url = get_ai_settings()
    msg = (req.message or "").strip()
    session = _get_or_create_session(db, user.id, msg, req.session_id)
    user_context = build_user_context(db, user.id)
    analytics_context = build_analytics_context(db, user.id)
    page_context = clean_page_context(req.page_context)
    rag = build_rag_context(msg, page_context=page_context)
    messages = build_messages(req, user, user_context, analytics_context, rag.context, rag.has_results)

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 1600,
        "stream": True,
    }

    return StreamingResponse(
        stream_and_persist_chat_completion(payload, api_key, base_url, db, session, msg),
        media_type="text/plain; charset=utf-8",
        headers={"X-Chat-Session-Id": str(session.id)},
    )


@router.get("/sessions", response_model=list[ChatSessionSummary])
def list_chat_sessions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(AIChatSession)
        .filter(AIChatSession.user_id == user.id)
        .order_by(desc(AIChatSession.updated_at), desc(AIChatSession.id))
        .all()
    )

    result: list[ChatSessionSummary] = []
    for session in sessions:
        last = (
            db.query(AIChatMessage)
            .filter(AIChatMessage.session_id == session.id)
            .order_by(desc(AIChatMessage.created_at), desc(AIChatMessage.id))
            .first()
        )
        result.append(
            ChatSessionSummary(
                id=session.id,
                title=session.title,
                created_at=session.created_at.isoformat() if session.created_at else "",
                updated_at=session.updated_at.isoformat() if session.updated_at else "",
                last_message=last.content[:120] if last else None,
            )
        )
    return result


@router.post("/sessions", response_model=ChatSessionOut)
def create_chat_session(
    data: ChatSessionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = AIChatSession(user_id=user.id, title=(data.title or "New chat")[:160])
    db.add(session)
    db.commit()
    db.refresh(session)
    return ChatSessionOut(
        id=session.id,
        title=session.title,
        created_at=session.created_at.isoformat() if session.created_at else "",
        updated_at=session.updated_at.isoformat() if session.updated_at else "",
        messages=[],
    )


@router.get("/sessions/{session_id}", response_model=ChatSessionOut)
def get_chat_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_owned_session(db, session_id, user.id)
    messages = (
        db.query(AIChatMessage)
        .filter(AIChatMessage.session_id == session.id)
        .order_by(AIChatMessage.created_at, AIChatMessage.id)
        .all()
    )
    return ChatSessionOut(
        id=session.id,
        title=session.title,
        created_at=session.created_at.isoformat() if session.created_at else "",
        updated_at=session.updated_at.isoformat() if session.updated_at else "",
        messages=[_serialize_chat_message(message) for message in messages],
    )


@router.delete("/sessions/{session_id}", status_code=204)
def delete_chat_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_owned_session(db, session_id, user.id)
    db.delete(session)
    db.commit()
    return None
