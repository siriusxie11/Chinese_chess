'use client'

import React, { useState } from 'react'
import { useGameState } from '@/hooks/useGameState'
import type { GameMode, AIDifficulty } from '@/hooks/useGameState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Bot, Wifi, Copy, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const GameModeSelector: React.FC = () => {
  const { 
    gameMode, 
    aiDifficulty, 
    playerSide, 
    roomId, 
    isConnected,
    isAiThinking,
    setGameMode, 
    setAIDifficulty, 
    setPlayerSide,
    createRoom,
    joinRoom,
    leaveRoom,
    resetGame
  } = useGameState()
  
  const [joinRoomId, setJoinRoomId] = useState('')
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isJoiningRoom, setIsJoiningRoom] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleModeChange = (mode: GameMode) => {
    if (gameMode === 'online' && isConnected) {
      leaveRoom()
    }
    setGameMode(mode)
    resetGame()
    toast.success(`已切换到${getModeDisplayName(mode)}模式`)
  }

  const getModeDisplayName = (mode: GameMode): string => {
    switch (mode) {
      case 'local': return '本地对弈'
      case 'ai': return '人机对弈'
      case 'online': return '在线对弈'
      default: return '未知模式'
    }
  }

  const getDifficultyDisplayName = (difficulty: AIDifficulty): string => {
    switch (difficulty) {
      case 'easy': return '简单'
      case 'medium': return '中等'
      case 'hard': return '困难'
      default: return '未知难度'
    }
  }

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true)
    try {
      const newRoomId = await createRoom()
      toast.success(`房间创建成功！房间号：${newRoomId}`)
    } catch (error) {
      toast.error('创建房间失败，请重试')
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) {
      toast.error('请输入房间号')
      return
    }
    
    setIsJoiningRoom(true)
    try {
      const success = await joinRoom(joinRoomId.trim().toUpperCase())
      if (success) {
        toast.success(`成功加入房间：${joinRoomId}`)
        setJoinRoomId('')
      } else {
        toast.error('加入房间失败，请检查房间号是否正确')
      }
    } catch (error) {
      toast.error('加入房间失败，请重试')
    } finally {
      setIsJoiningRoom(false)
    }
  }

  const handleCopyRoomId = async () => {
    if (roomId) {
      try {
        await navigator.clipboard.writeText(roomId)
        setCopied(true)
        toast.success('房间号已复制到剪贴板')
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        toast.error('复制失败，请手动复制房间号')
      }
    }
  }

  const handleLeaveRoom = () => {
    const confirmLeave = window.confirm('确定要离开房间吗？')
    if (confirmLeave) {
      leaveRoom()
      toast.success('已离开房间')
    }
  }

  return (
    <div className="w-full max-w-md space-y-4">
      {/* 游戏模式选择 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">游戏模式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {/* 本地对弈 */}
            <Button
              variant={gameMode === 'local' ? 'default' : 'outline'}
              onClick={() => handleModeChange('local')}
              className="flex items-center gap-2 justify-start h-12"
            >
              <Users className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">本地对弈</div>
                <div className="text-xs text-gray-500">双人在同一设备上对弈</div>
              </div>
            </Button>

            {/* 人机对弈 */}
            <Button
              variant={gameMode === 'ai' ? 'default' : 'outline'}
              onClick={() => handleModeChange('ai')}
              className="flex items-center gap-2 justify-start h-12"
            >
              <Bot className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">人机对弈</div>
                <div className="text-xs text-gray-500">与AI电脑对弈</div>
              </div>
              {isAiThinking && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
            </Button>

            {/* 在线对弈 */}
            <Button
              variant={gameMode === 'online' ? 'default' : 'outline'}
              onClick={() => handleModeChange('online')}
              className="flex items-center gap-2 justify-start h-12"
            >
              <Wifi className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">在线对弈</div>
                <div className="text-xs text-gray-500">与网络玩家对弈</div>
              </div>
              {isConnected && <Badge variant="secondary" className="ml-auto">已连接</Badge>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI设置 */}
      {gameMode === 'ai' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">AI设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">AI难度</Label>
              <Select value={aiDifficulty} onValueChange={(value: AIDifficulty) => setAIDifficulty(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择AI难度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">简单 - 随机性较高</SelectItem>
                  <SelectItem value="medium">中等 - 平衡策略</SelectItem>
                  <SelectItem value="hard">困难 - 最优策略</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="playerSide">玩家执子</Label>
              <Select value={playerSide} onValueChange={(value: 'red' | 'black') => setPlayerSide(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择执子颜色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">红方（先手）</SelectItem>
                  <SelectItem value="black">黑方（后手）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
              <p>💡 <strong>提示：</strong></p>
              <p>• 简单：AI会随机选择较好的移动</p>
              <p>• 中等：AI会选择相对最优的移动</p>
              <p>• 困难：AI会选择计算出的最佳移动</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 在线对弈设置 */}
      {gameMode === 'online' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">在线对弈</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <>
                {/* 创建房间 */}
                <div className="space-y-2">
                  <Button 
                    onClick={handleCreateRoom}
                    disabled={isCreatingRoom}
                    className="w-full"
                  >
                    {isCreatingRoom ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        创建中...
                      </>
                    ) : (
                      '创建房间'
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-xs text-gray-500">或</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                {/* 加入房间 */}
                <div className="space-y-2">
                  <Label htmlFor="roomId">房间号</Label>
                  <div className="flex gap-2">
                    <Input
                      id="roomId"
                      placeholder="输入6位房间号"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="uppercase"
                    />
                    <Button 
                      onClick={handleJoinRoom}
                      disabled={isJoiningRoom || !joinRoomId.trim()}
                    >
                      {isJoiningRoom ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        '加入'
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 已连接状态 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-green-800">已连接到房间</div>
                      <div className="text-sm text-green-600">房间号：{roomId}</div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {playerSide === 'red' ? '红方' : '黑方'}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCopyRoomId}
                      className="flex-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          复制房间号
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleLeaveRoom}
                    >
                      离开房间
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
              <p>💡 <strong>在线对弈说明：</strong></p>
              <p>• 创建房间后分享房间号给朋友</p>
              <p>• 房主默认执红方（先手）</p>
              <p>• 加入者默认执黑方（后手）</p>
              <p>• 目前使用本地存储模拟，刷新页面会断开连接</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 当前模式状态 */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Badge variant="outline" className="text-sm">
              当前模式：{getModeDisplayName(gameMode)}
              {gameMode === 'ai' && ` - ${getDifficultyDisplayName(aiDifficulty)}`}
              {gameMode === 'ai' && ` - 玩家执${playerSide === 'red' ? '红' : '黑'}方`}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 