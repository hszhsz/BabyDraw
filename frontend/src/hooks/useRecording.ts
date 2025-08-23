import { useState, useRef, useCallback, useEffect } from 'react'
import { RecordingStatus } from '@/types'

interface UseRecordingReturn {
  status: RecordingStatus
  audioBlob: Blob | null
  duration: number
  startRecording: () => Promise<void>
  stopRecording: () => void
  resetRecording: () => void
  isSupported: boolean
  mounted: boolean
}

export function useRecording(): UseRecordingReturn {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const [isSupported, setIsSupported] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // 检查浏览器是否支持录音
  useEffect(() => {
    setMounted(true)
    setIsSupported(
      typeof navigator !== 'undefined' && 
      !!navigator.mediaDevices && 
      !!navigator.mediaDevices.getUserMedia
    )
  }, [])

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setStatus('error')
      return
    }

    try {
      setStatus('processing')
      
      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      })
      
      streamRef.current = stream
      chunksRef.current = []
      
      // 创建MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      
      // 监听数据事件
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      // 监听停止事件
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setStatus('completed')
        
        // 清理资源
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }
      
      // 开始录音
      mediaRecorder.start(100) // 每100ms收集一次数据
      setStatus('recording')
      setDuration(0)
      
      // 开始计时
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 0.1)
      }, 100)
      
    } catch (error) {
      console.error('Failed to start recording:', error)
      setStatus('error')
      
      // 清理资源
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [isSupported])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      setStatus('processing')
      mediaRecorderRef.current.stop()
      
      // 停止计时
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [status])

  const resetRecording = useCallback(() => {
    // 停止录音
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    // 清理计时器
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    // 清理媒体流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    // 重置状态
    setStatus('idle')
    setAudioBlob(null)
    setDuration(0)
    chunksRef.current = []
    mediaRecorderRef.current = null
  }, [status])

  return {
    status,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
    resetRecording,
    isSupported,
    mounted
  }
}