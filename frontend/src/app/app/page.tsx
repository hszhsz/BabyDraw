'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Download, Trash2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const { getCachedDrawing, setCachedDrawing, getCachedSpeech, setCachedSpeech, clearCache, getCacheStats } = useCache();

  useEffect(() => {
    // 请求麦克风权限
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        console.log('麦克风权限已获取');
      })
      .catch((err) => {
        console.error('无法获取麦克风权限:', err);
      });
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('录音失败:', error);
      alert('无法开始录音，请检查麦克风权限');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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

      const response = await fetch('http://localhost:8000/api/speech-to-text', {
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

  const handleGenerateDrawing = async () => {
    if (!textInput.trim()) {
      alert('请输入描述或录制语音');
      return;
    }

    clientLog.info('开始生成画作', { prompt: textInput });
    setIsGenerating(true);
    try {
      // 检查缓存
      const cachedResult = getCachedDrawing(textInput.trim(), 'default');
      if (cachedResult) {
        console.log('使用缓存的绘画结果');
        setCurrentDrawing(cachedResult);
        setIsGenerating(false);
        return;
      }

      const response = await fetch('http://localhost:8000/api/generate-drawing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: textInput }),
      });

      if (!response.ok) {
        throw new Error('生成绘画失败');
      }

      const drawing = await response.json();
      clientLog.info('画作生成成功', { drawingId: drawing.id, prompt: textInput });
      setCurrentDrawing(drawing);
      
      // 存储到缓存
      setCachedDrawing(textInput.trim(), 'default', drawing);
    } catch (error) {
      clientLog.error('生成画作失败', { error: error instanceof Error ? error.message : String(error), prompt: textInput });
      alert('生成绘画失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    }
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
              onClick={clearCache}
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
                    <p className="text-sm">输入描述或录制语音来生成画作</p>
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
                    {isRecording ? '🔴 正在录音，再次点击停止' : '点击麦克风开始录音'}
                  </p>
                  
                  {audioBlob && (
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={playAudio}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>播放录音</span>
                      </button>
                      <button
                        onClick={handleSpeechRecognition}
                        disabled={isProcessingAudio}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        <span>{isProcessingAudio ? '识别中...' : '转换文字'}</span>
                      </button>
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
                
                <button
                  onClick={handleGenerateDrawing}
                  disabled={isGenerating || !textInput.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-lg font-semibold"
                >
                  <span>🎨</span>
                  <span>{isGenerating ? '生成中...' : '生成画作'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}