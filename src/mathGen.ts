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

    case 'ADD2to2': {
      operator = '+'
      num1 = randInt(10, 99)
      num2 = randInt(10, 99)
      num1 = Math.round(num1 / 1) * 1
      num2 = Math.round(num2 / 1) * 1
      break
    }

    case 'SUB2to2': {
      operator = '-'
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
    case 'COMPENSATE_ADD': return 2  // 两位数运算
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
    case 'COMPENSATE_ADD': return 2
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
  ADD2to2: null,
  SUB2to2: null,
  ADD2to3: null,
  SUB2to3: null,
  ADD3to3: null,
  SUB3to3: null,
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
