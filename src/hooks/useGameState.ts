import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 棋子类型
export type PieceType = 
  | 'R' | 'N' | 'B' | 'A' | 'K' | 'C' | 'P' // 红方：车马相仕帅炮兵
  | 'r' | 'n' | 'b' | 'a' | 'k' | 'c' | 'p' // 黑方：车马象士将砲卒
  | null

// 游戏模式类型
export type GameMode = 'local' | 'ai' | 'online'

// AI难度类型
export type AIDifficulty = 'easy' | 'medium' | 'hard'

// 游戏状态
export interface GameState {
  board: PieceType[][]
  currentPlayer: 'red' | 'black'
  gameHistory: { from: [number, number], to: [number, number], piece: PieceType, capturedPiece: PieceType | null }[]
  gameStatus: 'playing' | 'checkmate' | 'stalemate' | 'draw' | 'resigned'
  winner: 'red' | 'black' | null
  movesSinceCaptureOrPawn: number // 自上次吃子或兵卒移动以来的步数
  boardHistory: string[] // 用于检测重复局面
  
  // 游戏模式相关
  gameMode: GameMode
  aiDifficulty: AIDifficulty
  playerSide: 'red' | 'black' // 玩家执哪方（AI模式下使用）
  isAiThinking: boolean
  
  // 点击选择模式（触屏设备备用）
  selectedPosition: [number, number] | null
  clickMode: boolean // 是否启用点击模式
  
  // 在线对弈相关
  roomId: string | null
  playerId: string | null
  opponentId: string | null
  isConnected: boolean
  
  // 方法
  movePiece: (from: [number, number], to: [number, number]) => boolean
  resetGame: () => void
  resignGame: (player: 'red' | 'black') => void
  proposeDraw: () => void
  isValidMove: (from: [number, number], to: [number, number]) => boolean
  isPieceAt: (x: number, y: number) => PieceType
  getCurrentPlayerPieces: () => PieceType[]
  isInCheck: (player: 'red' | 'black') => boolean
  isCheckmate: (player: 'red' | 'black') => boolean
  isStalemate: (player: 'red' | 'black') => boolean
  checkGameEnd: () => void
  
  // 点击选择模式方法
  selectPosition: (x: number, y: number) => void
  clearSelection: () => void
  toggleClickMode: () => void
  
  // 游戏模式方法
  setGameMode: (mode: GameMode) => void
  setAIDifficulty: (difficulty: AIDifficulty) => void
  setPlayerSide: (side: 'red' | 'black') => void
  makeAIMove: () => void
  
  // 在线对弈方法
  createRoom: () => Promise<string>
  joinRoom: (roomId: string) => Promise<boolean>
  leaveRoom: () => void
}

// 标准中国象棋初始布局 - 完全按照传统棋盘
const initialBoard: PieceType[][] = [
  // 第0行：黑方底线 - 車馬象士將士象馬車
  ['r', 'n', 'b', 'a', 'k', 'a', 'b', 'n', 'r'],
  // 第1行：空行
  [null, null, null, null, null, null, null, null, null],
  // 第2行：黑方炮（位于第1列和第7列）
  [null, 'c', null, null, null, null, null, 'c', null],
  // 第3行：黑方卒（位于第0,2,4,6,8列）
  ['p', null, 'p', null, 'p', null, 'p', null, 'p'],
  // 第4行：河界上方（楚河）
  [null, null, null, null, null, null, null, null, null],
  // 第5行：河界下方（汉界）
  [null, null, null, null, null, null, null, null, null],
  // 第6行：红方兵（位于第0,2,4,6,8列）
  ['P', null, 'P', null, 'P', null, 'P', null, 'P'],
  // 第7行：红方炮（位于第1列和第7列）
  [null, 'C', null, null, null, null, null, 'C', null],
  // 第8行：空行
  [null, null, null, null, null, null, null, null, null],
  // 第9行：红方底线 - 車馬相仕帥仕相馬車
  ['R', 'N', 'B', 'A', 'K', 'A', 'B', 'N', 'R']
]

// 获取棋子的中文名称 - 完全按照传统象棋字符
export const getPieceName = (piece: PieceType): string => {
  if (!piece) return ''
  const names: Record<string, string> = {
    'K': '帥', 'k': '將',    // 红帅/黑将 (使用繁体字)
    'A': '仕', 'a': '士',    // 红仕/黑士 
    'B': '相', 'b': '象',    // 红相/黑象
    'N': '馬', 'n': '馬',    // 红马/黑马 (使用繁体字)
    'R': '車', 'r': '車',    // 红车/黑车 (使用繁体字)
    'C': '炮', 'c': '炮',    // 红炮/黑炮
    'P': '兵', 'p': '卒'     // 红兵/黑卒
  }
  return names[piece] || ''
}

// 判断棋子是否为红方
export const isRedPiece = (piece: PieceType): boolean => {
  if (!piece) return false
  return piece === piece.toUpperCase()
}

// 判断棋子是否为黑方
export const isBlackPiece = (piece: PieceType): boolean => {
  if (!piece) return false
  return piece === piece.toLowerCase()
}

// 将棋盘转换为字符串用于比较重复局面
const boardToString = (board: PieceType[][]): string => {
  return board.map(row => 
    row.map(piece => piece || '.').join('')
  ).join('|')
}

// 判断位置是否在九宫格内
const isInPalace = (x: number, y: number, isRed: boolean): boolean => {
  if (x < 3 || x > 5) return false
  if (isRed) {
    return y >= 7 && y <= 9 // 红方九宫：第7-9行
  } else {
    return y >= 0 && y <= 2 // 黑方九宫：第0-2行
  }
}

// 判断是否过河
const hasCrossedRiver = (y: number, isRed: boolean): boolean => {
  if (isRed) {
    return y < 5 // 红方过河：进入0-4行
  } else {
    return y > 4 // 黑方过河：进入5-9行
  }
}

// 检查直线路径是否被阻挡（用于车和炮的移动检查）
const isPathBlocked = (board: PieceType[][], fromX: number, fromY: number, toX: number, toY: number): boolean => {
  const dx = toX - fromX
  const dy = toY - fromY
  const stepX = dx === 0 ? 0 : dx / Math.abs(dx)
  const stepY = dy === 0 ? 0 : dy / Math.abs(dy)
  
  let x = fromX + stepX
  let y = fromY + stepY
  
  while (x !== toX || y !== toY) {
    if (x >= 0 && x < 9 && y >= 0 && y < 10) {
      const row = board[y]
      if (row && row[x]) {
        return true // 路径被阻挡
      }
    }
    x += stepX
    y += stepY
  }
  
  return false
}

// 检查将帅是否对面（将帅在同一直线上且中间无子）
const areKingsFacing = (board: PieceType[][]): boolean => {
  let redKingPos: [number, number] | null = null
  let blackKingPos: [number, number] | null = null
  
  // 找到双方将帅位置
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 9; x++) {
      const piece = board[y]?.[x]
      if (piece === 'K') redKingPos = [x, y]
      if (piece === 'k') blackKingPos = [x, y]
    }
  }
  
  if (!redKingPos || !blackKingPos) return false
  
  const [redX, redY] = redKingPos
  const [blackX, blackY] = blackKingPos
  
  // 检查是否在同一直线上
  if (redX === blackX) {
    // 在同一竖线上，检查中间是否有棋子
    const startY = Math.min(redY, blackY) + 1
    const endY = Math.max(redY, blackY)
    
    for (let y = startY; y < endY; y++) {
      if (board[y]?.[redX]) {
        return false // 中间有棋子，不对面
      }
    }
    return true // 中间无棋子，对面了
  }
  
  return false
}

// 车的移动规则：横竖任意格数，不可越子
const isValidRookMove = (board: PieceType[][], fromX: number, fromY: number, toX: number, toY: number): boolean => {
  // 车只能直线移动
  if (fromX !== toX && fromY !== toY) return false
  
  // 检查路径是否被阻挡
  return !isPathBlocked(board, fromX, fromY, toX, toY)
}

// 马的移动规则：走"日"字，检查马腿
const isValidKnightMove = (board: PieceType[][], fromX: number, fromY: number, toX: number, toY: number): boolean => {
  const dx = Math.abs(toX - fromX)
  const dy = Math.abs(toY - fromY)
  
  // 马走日字
  if (!((dx === 2 && dy === 1) || (dx === 1 && dy === 2))) return false
  
  // 检查马腿是否被阻挡（前进方向第一格有子则不能走）
  let legX = fromX
  let legY = fromY
  
  if (dx === 2) {
    // 横向走2格，马腿在横向第一格
    legX = fromX + (toX - fromX) / 2
  } else {
    // 纵向走2格，马腿在纵向第一格
    legY = fromY + (toY - fromY) / 2
  }
  
  const legRow = board[legY]
  return !(legRow && legRow[legX]) // 马腿位置没有子才能走
}

// 象/相的移动规则：走"田"字，不可过河，检查象眼
const isValidElephantMove = (board: PieceType[][], fromX: number, fromY: number, toX: number, toY: number, isRed: boolean): boolean => {
  const dx = Math.abs(toX - fromX)
  const dy = Math.abs(toY - fromY)
  
  // 象走田字（对角线2格）
  if (dx !== 2 || dy !== 2) return false
  
  // 不能过河
  if (isRed) {
    if (toY < 5) return false // 红相不能越过河界进入黑方
  } else {
    if (toY > 4) return false // 黑象不能越过河界进入红方
  }
  
  // 检查象眼是否被阻挡（田字中心有子则塞象眼）
  const eyeX = fromX + (toX - fromX) / 2
  const eyeY = fromY + (toY - fromY) / 2
  const eyeRow = board[eyeY]
  
  return !(eyeRow && eyeRow[eyeX]) // 象眼位置没有子才能走
}

// 士/仕的移动规则：斜走1格，限九宫内
const isValidAdvisorMove = (fromX: number, fromY: number, toX: number, toY: number, isRed: boolean): boolean => {
  const dx = Math.abs(toX - fromX)
  const dy = Math.abs(toY - fromY)
  
  // 士只能斜着走一格
  if (dx !== 1 || dy !== 1) return false
  
  // 必须在九宫格内
  return isInPalace(fromX, fromY, isRed) && isInPalace(toX, toY, isRed)
}

// 将/帅的移动规则：限于九宫内，每次走1格（横/竖）
const isValidKingMove = (board: PieceType[][], fromX: number, fromY: number, toX: number, toY: number, isRed: boolean): boolean => {
  const dx = Math.abs(toX - fromX)
  const dy = Math.abs(toY - fromY)
  
  // 将/帅只能走一格，且只能直线移动（横/竖）
  if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) return false
  
  // 必须在九宫格内
  if (!isInPalace(toX, toY, isRed)) return false
  
  // 检查移动后是否会导致将帅对面
  const newBoard = board.map(row => [...row])
  const fromRow = newBoard[fromY]
  const toRow = newBoard[toY]
  
  if (!fromRow || !toRow) return false
  
  const piece = fromRow[fromX]
  if (!piece) return false
  
  toRow[toX] = piece
  fromRow[fromX] = null
  
  return !areKingsFacing(newBoard)
}

// 炮的移动规则：移动同车，吃子时需隔1个任意棋子（炮架）
const isValidCannonMove = (board: PieceType[][], fromX: number, fromY: number, toX: number, toY: number): boolean => {
  // 炮只能直线移动
  if (fromX !== toX && fromY !== toY) return false
  
  const dx = toX - fromX
  const dy = toY - fromY
  const stepX = dx === 0 ? 0 : dx / Math.abs(dx)
  const stepY = dy === 0 ? 0 : dy / Math.abs(dy)
  
  let x = fromX + stepX
  let y = fromY + stepY
  let pieceCount = 0
  
  // 计算路径上的棋子数量（炮架）
  while (x !== toX || y !== toY) {
    if (x >= 0 && x < 9 && y >= 0 && y < 10) {
      const row = board[y]
      if (row && row[x]) {
        pieceCount++
      }
    }
    x += stepX
    y += stepY
  }
  
  // 检查目标位置
  const targetRow = board[toY]
  const targetPiece = targetRow ? targetRow[toX] : null
  
  if (targetPiece) {
    // 吃子时，中间必须有且仅有一个棋子（炮架）
    return pieceCount === 1
  } else {
    // 移动时，中间不能有棋子
    return pieceCount === 0
  }
}

// 兵/卒的移动规则：过河前只能前进1格；过河后可横移或前进1格
const isValidPawnMove = (fromX: number, fromY: number, toX: number, toY: number, isRed: boolean): boolean => {
  const dx = toX - fromX
  const dy = toY - fromY
  
  if (isRed) {
    // 红兵只能向前（向黑方，y减小）
    if (dy > 0) return false // 不能后退
    
    if (!hasCrossedRiver(fromY, isRed)) {
      // 未过河只能直走一格
      return dx === 0 && dy === -1
    } else {
      // 过河后可以横走或直走一格
      return (dx === 0 && dy === -1) || (Math.abs(dx) === 1 && dy === 0)
    }
  } else {
    // 黑卒只能向前（向红方，y增大）
    if (dy < 0) return false // 不能后退
    
    if (!hasCrossedRiver(fromY, isRed)) {
      // 未过河只能直走一格
      return dx === 0 && dy === 1
    } else {
      // 过河后可以横走或直走一格
      return (dx === 0 && dy === 1) || (Math.abs(dx) === 1 && dy === 0)
    }
  }
}

// 生成房间ID
const generateRoomId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// 生成玩家ID
const generatePlayerId = (): string => {
  return Math.random().toString(36).substring(2, 15)
}

// 棋子价值表
const PIECE_VALUES: Record<string, number> = {
  'k': 10000, 'K': 10000, // 将/帅
  'r': 500, 'R': 500,     // 车
  'n': 300, 'N': 300,     // 马
  'c': 300, 'C': 300,     // 炮
  'b': 200, 'B': 200,     // 象/相
  'a': 200, 'A': 200,     // 士/仕
  'p': 100, 'P': 100      // 兵/卒
}

// 评估棋盘局面
const evaluateBoard = (board: PieceType[][], player: 'red' | 'black'): number => {
  let score = 0
  
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 9; x++) {
      const piece = board[y]?.[x]
      if (!piece) continue
      
      const pieceValue = PIECE_VALUES[piece] || 0
      const isRed = isRedPiece(piece)
      
      if ((player === 'red' && isRed) || (player === 'black' && !isRed)) {
        score += pieceValue
        
        // 位置奖励
        if (piece.toLowerCase() === 'p') {
          // 兵卒过河奖励
          if ((isRed && y < 5) || (!isRed && y > 4)) {
            score += 50
          }
        }
      } else {
        score -= pieceValue
        
        // 位置惩罚
        if (piece.toLowerCase() === 'p') {
          if ((isRed && y < 5) || (!isRed && y > 4)) {
            score -= 50
          }
        }
      }
    }
  }
  
  return score
}

// 获取所有可能的移动
const getAllPossibleMoves = (
  board: PieceType[][], 
  player: 'red' | 'black',
  isValidMoveFn: (from: [number, number], to: [number, number]) => boolean
): { from: [number, number], to: [number, number], score: number }[] => {
  const moves: { from: [number, number], to: [number, number], score: number }[] = []
  
  for (let fromY = 0; fromY < 10; fromY++) {
    for (let fromX = 0; fromX < 9; fromX++) {
      const piece = board[fromY]?.[fromX]
      if (!piece) continue
      
      const isPieceRed = isRedPiece(piece)
      if ((player === 'red' && !isPieceRed) || (player === 'black' && isPieceRed)) {
        continue
      }
      
      for (let toY = 0; toY < 10; toY++) {
        for (let toX = 0; toX < 9; toX++) {
          if (fromX === toX && fromY === toY) continue
          
          if (isValidMoveFn([fromX, fromY], [toX, toY])) {
            // 模拟移动并评估
            const newBoard = board.map(row => [...row])
            const capturedPiece = newBoard[toY]?.[toX]
            
            const fromRow = newBoard[fromY]
            const toRow = newBoard[toY]
            if (fromRow && toRow) {
              const piece = fromRow[fromX]
              if (piece) {
                toRow[toX] = piece
                fromRow[fromX] = null
                
                const score = evaluateBoard(newBoard, player)
                const captureBonus = capturedPiece ? PIECE_VALUES[capturedPiece] || 0 : 0
                
                moves.push({
                  from: [fromX, fromY],
                  to: [toX, toY],
                  score: score + captureBonus
                })
              }
            }
          }
        }
      }
    }
  }
  
  return moves.sort((a, b) => b.score - a.score)
}

// AI移动算法
const getAIMove = (
  board: PieceType[][], 
  player: 'red' | 'black', 
  difficulty: AIDifficulty,
  isValidMoveFn: (from: [number, number], to: [number, number]) => boolean
): { from: [number, number], to: [number, number] } | null => {
  const allMoves = getAllPossibleMoves(board, player, isValidMoveFn)
  
  if (allMoves.length === 0) return null
  
  switch (difficulty) {
    case 'easy':
      // 简单：从前50%的移动中随机选择
      const easyMoves = allMoves.slice(0, Math.max(1, Math.floor(allMoves.length * 0.5)))
      const easyMove = easyMoves[Math.floor(Math.random() * easyMoves.length)]
      return easyMove ? { from: easyMove.from, to: easyMove.to } : null
      
    case 'medium':
      // 中等：从前25%的移动中随机选择
      const mediumMoves = allMoves.slice(0, Math.max(1, Math.floor(allMoves.length * 0.25)))
      const mediumMove = mediumMoves[Math.floor(Math.random() * mediumMoves.length)]
      return mediumMove ? { from: mediumMove.from, to: mediumMove.to } : null
      
    case 'hard':
      // 困难：选择最佳移动
      const hardMove = allMoves[0]
      return hardMove ? { from: hardMove.from, to: hardMove.to } : null
      
    default:
      const defaultMove = allMoves[0]
      return defaultMove ? { from: defaultMove.from, to: defaultMove.to } : null
  }
}

export const useGameState = create<GameState>()(
  persist(
    (set, get) => ({
      board: initialBoard.map(row => [...row]),
      currentPlayer: 'red',
      gameHistory: [],
      gameStatus: 'playing',
      winner: null,
      movesSinceCaptureOrPawn: 0,
      boardHistory: [boardToString(initialBoard)],

      gameMode: 'local',
      aiDifficulty: 'easy',
      playerSide: 'red',
      isAiThinking: false,

      // 点击选择模式初始状态
      selectedPosition: null,
      clickMode: false,

      roomId: null,
      playerId: null,
      opponentId: null,
      isConnected: false,

      isPieceAt: (x: number, y: number): PieceType => {
        const board = get().board
        if (x < 0 || x >= 9 || y < 0 || y >= 10) return null
        const row = board[y]
        if (!row) return null
        return row[x] || null
      },

      getCurrentPlayerPieces: () => {
        const currentPlayer = get().currentPlayer
        if (currentPlayer === 'red') {
          return ['K', 'A', 'B', 'N', 'R', 'C', 'P']
        } else {
          return ['k', 'a', 'b', 'n', 'r', 'c', 'p']
        }
      },

      isInCheck: (player: 'red' | 'black') => {
        const board = get().board
        let kingPos: [number, number] | null = null
        
        // 找到指定玩家的将/帅位置
        for (let y = 0; y < 10; y++) {
          for (let x = 0; x < 9; x++) {
            const piece = board[y]?.[x]
            if ((player === 'red' && piece === 'K') || (player === 'black' && piece === 'k')) {
              kingPos = [x, y]
              break
            }
          }
          if (kingPos) break
        }
        
        if (!kingPos) return false
        
        // 检查对方棋子是否能攻击到将/帅
        for (let y = 0; y < 10; y++) {
          for (let x = 0; x < 9; x++) {
            const piece = board[y]?.[x]
            if (!piece) continue
            
            const isPieceRed = isRedPiece(piece)
            if ((player === 'red' && isPieceRed) || (player === 'black' && !isPieceRed)) {
              continue // 跳过己方棋子
            }
            
            // 检查这个对方棋子是否能攻击到将/帅
            if (get().isValidMove([x, y], kingPos)) {
              return true
            }
          }
        }
        
        return false
      },

      // 检查是否将死
      isCheckmate: (player: 'red' | 'black') => {
        const state = get()
        
        // 如果没有被将军，就不是将死
        if (!state.isInCheck(player)) return false
        
        // 检查是否有任何合法移动可以解除将军
        const board = state.board
        for (let fromY = 0; fromY < 10; fromY++) {
          for (let fromX = 0; fromX < 9; fromX++) {
            const piece = board[fromY]?.[fromX]
            if (!piece) continue
            
            const isPieceRed = isRedPiece(piece)
            if ((player === 'red' && !isPieceRed) || (player === 'black' && isPieceRed)) {
              continue // 跳过对方棋子
            }
            
            // 尝试所有可能的移动
            for (let toY = 0; toY < 10; toY++) {
              for (let toX = 0; toX < 9; toX++) {
                if (state.isValidMove([fromX, fromY], [toX, toY])) {
                  return false // 找到了合法移动，不是将死
                }
              }
            }
          }
        }
        
        return true // 没有合法移动，是将死
      },

      // 检查是否困毙（无棋可走但未被将军）
      isStalemate: (player: 'red' | 'black') => {
        const state = get()
        
        // 如果被将军，就不是困毙
        if (state.isInCheck(player)) return false
        
        // 检查是否有任何合法移动
        const board = state.board
        for (let fromY = 0; fromY < 10; fromY++) {
          for (let fromX = 0; fromX < 9; fromX++) {
            const piece = board[fromY]?.[fromX]
            if (!piece) continue
            
            const isPieceRed = isRedPiece(piece)
            if ((player === 'red' && !isPieceRed) || (player === 'black' && isPieceRed)) {
              continue // 跳过对方棋子
            }
            
            // 尝试所有可能的移动
            for (let toY = 0; toY < 10; toY++) {
              for (let toX = 0; toX < 9; toX++) {
                if (state.isValidMove([fromX, fromY], [toX, toY])) {
                  return false // 找到了合法移动，不是困毙
                }
              }
            }
          }
        }
        
        return true // 没有合法移动，是困毙
      },

      // 检查游戏是否结束
      checkGameEnd: () => {
        const state = get()
        const currentPlayer = state.currentPlayer
        const opponent = currentPlayer === 'red' ? 'black' : 'red'
        
        // 检查将死
        if (state.isCheckmate(currentPlayer)) {
          set({ gameStatus: 'checkmate', winner: opponent })
          return
        }
        
        // 检查困毙
        if (state.isStalemate(currentPlayer)) {
          set({ gameStatus: 'stalemate', winner: null })
          return
        }
        
        // 检查50回合规则（100步未吃子）
        if (state.movesSinceCaptureOrPawn >= 100) {
          set({ gameStatus: 'draw', winner: null })
          return
        }
        
        // 检查重复局面（三次重复）
        const currentBoardString = boardToString(state.board)
        const occurrences = state.boardHistory.filter(board => board === currentBoardString).length
        if (occurrences >= 3) {
          set({ gameStatus: 'draw', winner: null })
          return
        }
        
        // 检查双方是否只剩将/帅（必和局面）
        const pieces = state.board.flat().filter(piece => piece !== null)
        if (pieces.length === 2 && pieces.includes('K') && pieces.includes('k')) {
          set({ gameStatus: 'draw', winner: null })
          return
        }
      },

      // 认输
      resignGame: (player: 'red' | 'black') => {
        const winner = player === 'red' ? 'black' : 'red'
        set({ gameStatus: 'resigned', winner })
      },

      // 提议和棋
      proposeDraw: () => {
        set({ gameStatus: 'draw', winner: null })
      },

      isValidMove: (from: [number, number], to: [number, number]) => {
        const [fromX, fromY] = from
        const [toX, toY] = to
        const board = get().board
        const currentPlayer = get().currentPlayer

        // 检查边界
        if (fromX < 0 || fromX >= 9 || fromY < 0 || fromY >= 10 ||
            toX < 0 || toX >= 9 || toY < 0 || toY >= 10) {
          return false
        }

        const fromRow = board[fromY]
        const toRow = board[toY]
        if (!fromRow || !toRow) return false

        const piece = fromRow[fromX]
        const targetPiece = toRow[toX]

        // 检查是否有棋子
        if (!piece) return false

        // 检查是否为当前玩家的棋子
        if (currentPlayer === 'red' && !isRedPiece(piece)) return false
        if (currentPlayer === 'black' && !isBlackPiece(piece)) return false

        // 不能吃自己的棋子
        if (targetPiece) {
          if (currentPlayer === 'red' && isRedPiece(targetPiece)) return false
          if (currentPlayer === 'black' && isBlackPiece(targetPiece)) return false
        }

        // 不能原地不动
        if (fromX === toX && fromY === toY) return false

        // 根据棋子类型检查移动规则
        const pieceType = piece.toLowerCase()
        const isRed = isRedPiece(piece)

        let isValidPieceMove = false
        switch (pieceType) {
          case 'r': // 车
            isValidPieceMove = isValidRookMove(board, fromX, fromY, toX, toY)
            break
          case 'n': // 马
            isValidPieceMove = isValidKnightMove(board, fromX, fromY, toX, toY)
            break
          case 'b': // 象/相
            isValidPieceMove = isValidElephantMove(board, fromX, fromY, toX, toY, isRed)
            break
          case 'a': // 士/仕
            isValidPieceMove = isValidAdvisorMove(fromX, fromY, toX, toY, isRed)
            break
          case 'k': // 将/帅
            isValidPieceMove = isValidKingMove(board, fromX, fromY, toX, toY, isRed)
            break
          case 'c': // 炮/砲
            isValidPieceMove = isValidCannonMove(board, fromX, fromY, toX, toY)
            break
          case 'p': // 兵/卒
            isValidPieceMove = isValidPawnMove(fromX, fromY, toX, toY, isRed)
            break
          default:
            return false
        }

        if (!isValidPieceMove) return false

        // 检查移动后是否会让己方将/帅被将军（不能主动送将）
        const newBoard = board.map(row => [...row])
        const newFromRow = newBoard[fromY]
        const newToRow = newBoard[toY]
        
        if (!newFromRow || !newToRow) return false
        
        newToRow[toX] = piece
        newFromRow[fromX] = null

        // 临时更新状态来检查
        const tempState = { ...get(), board: newBoard }
        
        // 模拟检查是否被将军
        let kingPos: [number, number] | null = null
        for (let y = 0; y < 10; y++) {
          for (let x = 0; x < 9; x++) {
            const p = newBoard[y]?.[x]
            if ((currentPlayer === 'red' && p === 'K') || (currentPlayer === 'black' && p === 'k')) {
              kingPos = [x, y]
              break
            }
          }
          if (kingPos) break
        }

        if (kingPos) {
          // 检查对方是否能攻击到己方将/帅
          for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
              const p = newBoard[y]?.[x]
              if (!p) continue
              
              const isPRed = isRedPiece(p)
              if ((currentPlayer === 'red' && isPRed) || (currentPlayer === 'black' && !isPRed)) {
                continue // 跳过己方棋子
              }
              
              // 简单检查对方棋子的攻击能力（避免递归调用isValidMove）
              const pType = p.toLowerCase()
              let canAttack = false
              
              switch (pType) {
                case 'r':
                  canAttack = isValidRookMove(newBoard, x, y, kingPos[0], kingPos[1])
                  break
                case 'n':
                  canAttack = isValidKnightMove(newBoard, x, y, kingPos[0], kingPos[1])
                  break
                case 'b':
                  canAttack = isValidElephantMove(newBoard, x, y, kingPos[0], kingPos[1], isPRed)
                  break
                case 'a':
                  canAttack = isValidAdvisorMove(x, y, kingPos[0], kingPos[1], isPRed)
                  break
                case 'k':
                  canAttack = isValidKingMove(newBoard, x, y, kingPos[0], kingPos[1], isPRed)
                  break
                case 'c':
                  canAttack = isValidCannonMove(newBoard, x, y, kingPos[0], kingPos[1])
                  break
                case 'p':
                  canAttack = isValidPawnMove(x, y, kingPos[0], kingPos[1], isPRed)
                  break
              }
              
              if (canAttack) {
                return false // 移动后会被将军，不允许
              }
            }
          }
        }

        return true
      },

      movePiece: (from: [number, number], to: [number, number]) => {
        const [fromX, fromY] = from
        const [toX, toY] = to
        
        if (!get().isValidMove(from, to)) {
          return false
        }

        set((state) => {
          const newBoard = state.board.map(row => [...row])
          const fromRow = newBoard[fromY]
          const toRow = newBoard[toY]
          
          if (!fromRow || !toRow) return state

          const piece = fromRow[fromX]
          const capturedPiece = toRow[toX]

          if (!piece) return state

          // 移动棋子
          toRow[toX] = piece
          fromRow[fromX] = null

          // 计算自上次吃子或兵卒移动以来的步数
          let newMovesSinceCaptureOrPawn = state.movesSinceCaptureOrPawn + 1
          if (capturedPiece || piece.toLowerCase() === 'p') {
            newMovesSinceCaptureOrPawn = 0 // 重置计数
          }

          // 记录历史
          const newHistory = [...state.gameHistory, { from, to, piece, capturedPiece: capturedPiece || null }]
          
          // 记录棋盘状态用于检测重复局面
          const newBoardString = boardToString(newBoard)
          const newBoardHistory = [...state.boardHistory, newBoardString]

          const newState = {
            ...state,
            board: newBoard,
            currentPlayer: state.currentPlayer === 'red' ? 'black' as const : 'red' as const,
            gameHistory: newHistory,
            movesSinceCaptureOrPawn: newMovesSinceCaptureOrPawn,
            boardHistory: newBoardHistory
          }

          return newState
        })

        // 检查游戏是否结束
        get().checkGameEnd()

        return true
      },

      resetGame: () => set({
        board: initialBoard.map(row => [...row]),
        currentPlayer: 'red',
        gameHistory: [],
        gameStatus: 'playing',
        winner: null,
        movesSinceCaptureOrPawn: 0,
        boardHistory: [boardToString(initialBoard)]
      }),

      setGameMode: (mode: GameMode) => set({ gameMode: mode }),
      setAIDifficulty: (difficulty: AIDifficulty) => set({ aiDifficulty: difficulty }),
      setPlayerSide: (side: 'red' | 'black') => set({ playerSide: side }),
      makeAIMove: () => {
        const state = get()
        if (state.gameMode !== 'ai' || state.isAiThinking || state.gameStatus !== 'playing') return
        
        set({ isAiThinking: true })
        
        // 延迟执行AI移动，模拟思考时间
        setTimeout(() => {
          const currentState = get()
          const aiPlayer = currentState.playerSide === 'red' ? 'black' : 'red'
          
          if (currentState.currentPlayer === aiPlayer) {
            // AI算法需要访问isValidMove，但这会导致循环引用
            // 所以我们创建一个简化的验证函数
            const simpleIsValidMove = (from: [number, number], to: [number, number]): boolean => {
              return currentState.isValidMove(from, to)
            }
            
            const aiMove = getAIMove(currentState.board, aiPlayer, currentState.aiDifficulty, simpleIsValidMove)
            
            if (aiMove) {
              currentState.movePiece(aiMove.from, aiMove.to)
            }
          }
          
          set({ isAiThinking: false })
        }, 500 + Math.random() * 1000) // 0.5-1.5秒思考时间
      },
      
      createRoom: async (): Promise<string> => {
        const roomId = generateRoomId()
        const playerId = generatePlayerId()
        
        // 这里应该连接到实际的服务器
        // 为了演示，我们使用localStorage模拟
        const roomData = {
          id: roomId,
          players: [playerId],
          board: initialBoard,
          currentPlayer: 'red',
          gameHistory: [],
          gameStatus: 'playing'
        }
        
        localStorage.setItem(`room_${roomId}`, JSON.stringify(roomData))
        
        set({
          gameMode: 'online',
          roomId,
          playerId,
          isConnected: true,
          playerSide: 'red' // 房主默认红方
        })
        
        return roomId
      },
      
      joinRoom: async (roomId: string): Promise<boolean> => {
        try {
          // 这里应该连接到实际的服务器
          // 为了演示，我们使用localStorage模拟
          const roomDataStr = localStorage.getItem(`room_${roomId}`)
          if (!roomDataStr) return false
          
          const roomData = JSON.parse(roomDataStr)
          if (roomData.players.length >= 2) return false // 房间已满
          
          const playerId = generatePlayerId()
          roomData.players.push(playerId)
          localStorage.setItem(`room_${roomId}`, JSON.stringify(roomData))
          
          set({
            gameMode: 'online',
            roomId,
            playerId,
            opponentId: roomData.players[0],
            isConnected: true,
            playerSide: 'black', // 加入者默认黑方
            board: roomData.board,
            currentPlayer: roomData.currentPlayer,
            gameHistory: roomData.gameHistory,
            gameStatus: roomData.gameStatus
          })
          
          return true
        } catch (error) {
          console.error('Failed to join room:', error)
          return false
        }
      },
      
      leaveRoom: () => {
        const state = get()
        if (state.roomId && state.playerId) {
          // 这里应该通知服务器离开房间
          // 为了演示，我们清理localStorage
          try {
            const roomDataStr = localStorage.getItem(`room_${state.roomId}`)
            if (roomDataStr) {
              const roomData = JSON.parse(roomDataStr)
              roomData.players = roomData.players.filter((id: string) => id !== state.playerId)
              if (roomData.players.length === 0) {
                localStorage.removeItem(`room_${state.roomId}`)
              } else {
                localStorage.setItem(`room_${state.roomId}`, JSON.stringify(roomData))
              }
            }
          } catch (error) {
            console.error('Failed to leave room:', error)
          }
        }
        
        set({
          gameMode: 'local',
          roomId: null,
          playerId: null,
          opponentId: null,
          isConnected: false
        })
      },

      // 点击选择模式方法
      selectPosition: (x: number, y: number) => {
        const state = get()
        const piece = state.isPieceAt(x, y)
        const selectedPos = state.selectedPosition
        
        // 如果没有选中任何棋子，尝试选择当前位置的棋子
        if (!selectedPos) {
          if (piece && (
            (state.currentPlayer === 'red' && isRedPiece(piece)) ||
            (state.currentPlayer === 'black' && isBlackPiece(piece))
          )) {
            // 选择当前玩家的棋子
            set({ selectedPosition: [x, y] })
          }
          return
        }
        
        const [selectedX, selectedY] = selectedPos
        const selectedPiece = state.isPieceAt(selectedX, selectedY)
        
        // 如果点击的是已选中的棋子，取消选择
        if (selectedX === x && selectedY === y) {
          set({ selectedPosition: null })
          return
        }
        
        // 如果点击的是己方另一个棋子，切换选择
        if (piece && selectedPiece && (
          (state.currentPlayer === 'red' && isRedPiece(piece)) ||
          (state.currentPlayer === 'black' && isBlackPiece(piece))
        )) {
          set({ selectedPosition: [x, y] })
          return
        }
        
        // 尝试移动到目标位置
        if (selectedPiece) {
          const moveSuccess = state.movePiece([selectedX, selectedY], [x, y])
          if (moveSuccess) {
            // 移动成功，清除选择
            set({ selectedPosition: null })
          }
          // 如果移动失败，保持当前选择状态，让用户知道移动无效
        }
      },
      clearSelection: () => set({ selectedPosition: null }),
      toggleClickMode: () => set((state) => ({ 
        clickMode: !state.clickMode,
        selectedPosition: null // 切换模式时清除选择
      }))
    }),
    {
      name: 'chinese-chess-game',
      partialize: (state) => ({
        board: state.board,
        currentPlayer: state.currentPlayer,
        gameHistory: state.gameHistory,
        gameStatus: state.gameStatus,
        winner: state.winner,
        movesSinceCaptureOrPawn: state.movesSinceCaptureOrPawn,
        boardHistory: state.boardHistory
      })
    }
  )
) 