'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Download, Trash2, Search, Filter, ChevronLeft, ChevronRight, Square } from 'lucide-react';
import { useCache, generateAudioHash } from '@/hooks/useCache';
import DrawingHistory from '@/components/DrawingHistory';
import Link from 'next/link';
import { clientLog } from '@/lib/logger';

import { Drawing } from '@/types';

export default function AppPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [textInput, setTextInput] = useState('');
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const { getCachedDrawing, setCachedDrawing, getCachedSpeech, setCachedSpeech, clearCache, getCacheStats } = useCache();

  useEffect(() => {
    // 请求麦克风权限并检查音频设备
    const checkAudioDevices = async () => {
      try {
        // 检查是否支持getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return;
        }
        
        // 获取音频设备列表
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        if (audioInputs.length === 0) {
          return;
        }
        
        // 请求麦克风权限
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // 立即停止流以释放资源
        stream.getTracks().forEach(track => track.stop());
        
      } catch (err) {
         console.error('❌ 无法获取麦克风权限或检查设备:', err);
         const error = err as Error;
         if (error.name === 'NotAllowedError') {
           console.error('用户拒绝了麦克风权限');
         } else if (error.name === 'NotFoundError') {
           console.error('没有找到音频输入设备');
         } else if (error.name === 'NotReadableError') {
           console.error('音频设备被其他应用占用');
         }
       }
    };
    
    checkAudioDevices();
  }, []);

  // 组件卸载时清理音频资源
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);



  // 创建WAV文件头
  const createWavHeader = (sampleRate: number, numChannels: number, numSamples: number) => {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    const byteRate = sampleRate * numChannels * 2;
    const blockAlign = numChannels * 2;
    const dataSize = numSamples * numChannels * 2;
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // 16-bit
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    return new Uint8Array(buffer);
  };

  // 使用Web Audio API录制WAV格式音频
  const recordWavAudio = async (stream: MediaStream): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      const audioData: Float32Array[] = [];
      
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        audioData.push(new Float32Array(inputData));
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // 存储录音控制函数
      (window as any).stopWavRecording = () => {
        processor.disconnect();
        source.disconnect();
        audioContext.close();
        
        // 检查音频数据是否为空
        if (audioData.length === 0) {
          reject(new Error('没有录制到音频数据'));
          return;
        }
        
        // 合并所有音频数据
        const totalLength = audioData.reduce((acc, chunk) => acc + chunk.length, 0);
        
        const combinedData = new Float32Array(totalLength);
        let offset = 0;
        
        for (const chunk of audioData) {
          combinedData.set(chunk, offset);
          offset += chunk.length;
        }
        
        // 重采样到16kHz（后端期望的采样率）
        const targetSampleRate = 16000;
        const sourceSampleRate = audioContext.sampleRate;
        const resampleRatio = targetSampleRate / sourceSampleRate;
        const resampledLength = Math.floor(combinedData.length * resampleRatio);
        
        const resampledData = new Float32Array(resampledLength);
        for (let i = 0; i < resampledLength; i++) {
          const sourceIndex = i / resampleRatio;
          const index = Math.floor(sourceIndex);
          const fraction = sourceIndex - index;
          
          if (index + 1 < combinedData.length) {
            // 线性插值
            resampledData[i] = combinedData[index] * (1 - fraction) + combinedData[index + 1] * fraction;
          } else {
            resampledData[i] = combinedData[index] || 0;
          }
        }
        
        // 转换为16位PCM
        const pcmData = new Int16Array(resampledData.length);
        for (let i = 0; i < resampledData.length; i++) {
          const sample = Math.max(-1, Math.min(1, resampledData[i]));
          const pcmValue = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          pcmData[i] = pcmValue;
        }
        
        // 使用16kHz采样率创建WAV文件（与后端期望一致）
        const header = createWavHeader(targetSampleRate, 1, resampledData.length);
        
        console.log('音频重采样信息:', {
          原始采样率: sourceSampleRate + 'Hz',
          目标采样率: targetSampleRate + 'Hz',
          原始长度: combinedData.length + '样本',
          重采样长度: resampledData.length + '样本',
          重采样比例: resampleRatio.toFixed(3)
        });
        
        const wavData = new Uint8Array(header.length + pcmData.length * 2);
        wavData.set(header, 0);
        wavData.set(new Uint8Array(pcmData.buffer), header.length);
        
        const wavBlob = new Blob([wavData], { type: 'audio/wav' });
        
        resolve(wavBlob);
      };
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1
        } 
      });
      
      setIsRecording(true);
      
      const recordingPromise = recordWavAudio(stream);
      
      (window as any).currentRecordingPromise = recordingPromise;
      (window as any).currentStream = stream;
      
    } catch (error) {
      console.error('录音失败:', error);
      alert('无法开始录音，请检查麦克风权限');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (isRecording && (window as any).stopWavRecording && (window as any).currentRecordingPromise) {
      try {
        (window as any).stopWavRecording();
        
        const wavBlob = await (window as any).currentRecordingPromise;
         setAudioBlob(wavBlob);
         
         if ((window as any).currentStream) {
           (window as any).currentStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
         }
         
         setIsRecording(false);
         
         // 启用语音识别
         handleAutoSpeechToDrawing(wavBlob);
         
         (window as any).currentRecordingPromise = null;
         (window as any).currentStream = null;
      } catch (error) {
        console.error('停止录音失败:', error);
        setIsRecording(false);
      }
    }
  };



  // 自动处理语音识别和生成画作
  const handleAutoSpeechToDrawing = async (audioBlob: Blob) => {
    clientLog.info('开始自动语音识别和画作生成');
    setIsProcessingAudio(true);
    
    try {
      // 生成音频哈希
      const audioHash = await generateAudioHash(audioBlob);
      
      // 检查缓存
      const cachedResult = getCachedSpeech(audioHash);
      let recognizedText = '';
      
      if (cachedResult) {
        console.log('使用缓存的语音识别结果');
        recognizedText = cachedResult;
        setTextInput(recognizedText);
      } else {
        // 语音识别
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        const response = await fetch('http://localhost:8000/api/v1/speech/recognize', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('语音识别失败');
        }

        const data = await response.json();
        recognizedText = data.text;
        clientLog.info('语音识别成功', { recognizedText });
        setTextInput(recognizedText);
        
        // 存储到缓存
        setCachedSpeech(audioHash, recognizedText);
      }
      
      setIsProcessingAudio(false);
      
      // 检查语音识别结果
      console.log('语音识别结果:', recognizedText);
      console.log('音频文件大小:', audioBlob.size, '字节');
      
      if (!recognizedText.trim() || recognizedText.trim() === '识别结果为空' || recognizedText.trim() === '未能识别出语音内容') {
        alert(`未能识别到语音内容。\n音频文件大小: ${audioBlob.size} 字节\n\n请确保：\n1. 录音时说话清晰\n2. 周围环境安静\n3. 麦克风工作正常\n4. 录音时间足够长（至少2-3秒）\n\n请重新录音或切换到文字输入模式。`);
        return;
      }
      
      // 如果识别到文字，自动开始生成画作
      await handleGenerateDrawingWithText(recognizedText.trim());
    } catch (error) {
      clientLog.error('自动语音识别失败', { error: error instanceof Error ? error.message : String(error) });
      setIsProcessingAudio(false);
      alert('语音识别失败，请重试');
    }
  };

  // 根据文字生成画作
  const handleGenerateDrawingWithText = async (text: string, forceRefresh: boolean = false) => {
    clientLog.info('开始生成画作', { prompt: text, forceRefresh });
    setIsGenerating(true);
    
    // 创建新的AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      // 暂时禁用缓存功能，每次都调用大模型生成
      // if (!forceRefresh) {
      //   const cachedResult = getCachedDrawing(text, 'default');
      //   if (cachedResult) {
      //     console.log('使用缓存的绘画结果');
      //     setCurrentDrawing(cachedResult);
      //     setIsGenerating(false);
      //     return;
      //   }
      // } else {
      //   console.log('强制刷新，跳过缓存检查');
      // }

      const response = await fetch('http://localhost:8001/api/v1/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: text,
          style: '简笔画',
          steps: 4
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('生成绘画失败');
      }

      const imageResult = await response.json();
      // 转换为Drawing格式
      const drawing = {
        id: Date.now(), // 临时ID
        title: text,
        description: `AI生成的${imageResult.style}`,
        prompt: imageResult.prompt,
        image_url: imageResult.final_image_url,
        step_images: imageResult.step_images,
        style: '简笔画',
        steps: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      clientLog.info('画作生成成功', { prompt: text, fromCache: false });
      setCurrentDrawing(drawing);
      
      // 暂时禁用缓存存储
      // setCachedDrawing(text, 'default', drawing);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        clientLog.info('画作生成已取消', { prompt: text });
        // 不显示错误提示，因为是用户主动取消
      } else {
        clientLog.error('生成画作失败', { error: error instanceof Error ? error.message : String(error), prompt: text });
        alert('生成绘画失败，请重试');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleSpeechRecognition = async () => {
    if (!audioBlob) return;

    clientLog.info('开始语音识别');
    setIsProcessingAudio(true);
    try {
      // 生成音频哈希
      const audioHash = await generateAudioHash(audioBlob);
      
      // 检查缓存
      const cachedResult = getCachedSpeech(audioHash);
      if (cachedResult) {
        console.log('使用缓存的语音识别结果');
        setTextInput(cachedResult);
        setIsProcessingAudio(false);
        return;
      }

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('http://localhost:8000/api/v1/speech/recognize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('语音识别失败');
      }

      const data = await response.json();
      clientLog.info('语音识别成功', { recognizedText: data.text });
      setTextInput(data.text);
      
      // 存储到缓存
      setCachedSpeech(audioHash, data.text);
    } catch (error) {
      clientLog.error('语音识别失败', { error: error instanceof Error ? error.message : String(error) });
      alert('语音识别失败，请重试');
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const generateDrawingInternal = async (forceRefresh: boolean = false) => {
    if (!textInput.trim()) {
      alert('请输入描述或录制语音');
      return;
    }

    clientLog.info('开始生成画作', { prompt: textInput, forceRefresh });
    setIsGenerating(true);
    
    // 创建新的AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      // 暂时禁用缓存功能，每次都调用大模型生成
      // if (!forceRefresh) {
      //   const cachedResult = getCachedDrawing(textInput.trim(), 'default');
      //   if (cachedResult) {
      //     console.log('使用缓存的绘画结果');
      //     setCurrentDrawing(cachedResult);
      //     setIsGenerating(false);
      //     return;
      //   }
      // } else {
      //   console.log('强制刷新，跳过缓存检查');
      // }

      const response = await fetch('http://localhost:8001/api/v1/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: textInput,
          style: '简笔画',
          steps: 4
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('生成绘画失败');
      }

      const imageResult = await response.json();
      // 转换为Drawing格式
      const drawing = {
        id: Date.now(), // 临时ID
        title: textInput,
        description: `AI生成的${imageResult.style}`,
        prompt: imageResult.prompt,
        image_url: imageResult.final_image_url,
        step_images: imageResult.step_images,
        style: '简笔画',
        steps: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      clientLog.info('画作生成成功', { prompt: textInput, fromCache: false });
      setCurrentDrawing(drawing);
      
      // 暂时禁用缓存存储
      // setCachedDrawing(textInput.trim(), 'default', drawing);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        clientLog.info('画作生成已取消', { prompt: textInput });
        // 不显示错误提示，因为是用户主动取消
      } else {
        clientLog.error('生成画作失败', { error: error instanceof Error ? error.message : String(error), prompt: textInput });
        alert('生成绘画失败，请重试');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleGenerateDrawing = () => generateDrawingInternal(false);
  const handleForceRefresh = () => generateDrawingInternal(true);
  
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      clientLog.info('用户取消画作生成');
    }
  };

  const playAudio = async () => {
    if (!audioBlob) {
      console.warn('❌ 没有可播放的音频');
      return;
    }

    console.log('🔊 准备播放音频');
    console.log('📁 音频文件信息:', {
      size: audioBlob.size + ' 字节',
      type: audioBlob.type,
      lastModified: new Date().toISOString()
    });

    try {
      // 检查音频文件内容
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // 检查音频数据部分是否有内容
      const audioDataStart = 44; // WAV文件头通常是44字节
      const audioDataBytes = uint8Array.slice(audioDataStart);
      const nonZeroBytes = audioDataBytes.filter(b => b !== 0).length;
      
      if (nonZeroBytes === 0) {
        alert('录制的音频文件为空，请检查麦克风是否正常工作');
        return;
      }

      // 如果当前有音频在播放，先停止
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      setIsPlayingAudio(true);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      audio.onerror = (error) => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        alert('音频播放失败，请重试');
      };

      audio.onpause = () => {
        setIsPlayingAudio(false);
      };

      await audio.play();
    } catch (error) {
      setIsPlayingAudio(false);
      alert('无法播放音频，请检查浏览器设置');
    }
  };

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsPlayingAudio(false);
    }
  };

  // 生成测试音频文件
  const generateTestAudio = () => {
    // 生成1秒的440Hz正弦波（A音）
    const sampleRate = 16000;
    const duration = 1; // 1秒
    const frequency = 440; // A音
    const samples = sampleRate * duration;
    
    // 创建音频数据
    const audioData = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      audioData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3; // 30%音量
    }
    
    // 转换为16位PCM
    const pcmData = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    
    // 创建WAV文件头
    const createWavHeader = (sampleRate: number, channels: number, samples: number) => {
      const buffer = new ArrayBuffer(44);
      const view = new DataView(buffer);
      
      // RIFF header
      view.setUint32(0, 0x46464952, true); // "RIFF"
      view.setUint32(4, 36 + samples * 2, true); // file size
      view.setUint32(8, 0x45564157, true); // "WAVE"
      
      // fmt chunk
      view.setUint32(12, 0x20746d66, true); // "fmt "
      view.setUint32(16, 16, true); // chunk size
      view.setUint16(20, 1, true); // PCM format
      view.setUint16(22, channels, true); // channels
      view.setUint32(24, sampleRate, true); // sample rate
      view.setUint32(28, sampleRate * channels * 2, true); // byte rate
      view.setUint16(32, channels * 2, true); // block align
      view.setUint16(34, 16, true); // bits per sample
      
      // data chunk
      view.setUint32(36, 0x61746164, true); // "data"
      view.setUint32(40, samples * 2, true); // data size
      
      return new Uint8Array(buffer);
    };
    
    // 创建WAV文件
    const header = createWavHeader(sampleRate, 1, audioData.length);
    const wavData = new Uint8Array(header.length + pcmData.length * 2);
    wavData.set(header, 0);
    wavData.set(new Uint8Array(pcmData.buffer), header.length);
    
    const testBlob = new Blob([wavData], { type: 'audio/wav' });
    
    setAudioBlob(testBlob);
  };

  const downloadImage = () => {
    if (currentDrawing && currentDrawing.image_url) {
      const link = document.createElement('a');
      link.href = currentDrawing.image_url;
      link.download = `babydraw-${currentDrawing.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const clearAll = () => {
    setTextInput('');
    setAudioBlob(null);
    stopAudio(); // 停止正在播放的音频
    setCurrentDrawing(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:scale-105 transition-transform cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🎨</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              BabyDraw
            </h1>
          </Link>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
            >
              <span>📚</span>
              <span>历史记录</span>
            </button>
            <button
              onClick={() => {
                console.log('清除缓存按钮被点击');
                clearCache();
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>清除缓存</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {showHistory ? (
          <DrawingHistory />
        ) : (
          <div className="space-y-8">
            {/* 画布区域 - 顶部 */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                🖼️ 画布
              </h2>
              
              <div className="aspect-video bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-dashed border-purple-300 flex items-center justify-center relative overflow-hidden">
                {isGenerating ? (
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-purple-600 font-medium">AI正在创作中...</p>
                  </div>
                ) : currentDrawing ? (
                  <div className="w-full h-full relative group">
                    <img 
                      src={currentDrawing.image_url || ''} 
                      alt={currentDrawing.prompt}
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                      <button
                        onClick={downloadImage}
                        className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                      >
                        <Download className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">🎨</div>
                    <p className="text-lg font-medium">等待创作...</p>
                    <p className="text-sm">录制语音后将自动开始作画，或切换到文字输入模式</p>
                  </div>
                )}
              </div>
              
              {currentDrawing && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>描述：</strong>{currentDrawing.prompt}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    创建时间：{new Date(currentDrawing.created_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* 输入区域 - 底部 */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                💬 输入方式
              </h2>
              
              {/* 输入模式切换 */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setInputMode('voice')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                    inputMode === 'voice' 
                      ? 'bg-white text-purple-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  语音输入
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                    inputMode === 'text' 
                      ? 'bg-white text-purple-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ✏️ 文字输入
                </button>
              </div>

              {/* 语音输入界面 */}
              {inputMode === 'voice' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                        isRecording 
                          ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                          : 'bg-purple-500 hover:bg-purple-600'
                      }`}
                    >
                      {isRecording ? (
                        <MicOff className="w-10 h-10 text-white" />
                      ) : (
                        <Mic className="w-10 h-10 text-white" />
                      )}
                    </button>
                    

                  </div>
                  

                  
                  <p className="text-center text-gray-600">
                    {isRecording 
                      ? '🔴 正在录音，再次点击停止并开始作画' 
                      : isProcessingAudio 
                        ? '🎯 正在识别语音并生成画作...' 
                        : isGenerating 
                          ? '🎨 AI正在创作中...' 
                          : '点击麦克风开始录音，录音结束后将自动开始作画'
                    }
                  </p>
                  
                  {audioBlob && !isProcessingAudio && !isGenerating && (
                    <div className="flex justify-center space-x-2">
                      {!isPlayingAudio ? (
                        <button
                          onClick={playAudio}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>播放录音</span>
                        </button>
                      ) : (
                        <button
                          onClick={stopAudio}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2 animate-pulse"
                        >
                          <Square className="w-4 h-4" />
                          <span>停止播放</span>
                        </button>
                      )}
                      <button
                        onClick={generateTestAudio}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                      >
                        🔧 测试音频
                      </button>
                    </div>
                  )}
                  
                  {!audioBlob && !isProcessingAudio && !isGenerating && (
                    <div className="flex justify-center">
                      <button
                        onClick={generateTestAudio}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                      >
                        🔧 生成测试音频
                      </button>
                    </div>
                  )}
                  
                  {(isProcessingAudio || isGenerating) && (
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              )}

              {/* 文字输入界面 */}
              {inputMode === 'text' && (
                <div className="space-y-4">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="描述你想要的画面，比如：一只可爱的小猫在花园里玩耍"
                    className="w-full h-32 p-4 border border-purple-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50"
                  />
                </div>
              )}

              {/* 识别结果显示 */}
              {textInput && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-1">当前描述：</p>
                  <p className="text-blue-900">{textInput}</p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={clearAll}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>清空</span>
                </button>
                
                {isGenerating ? (
                  <button
                    onClick={handleStopGeneration}
                    className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center space-x-2 text-lg font-semibold"
                  >
                    <Square className="w-5 h-5" />
                    <span>停止作画</span>
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateDrawing}
                    disabled={!textInput.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-lg font-semibold"
                  >
                    <span>🎨</span>
                    <span>生成画作</span>
                   </button>
                 )}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}