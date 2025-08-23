from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
from app.core.logging import setup_logging, get_logger
import logging

# 初始化日志系统
setup_logging()
logger = get_logger(__name__)

app = FastAPI(
    title="BabyDraw API",
    description="简笔画教学应用后端API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

logger.info("BabyDraw API 应用启动")

# 设置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含API路由
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    logger.info("根路径访问")
    return {"message": "BabyDraw API is running!"}

@app.get("/health")
async def health_check():
    logger.info("健康检查访问")
    return {"status": "healthy"}