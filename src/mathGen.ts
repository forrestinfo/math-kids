import { Question, Difficulty } from './types'

let questionIdCounter = 0

function generateId(): string {
  return `q_${++questionIdCounter}_${Date.now()}`
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export function generateQuestion(difficulty: Difficulty): Question {
  let num1 = 0
  let num2 = 0
  let operator: '+' | '-' | '×' | '÷' = '+'

  switch (difficulty) {
    case 'MULTIPLY_1to9':
      num1 = randInt(1, 9)
      num2 = randInt(1, 9)
      operator = '×'
      break

    case 'DIVIDE_TABLE': {
      // 表内除法：让结果为 1~9，除数为 1~9，确保整除
      operator = '÷'
      const divisor = randInt(1, 9)
      const quotient = randInt(1, 9)
      num1 = divisor * quotient
      num2 = divisor
      break
    }

    case 'ADD2to2': {
      operator = '+'
      // 两位数加法：10~99
      num1 = randInt(10, 99)
      num2 = randInt(10, 99)
      break
    }

    case 'SUB2to2': {
      operator = '-'
      // 两位数减法：保证为正
      num1 = randInt(30, 99)
      num2 = randInt(10, num1 - 1)
      break
    }

    case 'ADD2to3': {
      operator = '+'
      num1 = randInt(100, 999)
      num2 = randInt(10, 99)
      break
    }

    case 'SUB2to3': {
      operator = '-'
      num1 = randInt(200, 999)
      num2 = randInt(10, 99)
      while (num2 >= num1) {
        num2 = randInt(10, Math.min(99, num1 - 10))
      }
      break
    }

    case 'ADD3to3': {
      operator = '+'
      num1 = randInt(100, 999)
      num2 = randInt(100, 999)
      break
    }

    case 'SUB3to3': {
      operator = '-'
      num1 = randInt(300, 999)
      num2 = randInt(100, num1 - 1)
      while (num2 >= num1) {
        num2 = randInt(100, num1 - 10)
      }
      break
    }

    case 'MULTIPLY_3_PATTERN': {
      operator = '×'
      // 三位数乘法（规律）：优先给“整十/整百”等可口算的模式
      // 1) 三位数 × 10/20/.../90
      // 2) 三位数 × 100/200/.../900
      // 3) (100~999) × 11（类 11 技巧的扩展）
      const pattern = randInt(1, 3)
      if (pattern === 1) {
        num1 = randInt(10, 99) * 10 // 100~990
        num2 = randInt(1, 9) * 10  // 10~90
      } else if (pattern === 2) {
        num1 = randInt(10, 99) * 10 // 100~990
        num2 = randInt(1, 9) * 100  // 100~900
      } else {
        num1 = randInt(100, 999)
        num2 = 11
      }
      break
    }

    case 'DIVIDE_3_PATTERN': {
      operator = '÷'
      // 三位数除法（规律）：确保整除，且多为整十/整百结果
      // 1) (100~900) ÷ 10/20/.../90
      // 2) (100~900) ÷ 2/3/4/5/6/8/9（整除）
      const pattern = randInt(1, 2)
      if (pattern === 1) {
        const divisor = randInt(1, 9) * 10 // 10~90
        const quotient = randInt(10, 99)  // 10~99
        num1 = divisor * quotient
        // 控制在三位数范围
        num1 = clamp(num1, 100, 999)
        num2 = divisor
        // 再次确保整除（若 clamp 破坏整除就回退）
        num1 = divisor * Math.floor(num1 / divisor)
        if (num1 < 100) num1 = divisor * 10
      } else {
        const divisorOptions = [2, 3, 4, 5, 6, 8, 9]
        const divisor = divisorOptions[randInt(0, divisorOptions.length - 1)]
        const quotient = randInt(20, 99)
        num1 = divisor * quotient
        if (num1 > 999) num1 = divisor * randInt(20, 99)
        num2 = divisor
      }
      break
    }

    case 'ADD3to4': {
      operator = '+'
      num1 = randInt(1000, 9999)
      num2 = randInt(100, 999)
      break
    }

    case 'SUB3to4': {
      operator = '-'
      num1 = randInt(2000, 9999)
      num2 = randInt(100, 999)
      while (num2 >= num1) {
        num2 = randInt(100, Math.min(999, num1 - 10))
      }
      break
    }

    case 'ADD4to4': {
      operator = '+'
      num1 = randInt(1000, 9999)
      num2 = randInt(1000, 9999)
      break
    }

    case 'SUB4to4': {
      operator = '-'
      num1 = randInt(3000, 9999)
      num2 = randInt(1000, num1 - 1)
      while (num2 >= num1) {
        num2 = randInt(1000, num1 - 10)
      }
      break
    }

    // 平方数速算：尾数是5的两位数平方
    // 原理：(10n+5)² = n×(n+1)×100 + 25
    case 'SQUARE_END5': {
      const n = randInt(1, 9)       // 十位：1~9
      num1 = n * 10 + 5            // 生成 15, 25, 35, ..., 95
      num2 = num1                   // 平方 = 自己乘自己
      operator = '×'
      break
    }

    // 乘5速算（偶数）：n×5 = n÷2×10
    case 'MULTIPLY_5': {
      const n = randInt(7, 49) * 2  // 偶数 14~98
      num1 = n
      num2 = 5
      operator = '×'
      break
    }

    // 乘9速算：n×9 = n×10 - n
    case 'MULTIPLY_9': {
      let n = randInt(12, 88)
      const lastDigit = n % 10
      if (lastDigit === 0) n = n > 50 ? n - 1 : n + 1
      n = Math.max(12, Math.min(88, n))
      num1 = n
      num2 = 9
      operator = '×'
      break
    }

    // 除5速算：n÷5 = n×2÷10
    case 'DIVIDE_5': {
      const quotient = randInt(4, 196)
      num1 = quotient * 5
      num2 = 5
      operator = '÷'
      break
    }

    // 乘11速算：两头一拉，中间相加
    case 'MULTIPLY_11': {
      num1 = randInt(10, 99)
      num2 = 11
      operator = '×'
      break
    }

    // 凑整加法：把接近整十的数凑成整十，加完再减补数
    case 'COMPENSATE_ADD': {
      operator = '+'
      // 生成接近整十的数
      const baseTens = randInt(1, 9) * 10
      const lastDigits = [1, 2, 3, 4, 6, 7, 8, 9]
      const last = lastDigits[randInt(0, 7)]
      const nearNum = baseTens + last
      const normalTens = randInt(1, 9) * 10
      const normalLast = randInt(1, 9)
      const normalNum = normalTens + normalLast
      if (Math.random() > 0.5) {
        num1 = nearNum
        num2 = normalNum
      } else {
        num1 = normalNum
        num2 = nearNum
      }
      break
    }

    // 凑整减法：把接近整十的减数凑成整十，减完再加补数
    case 'COMPENSATE_SUBTRACT': {
      operator = '-'
      // 生成接近整十的减数
      const baseTens = randInt(1, 9) * 10
      const lastDigits = [1, 2, 3, 4, 6, 7, 8, 9]
      const last = lastDigits[randInt(0, 7)]
      const nearNum = baseTens + last  // 接近整十的减数
      // 被减数要大于减数，且留有余地
      const minMinuend = nearNum + 15  // 至少比减数大15
      const maxMinuend = minMinuend + 40 // 范围适当
      num1 = randInt(minMinuend, maxMinuend)
      num2 = nearNum
      break
    }

    // 乘法分配律：分解因数，凑成整百整千
    case 'MULTIPLY_DISTRIBUTIVE': {
      operator = '×'
      // 常见配对：4×25=100, 8×125=1000, 5×20=100, 2×50=100
      const pairs = [
        { factor: 4, multiplier: 25, result: 100 },
        { factor: 8, multiplier: 125, result: 1000 },
        { factor: 5, multiplier: 20, result: 100 },
        { factor: 2, multiplier: 50, result: 100 },
      ]
      const pair = pairs[randInt(0, pairs.length - 1)]
      // 生成能被factor整除的数
      const base = randInt(3, 12) * pair.factor  // 12~48, 16~96等
      num1 = base
      num2 = pair.multiplier
      break
    }

    // 接近100的乘法：(100-a)×(100+b)
    case 'NEAR_100_MULTIPLY': {
      operator = '×'
      // 生成接近100的数：一个小于100，一个大于100
      const a = randInt(1, 9)  // 2~9的差值
      const b = randInt(1, 9)  // 1~9的差值
      
      // 随机决定哪个数小于100，哪个大于100
      if (Math.random() > 0.5) {
        num1 = 100 - a
        num2 = 100 + b
      } else {
        num1 = 100 + b
        num2 = 100 - a
      }
      break
    }

    // 百分比快速计算
    case 'PERCENTAGE_QUICK': {
      operator = '×'
      // 常见百分比分解：15%=10%+5%，18%=10%+8%，25%=10%+15%等
      const percentages = [15, 18, 25, 35, 45]
      const percentage = percentages[randInt(0, percentages.length - 1)]
      // 生成一个适合计算的数
      const base = randInt(20, 80) * 10  // 200, 300, ..., 800
      num1 = base
      num2 = percentage  // 这里代表百分比，题目会特殊处理
      break
    }

    // 分数快速转换
    case 'FRACTION_CONVERT': {
      operator = '×'
      // 常见分数转换
      const fractions = [
        { num: 1, den: 8, decimal: 0.125 },
        { num: 3, den: 8, decimal: 0.375 },
        { num: 5, den: 8, decimal: 0.625 },
        { num: 7, den: 8, decimal: 0.875 },
        { num: 1, den: 4, decimal: 0.25 },
        { num: 3, den: 4, decimal: 0.75 },
        { num: 1, den: 5, decimal: 0.2 },
        { num: 2, den: 5, decimal: 0.4 },
      ]
      const fraction = fractions[randInt(0, fractions.length - 1)]
      // 生成一个数乘以这个分数
      const base = randInt(10, 50) * fraction.den  // 确保能整除
      num1 = base
      num2 = fraction.den  // 分母
      break
    }

    // 平方差公式应用
    case 'SQUARE_DIFFERENCE': {
      operator = '×'
      // 生成接近的数，差为2（为了用平方差公式）
      const center = randInt(20, 80)  // 中心数
      num1 = center - 1
      num2 = center + 1
      break
    }

    // 倍数特征判断
    case 'MULTIPLE_FEATURES': {
      // 这是一个特殊技巧，实际上是判断题
      operator = '÷'  // 用除法符号表示判断
      const multiples = [2, 3, 4, 5, 9, 10]
      const multiple = multiples[randInt(0, multiples.length - 1)]
      
      // 生成一个数，可能是或不是该倍数
      if (Math.random() > 0.5) {
        // 生成是该倍数的数
        const base = randInt(10, 30)
        num1 = base * multiple
      } else {
        // 生成不是该倍数的数
        const base = randInt(10, 30)
        num1 = base * multiple + 1  // 加1确保不是倍数
        // 如果是2的倍数且个位不是偶数，调整
        if (multiple === 2 && num1 % 2 === 0) {
          num1 += 1
        }
      }
      num2 = multiple
      break
    }

    // 头同尾补：十位相同，个位相加=10
    case 'SAME_TENS_DIFF_ONES': {
      const a = randInt(1, 9)
      const b = randInt(1, 8)
      const c = 10 - b
      num1 = a * 10 + b
      num2 = a * 10 + c
      operator = '×'
      break
    }

    // 11~19的平方
    case 'SPECIAL_SQUARE': {
      const n = randInt(1, 9)
      num1 = 10 + n  // 11~19
      num2 = num1
      operator = '×'
      break
    }

    default: {
      // fallback: avoid crash
      operator = '+'
      num1 = randInt(10, 99)
      num2 = randInt(10, 99)
      break
    }
  }

  const answer = operator === '×'
    ? num1 * num2
    : operator === '+'
      ? num1 + num2
      : operator === '÷'
        ? num1 / num2
        : num1 - num2

  return {
    id: generateId(),
    difficulty,
    num1,
    num2,
    operator,
    answer,
  }
}

export function generateBatch(difficulty: Difficulty, count: number): Question[] {
  const questions: Question[] = []
  for (let i = 0; i < count; i++) {
    questions.push(generateQuestion(difficulty))
  }
  return questions
}

export function getMaxDigits(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'MULTIPLY_1to9': return 1
    case 'ADD2to2':
    case 'SUB2to2': return 2
    case 'ADD2to3':
    case 'SUB2to3':
    case 'ADD3to3':
    case 'SUB3to3': return 3
    case 'ADD3to4':
    case 'SUB3to4':
    case 'ADD4to4':
    case 'SUB4to4': return 4
    case 'SQUARE_END5':
    case 'SPECIAL_SQUARE': return 2  // 两位数平方
    case 'MULTIPLY_5':
    case 'MULTIPLY_9':
    case 'MULTIPLY_11':
    case 'SAME_TENS_DIFF_ONES':
    case 'COMPENSATE_ADD':
    case 'COMPENSATE_SUBTRACT':
    case 'MULTIPLY_DISTRIBUTIVE': return 2  // 两位数运算
    case 'NEAR_100_MULTIPLY': return 3  // 91~109，三位数
    case 'PERCENTAGE_QUICK': return 3  // 200-800，三位数
    case 'FRACTION_CONVERT': return 3  // 基础数通常是三位数
    case 'SQUARE_DIFFERENCE': return 2  // 两位数
    case 'MULTIPLE_FEATURES': return 3  // 通常是三位数
    case 'DIVIDE_5': return 3  // 三位数除法结果
    default: return 4
  }
}

export function getNum1Digits(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'MULTIPLY_1to9': return 1
    case 'ADD2to2':
    case 'SUB2to2': return 2
    case 'ADD2to3':
    case 'SUB2to3': return 3
    case 'ADD3to3':
    case 'SUB3to3': return 3
    case 'SQUARE_END5': return 2
    case 'ADD3to4':
    case 'SUB3to4': return 4
    case 'ADD4to4':
    case 'SUB4to4': return 4
    default: return 4
  }
}

export function getNum2Digits(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'MULTIPLY_1to9': return 1
    case 'ADD2to2':
    case 'SUB2to2': return 2
    case 'ADD2to3':
    case 'SUB2to3': return 2
    case 'ADD3to3':
    case 'SUB3to3': return 3
    case 'SQUARE_END5': return 0  // 平方数只有num1，num2=0
    case 'ADD3to4':
    case 'SUB3to4': return 3
    case 'ADD4to4':
    case 'SUB4to4': return 4
    case 'MULTIPLY_5':
    case 'MULTIPLY_9':
    case 'MULTIPLY_11':
    case 'SAME_TENS_DIFF_ONES': return 2
    case 'DIVIDE_5': return 1
    case 'COMPENSATE_ADD':
    case 'COMPENSATE_SUBTRACT':
    case 'MULTIPLY_DISTRIBUTIVE': return 2
    case 'NEAR_100_MULTIPLY': return 3
    case 'PERCENTAGE_QUICK': return 1  // 百分比数字如15、18等
    case 'FRACTION_CONVERT': return 1  // 分母如8、4、5等
    case 'SQUARE_DIFFERENCE': return 2  // 两位数
    case 'MULTIPLE_FEATURES': return 1  // 倍数如2、3、4、5、9、10
    case 'SPECIAL_SQUARE': return 0  // 平方数
    default: return 4
  }
}

export function speakQuestion(q: Question): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const op = q.operator === '×' ? '乘以' : q.operator === '÷' ? '除以' : q.operator
  const text = `${q.num1} ${op} ${q.num2} 等于多少？`
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'zh-CN'
  utter.rate = 0.85
  utter.pitch = 1.1
  window.speechSynthesis.speak(utter)
}

export function speakText(text: string): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'zh-CN'
  utter.rate = 0.85
  window.speechSynthesis.speak(utter)
}

// 技巧速算口诀（显示在题目下方提示）
export const TECHNIQUE_TIPS: Record<Difficulty, string | null> = {
  MULTIPLY_1to9: null,              // 普通乘法口诀，无需提示
  DIVIDE_TABLE: null,

  ADD2to2: null,
  SUB2to2: null,

  ADD2to3: null,
  SUB2to3: null,
  ADD3to3: null,
  SUB3to3: null,

  MULTIPLY_3_PATTERN: null,
  DIVIDE_3_PATTERN: null,

  SQUARE_END5: '十位×(十位+1)，后面写上25',

  ADD3to4: null,
  SUB3to4: null,
  ADD4to4: null,
  SUB4to4: null,

  MULTIPLY_5: '偶数先÷2，后面写上0',
  MULTIPLY_9: '×10再减掉自己',
  MULTIPLY_11: '两头一拉，中间相加',
  DIVIDE_5: '先×2，再÷10',
  COMPENSATE_ADD: '凑成整十，算完再减补',
  COMPENSATE_SUBTRACT: '凑成整十，减完再加补',
  MULTIPLY_DISTRIBUTIVE: '分解因数，凑成整百整千',
  NEAR_100_MULTIPLY: '(100-a)×(100+b)展开计算',
  PERCENTAGE_QUICK: '分解百分比计算',
  FRACTION_CONVERT: '分数小数转换记忆',
  SQUARE_DIFFERENCE: '平方差公式应用',
  MULTIPLE_FEATURES: '倍数特征判断',
  SAME_TENS_DIFF_ONES: '十位×(十位+1)，个位×个位',
  SPECIAL_SQUARE: '100加20n再加n²',
}

// 平方数速算详细步骤（用于答案页展示）
export function getSquareEnd5Steps(num: number): string[] {
  const tens = Math.floor(num / 10)
  const front = tens * (tens + 1)
  return [
    `把 ${num} 拆成：十位=${tens}，末位=5`,
    `十位 × (十位+1) = ${tens} × ${tens + 1} = ${front}`,
    `后面写上 25 → ${front}25`,
  ]
}

// 所有口算技巧完整列表（技能树）
export interface FullTechnique {
  id: string
  name: string
  tip: string
  explanation: string
  examples: { q: string; a: string; steps: string[] }[]
  difficulty: Difficulty
  requiredStars: number  // 解锁所需星星数
}

export const ALL_TECHNIQUES: FullTechnique[] = [
  {
    id: 'square_end5',
    name: '平方数速算',
    tip: '十位×(十位+1)，后面写上25',
    explanation: '尾数是5的两位数平方，有超级快速的算法！例如 25²=(2×3)25=625，35²=(3×4)25=1225。原理是：(10n+5)² = n(n+1)×100 + 25。',
    examples: [
      { q: '25²', a: '625', steps: ['2×3=6', '后面写25', '→ 625'] },
      { q: '35²', a: '1225', steps: ['3×4=12', '后面写25', '→ 1225'] },
      { q: '15²', a: '225', steps: ['1×2=2', '后面写25', '→ 225'] },
      { q: '45²', a: '2025', steps: ['4×5=20', '后面写25', '→ 2025'] },
      { q: '55²', a: '3025', steps: ['5×6=30', '后面写25', '→ 3025'] },
    ],
    difficulty: 'SQUARE_END5',
    requiredStars: 5,
  },
]

export { randInt }
