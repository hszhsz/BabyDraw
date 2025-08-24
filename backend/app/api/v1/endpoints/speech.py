from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.api.dependencies.database import get_db
from app.services.speech_service import SpeechService
# from app.services.cache_service import CacheService
# import hashlib
import logging

logger = logging.getLogger(__name__)

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
        # 验证文件类型 - 检查content_type或文件扩展名
        valid_content_types = ['audio/', 'application/octet-stream']
        valid_extensions = ['.wav', '.mp3', '.m4a', '.ogg', '.flac']
        
        is_valid_content_type = any(audio.content_type.startswith(ct) for ct in valid_content_types)
        is_valid_extension = any(audio.filename.lower().endswith(ext) for ext in valid_extensions) if audio.filename else False
        
        if not (is_valid_content_type or is_valid_extension):
            logger.warning(f"无效的文件类型: content_type={audio.content_type}, filename={audio.filename}")
            raise HTTPException(status_code=400, detail="只支持音频文件")
        
        logger.info(f"接收到音频文件: content_type={audio.content_type}, filename={audio.filename}")
        
        # 读取音频内容
        audio_content = await audio.read()
        
        # 生成音频文件的哈希值用于缓存
        # audio_hash = hashlib.md5(audio_content).hexdigest()
        # cache_key = f"speech:{audio_hash}"
        
        # 检查缓存
        # cache_service = CacheService(db)
        # cached_result = await cache_service.get(cache_key)
        
        # if cached_result:
        #     return {"text": cached_result, "from_cache": True}
        
        # 调用语音识别服务
        speech_service = SpeechService()
        recognized_text = await speech_service.recognize(audio_content)
        
        # 缓存识别结果
        # await cache_service.set(cache_key, recognized_text)
        
        return {"text": recognized_text, "from_cache": False}
        
    except Exception as e:
        logger.error(f"语音识别失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"语音识别失败: {str(e)}")

@router.get("/test")
async def test_speech():
    """
    测试语音识别服务
    """
    speech_service = SpeechService()
    provider_info = speech_service.get_provider_info()
    return {
        "message": "语音识别服务正常",
        "current_provider": provider_info["current_provider"],
        "provider_info": provider_info["provider_info"]
    }