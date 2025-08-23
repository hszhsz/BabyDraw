import os
import hashlib
from typing import List, Optional
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class FileUtils:
    """
    文件处理工具类
    """
    
    # 支持的音频文件类型
    SUPPORTED_AUDIO_TYPES = {
        "audio/wav",
        "audio/wave", 
        "audio/x-wav",
        "audio/mpeg",
        "audio/mp3",
        "audio/mp4",
        "audio/aac",
        "audio/ogg",
        "audio/webm",
        "audio/flac"
    }
    
    # 支持的音频文件扩展名
    SUPPORTED_AUDIO_EXTENSIONS = {
        ".wav", ".mp3", ".mp4", ".aac", 
        ".ogg", ".webm", ".flac", ".m4a"
    }
    
    @staticmethod
    def validate_audio_file(file: UploadFile) -> bool:
        """
        验证音频文件
        """
        # 检查文件大小
        if hasattr(file, 'size') and file.size > settings.MAX_AUDIO_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"音频文件大小不能超过 {settings.MAX_AUDIO_SIZE / 1024 / 1024:.1f}MB"
            )
        
        # 检查文件类型
        if file.content_type not in FileUtils.SUPPORTED_AUDIO_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的音频文件类型: {file.content_type}"
            )
        
        # 检查文件扩展名
        if file.filename:
            file_ext = os.path.splitext(file.filename.lower())[1]
            if file_ext not in FileUtils.SUPPORTED_AUDIO_EXTENSIONS:
                raise HTTPException(
                    status_code=400,
                    detail=f"不支持的音频文件扩展名: {file_ext}"
                )
        
        return True
    
    @staticmethod
    async def read_audio_file(file: UploadFile) -> bytes:
        """
        读取音频文件内容
        """
        try:
            # 验证文件
            FileUtils.validate_audio_file(file)
            
            # 读取文件内容
            content = await file.read()
            
            # 再次检查文件大小
            if len(content) > settings.MAX_AUDIO_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"音频文件大小不能超过 {settings.MAX_AUDIO_SIZE / 1024 / 1024:.1f}MB"
                )
            
            return content
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"读取音频文件失败: {str(e)}"
            )
    
    @staticmethod
    def generate_file_hash(content: bytes) -> str:
        """
        生成文件内容的哈希值
        """
        return hashlib.md5(content).hexdigest()
    
    @staticmethod
    def get_file_info(file: UploadFile) -> dict:
        """
        获取文件信息
        """
        file_ext = ""
        if file.filename:
            file_ext = os.path.splitext(file.filename.lower())[1]
        
        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "extension": file_ext,
            "size": getattr(file, 'size', 0)
        }
    
    @staticmethod
    def ensure_upload_directory() -> str:
        """
        确保上传目录存在
        """
        upload_dir = settings.UPLOAD_DIR
        os.makedirs(upload_dir, exist_ok=True)
        return upload_dir
    
    @staticmethod
    async def save_uploaded_file(file: UploadFile, filename: str) -> str:
        """
        保存上传的文件
        """
        try:
            # 确保上传目录存在
            upload_dir = FileUtils.ensure_upload_directory()
            
            # 生成完整文件路径
            file_path = os.path.join(upload_dir, filename)
            
            # 读取文件内容
            content = await file.read()
            
            # 写入文件
            with open(file_path, "wb") as f:
                f.write(content)
            
            return file_path
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"保存文件失败: {str(e)}"
            )
    
    @staticmethod
    def delete_file(file_path: str) -> bool:
        """
        删除文件
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"删除文件失败: {str(e)}")
            return False
    
    @staticmethod
    def get_file_size_mb(file_path: str) -> float:
        """
        获取文件大小（MB）
        """
        try:
            if os.path.exists(file_path):
                size_bytes = os.path.getsize(file_path)
                return size_bytes / 1024 / 1024
            return 0.0
        except Exception:
            return 0.0
    
    @staticmethod
    def clean_old_files(directory: str, max_age_hours: int = 24) -> int:
        """
        清理旧文件
        """
        try:
            import time
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600
            deleted_count = 0
            
            if not os.path.exists(directory):
                return 0
            
            for filename in os.listdir(directory):
                file_path = os.path.join(directory, filename)
                if os.path.isfile(file_path):
                    file_age = current_time - os.path.getmtime(file_path)
                    if file_age > max_age_seconds:
                        try:
                            os.remove(file_path)
                            deleted_count += 1
                        except Exception as e:
                            print(f"删除旧文件失败 {file_path}: {str(e)}")
            
            return deleted_count
        except Exception as e:
            print(f"清理旧文件失败: {str(e)}")
            return 0