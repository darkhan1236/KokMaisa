import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.config import settings
from core.security import get_current_user
from model.models import User

router = APIRouter(prefix="/ai", tags=["AI"])

SYSTEM_PROMPT = """
You are an AI assistant for a pasture biomass monitoring web app in Kazakhstan.

Your job:
- answer questions about the product and how to use the website
- explain concepts (biomass, NDVI, grazing management) simply
- help the user plan next steps for the project

Rules:
- If you don't have real pasture data, say: "I don't have your pasture measurements yet."
- Do NOT invent numbers, farm names, or analytics.
- Ask 1-2 clarifying questions if needed.
- Be practical and short. Give steps.
Language: Russian (can include short English terms in brackets).
""".strip()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str


def _get_env_or_settings(name: str, default: str = "") -> str:
    # сначала settings (если ты добавил поля), потом os.getenv
    val = getattr(settings, name, None)
    if isinstance(val, str) and val:
        return val
    return os.getenv(name.upper(), default)  # на всякий случай


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(req: ChatRequest, user: User = Depends(get_current_user)):
    msg = (req.message or "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Empty message")

    # Эти поля мы ожидаем в settings, но на всякий случай делаем fallback на env:
    api_key = getattr(settings, "openai_api_key", "") or os.getenv("OPENAI_API_KEY", "")
    model = getattr(settings, "openai_model", "") or os.getenv("OPENAI_MODEL", "meta-llama/llama-3.1-8b-instruct")
    base_url = getattr(settings, "openai_base_url", "") or os.getenv("OPENAI_BASE_URL", "https://openrouter.ai/api/v1")

    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set (use OpenRouter key sk-or-v1-...)")

    # простая персонализация
    user_name = getattr(user, "full_name", "") or getattr(user, "name", "") or ""
    user_role = getattr(user, "role", "") or ""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": f"User: {user_name}. Role: {user_role}."},
        {"role": "user", "content": msg},
    ]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        # Рекомендуемые заголовки OpenRouter (не обязательно, но полезно)
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "KokMaisa AI Assistant",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.4,
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(f"{base_url}/chat/completions", json=payload, headers=headers)

        # Если OpenRouter вернул ошибку — покажем её текстом
        if resp.status_code >= 400:
            try:
                err_json = resp.json()
            except Exception:
                err_json = {"error": resp.text}

            # нормальные человеко-понятные ошибки
            if resp.status_code == 401:
                raise HTTPException(status_code=503, detail="AI auth error (invalid OpenRouter key).")
            if resp.status_code == 429:
                raise HTTPException(status_code=503, detail="AI rate limit / free quota exceeded on OpenRouter.")
            raise HTTPException(status_code=500, detail=f"OpenRouter error {resp.status_code}: {err_json}")

        data = resp.json()
        answer = (data.get("choices", [{}])[0].get("message", {}) or {}).get("content", "")
        answer = (answer or "").strip()

        if not answer:
            return ChatResponse(answer="Пустой ответ от AI. Попробуйте переформулировать вопрос.")

        return ChatResponse(answer=answer)

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI timeout. Try again.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
