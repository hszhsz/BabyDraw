from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import validator
import os

class Settings(BaseSettings):
    # API设置
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "BabyDraw"
    DEBUG: bool = True
    
    # CORS设置
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3006",
        "http://127.0.0.1:3006",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # 数据库设置
    DATABASE_URL: str = "sqlite:///./babydraw.db"
    
    # Redis设置
    REDIS_URL: str = "redis://localhost:6379"
    
    # AI服务设置
    # 阿里云语音识别
    ALIYUN_ACCESS_KEY_ID: Optional[str] = None
    ALIYUN_ACCESS_KEY_SECRET: Optional[str] = None
    
    # 通义万相图像生成
    DASHSCOPE_API_KEY: Optional[str] = None
    
    # 讯飞语音识别
    XFYUN_APP_ID: Optional[str] = None
    XFYUN_API_KEY: Optional[str] = None
    XFYUN_API_SECRET: Optional[str] = None
    
    # 文件存储设置
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # 缓存设置
    CACHE_TTL: int = 3600  # 1小时
    CACHE_TTL_SECONDS: int = 3600  # 1小时，用于缓存服务
    
    # 日志设置
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "./logs"
    LOG_FILE: str = "babydraw.log"
    LOG_MAX_SIZE: int = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()