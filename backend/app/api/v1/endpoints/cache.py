from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.api.dependencies.database import get_db
from app.services.cache_service import CacheService

router = APIRouter()

class CacheRequest(BaseModel):
    key: str
    value: str
    ttl: int = 3600  # 默认1小时

class CacheResponse(BaseModel):
    key: str
    value: str
    exists: bool

@router.get("/{cache_key}", response_model=CacheResponse)
async def get_cache(
    cache_key: str,
    db: Session = Depends(get_db)
):
    """
    获取缓存值
    """
    try:
        cache_service = CacheService(db)
        value = await cache_service.get(cache_key)
        
        return CacheResponse(
            key=cache_key,
            value=value or "",
            exists=value is not None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取缓存失败: {str(e)}")

@router.post("/")
async def set_cache(
    request: CacheRequest,
    db: Session = Depends(get_db)
):
    """
    设置缓存值
    """
    try:
        cache_service = CacheService(db)
        await cache_service.set(request.key, request.value, request.ttl)
        
        return {"message": "缓存设置成功", "key": request.key}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"设置缓存失败: {str(e)}")

@router.delete("/{cache_key}")
async def delete_cache(
    cache_key: str,
    db: Session = Depends(get_db)
):
    """
    删除缓存
    """
    try:
        cache_service = CacheService(db)
        success = await cache_service.delete(cache_key)
        
        if not success:
            raise HTTPException(status_code=404, detail="缓存不存在")
            
        return {"message": "缓存删除成功", "key": cache_key}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除缓存失败: {str(e)}")

@router.get("/")
async def cache_stats(
    db: Session = Depends(get_db)
):
    """
    获取缓存统计信息
    """
    try:
        cache_service = CacheService(db)
        stats = await cache_service.get_stats()
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取缓存统计失败: {str(e)}")