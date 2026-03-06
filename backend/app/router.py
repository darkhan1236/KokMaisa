# backend/app/router.py
import os
import logging
from fastapi import APIRouter

from app.api.users.user_api import router as user_router
from app.api.farms.farm_api import router as farm_router
from app.api.pastures.pasture_api import router as pasture_router
from app.api.drones.drone_api import router as drone_router
from app.api.ai.ai_api import router as ai_router
from app.api.biomass.biomass_api import router as measurements_router  # ← новый

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

router.include_router(user_router, prefix="/users")
router.include_router(farm_router)
router.include_router(pasture_router)
router.include_router(drone_router)
router.include_router(ai_router)
router.include_router(measurements_router)  # ← новый