#!/usr/bin/env python3
"""
数据库初始化脚本
用于创建数据库表和初始化数据
"""

import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import create_tables, drop_tables, engine
from app.models.drawing import Drawing, Cache
from sqlalchemy import text

def init_database(reset: bool = False):
    """
    初始化数据库
    
    Args:
        reset: 是否重置数据库（删除所有表后重新创建）
    """
    print("开始初始化数据库...")
    
    try:
        # 测试数据库连接
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✓ 数据库连接成功")
        
        if reset:
            print("⚠️  重置模式：删除所有现有表...")
            drop_tables()
            print("✓ 已删除所有表")
        
        # 创建所有表
        print("创建数据库表...")
        create_tables()
        print("✓ 数据库表创建成功")
        
        # 验证表是否创建成功
        with engine.connect() as conn:
            # 检查表是否存在
            tables_query = text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            """)
            result = conn.execute(tables_query)
            tables = [row[0] for row in result]
            
            print(f"✓ 已创建的表: {', '.join(tables)}")
        
        print("🎉 数据库初始化完成！")
        
    except Exception as e:
        print(f"❌ 数据库初始化失败: {str(e)}")
        sys.exit(1)

def main():
    """
    主函数
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="BabyDraw 数据库初始化脚本")
    parser.add_argument(
        "--reset", 
        action="store_true", 
        help="重置数据库（删除所有表后重新创建）"
    )
    
    args = parser.parse_args()
    
    if args.reset:
        confirm = input("⚠️  确定要重置数据库吗？这将删除所有数据！(y/N): ")
        if confirm.lower() != 'y':
            print("操作已取消")
            return
    
    init_database(reset=args.reset)

if __name__ == "__main__":
    main()