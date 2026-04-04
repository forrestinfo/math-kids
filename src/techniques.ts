import { Question, Difficulty } from './types'

let questionIdCounter = 0
function generateId(): string {
  return `q_${++questionIdCounter}_${Date.now()}`
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export interface TechniqueStep {
  line: string  // 显示的步骤行
}

// 各种技巧的generator签名
export type TechniqueGenerator = () => {
  num1: number
  num2: number
  answer: number
  steps: string[]
  techniqueId: string
}

// ==================== 1. 平方数速算（尾数5） ====================
// 原理：(10n+5)² = n×(n+1)×100 + 25
export function genSquareEnd5(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
  const n = randInt(1, 9)       // 十位：1~9 → 15²~95²
  const num1 = n * 10 + 5
  const num2 = num1
  const answer = num1 * num1
  const front = n * (n + 1)
  return {
    num1,
    num2,
    answer,
    steps: [
      `把 ${num1} 拆成：十位=${n}，末位=5`,
      `${n}×(${n}+1)=${n}×${n + 1}=${front}`,
      `→ 后面写上25 → ${front}25 = ${answer}`,
    ],
    techniqueId: 'square_end5',
  }
}

// ==================== 2. 乘9速算 ====================
// 原理：n×9 = n×10 - n
export function genMultiply9(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
  // n = 12~88，两位数，尾数非0
  let n = randInt(12, 88)
  const lastDigit = n % 10
  if (lastDigit === 0) {
    n = n > 50 ? n - 1 : n + 1  // 调整到非整十
  }
  n = Math.max(12, Math.min(88, n))

  const num1 = n
  const num2 = 9
  const answer = num1 * num2
  const step2 = num1 * 10
  return {
    num1,
    num2,
    answer,
    steps: [
      `${num1}×9`,
      `= ${num1}×10 - ${num1}`,
      `= ${step2} - ${num1}`,
      `= ${answer}`,
    ],
    techniqueId: 'multiply_9',
  }
}

// ==================== 3. 乘11速算 ====================
// 原理：两位数×11 = 两头一拉，中间相加（和≥10则百位进1）
export function genMultiply11(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
  const num1 = randInt(10, 99)
  const num2 = 11
  const answer = num1 * num2

  const tens = Math.floor(num1 / 10)
  const ones = num1 % 10
  const sum = tens + ones

  let step2: string
  let step3: string

  if (sum >= 10) {
    const carry = Math.floor(sum / 10)
    const middle = sum % 10
    step2 = `${tens}_${ones} → ${tens}+${ones}=${sum}，进位${carry}`
    step3 = `→ ${tens + carry}${middle}${ones} = ${answer}`
  } else {
    step2 = `${tens}_${ones} → ${tens}+${ones}=${sum}`
    step3 = `→ ${tens}${sum}${ones} = ${answer}`
  }

  return {
    num1,
    num2,
    answer,
    steps: [
      `${num1}×11`,
      step2,
      step3,
    ],
    techniqueId: 'multiply_11',
  }
}

// ==================== 4. 乘5速算（偶数） ====================
// 原理：n×5 = n÷2×10（n为偶数）
export function genMultiply5(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
  const n = randInt(7, 49) * 2  // 偶数 14~98
  const num1 = n
  const num2 = 5
  const answer = num1 * num2
  const half = num1 / 2
  return {
    num1,
    num2,
    answer,
    steps: [
      `${num1}×5`,
      `= ${num1}÷2×10`,
      `= ${half}×10`,
      `= ${answer}`,
    ],
    techniqueId: 'multiply_5',
  }
}

// ==================== 5. 除5速算 ====================
// 原理：n÷5 = n×2÷10（n为偶数，保证能整除）
export function genDivide5(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
  const quotient = randInt(4, 196)
  const num1 = quotient * 5  // 保证能整除
  const num2 = 5
  const answer = num1 / num2  // = quotient
  const step2 = num1 * 2
  return {
    num1,
    num2,
    answer,
    steps: [
      `${num1}÷5`,
      `= ${num1}×2÷10`,
      `= ${step2}÷10`,
      `= ${answer}`,
    ],
    techniqueId: 'divide_5',
  }
}

// ==================== 6. 凑整加法 ====================
// 原理：把接近整十的数凑成整十，加完再减补数
export function genCompensateAdd(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
  // 生成接近整十的数（尾数1-4或6-9）
  const baseTens = randInt(1, 9) * 10
  const lastDigits = [1, 2, 3, 4, 6, 7, 8, 9]
  const last = lastDigits[randInt(0, 7)]
  const nearNum = baseTens + last   // 接近整十的数，如 21, 33, 76...
  const compensation = 10 - last     // 补数，如 21→30，补9

  // 另一个数：普通两位数
  const normalTens = randInt(1, 9) * 10
  const normalLast = randInt(1, 9)
  const normalNum = normalTens + normalLast

  // 随机谁在前
  const num1 = Math.random() > 0.5 ? nearNum : normalNum
  const num2 = num1 === nearNum ? normalNum : nearNum

  const answer = num1 + num2
  const near = num1 === nearNum ? nearNum : nearNum
  const other = num1 === nearNum ? normalNum : normalNum
  const actualNear = num1 > num2 ? Math.max(num1, num2) : Math.min(num1, num2)
  const actualOther = num1 > num2 ? num2 : num1

  // 判断哪个接近整十
  const nearIsFirst = actualNear === num1
  const nearVal = nearIsFirst ? num1 : num2
  const otherVal = nearIsFirst ? num2 : num1
  const round = Math.ceil(nearVal / 10) * 10
  const comp = round - nearVal

  return {
    num1,
    num2,
    answer,
    steps: [
      `${num1}+${num2}`,
      `凑整：${nearVal}凑成${round}，补${comp}`,
      `= ${round}+${otherVal}-${comp}`,
      `= ${round + otherVal - comp}`,
      `= ${answer}`,
    ],
    techniqueId: 'compensate_add',
  }
}

// ==================== 7. 头同尾补（头同，个位和=10） ====================
// 原理：十位a相同，个位b和c相加=10 → a(a+1) | b×c（b×c补两位数）
export function genSameTensDiffOnes(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
  const a = randInt(1, 9)
  const b = randInt(1, 8)
  const c = 10 - b

  const num1 = a * 10 + b
  const num2 = a * 10 + c
  const answer = num1 * num2

  const front = a * (a + 1)
  const product = b * c
  const productStr = product < 10 ? `0${product}` : String(product)

  return {
    num1,
    num2,
    answer,
    steps: [
      `${num1}×${num2}`,
      `十位相同(${a})，个位相加=10(${b}+${c}=10)`,
      `${a}×${a + 1}=${front}，${b}×${c}=${product}`,
      `→ ${front}${productStr} = ${answer}`,
    ],
    techniqueId: 'same_tens_diff_ones',
  }
}

// ==================== 8. 11~19的平方 ====================
// 原理：(10+n)² = 100 + 20n + n²
export function genSpecialSquare(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
  const n = randInt(1, 9)
  const base = 10 + n
  const num1 = base
  const num2 = base
  const answer = num1 * num1
  const term2 = 20 * n
  const term3 = n * n

  return {
    num1,
    num2,
    answer,
    steps: [
      `${base}²`,
      `= (10+${n})²`,
      `= 100 + ${term2} + ${n}²`,
      `= 100 + ${term2} + ${term3}`,
      `= ${answer}`,
    ],
    techniqueId: 'special_square',
  }
}

// ==================== 技巧元数据 ====================
export interface TechniqueMeta {
  id: string
  name: string
  tip: string
  explanation: string
  difficulty: Difficulty
  requiredStars: number
  category: 'multiply' | 'divide' | 'square' | 'add'
  level: 1 | 2 | 3 | 4  // 1=最简单
}

export const TECHNIQUES_META: TechniqueMeta[] = [
  {
    id: 'multiply_5',
    name: '乘5速算',
    tip: '偶数先÷2，后面写上0',
    explanation: '乘以5其实就是乘以10再除以2。把偶数先除以2，再乘以10，一下子就算出来了！',
    difficulty: 'MULTIPLY_5',
    requiredStars: 0,
    category: 'multiply',
    level: 1,
  },
  {
    id: 'square_end5',
    name: '平方数速算',
    tip: '十位×(十位+1)，后面写上25',
    explanation: '尾数是5的两位数平方超级快！十位乘以(十位+1)，后面直接写25。例如35²：3×4=12，后面写25，得1225。',
    difficulty: 'SQUARE_END5',
    requiredStars: 1,
    category: 'square',
    level: 1,
  },
  {
    id: 'multiply_9',
    name: '乘9速算',
    tip: '×10再减掉自己',
    explanation: '乘以9太简单了！只要把数乘以10，再减去自己，就是答案。',
    difficulty: 'MULTIPLY_9',
    requiredStars: 2,
    category: 'multiply',
    level: 2,
  },
  {
    id: 'divide_5',
    name: '除5速算',
    tip: '先×2，再÷10',
    explanation: '除以5的反向思维：先乘以2，再除以10，轻松搞定！',
    difficulty: 'DIVIDE_5',
    requiredStars: 3,
    category: 'divide',
    level: 2,
  },
  {
    id: 'multiply_11',
    name: '乘11速算',
    tip: '两头一拉，中间相加',
    explanation: '两位数乘以11，只要把它的两个数字拉开，中间写上两个数的和（如果和≥10要进位）。例如47×11：4_7，中间4+7=11，写成517。',
    difficulty: 'MULTIPLY_11',
    requiredStars: 4,
    category: 'multiply',
    level: 3,
  },
  {
    id: 'compensate_add',
    name: '凑整加法',
    tip: '凑成整十，算完再减补',
    explanation: '遇到接近整十的数，先把它凑成整十算，加完后再减去多算的部分。',
    difficulty: 'COMPENSATE_ADD',
    requiredStars: 5,
    category: 'add',
    level: 3,
  },
  {
    id: 'same_tens_diff_ones',
    name: '头同尾补',
    tip: '十位×(十位+1)，个位×个位',
    explanation: '十位相同、个位相加等于10的两数相乘，可以速算！十位×(十位+1)写在前面，个位相乘写在后面（不满两位前面补0）。例如37×33：3×4=12，7×3=21，拼起来1221。',
    difficulty: 'SAME_TENS_DIFF_ONES',
    requiredStars: 6,
    category: 'multiply',
    level: 4,
  },
  {
    id: 'special_square',
    name: '11~19平方',
    tip: '100加20n再加n²',
    explanation: '11到19的平方有个固定公式：(10+n)² = 100 + 20n + n²。多练几次就记住了！',
    difficulty: 'SPECIAL_SQUARE',
    requiredStars: 7,
    category: 'square',
    level: 4,
  },
]

// 根据难度找技巧元数据
export function getTechniqueMeta(difficulty: Difficulty): TechniqueMeta | undefined {
  return TECHNIQUES_META.find(t => t.difficulty === difficulty)
}

// 步骤文本 → 带颜色的HTML（答对绿色，答错红色）
export function renderStepsHTML(steps: string[], isCorrect: boolean): string {
  const cls = isCorrect ? 'step-correct' : 'step-wrong'
  return steps.map(line => `<div class="step-line ${cls}">${line}</div>`).join('')
}
