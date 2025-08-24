from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.api.dependencies.database import get_db
from app.services.image_service import ImageService
# from app.services.cache_service import CacheService
# import hashlib

router = APIRouter()

class ImageGenerationRequest(BaseModel):
    prompt: str
    style: str = "简笔画"
    steps: int = 4  # 分步骤数量

class ImageGenerationResponse(BaseModel):
    final_image_url: str
    step_images: list[str]
    prompt: str
    from_cache: bool

@router.post("/generate", response_model=ImageGenerationResponse)
async def generate_image(
    request: ImageGenerationRequest,
    db: Session = Depends(get_db)
):
    """
    文字生成简笔画图像接口
    """
    try:
        # 生成缓存键
        # prompt_hash = hashlib.md5(f"{request.prompt}:{request.style}:{request.steps}".encode()).hexdigest()
        # cache_key = f"image:{prompt_hash}"
        
        # 检查缓存
        # cache_service = CacheService(db)
        # cached_result = await cache_service.get(cache_key)
        
        # if cached_result:
        #     # cached_result已经是解析后的字典
        #     return ImageGenerationResponse(
        #         final_image_url=cached_result["final_image_url"],
        #         step_images=cached_result["step_images"],
        #         prompt=request.prompt,
        #         from_cache=True
        #     )
        
        # 调用图像生成服务
        image_service = ImageService()
        result = await image_service.generate_step_by_step_drawing(
            prompt=request.prompt,
            style=request.style,
            steps=request.steps
        )
        
        # 缓存结果
        # cache_data = {
        #     "final_image_url": result["final_image_url"],
        #     "step_images": result["step_images"]
        # }
        # await cache_service.set(cache_key, cache_data)
        
        return ImageGenerationResponse(
            final_image_url=result["final_image_url"],
            step_images=result["step_images"],
            prompt=request.prompt,
            from_cache=False
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图像生成失败: {str(e)}")

@router.get("/test")
async def test_image_generation():
    """
    测试图像生成服务
    """
    return {"message": "图像生成服务正常"}