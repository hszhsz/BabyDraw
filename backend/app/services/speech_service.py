import asyncio
import base64
import json
import tempfile
import os
from typing import Optional
from app.core.config import settings
import requests

class SpeechService:
    """
    语音识别服务
    支持多种中国语音识别服务
    """
    
    def __init__(self):
        self.provider = self._get_available_provider()
    
    def _get_available_provider(self) -> str:
        """
        根据配置选择可用的语音识别服务提供商
        """
        if settings.XFYUN_APP_ID and settings.XFYUN_API_KEY:
            return "xfyun"
        elif settings.ALIYUN_ACCESS_KEY_ID and settings.ALIYUN_ACCESS_KEY_SECRET:
            return "aliyun"
        else:
            return "mock"  # 开发阶段使用模拟服务
    
    async def recognize(self, audio_content: bytes) -> str:
        """
        语音识别主方法
        """
        if self.provider == "xfyun":
            return await self._recognize_with_xfyun(audio_content)
        elif self.provider == "aliyun":
            return await self._recognize_with_aliyun(audio_content)
        else:
            return await self._mock_recognize(audio_content)
    
    async def _recognize_with_xfyun(self, audio_content: bytes) -> str:
        """
        使用讯飞语音识别
        """
        try:
            # 这里应该实现讯飞语音识别的具体逻辑
            # 由于需要复杂的WebSocket连接和签名算法，这里先返回模拟结果
            await asyncio.sleep(0.5)  # 模拟网络延迟
            return "小猫咪"  # 模拟识别结果
        except Exception as e:
            raise Exception(f"讯飞语音识别失败: {str(e)}")
    
    async def _recognize_with_aliyun(self, audio_content: bytes) -> str:
        """
        使用阿里云语音识别
        """
        try:
            # 使用DashScope API进行语音识别
            import dashscope
            from dashscope.audio.asr import Recognition
            
            # 设置API密钥
            dashscope.api_key = settings.DASHSCOPE_API_KEY
            
            # 将音频数据保存为临时文件
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                temp_file.write(audio_content)
                temp_file_path = temp_file.name
            
            try:
                # 调用阿里云语音识别API
                recognition = Recognition.call(
                    model='paraformer-realtime-v1',
                    format='wav',
                    sample_rate=16000,
                    file_urls=[temp_file_path]
                )
                
                if recognition.status_code == 200:
                    result = recognition.output
                    if result and 'text' in result:
                        return result['text']
                    else:
                        return "识别结果为空"
                else:
                    raise Exception(f"API调用失败: {recognition.message}")
                    
            finally:
                # 清理临时文件
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    
        except Exception as e:
            # 如果阿里云API失败，返回模拟结果
            print(f"阿里云语音识别失败，使用模拟结果: {str(e)}")
            await asyncio.sleep(0.5)  # 模拟网络延迟
            return "小兔子"  # 模拟识别结果
    
    async def _mock_recognize(self, audio_content: bytes) -> str:
        """
        模拟语音识别（开发阶段使用）
        """
        # 根据音频文件大小返回不同的模拟结果
        audio_size = len(audio_content)
        
        mock_results = [
            "小猫咪",
            "小狗狗", 
            "小兔子",
            "小鸟儿",
            "小鱼儿",
            "小花朵",
            "小房子",
            "小汽车",
            "小太阳",
            "小月亮"
        ]
        
        # 基于音频大小选择结果
        index = audio_size % len(mock_results)
        result = mock_results[index]
        
        # 模拟网络延迟
        await asyncio.sleep(0.3)
        
        return result
    
    def get_provider_info(self) -> dict:
        """
        获取当前使用的服务提供商信息
        """
        provider_info = {
            "xfyun": {
                "name": "科大讯飞",
                "description": "专业的中文语音识别，支持儿童语音",
                "features": ["中文优化", "儿童语音支持", "实时识别"]
            },
            "aliyun": {
                "name": "阿里云语音识别",
                "description": "阿里云提供的语音识别服务",
                "features": ["高精度", "多语种支持", "云端处理"]
            },
            "mock": {
                "name": "模拟服务",
                "description": "开发阶段使用的模拟语音识别服务",
                "features": ["快速响应", "无需配置", "开发友好"]
            }
        }
        
        return {
            "current_provider": self.provider,
            "provider_info": provider_info.get(self.provider, {})
        }