# backend/main.py
import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings
from app.router import router
from app.api.biomass.inference import predictor  # ← новый импорт

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Запускается один раз при старте сервера ──
    # model_path = os.getenv("MODEL_PATH", "")
    model_path = settings.MODEL_PATH
    if model_path:
        try:
            predictor.load(
                model_path    = model_path,
                backbone_name = os.getenv("BACKBONE_NAME", "vit_large_patch16_dinov3_qkvb.lvd1689m"),
                hidden        = int(os.getenv("MODEL_HIDDEN", "512")),
                dropout       = float(os.getenv("MODEL_DROPOUT", "0.4")),
            )
            logger.info("✅ Biomass model loaded from %s", model_path)
        except Exception as e:
            logger.error("❌ Failed to load biomass model: %s", e)
    else:
        logger.warning("⚠️  MODEL_PATH not set — inference will return 503")
    
    yield  # ← сервер работает здесь
    
    # ── Запускается при остановке сервера (ничего не нужно) ──


app = FastAPI(title="KokMaisa API", lifespan=lifespan)  # ← добавил lifespan

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()",
    )
    return response

app.include_router(router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
