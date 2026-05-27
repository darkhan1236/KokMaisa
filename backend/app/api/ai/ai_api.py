# backend/app/api/ai/ai_api.py
import json
import os
import re
import time
from datetime import datetime, timezone
from typing import AsyncIterator, List, Optional

import httpx
from fastapi import BackgroundTasks
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
CONTEXT_CACHE_TTL_SECONDS = 45
MAX_HISTORY_MESSAGES = 4
MAX_HISTORY_CHARS = 500
MAX_AI_TOKENS = 650
OLLAMA_OPTIONS = {
    "num_ctx": 2048,
    "num_predict": MAX_AI_TOKENS,
    "temperature": 0.2,
    "top_p": 0.85,
    "repeat_penalty": 1.08,
}
_USER_CONTEXT_CACHE: dict[int, tuple[float, str, str]] = {}

SYSTEM_PROMPT = """
You are KokMaisa AI, a concise agricultural consultant for farmers in Kazakhstan.
Answer in the user's language only. No emoji.
Keep answers useful but not too long: usually 6-10 sentences unless the user asks for detail.
Use only provided private context for the user's farms, pastures, and measurements.
Do not invent private data, causes, weather, or measurements.
Do not mention drones. Do not show internal database IDs.
If required context is missing, say what data is needed.
For KokMaisa documentation questions without RAG evidence, answer exactly:
"Пока не знаю точного ответа по этой теме в моей базе знаний."
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
    return cleaned[:500]


def compact_chat_content(text: str, limit: int = MAX_HISTORY_CHARS) -> str:
    cleaned = re.sub(r"\s+", " ", text or "").strip()
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[:limit].rstrip() + "..."


def should_use_rag(message: str, page_context: str | None = None) -> bool:
    text = (message or "").lower()
    keywords = (
        "документ", "база знаний", "rag", "инструкц", "как работает", "kokmaisa",
        "платформ", "система", "агроном", "норма", "рекомендац", "пастбищ",
        "биомасс", "деградац", "эроз", "животновод", "казахстан", "fao", "usda",
        "documentation", "knowledge", "platform", "agronomy", "recommendation",
        "pasture", "biomass", "degradation", "kazakhstan", "жайылым", "биомасса",
        "ұсыныс", "қазақстан",
    )
    return any(keyword in text for keyword in keywords)


def should_use_private_context(message: str) -> bool:
    text = (message or "").lower()
    keywords = (
        "моя", "мой", "мои", "менің", "my",
        "ферм", "қожалық", "farm",
        "паст", "жайылым", "pasture",
        "измер", "өлшем", "measurement",
        "биомасс", "biomass",
        "покров", "coverage",
        "дашборд", "dashboard",
        "анализ", "аналит", "trend", "тренд",
        "скот", "коров", "сиыр", "мал", "livestock", "cattle",
    )
    return any(keyword in text for keyword in keywords)


def get_cached_contexts(db: Session, user_id: int) -> tuple[str, str]:
    now = time.monotonic()
    cached = _USER_CONTEXT_CACHE.get(user_id)
    if cached and cached[0] > now:
        return cached[1], cached[2]

    user_context = build_user_context(db, user_id)
    analytics_context = build_analytics_context(db, user_id)
    _USER_CONTEXT_CACHE[user_id] = (
        now + CONTEXT_CACHE_TTL_SECONDS,
        user_context,
        analytics_context,
    )
    return user_context, analytics_context


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


def _save_chat_exchange_by_id(session_id: int, user_message: str, assistant_message: str) -> None:
    from database.db import SessionLocal

    db = SessionLocal()
    try:
        session = db.query(AIChatSession).filter(AIChatSession.id == session_id).first()
        if session:
            _save_chat_exchange(db, session, user_message, assistant_message)
    finally:
        db.close()


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
    recent_history = history[-MAX_HISTORY_MESSAGES:] if len(history) > MAX_HISTORY_MESSAGES else history

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "system",
            "content": f"Current user name: {user_name}. Current user role: {user_role}.",
        },
        {
            "role": "system",
            "content": (
                f"Frontend page context: {page_context}\n"
                f"Answer only in {response_language}."
            ),
        },
    ]
    if user_context or analytics_context:
        messages.append({
            "role": "system",
            "content": (
                "Private KokMaisa context for this user:\n"
                f"{user_context}\n\n"
                "Precomputed analytics:\n"
                f"{analytics_context}"
            ),
        })
    if rag_context:
        messages.append({
            "role": "system",
            "content": (
                "RAG knowledge-base context:\n"
                f"{rag_context}\n\n"
                f"RAG snippets found: {rag_has_results}. "
                f'If documentation knowledge is needed and snippets are not relevant, answer exactly: "{UNKNOWN_RAG_ANSWER_RU}"'
            ),
        })
    messages.extend({"role": m.role, "content": compact_chat_content(m.content)} for m in recent_history)
    messages.append({
        "role": "user",
        "content": (
            f"/no_think\nAnswer only in {response_language}. "
            "Give a complete answer in 6-10 clear sentences. Finish the last sentence.\n\n"
            f"{msg}"
        ),
    })
    return messages


def build_ai_payload(model: str, messages: list[dict[str, str]], stream: bool = False) -> dict:
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": MAX_AI_TOKENS,
    }
    if stream:
        payload["stream"] = True
    if "localhost:11434" in (getattr(settings, "openai_base_url", "") or os.getenv("OPENAI_BASE_URL", "")):
        payload["options"] = OLLAMA_OPTIONS
        payload["keep_alive"] = "10m"
    return payload


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
    page_context = clean_page_context(req.page_context)
    use_private_context = should_use_private_context(msg)
    user_context, analytics_context = get_cached_contexts(db, user.id) if use_private_context else ("", "")
    rag = build_rag_context(msg, top_k=2, page_context=page_context) if not use_private_context and should_use_rag(msg, page_context) else None
    rag_context = rag.context if rag else ""
    rag_has_results = rag.has_results if rag else False
    messages = build_messages(req, user, user_context, analytics_context, rag_context, rag_has_results)

    payload = build_ai_payload(model, messages)

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
    background_tasks: BackgroundTasks,
    session_id: int,
    user_message: str,
) -> AsyncIterator[str]:
    full_text = ""
    async for chunk in stream_chat_completion(payload, api_key, base_url):
        full_text += chunk
        yield chunk

    answer = clean_ai_answer(full_text)
    if answer:
        background_tasks.add_task(_save_chat_exchange_by_id, session_id, user_message, answer)


@router.post("/chat/stream")
async def ai_chat_stream(
    req: ChatRequest, 
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),):
    api_key, model, base_url = get_ai_settings()
    msg = (req.message or "").strip()
    session = _get_or_create_session(db, user.id, msg, req.session_id)
    page_context = clean_page_context(req.page_context)
    use_private_context = should_use_private_context(msg)
    user_context, analytics_context = get_cached_contexts(db, user.id) if use_private_context else ("", "")
    rag = build_rag_context(msg, top_k=2, page_context=page_context) if not use_private_context and should_use_rag(msg, page_context) else None
    rag_context = rag.context if rag else ""
    rag_has_results = rag.has_results if rag else False
    messages = build_messages(req, user, user_context, analytics_context, rag_context, rag_has_results)

    payload = build_ai_payload(model, messages, stream=True)

    return StreamingResponse(
        stream_and_persist_chat_completion(payload, api_key, base_url, background_tasks, session.id, msg),
        media_type="text/plain; charset=utf-8",
        headers={"X-Chat-Session-Id": str(session.id)},
        background=background_tasks,
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
