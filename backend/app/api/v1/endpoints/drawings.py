from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.api.dependencies.database import get_db
from app.models.drawing import Drawing
from app.services.drawing_service import DrawingService

router = APIRouter()

class DrawingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    prompt: str
    image_url: str
    steps_images: List[str]
    user_id: Optional[str] = None

class DrawingResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    prompt: str
    image_url: str
    steps_images: List[str]
    user_id: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True

@router.post("/", response_model=DrawingResponse)
async def create_drawing(
    drawing: DrawingCreate,
    db: Session = Depends(get_db)
):
    """
    保存新画作
    """
    try:
        drawing_service = DrawingService(db)
        new_drawing = await drawing_service.create_drawing(drawing)
        return new_drawing
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存画作失败: {str(e)}")

@router.get("/", response_model=List[DrawingResponse])
async def get_drawings(
    user_id: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    获取画作列表
    """
    try:
        drawing_service = DrawingService(db)
        if user_id:
            drawings = drawing_service.get_drawings_by_user(
                user_id=user_id,
                skip=skip,
                limit=limit
            )
        else:
            drawings = drawing_service.get_all_drawings(
                skip=skip,
                limit=limit
            )
        return drawings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取画作列表失败: {str(e)}")

@router.get("/{drawing_id}", response_model=DrawingResponse)
async def get_drawing(
    drawing_id: int,
    db: Session = Depends(get_db)
):
    """
    获取特定画作
    """
    try:
        drawing_service = DrawingService(db)
        drawing = await drawing_service.get_drawing_by_id(drawing_id)
        if not drawing:
            raise HTTPException(status_code=404, detail="画作不存在")
        return drawing
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取画作失败: {str(e)}")

@router.delete("/{drawing_id}")
async def delete_drawing(
    drawing_id: int,
    db: Session = Depends(get_db)
):
    """
    删除画作
    """
    try:
        drawing_service = DrawingService(db)
        success = await drawing_service.delete_drawing(drawing_id)
        if not success:
            raise HTTPException(status_code=404, detail="画作不存在")
        return {"message": "画作删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除画作失败: {str(e)}")