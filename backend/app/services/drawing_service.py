from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.drawing import Drawing
from app.services.speech_service import SpeechService
from app.services.image_service import ImageService
from app.services.cache_service import CacheService

class DrawingService:
    """
    绘画服务
    整合语音识别、图像生成和缓存功能
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.speech_service = SpeechService()
        self.image_service = ImageService()
        self.cache_service = CacheService(db)
    
    async def create_drawing_from_speech(
        self, 
        audio_content: bytes, 
        user_id: Optional[str] = None,
        style: str = "简笔画",
        steps: int = 4
    ) -> Dict[str, Any]:
        """
        从语音创建绘画
        """
        try:
            # 1. 语音识别
            import hashlib
            audio_hash = hashlib.md5(audio_content).hexdigest()
            
            # 检查语音识别缓存
            cached_text = await self.cache_service.get_speech_recognition_cache(audio_hash)
            if cached_text:
                recognized_text = cached_text
            else:
                recognized_text = await self.speech_service.recognize(audio_content)
                # 缓存语音识别结果
                await self.cache_service.set_speech_recognition_cache(audio_hash, recognized_text)
            
            # 2. 生成图像
            return await self.create_drawing_from_text(
                text=recognized_text,
                user_id=user_id,
                style=style,
                steps=steps
            )
        except Exception as e:
            raise Exception(f"从语音创建绘画失败: {str(e)}")
    
    async def create_drawing_from_text(
        self, 
        text: str, 
        user_id: Optional[str] = None,
        style: str = "简笔画",
        steps: int = 4
    ) -> Dict[str, Any]:
        """
        从文字创建绘画
        """
        try:
            # 1. 检查图像生成缓存
            cached_images = await self.cache_service.get_image_generation_cache(text, style, steps)
            if cached_images:
                image_result = cached_images
            else:
                # 2. 生成图像
                image_result = await self.image_service.generate_step_by_step_drawing(
                    prompt=text,
                    style=style,
                    steps=steps
                )
                # 缓存图像生成结果
                await self.cache_service.set_image_generation_cache(text, style, steps, image_result)
            
            # 3. 保存到数据库
            drawing = Drawing(
                title=text,
                description=f"使用{style}风格绘制的{text}",
                prompt=text,
                image_url=image_result["final_image_url"],
                step_images=image_result["step_images"],
                user_id=user_id or "anonymous",
                style=style,
                steps=steps
            )
            
            self.db.add(drawing)
            self.db.commit()
            self.db.refresh(drawing)
            
            return {
                "id": drawing.id,
                "title": drawing.title,
                "description": drawing.description,
                "prompt": drawing.prompt,
                "image_url": drawing.image_url,
                "step_images": drawing.step_images,
                "style": drawing.style,
                "steps": drawing.steps,
                "created_at": drawing.created_at.isoformat(),
                "provider": image_result.get("provider", "unknown")
            }
        except Exception as e:
            self.db.rollback()
            raise Exception(f"从文字创建绘画失败: {str(e)}")
    
    def get_drawing_by_id(self, drawing_id: int) -> Optional[Dict[str, Any]]:
        """
        根据ID获取绘画
        """
        try:
            drawing = self.db.query(Drawing).filter(Drawing.id == drawing_id).first()
            if not drawing:
                return None
            
            return {
                "id": drawing.id,
                "title": drawing.title,
                "description": drawing.description,
                "prompt": drawing.prompt,
                "image_url": drawing.image_url,
                "step_images": drawing.step_images,
                "style": drawing.style,
                "steps": drawing.steps,
                "user_id": drawing.user_id,
                "created_at": drawing.created_at.isoformat(),
                "updated_at": drawing.updated_at.isoformat()
            }
        except Exception as e:
            raise Exception(f"获取绘画失败: {str(e)}")
    
    def get_drawings_by_user(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        获取用户的绘画列表
        """
        try:
            drawings = self.db.query(Drawing).filter(
                Drawing.user_id == user_id
            ).order_by(
                Drawing.created_at.desc()
            ).offset(skip).limit(limit).all()
            
            return [
                {
                    "id": drawing.id,
                    "title": drawing.title,
                    "description": drawing.description,
                    "prompt": drawing.prompt,
                    "image_url": drawing.image_url,
                    "steps_images": drawing.step_images,
                    "user_id": drawing.user_id,
                    "created_at": drawing.created_at.isoformat()
                }
                for drawing in drawings
            ]
        except Exception as e:
            raise Exception(f"获取用户绘画列表失败: {str(e)}")
    
    def get_all_drawings(self, skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
        """
        获取所有绘画列表
        """
        try:
            drawings = self.db.query(Drawing).order_by(
                Drawing.created_at.desc()
            ).offset(skip).limit(limit).all()
            
            return [
                {
                    "id": drawing.id,
                    "title": drawing.title,
                    "description": drawing.description,
                    "prompt": drawing.prompt,
                    "image_url": drawing.image_url,
                    "steps_images": drawing.step_images,
                    "user_id": drawing.user_id,
                    "created_at": drawing.created_at.isoformat()
                }
                for drawing in drawings
            ]
        except Exception as e:
            raise Exception(f"获取绘画列表失败: {str(e)}")
    
    def delete_drawing(self, drawing_id: int, user_id: Optional[str] = None) -> bool:
        """
        删除绘画
        """
        try:
            query = self.db.query(Drawing).filter(Drawing.id == drawing_id)
            
            # 如果指定了用户ID，则只能删除自己的绘画
            if user_id:
                query = query.filter(Drawing.user_id == user_id)
            
            drawing = query.first()
            if not drawing:
                return False
            
            self.db.delete(drawing)
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            raise Exception(f"删除绘画失败: {str(e)}")
    
    async def get_service_status(self) -> Dict[str, Any]:
        """
        获取服务状态
        """
        try:
            # 获取各服务的状态信息
            speech_info = self.speech_service.get_provider_info()
            image_info = self.image_service.get_provider_info()
            cache_stats = await self.cache_service.get_stats()
            
            # 获取数据库统计
            total_drawings = self.db.query(Drawing).count()
            
            return {
                "speech_service": speech_info,
                "image_service": image_info,
                "cache_stats": cache_stats,
                "database_stats": {
                    "total_drawings": total_drawings
                },
                "status": "healthy"
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }