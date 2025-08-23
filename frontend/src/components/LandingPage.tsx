'use client'

import React from 'react'
import { Mic, Type, Palette, Sparkles, Heart, Star, Zap, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-pink-400/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img 
                  src="/babydraw-logo.svg" 
                  alt="BabyDraw" 
                  className="w-24 h-24 drop-shadow-lg"
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent mb-6">
              BabyDraw
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              🎨 专为 <span className="font-semibold text-purple-600">5-8岁儿童</span> 设计的AI简笔画教学应用
            </p>
            
            {/* Description */}
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
              通过语音转文字和AI生成图片技术，分四个步骤教会小朋友画简笔画，让创作变得简单有趣！
            </p>
            
            {/* CTA Button */}
            <Link href="/app">
              <button className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <Palette className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                开始创作
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </button>
            </Link>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-yellow-300 rounded-full opacity-60 animate-pulse" />
        <div className="absolute top-40 right-20 w-12 h-12 bg-blue-300 rounded-full opacity-60 animate-bounce" />
        <div className="absolute bottom-20 left-20 w-20 h-20 bg-pink-300 rounded-full opacity-60 animate-pulse" />
      </header>

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ✨ 神奇功能
            </h2>
            <p className="text-xl text-gray-600">
              让孩子的想象力插上AI的翅膀
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">🎤 语音输入</h3>
              <p className="text-gray-600">
                说出想画的内容，AI自动识别转换为文字
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Type className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">✏️ 文字输入</h3>
              <p className="text-gray-600">
                直接输入描述，简单快捷开始创作
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">⚡ AI生成</h3>
              <p className="text-gray-600">
                AI瞬间生成可爱的卡通简笔画
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">💝 分步教学</h3>
              <p className="text-gray-600">
                四个步骤循序渐进，轻松学会画画
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              🚀 使用步骤
            </h2>
            <p className="text-xl text-gray-600">
              简单四步，开启创作之旅
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">选择输入方式</h3>
                <p className="text-gray-600">
                  语音说话或文字输入，选择你喜欢的方式
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className="w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-b-2 border-t-transparent border-b-transparent absolute right-0 top-1/2 transform -translate-y-1/2"></div>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">描述想画的内容</h3>
                <p className="text-gray-600">
                  告诉AI你想画什么，比如"小猫咪"、"房子"
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className="w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-b-2 border-t-transparent border-b-transparent absolute right-0 top-1/2 transform -translate-y-1/2"></div>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-pink-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI生成简笔画</h3>
                <p className="text-gray-600">
                  AI魔法师为你创作可爱的卡通简笔画
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className="w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-b-2 border-t-transparent border-b-transparent absolute right-0 top-1/2 transform -translate-y-1/2"></div>
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">学习和保存</h3>
              <p className="text-gray-600">
                跟着步骤学画画，保存你的作品
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div className="group">
              <div className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform">
                🎨 1000+
              </div>
              <p className="text-xl opacity-90">可爱图案</p>
            </div>
            <div className="group">
              <div className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform">
                👶 5-8岁
              </div>
              <p className="text-xl opacity-90">专属设计</p>
            </div>
            <div className="group">
              <div className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform">
                ⚡ 秒级
              </div>
              <p className="text-xl opacity-90">生成速度</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            🌟 准备好开始创作了吗？
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            让孩子的想象力在AI的帮助下自由飞翔
          </p>
          <Link href="/app">
            <button className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-6 rounded-full text-xl font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <Star className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              立即开始创作
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
              <img 
                src="/babydraw-logo.svg" 
                alt="BabyDraw" 
                className="w-8 h-8"
              />
              <span className="text-2xl font-bold">BabyDraw</span>
            </div>
            <p className="text-gray-400 mb-4">
              让每个孩子都能成为小画家 🎨
            </p>
            <p className="text-sm text-gray-500">
              © 2024 BabyDraw. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}