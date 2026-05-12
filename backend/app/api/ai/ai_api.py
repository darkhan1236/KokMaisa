# backend/app/api/ai/ai_api.py
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from core.config import settings
from core.security import get_current_user
from model.models import User

router = APIRouter(prefix="/ai", tags=["AI"])

SYSTEM_PROMPT = """
Ты — агрономический AI-консультант платформы KokMaisa (Казахстан).

## Твоя экспертиза:

### 🌿 Биомасса и пастбища
- Измерение и интерпретация биомассы (ц/га, кг/га)
- NDVI индекс: значения 0.2-0.4 (разреженная растительность), 0.4-0.6 (умеренная), 0.6-0.9 (густая)
- Оптимальная биомасса для выпаса: 15-25 ц/га сухого вещества
- Нормы стравливания: не более 50-60% от имеющейся биомассы
- Сезонная динамика пастбищ Казахстана: весна (апрель-май), лето (июнь-август), осень (сентябрь-октябрь)
- Типы пастбищ Казахстана: степные, полупустынные, горные, пойменные

### 🐄 Животноводство и скотоводство
- Нормы потребления корма: КРС 10-15 кг/день сухого вещества, овцы 1.5-2.5 кг/день
- Пастбищная нагрузка: 1 условная голова на 2-5 га (зависит от зоны)
- Загонная система выпаса: ротация загонов каждые 7-14 дней
- Периоды отдыха пастбищ: 30-45 дней для восстановления

### 🌾 Сеноводство и кормопроизводство
- Оптимальные сроки скашивания: начало цветения (максимум питательности)
- Урожайность сена: степные — 8-15 ц/га, поливные — 30-60 ц/га
- Влажность при закладке: не более 17-18%
- Потери при заготовке: 15-25% от урожая на корню
- Культуры Казахстана: люцерна, эспарцет, костёр, пырей, житняк

### 📊 Агрономия и урожайность
- Зерновые Казахстана: пшеница (8-20 ц/га), ячмень (12-25 ц/га), просо (10-15 ц/га)
- Влияние осадков: 1 мм осадков = ~1-2 кг/га прибавки биомассы
- Агроклиматические зоны Казахстана: сухостепная, степная, лесостепная
- Применение удобрений: N60-90 для злаков, P40-60 для бобовых

### 🚁 Дроны и технологии мониторинга
- NDVI съёмка: лучшее время — 11:00-14:00 в ясную погоду
- Мультиспектральные камеры vs RGB: мультиспектральные точнее для NDVI
- Высота полёта для пастбищ: 50-120 м
- Периодичность мониторинга: каждые 7-14 дней в активный сезон

### 📱 Платформа KokMaisa
- Измерение биомассы через загрузку фото пастбища (AI-анализ)
- Управление несколькими пастбищами и фермами
- История измерений и тренды по NDVI и биомассе
- Интеграция с дронами для автоматического сканирования
- Доступно на казахском, русском и английском языках

## Правила ответов:
- Отвечай НА ТОМ ЖЕ ЯЗЫКЕ, на котором задан вопрос (рус/каз/англ)
- Давай конкретные числа и нормы — фермерам нужна практика, не теория
- Если спрашивают про данные пользователя (его пастбища, измерения) — скажи что не имеешь доступа к его личным данным, предложи посмотреть в разделе "Измерения"
- Структурируй ответ: короткий вывод → детали → рекомендация
- НЕ придумывай данные пользователя
- Максимальная длина ответа: 400 слов
""".strip()


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []   # история для контекста


class ChatResponse(BaseModel):
    answer: str


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(req: ChatRequest, user: User = Depends(get_current_user)):
    msg = (req.message or "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Empty message")

    api_key  = getattr(settings, "openai_api_key", "")  or os.getenv("OPENAI_API_KEY", "")
    model    = getattr(settings, "openai_model", "")    or os.getenv("OPENAI_MODEL", "meta-llama/llama-3.1-8b-instruct:free")
    base_url = getattr(settings, "openai_base_url", "") or os.getenv("OPENAI_BASE_URL", "https://openrouter.ai/api/v1")

    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY не задан")

    user_name = getattr(user, "full_name", "") or ""
    user_role = getattr(user, "role", "") or ""

    # Собираем историю (последние 10 сообщений чтобы не раздувать контекст)
    history = req.history or []
    recent_history = history[-10:] if len(history) > 10 else history

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": f"Пользователь: {user_name}. Роль: {user_role}."},
        # история диалога
        *[{"role": m.role, "content": m.content} for m in recent_history],
        # текущий вопрос
        {"role": "user", "content": msg},
    ]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kokmaisa.kz",
        "X-Title": "KokMaisa AI Consultant",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 800,
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(f"{base_url}/chat/completions", json=payload, headers=headers)

        if resp.status_code >= 400:
            try:
                err_json = resp.json()
            except Exception:
                err_json = {"error": resp.text}
            if resp.status_code == 401:
                raise HTTPException(status_code=503, detail="Ошибка авторизации OpenRouter (неверный ключ)")
            if resp.status_code == 429:
                raise HTTPException(status_code=503, detail="Превышен лимит запросов AI. Попробуйте позже.")
            raise HTTPException(status_code=502, detail=f"AI provider error {resp.status_code}")

        data   = resp.json()
        answer = (data.get("choices", [{}])[0].get("message", {}) or {}).get("content", "").strip()

        if not answer:
            return ChatResponse(answer="Пустой ответ от AI. Попробуйте переформулировать вопрос.")

        return ChatResponse(answer=answer)

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI не ответил вовремя. Попробуйте ещё раз.")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="AI request failed")
