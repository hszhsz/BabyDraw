'use client'

import React from 'react'
import Image from 'next/image'
import { Drawing } from '@/types'
import { cn } from '@/lib/utils'

interface DrawingCanvasProps {
  drawing?: Drawing
  currentStep?: number
  showSteps?: boolean
  className?: string
}

export function DrawingCanvas({ 
  drawing, 
  currentStep = 0, 
  showSteps = true,
  className 
}: DrawingCanvasProps) {
  if (!drawing) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300",
        "min-h-[400px]",
        className
      )}>
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-lg font-medium">等待生成绘画...</p>
          <p className="text-sm">说出你想画的内容，我来帮你画出来！</p>
        </div>
      </div>
    )
  }

  const displayImage = showSteps && drawing.step_images && drawing.step_images[currentStep] 
    ? drawing.step_images[currentStep]
    : drawing.image_url

  return (
    <div className={cn("space-y-4", className)}>
      {/* 主画布 */}
      <div className="relative bg-white rounded-lg border shadow-sm overflow-hidden">
        {displayImage ? (
          <div className="relative aspect-square">
            <Image
              src={displayImage}
              alt={drawing.title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="aspect-square flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">🖼️</div>
              <p>图片加载中...</p>
            </div>
          </div>
        )}
        
        {/* 步骤指示器 */}
        {showSteps && drawing.step_images && drawing.step_images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              步骤 {currentStep + 1} / {drawing.step_images.length}
            </div>
          </div>
        )}
      </div>

      {/* 绘画信息 */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {drawing.title}
        </h3>
        {drawing.description && (
          <p className="text-gray-600 text-sm">
            {drawing.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {drawing.style}
          </span>
          <span>
            {drawing.steps} 个步骤
          </span>
        </div>
      </div>

      {/* 步骤缩略图 */}
      {showSteps && drawing.step_images && drawing.step_images.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">绘画步骤</h4>
          <div className="grid grid-cols-4 gap-2">
            {drawing.step_images.map((stepImage, index) => (
              <button
                key={index}
                onClick={() => {/* 这里可以添加切换步骤的逻辑 */}}
                className={cn(
                  "relative aspect-square rounded border-2 overflow-hidden transition-all",
                  currentStep === index 
                    ? "border-blue-500 ring-2 ring-blue-200" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Image
                  src={stepImage}
                  alt={`步骤 ${index + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 25vw, 10vw"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                <div className="absolute bottom-1 right-1 bg-white/90 text-xs px-1 rounded">
                  {index + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DrawingCanvas