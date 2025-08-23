import asyncio
import json
from typing import List, Dict
from app.core.config import settings

class ImageService:
    """
    图像生成服务
    支持多种中国文字生成图片服务
    """
    
    def __init__(self):
        self.provider = self._get_available_provider()
    
    def _get_available_provider(self) -> str:
        """
        根据配置选择可用的图像生成服务提供商
        """
        if settings.DASHSCOPE_API_KEY and settings.DASHSCOPE_API_KEY.strip():
            return "tongyi"  # 通义万相
        else:
            return "mock"  # 开发阶段使用模拟服务
    
    async def generate_step_by_step_drawing(
        self, 
        prompt: str, 
        style: str = "简笔画", 
        steps: int = 4
    ) -> Dict[str, any]:
        """
        生成分步骤简笔画
        """
        if self.provider == "tongyi":
            return await self._generate_with_tongyi(prompt, style, steps)
        else:
            return await self._mock_generate(prompt, style, steps)
    
    async def _generate_with_tongyi(self, prompt: str, style: str, steps: int) -> Dict[str, any]:
        """
        使用通义万相生成图像
        """
        # TODO: 实现通义万相API调用
        # 由于通义万相API尚未实现，暂时使用mock数据
        return await self._mock_generate(prompt, style, steps)
    
    async def _mock_generate(self, prompt: str, style: str, steps: int) -> Dict[str, any]:
        """
        模拟图像生成（开发阶段使用）
        """
        # 模拟生成时间
        await asyncio.sleep(1.5)
        
        # 生成模拟的图像URL
        prompt_hash = abs(hash(prompt)) % 1000
        base_url = "https://picsum.photos"
        
        # 最终完整图像
        final_image_url = f"{base_url}/400/400?random={prompt_hash}"
        
        # 分步骤图像
        step_images = []
        for i in range(steps):
            step_url = f"{base_url}/300/300?random={prompt_hash + i + 1}"
            step_images.append(step_url)
        
        return {
            "final_image_url": final_image_url,
            "step_images": step_images,
            "provider": "mock"
        }
    
    def _optimize_prompt_for_drawing(self, prompt: str, style: str) -> str:
        """
        优化提示词，使其更适合简笔画生成
        """
        # 简笔画风格的提示词优化
        style_prompts = {
            "简笔画": "simple line drawing, minimalist, black and white, clean lines",
            "卡通": "cartoon style, cute, colorful, child-friendly",
            "水彩": "watercolor style, soft colors, artistic",
            "素描": "pencil sketch, hand-drawn, artistic lines"
        }
        
        base_prompt = f"{prompt}, {style_prompts.get(style, style_prompts['简笔画'])}"
        
        # 添加儿童友好的修饰词
        child_friendly_terms = [
            "suitable for children",
            "educational",
            "step by step tutorial",
            "easy to follow",
            "beginner friendly"
        ]
        
        optimized_prompt = f"{base_prompt}, {', '.join(child_friendly_terms[:2])}"
        
        return optimized_prompt
    
    def get_provider_info(self) -> dict:
        """
        获取当前使用的服务提供商信息
        """
        provider_info = {
            "tongyi": {
                "name": "通义万相",
                "description": "阿里云推出的AI图像生成模型",
                "features": ["中文优化", "高质量生成", "多风格支持", "分步骤生成"]
            },
            "mock": {
                "name": "模拟服务",
                "description": "开发阶段使用的模拟图像生成服务",
                "features": ["快速响应", "无需配置", "开发友好"]
            }
        }
        
        return {
            "current_provider": self.provider,
            "provider_info": provider_info.get(self.provider, {})
        }
    
    async def generate_single_image(self, prompt: str, style: str = "简笔画") -> str:
        """
        生成单张图像
        """
        optimized_prompt = self._optimize_prompt_for_drawing(prompt, style)
        
        if self.provider == "tongyi":
            # 调用通义万相API生成单张图像
            await asyncio.sleep(1.5)
            prompt_hash = abs(hash(optimized_prompt)) % 1000
            return f"https://example.com/images/single_{prompt_hash}.png"
        else:
            # 模拟生成
            await asyncio.sleep(1.0)
            prompt_hash = abs(hash(optimized_prompt)) % 1000
            return f"https://picsum.photos/400/400?random={prompt_hash}"