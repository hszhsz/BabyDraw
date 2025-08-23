/**
 * 绘画作品类型
 */
export interface Drawing {
  id: number
  title: string
  description?: string
  prompt: string
  image_url?: string
  step_images: string[]
  style: string
  steps: number
  user_id?: string
  created_at: string
  updated_at: string
}

/**
 * 创建绘画请求
 */
export interface CreateDrawingRequest {
  title: string
  description?: string
  prompt: string
  style?: string
  steps?: number
}

/**
 * 语音识别响应
 */
export interface SpeechRecognitionResponse {
  text: string
  confidence?: number
  provider: string
}

/**
 * 图像生成响应
 */
export interface ImageGenerationResponse {
  final_image_url: string
  step_images: string[]
  provider: string
}

/**
 * 图像生成请求
 */
export interface ImageGenerationRequest {
  prompt: string
  style?: string
  steps?: number
}

/**
 * API响应基础类型
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * 缓存统计
 */
export interface CacheStats {
  total_count: number
  active_count: number
  expired_count: number
  hit_rate: number
}

/**
 * 服务状态
 */
export interface ServiceStatus {
  speech_service: {
    current_provider: string
    provider_info: {
      name: string
      description: string
      features: string[]
    }
  }
  image_service: {
    current_provider: string
    provider_info: {
      name: string
      description: string
      features: string[]
    }
  }
  cache_stats: CacheStats
  database_stats: {
    total_drawings: number
  }
  status: 'healthy' | 'error'
  error?: string
}

/**
 * 历史记录相关类型
 */
export interface DrawingHistory {
  id: number
  drawings: Drawing[]
  total: number
  page: number
  pageSize: number
}

export interface HistoryFilter {
  search?: string
  date_from?: string
  date_to?: string
  style?: string
  limit?: number
  offset?: number
}

export interface CacheStats {
  total_items: number
  total_size_mb: number
  hit_rate: number
  last_cleanup: string
  total_count: number
  active_count: number
  expired_count: number
}

/**
 * 绘画风格选项
 */
export type DrawingStyle = '简笔画' | '卡通' | '水彩' | '素描'

/**
 * 绘画步骤数选项
 */
export type DrawingSteps = 3 | 4 | 5 | 6

/**
 * 录音状态
 */
export type RecordingStatus = 'idle' | 'recording' | 'processing' | 'completed' | 'error'

/**
 * 生成状态
 */
export type GenerationStatus = 'idle' | 'processing' | 'generating' | 'completed' | 'error'