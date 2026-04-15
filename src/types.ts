export interface User {
  id: string
  name: string
  stars: number
  moons: number
  suns: number
  diamonds: number
  difficulty: Difficulty
  totalCorrect: number
  totalWrong: number
  createdAt: number
  levelProgress: Record<string, number>
  unlockedCharacters: string[]
  activeCharacter: string
  totalGamesPlayed: number
  bestCombo: number
  streakDays: number
  lastPlayedDate: string
}

export type Difficulty =
  // 表内乘除（1~9）
  | 'MULTIPLY_1to9'
  | 'DIVIDE_TABLE'
  // 两位数加减（入门）
  | 'ADD2to2'
  | 'SUB2to2'
  // 口算技巧
  | 'SQUARE_END5'
  | 'MULTIPLY_5'
  | 'MULTIPLY_9'
  | 'MULTIPLY_11'
  | 'DIVIDE_5'
  | 'COMPENSATE_ADD'
  | 'SAME_TENS_DIFF_ONES'
  | 'SPECIAL_SQUARE'
  // 三位数加减
  | 'ADD2to3'
  | 'SUB2to3'
  | 'ADD3to3'
  | 'SUB3to3'
  // 三位数乘除（有规律的）
  | 'MULTIPLY_3_PATTERN'
  | 'DIVIDE_3_PATTERN'
  // 旧的更高位难度（暂保留给后续扩展）
  | 'ADD3to4'
  | 'SUB3to4'
  | 'ADD4to4'
  | 'SUB4to4'

// 难度顺序（用于：
// 1) 关卡推进时的“升阶推荐”
// 2) 自由练习的默认排序
// 目标顺序：两位数加减 → 表内乘除 → 口算技巧 → 三位数加减 → 三位数乘除（规律）
export const DIFFICULTY_ORDER: Difficulty[] = [
  'ADD2to2',
  'SUB2to2',

  'MULTIPLY_1to9',
  'DIVIDE_TABLE',

  'COMPENSATE_ADD',
  'MULTIPLY_5',
  'MULTIPLY_9',
  'MULTIPLY_11',
  'DIVIDE_5',
  'SQUARE_END5',
  'SAME_TENS_DIFF_ONES',
  'SPECIAL_SQUARE',

  'ADD2to3',
  'SUB2to3',
  'ADD3to3',
  'SUB3to3',

  'MULTIPLY_3_PATTERN',
  'DIVIDE_3_PATTERN',

  // legacy high-digit difficulties
  'ADD3to4',
  'SUB3to4',
  'ADD4to4',
  'SUB4to4',
]

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  MULTIPLY_1to9: '乘法口诀',
  DIVIDE_TABLE: '表内除法',

  ADD2to2: '两位数加法',
  SUB2to2: '两位数减法',

  ADD2to3: '三位数加两位数',
  SUB2to3: '三位数减两位数',
  ADD3to3: '三位数加法',
  SUB3to3: '三位数减法',

  MULTIPLY_3_PATTERN: '三位数乘法（规律）',
  DIVIDE_3_PATTERN: '三位数除法（规律）',

  SQUARE_END5: '平方数速算',
  ADD3to4: '四位数加三位数',
  SUB3to4: '四位数减三位数',
  ADD4to4: '四位数加法',
  SUB4to4: '四位数减法',
  MULTIPLY_5: '乘5速算',
  MULTIPLY_9: '乘9速算',
  MULTIPLY_11: '乘11速算',
  DIVIDE_5: '除5速算',
  COMPENSATE_ADD: '凑整加法',
  SAME_TENS_DIFF_ONES: '头同尾补',
  SPECIAL_SQUARE: '11~19平方',
}

export const DIFFICULTY_CATEGORIES: Record<string, Difficulty[]> = {
  '两位数加减': ['ADD2to2', 'SUB2to2'],
  '表内乘除': ['MULTIPLY_1to9', 'DIVIDE_TABLE'],
  '口算技巧': [
    'COMPENSATE_ADD',
    'MULTIPLY_5',
    'MULTIPLY_9',
    'MULTIPLY_11',
    'DIVIDE_5',
    'SQUARE_END5',
    'SAME_TENS_DIFF_ONES',
    'SPECIAL_SQUARE',
  ],
  '三位数加减': ['ADD2to3', 'SUB2to3', 'ADD3to3', 'SUB3to3'],
  '三位数乘除（规律）': ['MULTIPLY_3_PATTERN', 'DIVIDE_3_PATTERN'],
  '更高位（暂存）': ['ADD3to4', 'SUB3to4', 'ADD4to4', 'SUB4to4'],
}

export interface Question {
  id: string
  difficulty: Difficulty
  num1: number
  num2: number
  operator: '+' | '-' | '×' | '÷'
  answer: number
}

export interface Technique {
  id: string
  name: string
  tip: string
  explanation: string
  examples: { q: string; a: string; steps: string[] }[]
  difficulty: Difficulty
  order: number
}

export interface TechniqueProgress {
  techniqueId: string
  correctCount: number
  totalCount: number
  avgTimeMs: number
  mastered: boolean
  streak: number
  firstMasteredAt?: number
}

export interface GameSession {
  questions: Question[]
  currentIndex: number
  wrongQueue: Question[]
  score: number
  correctCount: number
  wrongCount: number
  startTime: number
  questionStartTime: number
  timeLimit: number
  isPaused: boolean
  isFinished: boolean
  pausedAt?: number
  totalPausedTime: number
  currentCombo: number
  maxComboThisGame: number
  streakPoints: number
  earnedStars: number
  earnedDiamonds: number
  starMultiplier: number
  levelId: string
  levelDifficulty: Difficulty
  questionCount: number
}

export type Screen = 'user-select' | 'main-menu' | 'world-map' | 'level-select' | 'character-screen' | 'setup' | 'game' | 'summary'

export interface ElectronAPI {
  saveUsers: (users: User[]) => Promise<{ success: boolean; error?: string }>
  loadUsers: () => Promise<{ success: boolean; data?: User[]; error?: string }>
  getResourcePath: (filename: string) => Promise<string>
  getAudioBase64: (filename: string) => Promise<{ success: boolean; data?: string; error?: string }>
  getImagePath: (filename: string) => Promise<string>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

// ============ 关卡系统类型 ============

export interface GameLevel {
  id: string               // 'world1-level1'
  worldId: string
  order: number            // 在世界内的序号 1~5
  name: string             // '水果乐园'
  description: string       // '10以内加法'
  difficulty: Difficulty   // 对应难度
  questionCount: number
  timeLimit: number        // 每题秒数
  starThresholds: [number, number]  // [3星正确率%, 2星正确率%]
  reward: { stars: number; diamonds: number }  // 通关基础奖励
  unlockCost: number        // 解锁所需星星（0=初始开放）
  requiredLevel?: string    // 前置关卡ID
}

export interface GameWorld {
  id: string
  name: string
  emoji: string
  color: string            // CSS颜色变量
  colorLight: string       // 浅色
  description: string
  levels: GameLevel[]
  unlockCost: number       // 解锁世界所需总星星
  isUnlocked: (user: User, worldIndex: number) => boolean
}

export interface Character {
  id: string
  name: string
  emoji: string
  description: string
  cost: number             // 钻石价格，0=免费
  bonus: 'extra_time' | 'combo_boost' | 'reward_boost'
  bonusValue: number       // 效果值
}

export interface DailyQuest {
  id: string
  type: 'complete_levels' | 'earn_stars' | 'reach_combo'
  target: number
  progress: number
  reward: { stars: number; diamonds: number }
  description: string
  completed: boolean
  claimed: boolean
}
