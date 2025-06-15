'use client'

import React from 'react'
import { useGameState } from '@/hooks/useGameState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Trophy, Crown, Flag, Handshake, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const GameControl: React.FC = () => {
  const { 
    currentPlayer, 
    gameHistory, 
    gameStatus,
    winner,
    movesSinceCaptureOrPawn,
    resetGame,
    resignGame,
    proposeDraw,
    isInCheck
  } = useGameState()
  
  const isGameOver = gameStatus !== 'playing'
  const currentPlayerInCheck = isInCheck(currentPlayer)
  
  const getGameStatusMessage = () => {
    switch (gameStatus) {
      case 'checkmate':
        return `将死！${winner === 'red' ? '红方' : '黑方'}获胜！`
      case 'stalemate':
        return '困毙！无棋可走，平局！'
      case 'draw':
        return '和棋！游戏平局！'
      case 'resigned':
        return `认输！${winner === 'red' ? '红方' : '黑方'}获胜！`
      default:
        return currentPlayerInCheck ? '将军！' : '游戏进行中'
    }
  }

  const getGameStatusIcon = () => {
    switch (gameStatus) {
      case 'checkmate':
        return <Trophy className="w-5 h-5 text-yellow-600" />
      case 'stalemate':
      case 'draw':
        return <Handshake className="w-5 h-5 text-blue-600" />
      case 'resigned':
        return <Flag className="w-5 h-5 text-gray-600" />
      default:
        return currentPlayerInCheck ? <AlertCircle className="w-5 h-5 text-red-600" /> : <Crown className="w-5 h-5 text-green-600" />
    }
  }

  const handleResign = () => {
    const confirmResign = window.confirm(`确定要认输吗？${currentPlayer === 'red' ? '红方' : '黑方'}将认输，对方获胜！`)
    if (confirmResign) {
      resignGame(currentPlayer)
      toast.success(`${currentPlayer === 'red' ? '红方' : '黑方'}认输，${currentPlayer === 'red' ? '黑方' : '红方'}获胜！`)
    }
  }

  const handleProposeDraw = () => {
    const confirmDraw = window.confirm('确定要提议和棋吗？游戏将以平局结束！')
    if (confirmDraw) {
      proposeDraw()
      toast.success('双方同意和棋！')
    }
  }

  const handleReset = () => {
    const confirmReset = window.confirm('确定要重新开始游戏吗？当前进度将丢失！')
    if (confirmReset) {
      resetGame()
      toast.success('游戏已重新开始！')
    }
  }
  
  return (
    <div className="w-full max-w-md space-y-4">
      {/* 游戏状态卡片 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getGameStatusIcon()}
            游戏状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">当前回合：</span>
            <Badge 
              variant={currentPlayer === 'red' ? 'destructive' : 'secondary'}
              className={cn(
                currentPlayer === 'red' 
                  ? 'bg-red-100 text-red-800 border-red-300' 
                  : 'bg-gray-100 text-gray-800 border-gray-300'
              )}
            >
              {currentPlayer === 'red' ? '红方' : '黑方'}
            </Badge>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-gray-50">
            <p className={cn(
              "font-semibold",
              gameStatus === 'checkmate' && "text-yellow-700",
              (gameStatus === 'stalemate' || gameStatus === 'draw') && "text-blue-700",
              gameStatus === 'resigned' && "text-gray-700",
              gameStatus === 'playing' && currentPlayerInCheck && "text-red-700",
              gameStatus === 'playing' && !currentPlayerInCheck && "text-green-700"
            )}>
              {getGameStatusMessage()}
            </p>
          </div>

          {/* 50回合规则提示 */}
          {movesSinceCaptureOrPawn > 80 && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              ⚠️ 已连续 {movesSinceCaptureOrPawn} 步未吃子，接近50回合和棋规则
            </div>
          )}
        </CardContent>
      </Card>

      {/* 游戏控制按钮 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">游戏控制</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={handleResign}
              disabled={isGameOver}
              variant="destructive"
              size="sm"
              className="flex items-center gap-1"
            >
              <Flag className="w-4 h-4" />
              认输
            </Button>
            
            <Button 
              onClick={handleProposeDraw}
              disabled={isGameOver}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Handshake className="w-4 h-4" />
              和棋
            </Button>
          </div>
          
          <Button 
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            重新开始
          </Button>
        </CardContent>
      </Card>

      {/* 历史记录 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            移动历史 ({gameHistory.length} 步)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {gameHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">暂无移动记录</p>
            ) : (
              gameHistory.map((move, index) => (
                <div key={index} className="text-xs p-2 rounded bg-gray-50 flex items-center justify-between">
                  <span className="font-mono">
                    {index + 1}. [{move.from[0]},{move.from[1]}] → [{move.to[0]},{move.to[1]}]
                  </span>
                  {move.capturedPiece && (
                    <Badge variant="outline" className="text-xs">
                      吃子
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 游戏规则提示 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">游戏规则</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-600 space-y-2">
          <div className="space-y-1">
            <p>• <strong>将死：</strong>对方将/帅无法避免被吃掉</p>
            <p>• <strong>困毙：</strong>未被将军但无棋可走</p>
            <p>• <strong>50回合规则：</strong>连续100步未吃子可和棋</p>
            <p>• <strong>重复局面：</strong>同一局面重复3次可和棋</p>
            <p>• <strong>禁止送将：</strong>不能主动让己方将/帅被攻击</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 