# backend/app/router.py
from fastapi import APIRouter
from app.api.users.user_api import router as user_router

router = APIRouter(prefix="/api")
router.include_router(user_router, prefix="/users")