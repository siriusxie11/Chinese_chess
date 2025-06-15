'use client'

import React from 'react'
import { useDrag } from 'react-dnd'
import type { PieceType } from '@/hooks/useGameState'
import { getPieceName, isRedPiece } from '@/hooks/useGameState'
import { cn } from '@/lib/utils'

interface ChessPieceProps {
  piece: PieceType
  position: [number, number]
  isCurrentPlayer: boolean
}

export const ChessPiece: React.FC<ChessPieceProps> = ({ 
  piece, 
  position, 
  isCurrentPlayer 
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'piece',
    item: { piece, position },
    canDrag: isCurrentPlayer,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [piece, position, isCurrentPlayer])

  if (!piece) return null

  const pieceName = getPieceName(piece)
  const isRed = isRedPiece(piece)

  return (
    <div
      ref={drag as any}
      className={cn(
        "flex items-center justify-center cursor-pointer select-none transition-all duration-200",
        isDragging && "opacity-60 scale-110 z-50",
        isCurrentPlayer && "hover:scale-105 hover:shadow-lg hover:z-20",
        !isCurrentPlayer && "cursor-not-allowed opacity-80"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border-3 flex items-center justify-center font-bold text-base sm:text-lg md:text-xl shadow-lg transition-all duration-200",
          isRed 
            ? "bg-gradient-to-br from-red-100 to-red-200 border-red-600 text-red-800 shadow-red-300" 
            : "bg-gradient-to-br from-gray-100 to-gray-200 border-gray-700 text-gray-900 shadow-gray-400",
          isDragging && "shadow-xl scale-110",
          isCurrentPlayer && "hover:shadow-xl hover:border-opacity-80"
        )}
        style={{
          boxShadow: isDragging 
            ? '0 8px 25px rgba(0,0,0,0.3)' 
            : '0 4px 15px rgba(0,0,0,0.2)'
        }}
      >
        {pieceName}
      </div>
    </div>
  )
} 