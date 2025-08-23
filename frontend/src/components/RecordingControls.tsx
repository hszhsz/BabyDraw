'use client'

import React from 'react'
import { Mic, MicOff, Square, RotateCcw } from 'lucide-react'
import { RecordingStatus } from '@/types'
import { cn, formatTime } from '@/lib/utils'

interface RecordingControlsProps {
  status: RecordingStatus
  duration: number
  isSupported: boolean
  mounted?: boolean
  onStart: () => void
  onStop: () => void
  onReset: () => void
  className?: string
}

export function RecordingControls({
  status,
  duration,
  isSupported,
  mounted = true,
  onStart,
  onStop,
  onReset,
  className
}: RecordingControlsProps) {
  // 在组件未挂载时显示加载状态，避免水合不匹配
  if (!mounted) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center">
          <div className="text-lg font-medium text-gray-600">
            加载中...
          </div>
        </div>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className={cn(
        "flex items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg",
        className
      )}>
        <div className="text-center text-red-600">
          <MicOff className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">不支持录音功能</p>
          <p className="text-sm">请使用支持录音的浏览器</p>
        </div>
      </div>
    )
  }

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return '点击开始录音'
      case 'processing':
        return '准备中...'
      case 'recording':
        return '正在录音...'
      case 'completed':
        return '录音完成'
      case 'error':
        return '录音出错'
      default:
        return ''
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'recording':
        return 'text-red-600'
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'processing':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 状态显示 */}
      <div className="text-center">
        <div className={cn("text-lg font-medium", getStatusColor())}>
          {getStatusText()}
        </div>
        {status === 'recording' && (
          <div className="text-2xl font-mono text-gray-700 mt-2">
            {formatTime(duration.toString())}
          </div>
        )}
      </div>

      {/* 录音按钮 */}
      <div className="flex items-center justify-center gap-4">
        {(status === 'idle' || status === 'completed' || status === 'error') ? (
          <button
            onClick={onStart}
            disabled={!isSupported}
            className={cn(
              "flex items-center justify-center w-16 h-16 rounded-full transition-all",
              "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300",
              "text-white shadow-lg hover:shadow-xl",
              "transform hover:scale-105 active:scale-95"
            )}
          >
            <Mic className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={onStop}
            disabled={status === 'processing'}
            className={cn(
              "flex items-center justify-center w-16 h-16 rounded-full transition-all",
              "bg-red-500 hover:bg-red-600 disabled:bg-gray-300",
              "text-white shadow-lg hover:shadow-xl",
              "transform hover:scale-105 active:scale-95",
              status === 'recording' && "animate-pulse"
            )}
          >
            <Square className="w-6 h-6" />
          </button>
        )}

        {/* 重置按钮 */}
        {(status === 'completed' || status === 'error') && (
          <button
            onClick={onReset}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-full transition-all",
              "bg-gray-500 hover:bg-gray-600 text-white shadow-md hover:shadow-lg",
              "transform hover:scale-105 active:scale-95"
            )}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 录音指示器 */}
      {status === 'recording' && (
        <div className="flex items-center justify-center">
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-8 bg-red-500 rounded-full animate-pulse",
                  `animation-delay-${i * 200}`
                )}
                style={{
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 提示文本 */}
      <div className="text-center text-sm text-gray-500">
        {status === 'idle' && (
          <p>点击麦克风按钮开始录音，说出你想画的内容</p>
        )}
        {status === 'recording' && (
          <p>请清晰地说出你想画的内容，完成后点击停止</p>
        )}
        {status === 'completed' && (
          <p>录音完成！可以重新录音或继续下一步</p>
        )}
        {status === 'error' && (
          <p>录音失败，请检查麦克风权限后重试</p>
        )}
      </div>
    </div>
  )
}

export default RecordingControls