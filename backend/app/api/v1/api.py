from fastapi import APIRouter
from app.api.v1.endpoints import speech, images, drawings, cache

api_router = APIRouter()

api_router.include_router(speech.router, prefix="/speech", tags=["speech"])
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(drawings.router, prefix="/drawings", tags=["drawings"])
api_router.include_router(cache.router, prefix="/cache", tags=["cache"])