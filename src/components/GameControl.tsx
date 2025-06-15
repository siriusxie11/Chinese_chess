'use client'

import React from 'react'
import { useGameState, getPieceName } from '@/hooks/useGameState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Trophy, Crown, Flag, Handshake, RotateCcw, AlertTriangle, MousePointer, Smartphone, Users } from 'lucide-react'
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
    isInCheck,
    checkGameEnd,
    clickMode,
    toggleClickMode,
    clearSelection
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

  const handleToggleMode = () => {
    clearSelection() // 切换模式时清除选择
    toggleClickMode()
    toast.info(clickMode ? '已切换到拖拽模式' : '已切换到点击模式')
  }

  const gameStatusText = {
    'playing': '游戏进行中',
    'checkmate': '将死',
    'stalemate': '困毙',
    'draw': '平局',
    'resigned': '认输'
  }

  const lastMove = gameHistory[gameHistory.length - 1]

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">游戏控制</CardTitle>
          <Badge 
            variant={gameStatus === 'playing' ? 'default' : 'secondary'}
            className={cn(
              gameStatus === 'playing' && 'bg-green-100 text-green-800',
              gameStatus === 'checkmate' && 'bg-red-100 text-red-800',
              gameStatus === 'draw' && 'bg-blue-100 text-blue-800'
            )}
          >
            {gameStatusText[gameStatus]}
          </Badge>
        </div>
        <CardDescription>
          管理游戏状态和操作
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 当前游戏状态 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">当前回合：</span>
            <Badge variant="outline" className={cn(
              currentPlayer === 'red' ? 'border-red-300 text-red-700' : 'border-gray-400 text-gray-700'
            )}>
              {currentPlayer === 'red' ? '红方' : '黑方'}
            </Badge>
          </div>
          
          {/* 将军提示 */}
          {gameStatus === 'playing' && isInCheck(currentPlayer) && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700 font-medium">
                {currentPlayer === 'red' ? '红方' : '黑方'}被将军！
              </span>
            </div>
          )}
          
          {/* 胜负结果 */}
          {winner && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <Crown className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 font-medium">
                {winner === 'red' ? '红方' : '黑方'}获胜！
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* 控制模式切换 */}
        <div className="space-y-2">
          <span className="text-sm font-medium">操作模式：</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleMode}
            className="w-full justify-start"
          >
            {clickMode ? (
              <>
                <Smartphone className="w-4 h-4 mr-2" />
                点击模式
                <Badge variant="secondary" className="ml-auto">
                  触屏友好
                </Badge>
              </>
            ) : (
              <>
                <MousePointer className="w-4 h-4 mr-2" />
                拖拽模式
                <Badge variant="secondary" className="ml-auto">
                  桌面版
                </Badge>
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            {clickMode 
              ? '点击棋子选择，再点击目标位置移动' 
              : '拖拽棋子到目标位置移动'
            }
          </p>
        </div>

        <Separator />

        {/* 游戏操作 */}
        <div className="space-y-2">
          <span className="text-sm font-medium">游戏操作：</span>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleReset}
              className="text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              重新开始
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResign}
              disabled={gameStatus !== 'playing'}
              className="text-xs"
            >
              <Flag className="w-3 h-3 mr-1" />
              认输
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleProposeDraw}
            disabled={gameStatus !== 'playing'}
            className="w-full text-xs"
          >
            <Users className="w-3 h-3 mr-1" />
            提议和棋
          </Button>
        </div>

        <Separator />

        {/* 游戏统计 */}
        <div className="space-y-2">
          <span className="text-sm font-medium">游戏统计：</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{gameHistory.length}</div>
              <div className="text-gray-600">总步数</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{movesSinceCaptureOrPawn}</div>
              <div className="text-gray-600">和棋倒计时</div>
            </div>
          </div>
        </div>

        {/* 最后一步 */}
        {lastMove && (
          <>
            <Separator />
            <div className="space-y-2">
              <span className="text-sm font-medium">最后一步：</span>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm text-blue-900">
                  <span className="font-medium">{getPieceName(lastMove.piece)}</span>
                  <span className="text-blue-600 mx-1">→</span>
                  <span className="text-xs text-blue-700">
                    ({lastMove.from[0]},{lastMove.from[1]}) → ({lastMove.to[0]},{lastMove.to[1]})
                  </span>
                </div>
                {lastMove.capturedPiece && (
                  <div className="text-xs text-blue-600 mt-1">
                    吃掉：{getPieceName(lastMove.capturedPiece)}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 