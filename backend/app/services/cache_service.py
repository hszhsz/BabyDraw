import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from app.models.drawing import Cache
from app.core.config import settings

class CacheService:
    """
    缓存服务
    支持数据库缓存，可扩展支持Redis
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def _generate_cache_key(self, prefix: str, data: Any) -> str:
        """
        生成缓存键
        """
        if isinstance(data, dict):
            # 对字典进行排序后序列化，确保相同内容生成相同的键
            sorted_data = json.dumps(data, sort_keys=True, ensure_ascii=False)
        else:
            sorted_data = str(data)
        
        # 使用MD5生成短键
        hash_object = hashlib.md5(sorted_data.encode('utf-8'))
        hash_hex = hash_object.hexdigest()
        
        return f"{prefix}:{hash_hex}"
    
    async def get(self, key: str) -> Optional[Any]:
        """
        获取缓存
        """
        try:
            cache_item = self.db.query(Cache).filter(
                Cache.cache_key == key,
                Cache.expires_at > datetime.utcnow()
            ).first()
            
            if cache_item:
                # 尝试解析JSON，如果失败则返回原始字符串
                try:
                    return json.loads(cache_item.content)
                except json.JSONDecodeError:
                    return cache_item.content
            
            return None
        except Exception as e:
            print(f"缓存获取失败: {str(e)}")
            return None
    
    async def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> bool:
        """
        设置缓存
        """
        try:
            # 计算过期时间
            if ttl_seconds is None:
                ttl_seconds = settings.CACHE_TTL_SECONDS
            
            expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
            
            # 序列化值
            if isinstance(value, (dict, list)):
                content = json.dumps(value, ensure_ascii=False)
            else:
                content = str(value)
            
            # 检查是否已存在
            existing_cache = self.db.query(Cache).filter(Cache.cache_key == key).first()
            
            if existing_cache:
                # 更新现有缓存
                existing_cache.content = content
                existing_cache.expires_at = expires_at
                existing_cache.created_at = datetime.utcnow()
            else:
                # 创建新缓存
                cache_item = Cache(
                    cache_key=key,
                    content=content,
                    expires_at=expires_at
                )
                self.db.add(cache_item)
            
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            print(f"缓存设置失败: {str(e)}")
            return False
    
    async def delete(self, key: str) -> bool:
        """
        删除缓存
        """
        try:
            cache_item = self.db.query(Cache).filter(Cache.cache_key == key).first()
            if cache_item:
                self.db.delete(cache_item)
                self.db.commit()
                return True
            return False
        except Exception as e:
            self.db.rollback()
            print(f"缓存删除失败: {str(e)}")
            return False
    
    async def clear_expired(self) -> int:
        """
        清理过期缓存
        """
        try:
            expired_count = self.db.query(Cache).filter(
                Cache.expires_at <= datetime.utcnow()
            ).count()
            
            self.db.query(Cache).filter(
                Cache.expires_at <= datetime.utcnow()
            ).delete()
            
            self.db.commit()
            return expired_count
        except Exception as e:
            self.db.rollback()
            print(f"清理过期缓存失败: {str(e)}")
            return 0
    
    async def get_stats(self) -> Dict[str, Any]:
        """
        获取缓存统计信息
        """
        try:
            total_count = self.db.query(Cache).count()
            expired_count = self.db.query(Cache).filter(
                Cache.expires_at <= datetime.utcnow()
            ).count()
            active_count = total_count - expired_count
            
            return {
                "total_count": total_count,
                "active_count": active_count,
                "expired_count": expired_count,
                "hit_rate": 0.0  # 这里可以实现更复杂的命中率统计
            }
        except Exception as e:
            print(f"获取缓存统计失败: {str(e)}")
            return {
                "total_count": 0,
                "active_count": 0,
                "expired_count": 0,
                "hit_rate": 0.0
            }
    
    # 业务相关的缓存方法
    
    async def get_speech_recognition_cache(self, audio_hash: str) -> Optional[str]:
        """
        获取语音识别缓存
        """
        key = self._generate_cache_key("speech", audio_hash)
        return await self.get(key)
    
    async def set_speech_recognition_cache(self, audio_hash: str, result: str) -> bool:
        """
        设置语音识别缓存
        """
        key = self._generate_cache_key("speech", audio_hash)
        return await self.set(key, result, settings.CACHE_TTL_SECONDS)
    
    async def get_image_generation_cache(self, prompt: str, style: str, steps: int) -> Optional[Dict[str, Any]]:
        """
        获取图像生成缓存
        """
        cache_data = {
            "prompt": prompt,
            "style": style,
            "steps": steps
        }
        key = self._generate_cache_key("image", cache_data)
        return await self.get(key)
    
    async def set_image_generation_cache(
        self, 
        prompt: str, 
        style: str, 
        steps: int, 
        result: Dict[str, Any]
    ) -> bool:
        """
        设置图像生成缓存
        """
        cache_data = {
            "prompt": prompt,
            "style": style,
            "steps": steps
        }
        key = self._generate_cache_key("image", cache_data)
        # 图像生成结果缓存时间更长
        return await self.set(key, result, settings.CACHE_TTL_SECONDS * 24)  # 24倍时间