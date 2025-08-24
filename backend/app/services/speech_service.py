import asyncio
import base64
import json
import tempfile
import os
from typing import Optional
from http import HTTPStatus
from app.core.config import settings
import requests
import dashscope

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
        elif settings.DASHSCOPE_API_KEY:
            return "aliyun"
        else:
            raise Exception("未配置语音识别API密钥，无法使用语音识别服务")
    
    async def recognize(self, audio_content: bytes) -> str:
        """
        语音识别主方法
        """
        if self.provider == "xfyun":
            return await self._recognize_with_xfyun(audio_content)
        elif self.provider == "aliyun":
            return await self._recognize_with_aliyun(audio_content)
        else:
            raise Exception(f"不支持的语音识别提供商: {self.provider}")
    
    async def _recognize_with_xfyun(self, audio_content: bytes) -> str:
        """
        使用讯飞语音识别
        """
        # 讯飞语音识别功能尚未实现
        raise Exception("讯飞语音识别功能尚未实现，请使用阿里云语音识别服务")
    
    async def _recognize_with_aliyun(self, audio_content: bytes) -> str:
        """
        使用阿里云语音识别 - Paraformer模型（同步调用方式）
        """
        try:
            # 设置API密钥
            dashscope.api_key = settings.DASHSCOPE_API_KEY
            
            # 检测音频格式并保存为临时文件
            file_header = audio_content[:4]
            
            # 根据文件头判断格式
            if file_header.startswith(b'RIFF'):
                # WAV格式
                suffix = '.wav'
                print("检测到WAV格式音频")
            elif file_header.startswith(b'\x1a\x45\xdf\xa3'):
                # WebM格式
                suffix = '.webm'
                print("检测到WebM格式音频")
            else:
                # 默认使用wav
                suffix = '.wav'
                print(f"未知音频格式，文件头: {file_header.hex()}，默认使用wav")
            
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
                temp_file.write(audio_content)
                temp_file_path = temp_file.name
            
            print(f"临时音频文件路径: {temp_file_path}")
            print(f"音频文件大小: {len(audio_content)} bytes")
            
            # 如果是webm格式，尝试转换为wav
            if suffix == '.webm':
                try:
                    from pydub import AudioSegment
                    
                    # 读取webm音频文件
                    audio = AudioSegment.from_file(temp_file_path, format="webm")
                    
                    # 转换为WAV格式，设置采样率和声道
                    audio = audio.set_frame_rate(16000).set_channels(1)
                    
                    # 保存为WAV文件
                    converted_path = temp_file_path.replace('.webm', '.wav')
                    audio.export(converted_path, format="wav")
                    
                    final_audio_path = converted_path
                    print(f"WebM转WAV成功: {final_audio_path}")
                    
                except Exception as convert_error:
                    print(f"WebM转换失败: {convert_error}，使用原始文件")
                    final_audio_path = temp_file_path
            else:
                # WAV格式直接使用
                final_audio_path = temp_file_path
                print(f"使用WAV文件: {final_audio_path}")
            
            try:
                # 使用dashscope进行语音识别 - 同步调用方式
                from dashscope.audio.asr import Recognition
                from http import HTTPStatus
                
                print("🚀 开始语音识别（同步调用）...")
                
                # 创建语音识别实例 - 使用paraformer-realtime-v2模型
                recognition = Recognition(
                    model='paraformer-realtime-v2',
                    format='wav',
                    sample_rate=16000,
                    language_hints=['zh', 'en'],  # 支持中文和英文
                    callback=None  # 同步调用不需要回调
                )
                
                print(f"📝 模型配置: paraformer-realtime-v2, format=wav, sample_rate=16000")
                print(f"📝 语言提示: 中文、英文")
                
                # 调用语音识别
                result = recognition.call(final_audio_path)
                
                # 检查识别结果
                if result.status_code == HTTPStatus.OK:
                    # 获取识别文本
                    sentence_list = result.get_sentence()
                    
                    print(f"✅ 语音识别成功")
                    print(f"📝 识别结果: '{sentence_list}'")
                    
                    # 处理识别结果，提取文本内容
                    recognized_text = ""
                    if isinstance(sentence_list, list) and sentence_list:
                        # 从句子列表中提取文本
                        text_parts = []
                        for sentence in sentence_list:
                            if isinstance(sentence, dict) and 'text' in sentence:
                                text_parts.append(sentence['text'])
                        recognized_text = ''.join(text_parts)
                    elif isinstance(sentence_list, str):
                        recognized_text = sentence_list
                    
                    print(f"📝 提取的文本: '{recognized_text}'")
                    print(f"📝 文本长度: {len(recognized_text) if recognized_text else 0} 字符")
                    
                    # 打印性能指标
                    print(f"📊 性能指标:")
                    print(f"   请求ID: {recognition.get_last_request_id()}")
                    print(f"   首包延迟: {recognition.get_first_package_delay()} ms")
                    print(f"   末包延迟: {recognition.get_last_package_delay()} ms")
                    
                    if recognized_text and recognized_text.strip():
                        return recognized_text.strip()
                    else:
                        print("⚠️ 识别结果为空，可能是静音或音频质量问题")
                        return '未能识别出语音内容'
                else:
                    error_msg = f"语音识别失败: {result.message}"
                    print(f"❌ {error_msg}")
                    raise Exception(error_msg)
                    
            finally:
                # 清理临时文件
                try:
                    if os.path.exists(temp_file_path):
                        os.unlink(temp_file_path)
                        print(f"🗑️ 已删除临时文件: {temp_file_path}")
                    if 'converted_path' in locals() and os.path.exists(converted_path):
                        os.unlink(converted_path)
                        print(f"🗑️ 已删除转换文件: {converted_path}")
                except OSError as e:
                    print(f"⚠️ 清理临时文件时出错: {e}")
                    
        except Exception as e:
            print(f"❌ 阿里云语音识别失败: {str(e)}")
            raise e
    

    
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
            }
        }
        
        return {
            "current_provider": self.provider,
            "provider_info": provider_info.get(self.provider, {})
        }