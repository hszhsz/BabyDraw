import { useState, useEffect, useCallback } from 'react'
import { Drawing, CacheStats } from '@/types'

interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

interface UseCacheReturn {
  // 绘画缓存
  getCachedDrawing: (prompt: string, style: string) => Drawing | null
  setCachedDrawing: (prompt: string, style: string, drawing: Drawing) => void
  
  // 语音识别缓存
  getCachedSpeech: (audioHash: string) => string | null
  setCachedSpeech: (audioHash: string, text: string) => void
  
  // 缓存管理
  clearCache: () => void
  getCacheStats: () => CacheStats
  cleanExpiredCache: () => void
}

const CACHE_PREFIX = 'babydraw_cache_'
const DRAWING_CACHE_KEY = `${CACHE_PREFIX}drawings`
const SPEECH_CACHE_KEY = `${CACHE_PREFIX}speech`
const DEFAULT_EXPIRY = 24 * 60 * 60 * 1000 // 24小时
const SPEECH_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7天

export function useCache(): UseCacheReturn {
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    total_items: 0,
    total_size_mb: 0,
    hit_rate: 0,
    last_cleanup: new Date().toISOString(),
    total_count: 0,
    active_count: 0,
    expired_count: 0
  })

  // 生成缓存键
  const generateDrawingKey = (prompt: string, style: string): string => {
    return `${prompt}_${style}`.toLowerCase().replace(/[^a-z0-9]/g, '_')
  }

  // 计算字符串哈希（简单实现）
  const generateHash = (str: string): string => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  }

  // 从localStorage获取缓存
  const getFromCache = <T>(cacheKey: string, itemKey: string): T | null => {
    try {
      const cacheData = localStorage.getItem(cacheKey)
      if (!cacheData) return null

      const cache: Record<string, CacheItem<T>> = JSON.parse(cacheData)
      const item = cache[itemKey]

      if (!item) return null

      // 检查是否过期
      if (Date.now() > item.expiry) {
        delete cache[itemKey]
        localStorage.setItem(cacheKey, JSON.stringify(cache))
        return null
      }

      return item.data
    } catch (error) {
      console.error('Error reading from cache:', error)
      return null
    }
  }

  // 保存到localStorage缓存
  const saveToCache = <T>(cacheKey: string, itemKey: string, data: T, expiry: number = DEFAULT_EXPIRY): void => {
    try {
      const cacheData = localStorage.getItem(cacheKey)
      const cache: Record<string, CacheItem<T>> = cacheData ? JSON.parse(cacheData) : {}

      cache[itemKey] = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + expiry
      }

      localStorage.setItem(cacheKey, JSON.stringify(cache))
      updateCacheStats()
    } catch (error) {
      console.error('Error saving to cache:', error)
    }
  }

  // 获取缓存的绘画
  const getCachedDrawing = useCallback((prompt: string, style: string): Drawing | null => {
    const key = generateDrawingKey(prompt, style)
    return getFromCache<Drawing>(DRAWING_CACHE_KEY, key)
  }, [])

  // 缓存绘画
  const setCachedDrawing = useCallback((prompt: string, style: string, drawing: Drawing): void => {
    const key = generateDrawingKey(prompt, style)
    saveToCache(DRAWING_CACHE_KEY, key, drawing, DEFAULT_EXPIRY)
  }, [])

  // 获取缓存的语音识别结果
  const getCachedSpeech = useCallback((audioHash: string): string | null => {
    return getFromCache<string>(SPEECH_CACHE_KEY, audioHash)
  }, [])

  // 缓存语音识别结果
  const setCachedSpeech = useCallback((audioHash: string, text: string): void => {
    saveToCache(SPEECH_CACHE_KEY, audioHash, text, SPEECH_EXPIRY)
  }, [])

  // 清除所有缓存
  const clearCache = useCallback((): void => {
    try {
      console.log('开始清除缓存...')
      localStorage.removeItem(DRAWING_CACHE_KEY)
      localStorage.removeItem(SPEECH_CACHE_KEY)
      
      // 直接重置缓存统计
      setCacheStats({
        total_items: 0,
        total_size_mb: 0,
        hit_rate: 0,
        last_cleanup: new Date().toISOString(),
        total_count: 0,
        active_count: 0,
        expired_count: 0
      })
      
      console.log('缓存清除完成')
      // 添加用户反馈
      alert('缓存已清除！')
    } catch (error) {
      console.error('Error clearing cache:', error)
      alert('清除缓存失败：' + error)
    }
  }, [setCacheStats])

  // 清理过期缓存
  const cleanExpiredCache = useCallback((): void => {
    try {
      const now = Date.now()
      
      // 清理绘画缓存
      const drawingCacheData = localStorage.getItem(DRAWING_CACHE_KEY)
      if (drawingCacheData) {
        const drawingCache = JSON.parse(drawingCacheData)
        const cleanedDrawingCache: Record<string, CacheItem<Drawing>> = {}
        
        Object.entries(drawingCache).forEach(([key, item]) => {
          const cacheItem = item as CacheItem<Drawing>
          if (now <= cacheItem.expiry) {
            cleanedDrawingCache[key] = cacheItem
          }
        })
        
        localStorage.setItem(DRAWING_CACHE_KEY, JSON.stringify(cleanedDrawingCache))
      }
      
      // 清理语音缓存
      const speechCacheData = localStorage.getItem(SPEECH_CACHE_KEY)
      if (speechCacheData) {
        const speechCache = JSON.parse(speechCacheData)
        const cleanedSpeechCache: Record<string, CacheItem<string>> = {}
        
        Object.entries(speechCache).forEach(([key, item]) => {
          const cacheItem = item as CacheItem<string>
          if (now <= cacheItem.expiry) {
            cleanedSpeechCache[key] = cacheItem
          }
        })
        
        localStorage.setItem(SPEECH_CACHE_KEY, JSON.stringify(cleanedSpeechCache))
      }
      
      updateCacheStats()
    } catch (error) {
      console.error('Error cleaning expired cache:', error)
    }
  }, [])

  // 更新缓存统计
  const updateCacheStats = useCallback((): void => {
    try {
      let totalItems = 0
      let totalSize = 0
      
      // 计算绘画缓存
      const drawingCacheData = localStorage.getItem(DRAWING_CACHE_KEY)
      if (drawingCacheData) {
        const drawingCache = JSON.parse(drawingCacheData)
        totalItems += Object.keys(drawingCache).length
        totalSize += new Blob([drawingCacheData]).size
      }
      
      // 计算语音缓存
      const speechCacheData = localStorage.getItem(SPEECH_CACHE_KEY)
      if (speechCacheData) {
        const speechCache = JSON.parse(speechCacheData)
        totalItems += Object.keys(speechCache).length
        totalSize += new Blob([speechCacheData]).size
      }
      
      setCacheStats({
        total_items: totalItems,
        total_size_mb: totalSize / (1024 * 1024),
        hit_rate: 0, // 这里可以实现更复杂的命中率计算
        last_cleanup: new Date().toISOString(),
        total_count: totalItems,
        active_count: totalItems,
        expired_count: 0
      })
    } catch (error) {
      console.error('Error updating cache stats:', error)
    }
  }, [setCacheStats])

  // 获取缓存统计
  const getCacheStats = useCallback((): CacheStats => {
    updateCacheStats()
    return cacheStats
  }, [cacheStats])

  // 初始化时清理过期缓存
  useEffect(() => {
    cleanExpiredCache()
    updateCacheStats()
  }, [])

  return {
    getCachedDrawing,
    setCachedDrawing,
    getCachedSpeech,
    setCachedSpeech,
    clearCache,
    getCacheStats,
    cleanExpiredCache
  }
}

// 生成音频文件的哈希值
export const generateAudioHash = async (audioBlob: Blob): Promise<string> => {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (error) {
    console.error('Error generating audio hash:', error)
    // 降级方案：使用文件大小和时间戳
    return `${audioBlob.size}_${Date.now()}`
  }
}