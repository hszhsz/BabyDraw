'use client'

import React, { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TextInputProps {
  onSubmit: (text: string) => void
  isLoading?: boolean
  placeholder?: string
  className?: string
}

export function TextInput({
  onSubmit,
  isLoading = false,
  placeholder = "输入你想画的内容...",
  className
}: TextInputProps) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() && !isLoading) {
      onSubmit(text.trim())
      setText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 文本输入区域 */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={3}
            className={cn(
              "w-full px-4 py-3 border border-gray-300 rounded-lg resize-none",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:bg-gray-50 disabled:text-gray-500",
              "placeholder:text-gray-400"
            )}
          />
          
          {/* 字符计数 */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {text.length}/200
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all",
              "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300",
              "text-white disabled:text-gray-500",
              "transform hover:scale-105 active:scale-95",
              "disabled:transform-none disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                开始画画
              </>
            )}
          </button>
        </div>
      </form>

      {/* 提示文本 */}
      <div className="text-center text-sm text-gray-500">
        <p>描述你想画的内容，比如："一只可爱的小猫"、"彩虹和太阳"</p>
        <p className="text-xs mt-1">按 Enter 提交，Shift + Enter 换行</p>
      </div>
    </div>
  )
}

export default TextInput