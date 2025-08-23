import { 
  Drawing, 
  CreateDrawingRequest, 
  SpeechRecognitionResponse, 
  ImageGenerationResponse, 
  ImageGenerationRequest, 
  ApiResponse, 
  CacheStats, 
  ServiceStatus,
  DrawingHistory,
  HistoryFilter
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_V1 = `${API_BASE_URL}/api/v1`

class ApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_V1}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value)
        })
      }

      const response = await fetch(`${API_V1}${endpoint}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('File upload failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  // 语音识别
  async recognizeSpeech(audioFile: File): Promise<ApiResponse<SpeechRecognitionResponse>> {
    return this.uploadFile<SpeechRecognitionResponse>('/speech/recognize', audioFile)
  }

  // 测试语音识别服务
  async testSpeechService(): Promise<ApiResponse<any>> {
    return this.request('/speech/test')
  }

  // 生成图像
  async generateImage(request: ImageGenerationRequest): Promise<ApiResponse<ImageGenerationResponse>> {
    return this.request<ImageGenerationResponse>('/images/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // 测试图像生成服务
  async testImageService(): Promise<ApiResponse<any>> {
    return this.request('/images/test')
  }

  // 获取绘画列表
  async getDrawings(skip: number = 0, limit: number = 20): Promise<ApiResponse<Drawing[]>> {
    return this.request<Drawing[]>(`/drawings/?skip=${skip}&limit=${limit}`)
  }

  // 获取单个绘画
  async getDrawing(id: number): Promise<ApiResponse<Drawing>> {
    return this.request<Drawing>(`/drawings/${id}`)
  }

  // 创建绘画
  async createDrawing(request: CreateDrawingRequest): Promise<ApiResponse<Drawing>> {
    return this.request<Drawing>('/drawings/', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // 删除绘画
  async deleteDrawing(id: number): Promise<ApiResponse<any>> {
    return this.request(`/drawings/${id}`, {
      method: 'DELETE',
    })
  }

  // 从语音创建绘画
  async createDrawingFromSpeech(
    audioFile: File, 
    style: string = '简笔画', 
    steps: number = 4
  ): Promise<ApiResponse<Drawing>> {
    return this.uploadFile<Drawing>('/drawings/from-speech', audioFile, {
      style,
      steps: steps.toString()
    })
  }

  // 从文字创建绘画
  async createDrawingFromText(
    text: string, 
    style: string = '简笔画', 
    steps: number = 4
  ): Promise<ApiResponse<Drawing>> {
    return this.request<Drawing>('/drawings/from-text', {
      method: 'POST',
      body: JSON.stringify({
        text,
        style,
        steps
      }),
    })
  }

  // 获取缓存统计
  async getCacheStats(): Promise<ApiResponse<any>> {
    return this.request('/cache/stats')
  }

  // 清理过期缓存
  async clearExpiredCache(): Promise<ApiResponse<any>> {
    return this.request('/cache/clear-expired', {
      method: 'POST',
    })
  }

  // 获取服务状态
  async getServiceStatus(): Promise<ApiResponse<ServiceStatus>> {
    return this.request<ServiceStatus>('/drawings/status')
  }

  // 历史记录管理
  async getDrawingHistory(page: number = 1, pageSize: number = 10, filter?: HistoryFilter): Promise<ApiResponse<DrawingHistory>> {
    const params = new URLSearchParams({
      skip: ((page - 1) * pageSize).toString(),
      limit: pageSize.toString(),
      ...(filter?.style && { style: filter.style }),
      ...(filter?.search && { search: filter.search })
    })
    return this.request<DrawingHistory>(`/drawings/?${params}`)
  }

  async getDrawingById(id: number): Promise<ApiResponse<Drawing>> {
    return this.request<Drawing>(`/drawings/${id}`)
  }

  // 健康检查
  async healthCheck(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      return {
        success: response.ok,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      }
    }
  }
}

export const apiService = new ApiService()
export default apiService