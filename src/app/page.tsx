'use client'

import React from 'react'
import { DndProvider } from 'react-dnd'
import { MultiBackend, createTransition } from 'react-dnd-multi-backend'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'
import { ChessBoard } from '@/components/ChessBoard'
import { GameControl } from '@/components/GameControl'
import { GameModeSelector } from '@/components/GameModeSelector'
import { Toaster } from 'sonner'

// 创建触控转换
const TouchTransition = createTransition('touchstart', (event: any) => {
	return event.touches != null
})

// 创建鼠标转换  
const MouseTransition = createTransition('mousedown', (event: any) => {
	return event.touches == null
})

// 创建自定义的HTML5-to-Touch配置
const HTML5toTouch = {
	backends: [
		{
			id: 'html5',
			backend: HTML5Backend,
			transition: MouseTransition,
		},
		{
			id: 'touch',
			backend: TouchBackend,
			options: { enableMouseEvents: true },
			preview: true,
			transition: TouchTransition,
		},
	],
}

/**
 * @description 这只是个示例页面，你可以随意修改这个页面或进行全面重构
 */
export default function Home() {
	return (
		<DndProvider backend={MultiBackend} options={HTML5toTouch}>
			<main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
				<div className="container mx-auto">
					{/* 页面标题 */}
					<div className="text-center mb-8">
						<h1 className="text-4xl font-bold text-amber-900 mb-2">中国象棋</h1>
						<p className="text-amber-700">传统中国象棋游戏 - 支持本地对弈、人机对弈和在线对弈</p>
					</div>
					
					{/* 主要内容区域 */}
					<div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
						{/* 左侧：游戏模式选择 */}
						<div className="w-full lg:w-auto">
							<GameModeSelector />
						</div>
						
						{/* 中间：棋盘 */}
						<div className="flex-shrink-0">
							<ChessBoard />
						</div>
						
						{/* 右侧：游戏控制 */}
						<div className="w-full lg:w-auto">
							<GameControl />
						</div>
					</div>
					
					{/* 页脚信息 */}
					<div className="text-center mt-12 text-sm text-amber-600">
						<p>🎯 完整的中国象棋规则实现 | 🤖 智能AI对手 | 🌐 在线对弈功能</p>
						<p className="mt-2">支持将死、困毙、50回合规则、重复局面等完整规则</p>
						<p className="mt-1 text-xs text-amber-500">📱 支持触屏设备拖拽操作</p>
					</div>
				</div>
				
				{/* Toast 通知 */}
				<Toaster position="top-right" richColors />
			</main>
		</DndProvider>
	)
}
