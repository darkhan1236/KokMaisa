# backend/app/router.py
from fastapi import APIRouter

from app.api.users.user_api import router as user_router
from app.api.farms.farm_api import router as farm_router  

router = APIRouter(prefix="/api")

router.include_router(user_router, prefix="/users")
router.include_router(farm_router)  