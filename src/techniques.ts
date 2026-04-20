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

// ==================== 9. 凑整减法 ====================
// 原理：把减数凑成整十，减完再加回补数
// 例如：72-19 = 72-20+1
export function genCompensateSubtract(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
  // 生成接近整十的减数（尾数1-4或6-9）
  const baseTens = randInt(1, 9) * 10
  const lastDigits = [1, 2, 3, 4, 6, 7, 8, 9]
  const last = lastDigits[randInt(0, 7)]
  const nearNum = baseTens + last   // 接近整十的减数，如 19, 28, 37...
  const compensation = 10 - last     // 补数，如 19→20，补1

  // 被减数：确保结果为正，且比减数大
  const minMinuend = nearNum + 10  // 至少比减数大10
  const maxMinuend = minMinuend + 50 // 范围适当
  const minuend = randInt(minMinuend, maxMinuend)

  const num1 = minuend
  const num2 = nearNum
  const answer = num1 - num2
  const round = Math.ceil(nearNum / 10) * 10  // 向上取整到整十
  const comp = round - nearNum  // 补数（正数）

  return {
    num1,
    num2,
    answer,
    steps: [
      `${num1}-${num2}`,
      `凑整：把${num2}看成${round}，多减了${comp}`,
      `= ${num1}-${round}+${comp}`,
      `= ${num1 - round}+${comp}`,
      `= ${answer}`,
    ],
    techniqueId: 'compensate_subtract',
  }
}

// ==================== 10. 乘法分配律简化 ====================
// 原理：a×b = (a÷c)×(b×c)，通过因数分解简化计算
// 例如：24×25 = (24÷4)×(25×4) = 6×100 = 600
export function genMultiplyDistributive(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
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
  const num1 = base
  const num2 = pair.multiplier
  const answer = num1 * num2
  
  const simplified = num1 / pair.factor
  const expanded = num2 * pair.factor
  
  return {
    num1,
    num2,
    answer,
    steps: [
      `${num1}×${num2}`,
      `分配律：${num1}÷${pair.factor}=${simplified}，${num2}×${pair.factor}=${expanded}`,
      `= ${simplified}×${expanded}`,
      `= ${simplified}×${pair.result}`,
      `= ${answer}`,
    ],
    techniqueId: 'multiply_distributive',
  }
}

// ==================== 11. 接近100的乘法 ====================
// 原理：(100-a)×(100+b) = 10000 + 100×(b-a) - a×b
// 例如：98×103 = (100-2)×(100+3) = 10000 + 100×(3-2) - 2×3 = 10094
export function genNear100Multiply(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
  // 生成接近100的数：一个小于100，一个大于100
  const a = randInt(1, 9)  // 2~9的差值
  const b = randInt(1, 9)  // 1~9的差值
  
  // 随机决定哪个数小于100，哪个大于100
  let num1, num2;
  if (Math.random() > 0.5) {
    num1 = 100 - a
    num2 = 100 + b
  } else {
    num1 = 100 + b
    num2 = 100 - a
  }
  
  const answer = num1 * num2
  const diff = b - a
  const middleTerm = 100 * diff
  const product = a * b
  
  return {
    num1,
    num2,
    answer,
    steps: [
      `${num1}×${num2}`,
      `看成：(100-${a})×(100+${b})`,
      `= 100×100 + 100×${b} - ${a}×100 - ${a}×${b}`,
      `= 10000 + ${100 * b} - ${100 * a} - ${product}`,
      `= ${10000 + middleTerm - product}`,
      `= ${answer}`,
    ],
    techniqueId: 'near_100_multiply',
  }
}

// ==================== 12. 百分比快速计算 ====================
// 原理：n% = (n/10)% + (n/20)% 等分解
// 例如：15% = 10% + 5%，或 15% = (10% + 5%)
export function genPercentageQuick(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
  // 常见百分比分解：15%=10%+5%，18%=10%+8%，25%=10%+15%等
  const percentages = [15, 18, 25, 35, 45]
  const percentage = percentages[randInt(0, percentages.length - 1)]
  
  // 生成一个适合计算的数
  const base = randInt(20, 80) * 10  // 200, 300, ..., 800
  const num1 = base
  const num2 = percentage  // 这里代表百分比，但题目会显示为'×15%'
  const answer = Math.round((base * percentage) / 100)  // 四舍五入到整数
  
  // 分解百分比
  let decomposition = ''
  let steps: string[] = []
  
  switch (percentage) {
    case 15:
      decomposition = '10% + 5%'
      steps = [
        `${base}×15%`,
        `= ${base}×(10% + 5%)`,
        `= ${base}×10% + ${base}×5%`,
        `= ${base / 10} + ${base / 20}`,
        `= ${base / 10} + ${base / 20} = ${answer}`,
      ]
      break
    case 18:
      decomposition = '10% + 8%'
      steps = [
        `${base}×18%`,
        `= ${base}×(10% + 8%)`,
        `= ${base}×10% + ${base}×8%`,
        `= ${base / 10} + ${base * 8 / 100}`,
        `= ${base / 10} + ${base * 0.08} = ${answer}`,
      ]
      break
    case 25:
      decomposition = '10% + 15%'
      steps = [
        `${base}×25%`,
        `= ${base}×(10% + 15%)`,
        `= ${base}×10% + ${base}×15%`,
        `= ${base / 10} + ${base * 15 / 100}`,
        `= ${base / 10} + ${base * 0.15} = ${answer}`,
      ]
      break
    default:
      decomposition = '分解计算'
      steps = [
        `${base}×${percentage}%`,
        `= ${base}×${percentage / 100}`,
        `= ${answer}`,
      ]
  }
  
  return {
    num1,
    num2,
    answer,
    steps,
    techniqueId: 'percentage_quick',
  }
}

// ==================== 13. 分数快速转换 ====================
// 原理：常见分数的小数等价记忆
// 例如：1/8 = 0.125，3/8 = 0.375
export function genFractionConvert(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
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
  const num1 = base
  const num2 = fraction.den  // 分母
  const answer = Math.round(base * fraction.decimal)  // 四舍五入
  
  return {
    num1,
    num2,
    answer,
    steps: [
      `${base}×${fraction.num}/${fraction.den}`,
      `= ${base}×${fraction.decimal}`,
      `记忆：${fraction.num}/${fraction.den} = ${fraction.decimal}`,
      `= ${answer}`,
    ],
    techniqueId: 'fraction_convert',
  }
}

// ==================== 14. 平方差公式应用 ====================
// 原理：a² - b² = (a+b)(a-b)
// 例如：49×51 = (50-1)×(50+1) = 50² - 1² = 2500-1 = 2499
export function genSquareDifference(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
  // 生成接近的数，差为2（为了用平方差公式）
  const center = randInt(20, 80)  // 中心数
  const num1 = center - 1
  const num2 = center + 1
  const answer = num1 * num2
  
  return {
    num1,
    num2,
    answer,
    steps: [
      `${num1}×${num2}`,
      `平方差公式：(${center}-1)×(${center}+1) = ${center}² - 1²`,
      `= ${center * center} - 1`,
      `= ${answer}`,
    ],
    techniqueId: 'square_difference',
  }
}

// ==================== 15. 倍数特征判断 ====================
// 原理：2,3,4,5,9,10的倍数特征
// 例如：判断123是否是3的倍数（1+2+3=6，是3的倍数）
export function genMultipleFeatures(): { num1: number; num2: number; answer: number; steps: string[]; techniqueId: string } {
  // 倍数类型
  const multiples = [
    { type: 2, name: '2', rule: '个位是0、2、4、6、8' },
    { type: 3, name: '3', rule: '各位数字之和是3的倍数' },
    { type: 4, name: '4', rule: '末两位是4的倍数' },
    { type: 5, name: '5', rule: '个位是0或5' },
    { type: 9, name: '9', rule: '各位数字之和是9的倍数' },
    { type: 10, name: '10', rule: '个位是0' },
  ]
  
  const multiple = multiples[randInt(0, multiples.length - 1)]
  
  // 生成一个数，可能是或不是该倍数
  let num1: number
  let isMultiple: boolean
  
  if (Math.random() > 0.5) {
    // 生成是该倍数的数
    const base = randInt(10, 30)
    num1 = base * multiple.type
    isMultiple = true
  } else {
    // 生成不是该倍数的数
    const base = randInt(10, 30)
    num1 = base * multiple.type + 1  // 加1确保不是倍数
    // 如果是2的倍数且个位不是偶数，调整
    if (multiple.type === 2 && num1 % 2 === 0) {
      num1 += 1
    }
    isMultiple = false
  }
  
  const num2 = multiple.type
  const answer = isMultiple ? 1 : 0  // 1表示是倍数，0表示不是
  
  let steps: string[] = []
  
  switch (multiple.type) {
    case 2:
      steps = [
        `判断 ${num1} 是否是2的倍数`,
        `规则：${multiple.rule}`,
        `${num1}的个位是 ${num1 % 10}`,
        isMultiple ? `个位是偶数，所以是2的倍数` : `个位不是偶数，所以不是2的倍数`,
      ]
      break
    case 3:
      const sum3 = String(num1).split('').reduce((a, b) => a + parseInt(b), 0)
      steps = [
        `判断 ${num1} 是否是3的倍数`,
        `规则：${multiple.rule}`,
        `${num1}的各位数字之和：${String(num1).split('').join('+')} = ${sum3}`,
        isMultiple ? `${sum3}是3的倍数，所以是3的倍数` : `${sum3}不是3的倍数，所以不是3的倍数`,
      ]
      break
    case 4:
      const lastTwo4 = num1 % 100
      steps = [
        `判断 ${num1} 是否是4的倍数`,
        `规则：${multiple.rule}`,
        `${num1}的末两位是 ${lastTwo4}`,
        isMultiple ? `${lastTwo4}是4的倍数，所以是4的倍数` : `${lastTwo4}不是4的倍数，所以不是4的倍数`,
      ]
      break
    case 5:
      steps = [
        `判断 ${num1} 是否是5的倍数`,
        `规则：${multiple.rule}`,
        `${num1}的个位是 ${num1 % 10}`,
        isMultiple ? `个位是0或5，所以是5的倍数` : `个位不是0或5，所以不是5的倍数`,
      ]
      break
    case 9:
      const sum9 = String(num1).split('').reduce((a, b) => a + parseInt(b), 0)
      steps = [
        `判断 ${num1} 是否是9的倍数`,
        `规则：${multiple.rule}`,
        `${num1}的各位数字之和：${String(num1).split('').join('+')} = ${sum9}`,
        isMultiple ? `${sum9}是9的倍数，所以是9的倍数` : `${sum9}不是9的倍数，所以不是9的倍数`,
      ]
      break
    case 10:
      steps = [
        `判断 ${num1} 是否是10的倍数`,
        `规则：${multiple.rule}`,
        `${num1}的个位是 ${num1 % 10}`,
        isMultiple ? `个位是0，所以是10的倍数` : `个位不是0，所以不是10的倍数`,
      ]
      break
  }
  
  return {
    num1,
    num2,
    answer,
    steps,
    techniqueId: 'multiple_features',
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
    id: 'compensate_subtract',
    name: '凑整减法',
    tip: '凑成整十，减完再加补',
    explanation: '遇到接近整十的减数，先把它凑成整十减，减完后再加回多减的部分。例如72-19：72-20+1=53。',
    difficulty: 'COMPENSATE_SUBTRACT',
    requiredStars: 5,
    category: 'add',
    level: 3,
  },
  {
    id: 'multiply_distributive',
    name: '乘法分配律',
    tip: '分解因数，凑成整百整千',
    explanation: '把一个数分解，另一个数乘以分解出来的因数，凑成整百整千来计算。例如24×25 = (24÷4)×(25×4) = 6×100 = 600。',
    difficulty: 'MULTIPLY_DISTRIBUTIVE',
    requiredStars: 5,
    category: 'multiply',
    level: 3,
  },
  {
    id: 'near_100_multiply',
    name: '接近100乘法',
    tip: '(100-a)×(100+b)展开计算',
    explanation: '两个接近100的数相乘，可以看成(100-a)×(100+b)来快速计算。例如98×103 = (100-2)×(100+3) = 10000 + 100 - 6 = 10094。',
    difficulty: 'NEAR_100_MULTIPLY',
    requiredStars: 5,
    category: 'multiply',
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
