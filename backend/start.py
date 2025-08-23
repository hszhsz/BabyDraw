#!/usr/bin/env python3
"""
BabyDraw 后端服务启动脚本
"""

import sys
import os
import uvicorn
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# 导入应用
from app.main import app
from app.core.config import settings
from app.core.database import create_tables

def ensure_database():
    """
    确保数据库表存在
    """
    try:
        print("检查数据库表...")
        create_tables()
        print("✓ 数据库表检查完成")
    except Exception as e:
        print(f"⚠️  数据库表检查失败: {str(e)}")
        print("请运行 'python init_db.py' 初始化数据库")

def main():
    """
    启动服务
    """
    print("🚀 启动 BabyDraw 后端服务...")
    print(f"📁 项目目录: {project_root}")
    print(f"🔧 环境: {'开发模式' if settings.DEBUG else '生产模式'}")
    
    # 确保数据库表存在
    ensure_database()
    
    # 启动服务器
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug",
        access_log=True
    )

if __name__ == "__main__":
    main()