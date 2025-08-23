'use client'

import React, { useState, useEffect } from 'react'
import { History, Search, Filter, Trash2, Eye, Calendar, Palette } from 'lucide-react'
import { Drawing, DrawingHistory as DrawingHistoryType, HistoryFilter, DrawingStyle } from '@/types'
import { apiService } from '@/services/api'
import { cn, formatTime } from '@/lib/utils'

interface DrawingHistoryProps {
  onSelectDrawing?: (drawing: Drawing) => void
  className?: string
}

export function DrawingHistory({ onSelectDrawing, className }: DrawingHistoryProps) {
  const [history, setHistory] = useState<DrawingHistoryType | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState<HistoryFilter>({})
  const [showFilter, setShowFilter] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')

  const pageSize = 12

  // 加载历史记录
  const loadHistory = async (page: number = 1, currentFilter: HistoryFilter = filter) => {
    try {
      setLoading(true)
      const response = await apiService.getDrawingHistory(page, pageSize, currentFilter)
      setHistory(response.data || null)
      setCurrentPage(page)
    } catch (error) {
      console.error('Failed to load drawing history:', error)
    } finally {
      setLoading(false)
    }
  }

  // 删除绘画
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个绘画吗？')) return
    
    try {
      await apiService.deleteDrawing(id)
      // 重新加载当前页
      await loadHistory(currentPage)
    } catch (error) {
      console.error('Failed to delete drawing:', error)
      alert('删除失败，请重试')
    }
  }

  // 搜索处理
  const handleSearch = () => {
    const newFilter = { ...filter, keyword: searchKeyword }
    setFilter(newFilter)
    loadHistory(1, newFilter)
  }

  // 筛选处理
  const handleFilterChange = (newFilter: Partial<HistoryFilter>) => {
    const updatedFilter = { ...filter, ...newFilter }
    setFilter(updatedFilter)
    loadHistory(1, updatedFilter)
  }

  // 清除筛选
  const clearFilter = () => {
    setFilter({})
    setSearchKeyword('')
    loadHistory(1, {})
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 初始加载
  useEffect(() => {
    loadHistory()
  }, [])

  return (
    <div className={cn("bg-white rounded-xl shadow-sm", className)}>
      {/* 头部 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">绘画历史</h2>
            {history && (
              <span className="text-sm text-gray-500">({history.total} 个作品)</span>
            )}
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showFilter ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索绘画内容..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            搜索
          </button>
        </div>

        {/* 筛选面板 */}
        {showFilter && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 风格筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">绘画风格</label>
                <select
                  value={filter.style || ''}
                  onChange={(e) => handleFilterChange({ style: e.target.value as DrawingStyle || undefined })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">全部风格</option>
                  <option value="simple">简单</option>
                  <option value="detailed">详细</option>
                  <option value="cartoon">卡通</option>
                </select>
              </div>

              {/* 日期筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                <input
                  type="date"
                  value={filter.date_from || ''}
                  onChange={(e) => handleFilterChange({ date_from: e.target.value || undefined })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                <input
                  type="date"
                  value={filter.date_to || ''}
                  onChange={(e) => handleFilterChange({ date_to: e.target.value || undefined })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearFilter}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                清除筛选
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : !history || history.drawings.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">还没有绘画历史</p>
            <p className="text-sm text-gray-400 mt-1">开始创作你的第一个作品吧！</p>
          </div>
        ) : (
          <>
            {/* 绘画网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {history.drawings.map((drawing) => (
                <div
                  key={drawing.id}
                  className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* 图片 */}
                  <div className="aspect-square bg-gray-100 relative">
                    {drawing.image_url ? (
                      <img
                        src={drawing.image_url}
                        alt={drawing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Palette className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    
                    {/* 悬浮操作按钮 */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onSelectDrawing?.(drawing)}
                          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(drawing.id)}
                          className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 信息 */}
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 truncate" title={drawing.title}>
                      {drawing.title}
                    </h3>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Palette className="w-3 h-3" />
                        {drawing.style}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(drawing.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {history.total > pageSize && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => loadHistory(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded transition-colors"
                >
                  上一页
                </button>
                
                <span className="text-sm text-gray-600">
                  第 {currentPage} 页，共 {Math.ceil(history.total / pageSize)} 页
                </span>
                
                <button
                  onClick={() => loadHistory(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(history.total / pageSize)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded transition-colors"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DrawingHistory