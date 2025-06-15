'use client'

import React, { useEffect } from 'react'
import { useDrop } from 'react-dnd'
import { useGameState, isRedPiece, isBlackPiece } from '@/hooks/useGameState'
import { ChessPiece } from './ChessPiece'
import { cn } from '@/lib/utils'

interface ChessIntersectionProps {
  x: number
  y: number
}

// 单个交叉点组件 - 棋子将放在这里
const ChessIntersection: React.FC<ChessIntersectionProps> = ({ x, y }) => {
  const { board, currentPlayer, movePiece, isPieceAt } = useGameState()
  const piece = isPieceAt(x, y)
  
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'piece',
    drop: (item: { piece: any, position: [number, number] }) => {
      const [fromX, fromY] = item.position
      const success = movePiece([fromX, fromY], [x, y])
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [x, y, movePiece, currentPlayer])

  // 判断当前棋子是否可以被当前玩家移动
  const isCurrentPlayerPiece = piece && (
    (currentPlayer === 'red' && isRedPiece(piece)) ||
    (currentPlayer === 'black' && isBlackPiece(piece))
  )

  return (
    <div
      ref={drop as any}
      className={cn(
        "absolute flex items-center justify-center",
        "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14",
        "-translate-x-1/2 -translate-y-1/2 z-10", // 居中到交叉点
        isOver && canDrop && "bg-green-200 bg-opacity-70 rounded-full border-2 border-green-500",
        isOver && !canDrop && "bg-red-200 bg-opacity-70 rounded-full border-2 border-red-500"
      )}
      style={{
        left: `${(x / 8) * 100}%`,
        top: `${(y / 9) * 100}%`,
      }}
    >
      {piece && (
        <ChessPiece
          piece={piece}
          position={[x, y]}
          isCurrentPlayer={!!isCurrentPlayerPiece}
        />
      )}
      
      {/* 交叉点标记 - 仅在没有棋子时显示 */}
      {!piece && (
        <div className="w-2 h-2 bg-amber-800 rounded-full opacity-40"></div>
      )}
    </div>
  )
}

export const ChessBoard: React.FC = () => {
  const { 
    currentPlayer, 
    gameMode, 
    playerSide, 
    gameStatus, 
    isAiThinking,
    makeAIMove 
  } = useGameState()
  
  // AI自动走棋逻辑
  useEffect(() => {
    if (gameMode === 'ai' && gameStatus === 'playing' && !isAiThinking) {
      const aiPlayer = playerSide === 'red' ? 'black' : 'red'
      if (currentPlayer === aiPlayer) {
        // 延迟触发AI移动，让UI有时间更新
        const timer = setTimeout(() => {
          makeAIMove()
        }, 300)
        
        return () => clearTimeout(timer)
      }
    }
  }, [currentPlayer, gameMode, playerSide, gameStatus, isAiThinking, makeAIMove])
  
  return (
    <div className="inline-block p-6 bg-gradient-to-br from-amber-100 to-yellow-100 border-4 border-amber-900 rounded-lg shadow-2xl">
      {/* 棋盘标题 */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-amber-900">中国象棋</h2>
        <p className="text-sm text-amber-700">当前回合：
          <span className={cn(
            "font-semibold ml-1",
            currentPlayer === 'red' ? "text-red-600" : "text-gray-700"
          )}>
            {currentPlayer === 'red' ? '红方' : '黑方'}
          </span>
        </p>
      </div>
      
      {/* 棋盘主体 - 固定尺寸便于精确定位 */}
      <div className="relative bg-amber-50 border-4 border-amber-900 rounded-lg"
           style={{ width: '520px', height: '580px' }}>
        
        {/* 棋盘背景 - 河界区域 */}
        <div className="absolute inset-0">
          {/* 河界背景 */}
          <div 
            className="absolute bg-gradient-to-r from-blue-50 to-blue-100 border-y-2 border-blue-300"
            style={{ 
              top: '44.4%', 
              height: '11.2%', 
              width: '100%' 
            }}
          >
            {/* 楚河汉界文字 */}
            <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 text-lg text-blue-800 font-bold">
              楚河
            </div>
            <div className="absolute top-1/2 right-1/4 transform translate-x-1/2 -translate-y-1/2 text-lg text-blue-800 font-bold">
              汉界
            </div>
          </div>
        </div>
        
        {/* 棋盘线条 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {/* 竖线 (9条) */}
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={`vertical-${i}`}
              x1={`${(i / 8) * 100}%`}
              y1="0%"
              x2={`${(i / 8) * 100}%`}
              y2="100%"
              stroke="#92400e"
              strokeWidth="2"
            />
          ))}
          
          {/* 横线 (10条) */}
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`horizontal-${i}`}
              x1="0%"
              y1={`${(i / 9) * 100}%`}
              x2="100%"
              y2={`${(i / 9) * 100}%`}
              stroke="#92400e"
              strokeWidth="2"
            />
          ))}
          
          {/* 九宫格对角线 - 黑方九宫 (上方) */}
          {/* 左上到右下对角线 */}
          <line
            x1="37.5%" y1="0%"
            x2="62.5%" y2="22.22%"
            stroke="#92400e"
            strokeWidth="2"
            opacity="0.8"
          />
          {/* 右上到左下对角线 */}
          <line
            x1="62.5%" y1="0%"
            x2="37.5%" y2="22.22%"
            stroke="#92400e"
            strokeWidth="2"
            opacity="0.8"
          />
          
          {/* 九宫格对角线 - 红方九宫 (下方) */}
          {/* 左上到右下对角线 */}
          <line
            x1="37.5%" y1="77.78%"
            x2="62.5%" y2="100%"
            stroke="#92400e"
            strokeWidth="2"
            opacity="0.8"
          />
          {/* 右上到左下对角线 */}
          <line
            x1="62.5%" y1="77.78%"
            x2="37.5%" y2="100%"
            stroke="#92400e"
            strokeWidth="2"
            opacity="0.8"
          />
        </svg>
        
        {/* 棋子交叉点位置 - 90个交叉点 */}
        {Array.from({ length: 10 }, (_, y) =>
          Array.from({ length: 9 }, (_, x) => (
            <ChessIntersection key={`intersection-${x}-${y}`} x={x} y={y} />
          ))
        )}
      </div>
      
      {/* 棋盘底部标识 */}
      <div className="flex justify-between mt-4 text-sm text-amber-800 font-semibold">
        <span className="text-red-600">红方（帥）</span>
        <span>传统中国象棋</span>
        <span className="text-gray-700">黑方（將）</span>
      </div>
    </div>
  )
} 