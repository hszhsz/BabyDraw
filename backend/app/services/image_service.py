import asyncio
import json
import os
import time
from typing import List, Dict
import dashscope
from dashscope import ImageSynthesis
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
            raise Exception("未配置DASHSCOPE_API_KEY，无法使用图像生成服务")
    
    async def generate_step_by_step_drawing(
        self, 
        prompt: str, 
        style: str = "简笔画", 
        steps: int = 4
    ) -> Dict[str, any]:
        """
        生成分步骤简笔画
        """
        return await self._generate_with_tongyi(prompt, style, steps)
    
    async def _generate_with_tongyi(self, prompt: str, style: str, steps: int) -> Dict[str, any]:
        """
        使用通义万相生成图像
        """
        try:
            # 优化提示词
            optimized_prompt = self._optimize_prompt_for_drawing(prompt, style)
            
            # 生成最终完整图像
            final_image_url = await self._call_tongyi_api(optimized_prompt)
            
            # 生成分步骤图像
            step_images = []
            for i in range(steps):
                step_prompt = f"{optimized_prompt}, step {i+1} of {steps}, progressive drawing"
                step_url = await self._call_tongyi_api(step_prompt)
                step_images.append(step_url)
            
            return {
                "final_image_url": final_image_url,
                "step_images": step_images,
                "provider": "tongyi"
            }
        except Exception as e:
            print(f"通义万相API调用失败: {e}")
            raise e
    
    async def _call_tongyi_api(self, prompt: str) -> str:
        """
        调用通义万相API生成单张图像
        """
        try:
            # 设置API密钥
            dashscope.api_key = settings.DASHSCOPE_API_KEY
            
            # 创建异步任务
            rsp = ImageSynthesis.async_call(
                model="wan2.2-t2i-flash",  # 使用万相2.2极速版
                prompt=prompt,
                n=1,
                size="1024*1024"
            )
            
            if rsp.status_code != 200:
                raise Exception(f"API调用失败: {rsp.message}")
            
            task_id = rsp.output.task_id
            
            # 轮询任务状态直到完成
            max_wait_time = 60  # 最大等待60秒
            start_time = time.time()
            
            while time.time() - start_time < max_wait_time:
                # 等待1秒后查询状态
                await asyncio.sleep(1)
                
                result = ImageSynthesis.fetch(task_id)
                
                if result.status_code == 200:
                    if result.output.task_status == 'SUCCEEDED':
                        # 任务成功，返回图像URL
                        if result.output.results and len(result.output.results) > 0:
                            return result.output.results[0].url
                        else:
                            raise Exception("API返回结果为空")
                    elif result.output.task_status == 'FAILED':
                        raise Exception(f"图像生成失败: {result.output.message}")
                    # 如果状态是PENDING或RUNNING，继续等待
                else:
                    raise Exception(f"查询任务状态失败: {result.message}")
            
            # 超时
            raise Exception("图像生成超时")
            
        except Exception as e:
            print(f"通义万相API调用异常: {e}")
            raise e
    

    
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
                "description": "阿里云推出的AI图像生成模型，支持万相2.2极速版",
                "features": ["中文优化", "高质量生成", "多风格支持", "分步骤生成", "真实API调用"]
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
        return await self._call_tongyi_api(optimized_prompt)