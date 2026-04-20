import { User, Difficulty } from './types'

// ==================== 城市区域定义 ====================
export interface CityRegion {
  id: string
  name: string
  emoji: string
  color: string
  description: string
  position: { x: number; y: number }  // 在地图上的位置
  size: { width: number; height: number }
  requiredStars: number  // 解锁所需星星
  unlocked: boolean
  difficultyCategories: string[]  // 关联的技巧分类
  completed: boolean
  completionRate: number  // 完成度 0-100
  lastVisited?: number  // 上次访问时间戳
}

export interface CityMap {
  regions: CityRegion[]
  currentRegionId: string | null
  totalRegions: number
  unlockedRegions: number
  completionPercentage: number
}

export interface AnnaGuide {
  name: string
  currentTip: string
  lastTipTime: number
  tipCooldown: number  // 提示冷却时间（毫秒）
  welcomeMessages: string[]
  progressMessages: string[]
  encouragementMessages: string[]
}

// ==================== 城市配置 ====================
const CITY_REGIONS: CityRegion[] = [
  {
    id: 'number-square',
    name: '数字广场',
    emoji: '🔢',
    color: '#4CAF50',  // 绿色
    description: '基础加减法练习区，从这里开始你的数学冒险！',
    position: { x: 100, y: 100 },
    size: { width: 120, height: 120 },
    requiredStars: 0,
    unlocked: true,
    difficultyCategories: ['两位数加减'],
    completed: false,
    completionRate: 0,
  },
  {
    id: 'multiply-park',
    name: '乘法公园',
    emoji: '✖️',
    color: '#2196F3',  // 蓝色
    description: '乘除法基础训练，掌握口诀快速计算！',
    position: { x: 300, y: 100 },
    size: { width: 120, height: 120 },
    requiredStars: 5,
    unlocked: false,
    difficultyCategories: ['表内乘除'],
    completed: false,
    completionRate: 0,
  },
  {
    id: 'technique-camp',
    name: '技巧训练营',
    emoji: '💡',
    color: '#9C27B0',  // 紫色
    description: '口算技巧专项训练，学会快速计算方法！',
    position: { x: 100, y: 300 },
    size: { width: 120, height: 120 },
    requiredStars: 10,
    unlocked: false,
    difficultyCategories: ['口算技巧'],
    completed: false,
    completionRate: 0,
  },
  {
    id: 'logic-puzzle-street',
    name: '逻辑谜题街',
    emoji: '🧩',
    color: '#FF9800',  // 橙色
    description: '综合应用题挑战，提升数学思维能力！',
    position: { x: 300, y: 300 },
    size: { width: 120, height: 120 },
    requiredStars: 15,
    unlocked: false,
    difficultyCategories: ['三位数加减', '三位数乘除（规律）'],
    completed: false,
    completionRate: 0,
  },
  {
    id: 'anna-library',
    name: '安娜图书馆',
    emoji: '📚',
    color: '#795548',  // 棕色
    description: '成就回顾与知识总结，查看你的学习成果！',
    position: { x: 200, y: 500 },
    size: { width: 120, height: 120 },
    requiredStars: 20,
    unlocked: false,
    difficultyCategories: [],  // 综合区域
    completed: false,
    completionRate: 0,
  },
]

// ==================== 安娜向导配置 ====================
const ANNA_GUIDE_CONFIG: AnnaGuide = {
  name: '安娜',
  currentTip: '',
  lastTipTime: 0,
  tipCooldown: 30000,  // 30秒冷却
  welcomeMessages: [
    '欢迎来到数学城市！我是你的向导安娜。',
    '准备好开始数学冒险了吗？',
    '每个区域都有不同的数学挑战等着你！',
  ],
  progressMessages: [
    '做得很棒！继续努力！',
    '你的计算速度越来越快了！',
    '又掌握了一个新技巧，真厉害！',
    '离解锁下一个区域更近了一步！',
  ],
  encouragementMessages: [
    '别放弃，再试一次！',
    '每个人都会犯错，重要的是从中学习。',
    '慢慢来，准确比速度更重要。',
    '你已经进步了很多！',
  ],
}

// ==================== 城市管理类 ====================
export class CityManager {
  private map: CityMap
  private anna: AnnaGuide
  private user: User | null = null

  constructor() {
    this.map = this.initializeMap()
    this.anna = { ...ANNA_GUIDE_CONFIG }
  }

  private initializeMap(): CityMap {
    const regions = CITY_REGIONS.map(region => ({ ...region }))
    // 第一个区域默认解锁
    if (regions.length > 0) {
      regions[0].unlocked = true
    }
    
    return {
      regions,
      currentRegionId: regions[0]?.id || null,
      totalRegions: regions.length,
      unlockedRegions: 1,
      completionPercentage: 0,
    }
  }

  // 设置当前用户
  setUser(user: User): void {
    this.user = user
    this.updateRegionUnlocks()
    this.updateCompletionStats()
  }

  // 更新区域解锁状态
  private updateRegionUnlocks(): void {
    if (!this.user) return

    let unlockedCount = 0
    for (const region of this.map.regions) {
      // 第一个区域总是解锁的
      if (region.id === 'number-square') {
        region.unlocked = true
        unlockedCount++
        continue
      }

      // 检查是否满足解锁条件
      const shouldUnlock = this.user.stars >= region.requiredStars
      if (shouldUnlock && !region.unlocked) {
        region.unlocked = true
        this.generateAnnaTip(`恭喜！你解锁了新的区域：${region.name} ${region.emoji}`)
      }
      
      if (region.unlocked) {
        unlockedCount++
      }
    }

    this.map.unlockedRegions = unlockedCount
  }

  // 更新完成度统计
  private updateCompletionStats(): void {
    if (!this.user) return

    let totalCompletion = 0
    for (const region of this.map.regions) {
      if (region.unlocked) {
        // 简单计算完成度：基于用户星星和区域要求
        const regionProgress = Math.min(100, (this.user.stars / (region.requiredStars + 10)) * 100)
        region.completionRate = regionProgress
        totalCompletion += regionProgress
        
        // 如果完成度达到80%，标记为完成
        region.completed = regionProgress >= 80
      }
    }

    this.map.completionPercentage = Math.round(totalCompletion / this.map.regions.length)
  }

  // 获取当前区域
  getCurrentRegion(): CityRegion | null {
    if (!this.map.currentRegionId) return null
    return this.map.regions.find(r => r.id === this.map.currentRegionId) || null
  }

  // 切换到指定区域
  switchRegion(regionId: string): boolean {
    const region = this.map.regions.find(r => r.id === regionId)
    if (!region || !region.unlocked) {
      return false
    }

    this.map.currentRegionId = regionId
    region.lastVisited = Date.now()
    
    // 生成欢迎提示
    this.generateAnnaTip(`欢迎来到${region.name} ${region.emoji}！${region.description}`)
    
    return true
  }

  // 获取区域对应的难度分类
  getRegionDifficulties(regionId: string): Difficulty[] {
    const region = this.map.regions.find(r => r.id === regionId)
    if (!region) return []

    // 根据区域关联的技巧分类返回对应的难度
    const difficultyMap: Record<string, Difficulty[]> = {
      '两位数加减': ['ADD2to2', 'SUB2to2'],
      '表内乘除': ['MULTIPLY_1to9', 'DIVIDE_TABLE'],
      '口算技巧': [
        'COMPENSATE_ADD', 'COMPENSATE_SUBTRACT', 'MULTIPLY_DISTRIBUTIVE',
        'MULTIPLY_5', 'MULTIPLY_9', 'MULTIPLY_11', 'DIVIDE_5',
        'SQUARE_END5', 'NEAR_100_MULTIPLY', 'PERCENTAGE_QUICK',
        'FRACTION_CONVERT', 'SQUARE_DIFFERENCE', 'MULTIPLE_FEATURES',
        'SAME_TENS_DIFF_ONES', 'SPECIAL_SQUARE'
      ],
      '三位数加减': ['ADD2to3', 'SUB2to3', 'ADD3to3', 'SUB3to3'],
      '三位数乘除（规律）': ['MULTIPLY_3_PATTERN', 'DIVIDE_3_PATTERN'],
    }

    const difficulties: Difficulty[] = []
    for (const category of region.difficultyCategories) {
      if (difficultyMap[category]) {
        difficulties.push(...difficultyMap[category])
      }
    }

    return difficulties
  }

  // 生成安娜提示
  generateAnnaTip(message?: string): string {
    const now = Date.now()
    
    // 冷却检查
    if (now - this.anna.lastTipTime < this.anna.tipCooldown && !message) {
      return this.anna.currentTip
    }

    if (message) {
      this.anna.currentTip = message
    } else {
      // 随机选择一条提示
      const allMessages = [
        ...this.anna.welcomeMessages,
        ...this.anna.progressMessages,
        ...this.anna.encouragementMessages,
      ]
      const randomIndex = Math.floor(Math.random() * allMessages.length)
      this.anna.currentTip = allMessages[randomIndex]
    }

    this.anna.lastTipTime = now
    return this.anna.currentTip
  }

  // 记录练习完成
  recordPracticeComplete(difficulty: Difficulty, isCorrect: boolean, timeSpent: number): void {
    if (!this.user) return

    const currentRegion = this.getCurrentRegion()
    if (!currentRegion) return

    // 更新区域完成度
    const regionDifficulties = this.getRegionDifficulties(currentRegion.id)
    if (regionDifficulties.includes(difficulty)) {
      // 简单增加完成度
      currentRegion.completionRate = Math.min(100, currentRegion.completionRate + 2)
      if (currentRegion.completionRate >= 80) {
        currentRegion.completed = true
      }
    }

    // 生成进度提示
    if (isCorrect && Math.random() > 0.7) {
      this.generateAnnaTip()
    }

    this.updateCompletionStats()
  }

  // 获取地图数据
  getMap(): CityMap {
    return { ...this.map }
  }

  // 获取安娜向导状态
  getAnnaGuide(): AnnaGuide {
    return { ...this.anna }
  }

  // 获取下一个可解锁区域
  getNextUnlockableRegion(): CityRegion | null {
    if (!this.user) return null

    for (const region of this.map.regions) {
      if (!region.unlocked && this.user.stars >= region.requiredStars - 3) {
        return region
      }
    }

    return null
  }

  // 获取区域进度报告
  getRegionReport(regionId: string): {
    region: CityRegion
    recommendedDifficulties: Difficulty[]
    nextMilestone: string
  } | null {
    const region = this.map.regions.find(r => r.id === regionId)
    if (!region) return null

    const difficulties = this.getRegionDifficulties(regionId)
    let nextMilestone = ''

    if (region.completionRate < 30) {
      nextMilestone = '完成基础练习（30%）'
    } else if (region.completionRate < 60) {
      nextMilestone = '掌握核心技巧（60%）'
    } else if (region.completionRate < 80) {
      nextMilestone = '达到熟练程度（80%）'
    } else {
      nextMilestone = '区域已精通！'
    }

    return {
      region: { ...region },
      recommendedDifficulties: difficulties.slice(0, 3), // 推荐前3个难度
      nextMilestone,
    }
  }
}

// 单例实例
export const cityManager = new CityManager()