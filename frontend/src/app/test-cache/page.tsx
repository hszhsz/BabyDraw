'use client';

import { useCache } from '@/hooks/useCache';
import { useState } from 'react';

export default function TestCachePage() {
  const { clearCache, getCacheStats, setCachedSpeech, getCachedSpeech } = useCache();
  const [testResult, setTestResult] = useState<string>('');

  const testCacheOperations = () => {
    try {
      // 添加一些测试数据到缓存
      setCachedSpeech('test-hash-1', 'test speech 1');
      setCachedSpeech('test-hash-2', 'test speech 2');
      
      // 验证数据已添加
      const cached1 = getCachedSpeech('test-hash-1');
      const cached2 = getCachedSpeech('test-hash-2');
      
      setTestResult(`缓存测试数据添加成功:\n- test-hash-1: ${cached1}\n- test-hash-2: ${cached2}`);
    } catch (error) {
      setTestResult(`缓存测试失败: ${error}`);
    }
  };

  const testClearCache = () => {
    try {
      console.log('开始测试清除缓存...');
      clearCache();
      
      // 验证缓存已清除
      const cached1 = getCachedSpeech('test-hash-1');
      const cached2 = getCachedSpeech('test-hash-2');
      
      if (cached1 === null && cached2 === null) {
        setTestResult('✅ 缓存清除成功！所有测试数据已被清除。');
      } else {
        setTestResult(`❌ 缓存清除失败！仍然存在数据:\n- test-hash-1: ${cached1}\n- test-hash-2: ${cached2}`);
      }
    } catch (error) {
      setTestResult(`清除缓存测试失败: ${error}`);
    }
  };

  const getCacheInfo = () => {
    try {
      const stats = getCacheStats();
      setTestResult(`缓存统计信息:\n${JSON.stringify(stats, null, 2)}`);
    } catch (error) {
      setTestResult(`获取缓存统计失败: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">缓存功能测试页面</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试操作</h2>
          <div className="space-x-4">
            <button
              onClick={testCacheOperations}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              添加测试缓存数据
            </button>
            <button
              onClick={testClearCache}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              测试清除缓存
            </button>
            <button
              onClick={getCacheInfo}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              获取缓存统计
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">测试结果</h2>
          <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
            {testResult || '点击上方按钮开始测试...'}
          </pre>
        </div>
      </div>
    </div>
  );
}