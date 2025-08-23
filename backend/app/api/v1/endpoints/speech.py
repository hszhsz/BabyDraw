from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.api.dependencies.database import get_db
from app.services.speech_service import SpeechService
from app.services.cache_service import CacheService
import hashlib

router = APIRouter()

@router.post("/recognize")
async def recognize_speech(
    audio: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    语音识别接口
    """
    try:
        # 验证文件类型
        if not audio.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="只支持音频文件")
        
        # 读取音频内容
        audio_content = await audio.read()
        
        # 生成缓存键
        audio_hash = hashlib.md5(audio_content).hexdigest()
        cache_key = f"speech:{audio_hash}"
        
        # 检查缓存
        cache_service = CacheService(db)
        cached_result = await cache_service.get(cache_key)
        
        if cached_result:
            return {"text": cached_result, "from_cache": True}
        
        # 调用语音识别服务
        speech_service = SpeechService()
        recognized_text = await speech_service.recognize(audio_content)
        
        # 缓存结果
        await cache_service.set(cache_key, recognized_text)
        
        return {"text": recognized_text, "from_cache": False}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"语音识别失败: {str(e)}")

@router.get("/test")
async def test_speech():
    """
    测试语音识别服务
    """
    return {"message": "语音识别服务正常"}