import './style.css'
import { User, Question, GameSession, Screen, Difficulty, DIFFICULTY_ORDER } from './types'
import { generateBatch, generateQuestion, speakQuestion, speakText, TECHNIQUE_TIPS } from './mathGen'
import { audioManager } from './audio'
import { TECHNIQUES_META, renderStepsHTML } from './techniques'
import { GAME_LEVELS, getWorldLevels, getLevelStars, isLevelUnlocked, getLevelById, getCharacterById, CHARACTERS } from './levels'

// ============== 状态 ==============
let users: User[] = []
let currentUser: User | null = null
let screen: Screen = 'user-select'
let gameSession: GameSession | null = null
let countdownInterval: ReturnType<typeof setInterval> | null = null
let countdownSeconds = 30
let meilediPath = '/images/meiledi.jpg'
let currentLevelId: string | null = null
let selectedDifficulties: Difficulty[] = []
let selectedQuestionCount: 20 | 30 | 50 = 20
let currentWorldId: string | null = null

// ============== 自适应难度状态 ==============
interface DiffStats { correctCount: number; totalAnswered: number; totalCorrect: number }
let diffStats: Record<string, DiffStats> = {}
let upgradeSuggestion: string | null = null

function initDiffStats(diffs: Difficulty[]) {
  diffStats = {}; upgradeSuggestion = null
  for (const d of diffs) diffStats[d] = { correctCount: 0, totalAnswered: 0, totalCorrect: 0 }
}

function recordAnswer(difficulty: Difficulty, isCorrect: boolean): void {
  const key = difficulty
  if (!diffStats[key]) diffStats[key] = { correctCount: 0, totalAnswered: 0, totalCorrect: 0 }
  diffStats[key].totalAnswered++
  if (isCorrect) { diffStats[key].correctCount++; diffStats[key].totalCorrect++ } else { diffStats[key].correctCount = 0 }
  checkAutoUpgrade()
}

function checkAutoUpgrade(): void {
  upgradeSuggestion = null
  if (selectedDifficulties.length <= 1) return
  for (const diff of selectedDifficulties) {
    const stats = diffStats[diff]
    if (!stats || stats.correctCount < 5) continue
    const rate = stats.totalCorrect / stats.totalAnswered
    if (rate >= 0.9) {
      const currentIdx = DIFFICULTY_ORDER.indexOf(diff)
      if (currentIdx < DIFFICULTY_ORDER.length - 1) {
        const nextDiff = DIFFICULTY_ORDER[currentIdx + 1]
        if (selectedDifficulties.includes(nextDiff)) {
          const nextMeta = TECHNIQUES_META.find(t => t.difficulty === nextDiff)
          upgradeSuggestion = nextMeta ? nextMeta.name : nextDiff
          if (currentUser) { currentUser.difficulty = nextDiff; saveUsers() }
        }
      }
    }
  }
}

// ============== 技巧步骤 ==============
function getTechniqueSteps(difficulty: Difficulty): string[] | null {
  if (!gameSession) return null
  const q = gameSession.questions[gameSession.currentIndex]
  switch (difficulty) {
    case 'SQUARE_END5': { const n = Math.floor(q.num1 / 10); const front = n * (n + 1); return [`把 ${q.num1} 拆成：十位=${n}，末位=5`, `${n}×(${n}+1)=${front}`, `→ 后面写上25 → ${front}25 = ${q.answer}`] }
    case 'MULTIPLY_5': { const half = q.num1 / 2; return [`${q.num1}×5`, `= ${q.num1}÷2×10`, `= ${half}×10`, `= ${q.answer}`] }
    case 'MULTIPLY_9': { const step2 = q.num1 * 10; return [`${q.num1}×9`, `= ${q.num1}×10 - ${q.num1}`, `= ${step2} - ${q.num1}`, `= ${q.answer}`] }
    case 'MULTIPLY_11': { const tens = Math.floor(q.num1 / 10); const ones = q.num1 % 10; const sum = tens + ones; if (sum >= 10) { const carry = Math.floor(sum / 10); const middle = sum % 10; return [`${q.num1}×11`, `${tens}_${ones} → ${tens}+${ones}=${sum}，进位${carry}`, `→ ${tens + carry}${middle}${ones} = ${q.answer}`] } return [`${q.num1}×11`, `${tens}_${ones} → ${tens}+${ones}=${sum}`, `→ ${tens}${sum}${ones} = ${q.answer}`] }
    case 'DIVIDE_5': { const step2 = q.num1 * 2; return [`${q.num1}÷5`, `= ${q.num1}×2÷10`, `= ${step2}÷10`, `= ${q.answer}`] }
    case 'COMPENSATE_ADD': { const lastA = q.num1 % 10; const aNear = (lastA >= 1 && lastA <= 4) || (lastA >= 6 && lastA <= 9); const near = aNear ? q.num1 : q.num2; const other = aNear ? q.num2 : q.num1; const round = Math.ceil(near / 10) * 10; const comp = round - near; return [`${q.num1}+${q.num2}`, `凑整：${near}凑成${round}，补${comp}`, `= ${round}+${other}-${comp}`, `= ${q.answer}`] }
    case 'SAME_TENS_DIFF_ONES': { const a = Math.floor(q.num1 / 10); const b = q.num1 % 10; const c = q.num2 % 10; const front = a * (a + 1); const product = b * c; const productStr = product < 10 ? `0${product}` : String(product); return [`${q.num1}×${q.num2}`, `十位相同(${a})，个位相加=10`, `${a}×${a + 1}=${front}，${b}×${c}=${product}`, `→ ${front}${productStr} = ${q.answer}`] }
    case 'SPECIAL_SQUARE': { const n = q.num1 - 10; return [`${q.num1}²`, `= (10+${n})²`, `= 100 + ${20 * n} + ${n * n}`, `= ${q.answer}`] }
    default: return null
  }
}

function showTechniqueSteps(difficulty: Difficulty, isCorrect: boolean): void {
  const steps = getTechniqueSteps(difficulty)
  if (!steps) return
  const container = document.getElementById('technique-steps')
  if (container) { container.innerHTML = renderStepsHTML(steps, isCorrect); container.style.display = 'block' }
}

// ============== DOM ==============
const app = document.getElementById('app')!

// ============== 初始化 ==============
async function init() {
  await audioManager.init()
  await loadUsers()
  try { const path = await window.electronAPI?.getImagePath('meiledi.jpg'); if (path) meilediPath = path } catch { /* ignore */ }
  render()
}

// ============== 用户管理 ==============
async function loadUsers() {
  try {
    const result = await window.electronAPI?.loadUsers()
    if (result?.success && result.data) {
      users = result.data.map(u => ({
        ...u, diamonds: u.diamonds ?? 0,
        levelProgress: u.levelProgress ?? {},
        unlockedCharacters: u.unlockedCharacters ?? ['meiledi'],
        activeCharacter: u.activeCharacter ?? 'meiledi',
        totalGamesPlayed: u.totalGamesPlayed ?? 0,
        bestCombo: u.bestCombo ?? 0,
        streakDays: u.streakDays ?? 0,
        lastPlayedDate: u.lastPlayedDate ?? '',
      }))
    }
  } catch { users = [] }
}

async function saveUsers() { try { await window.electronAPI?.saveUsers(users) } catch { /* ignore */ } }

function createUser(name: string): User {
  const user: User = {
    id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, name, stars: 0, moons: 0, suns: 0, diamonds: 0,
    difficulty: 'ADD2to2', totalCorrect: 0, totalWrong: 0, createdAt: Date.now(),
    levelProgress: {}, unlockedCharacters: ['meiledi'], activeCharacter: 'meiledi',
    totalGamesPlayed: 0, bestCombo: 0, streakDays: 0, lastPlayedDate: '',
  }
  users.push(user); saveUsers(); return user
}

function deleteUser(id: string) {
  users = users.filter(u => u.id !== id)
  if (currentUser?.id === id) { currentUser = null; screen = 'user-select' }
  saveUsers()
}

function selectUser(user: User) {
  currentUser = user; checkDailyStreak(); screen = 'main-menu'; render()
}

function checkDailyStreak() {
  if (!currentUser) return
  const today = new Date().toISOString().split('T')[0]
  if (currentUser.lastPlayedDate === today) return
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (currentUser.lastPlayedDate === yesterday) { currentUser.streakDays++; currentUser.diamonds += 1; saveUsers() }
  else currentUser.streakDays = 1
  currentUser.lastPlayedDate = today; saveUsers()
}

function updateRewards(deltaStars: number, deltaDiamonds: number = 0) {
  if (!currentUser) return
  currentUser.totalCorrect += deltaStars > 0 ? 1 : 0
  currentUser.totalWrong += deltaStars < 0 ? 1 : 0
  if (deltaStars > 0) {
    currentUser.stars += 1
    if (currentUser.stars >= 10) { currentUser.moons += Math.floor(currentUser.stars / 10); currentUser.stars = currentUser.stars % 10 }
    if (currentUser.moons >= 10) { currentUser.suns += Math.floor(currentUser.moons / 10); currentUser.moons = currentUser.moons % 10 }
  } else if (deltaStars < 0) { currentUser.stars = Math.max(0, currentUser.stars - 1) }
  if (deltaDiamonds !== 0) currentUser.diamonds = Math.max(0, currentUser.diamonds + deltaDiamonds)
  saveUsers()
}

function getCharacterBonus() {
  if (!currentUser) return { extraTime: 0, comboBoost: 0, rewardBoost: 0 }
  const char = getCharacterById(currentUser.activeCharacter)
  if (!char) return { extraTime: 0, comboBoost: 0, rewardBoost: 0 }
  return { extraTime: char.bonus === 'extra_time' ? char.bonusValue : 0, comboBoost: char.bonus === 'combo_boost' ? char.bonusValue : 0, rewardBoost: char.bonus === 'reward_boost' ? char.bonusValue : 0 }
}

// ============== 游戏逻辑 ==============
function startLevelGame(level: ReturnType<typeof getLevelById>) {
  if (!level || !currentUser) return
  currentLevelId = level.id
  const rawQuestions = generateBatch(level.difficulty, level.questionCount)
  const shuffled = [...rawQuestions].sort(() => Math.random() - 0.5)
  const { extraTime } = getCharacterBonus()
  const effectiveTimeLimit = level.timeLimit + extraTime

  gameSession = {
    questions: shuffled, currentIndex: 0, wrongQueue: [], score: currentUser.stars,
    correctCount: 0, wrongCount: 0, startTime: Date.now(), questionStartTime: Date.now(),
    timeLimit: effectiveTimeLimit, isPaused: false, isFinished: false, totalPausedTime: 0,
    currentCombo: 0, maxComboThisGame: 0, streakPoints: 0, earnedStars: 0, earnedDiamonds: 0,
    starMultiplier: 1, levelId: level.id, levelDifficulty: level.difficulty, questionCount: level.questionCount,
  }
  initDiffStats([level.difficulty])
  countdownSeconds = effectiveTimeLimit
  screen = 'game'; render(); startCountdown(); speakCurrentQuestion()
}

function startFreeGame(difficulties: Difficulty[], count: 30 | 50) {
  selectedDifficulties = difficulties.length > 0 ? difficulties : [currentUser!.difficulty]
  selectedQuestionCount = count
  const rawQuestions = generateBatch(selectedDifficulties[0], count)
  const shuffled = [...rawQuestions].sort(() => Math.random() - 0.5)
  const { extraTime } = getCharacterBonus()
  const effectiveTimeLimit = 30 + extraTime

  gameSession = {
    questions: shuffled, currentIndex: 0, wrongQueue: [], score: currentUser!.stars,
    correctCount: 0, wrongCount: 0, startTime: Date.now(), questionStartTime: Date.now(),
    timeLimit: effectiveTimeLimit, isPaused: false, isFinished: false, totalPausedTime: 0,
    currentCombo: 0, maxComboThisGame: 0, streakPoints: 0, earnedStars: 0, earnedDiamonds: 0,
    starMultiplier: 1, levelId: '', levelDifficulty: selectedDifficulties[0], questionCount: count,
  }
  initDiffStats(selectedDifficulties)
  countdownSeconds = effectiveTimeLimit
  screen = 'game'; render(); startCountdown(); speakCurrentQuestion()
}

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval)
  if (!gameSession) return
  countdownSeconds = gameSession.timeLimit
  countdownInterval = setInterval(() => {
    if (gameSession?.isPaused) return
    countdownSeconds--
    const el = document.getElementById('countdown-num')
    if (el) { el.textContent = String(countdownSeconds); el.className = countdownSeconds <= 5 ? 'countdown-num urgent' : 'countdown-num' }
    if (countdownSeconds <= 0) handleTimeout()
  }, 1000)
}

function handleTimeout() {
  if (!gameSession) return
  audioManager.play('incorrect'); speakText('时间到！')
  const q = gameSession.questions[gameSession.currentIndex]
  gameSession.wrongQueue.push(q); gameSession.wrongCount++
  gameSession.currentCombo = 0; gameSession.starMultiplier = 1
  const feedback = document.getElementById('answer-feedback')
  if (feedback) { feedback.textContent = '⏰ 时间到！'; feedback.className = 'answer-feedback wrong'; setTimeout(() => { if (feedback) { feedback.textContent = ''; feedback.className = 'answer-feedback' } }, 1500) }
  advanceToNext()
}

function speakCurrentQuestion() {
  if (!gameSession) return
  const q = gameSession.questions[gameSession.currentIndex]
  setTimeout(() => speakQuestion(q), 300)
}

function handleAnswer(userAnswer: number) {
  if (!gameSession || gameSession.isPaused || gameSession.isFinished) return
  if (countdownInterval) clearInterval(countdownInterval)
  const q = gameSession.questions[gameSession.currentIndex]
  const isCorrect = userAnswer === q.answer
  recordAnswer(q.difficulty, isCorrect)
  const feedback = document.getElementById('answer-feedback')
  const comboEl = document.getElementById('combo-display')
  const { comboBoost, rewardBoost } = getCharacterBonus()

  if (isCorrect) {
    audioManager.play('correct')
    gameSession.correctCount++
    gameSession.currentCombo++
    if (gameSession.currentCombo > gameSession.maxComboThisGame) gameSession.maxComboThisGame = gameSession.currentCombo
    if (currentUser && gameSession.currentCombo > currentUser.bestCombo) { currentUser.bestCombo = gameSession.currentCombo; saveUsers() }

    let multiplier = 1; let comboReward = 0
    if (gameSession.currentCombo >= 10) { multiplier = 3; comboReward = 3 }
    else if (gameSession.currentCombo >= 5) { multiplier = 2; comboReward = 1 }
    else if (gameSession.currentCombo >= 3) multiplier = 1.5
    multiplier *= (1 + comboBoost * (gameSession.currentCombo >= 5 ? 1 : 0))
    multiplier = Math.round(multiplier * 10) / 10
    gameSession.starMultiplier = multiplier
    gameSession.streakPoints++
    if (gameSession.streakPoints < 0) gameSession.streakPoints = 0

    const earnedStars = Math.ceil(multiplier * (1 + rewardBoost))
    gameSession.earnedStars += earnedStars
    if (gameSession.currentCombo >= 10 && Math.random() < 0.3) gameSession.earnedDiamonds++
    updateRewards(1, 0)

    if (feedback) { feedback.textContent = `🎉 答对！${multiplier > 1 ? `🔥×${multiplier} combo!` : ''}`; feedback.className = 'answer-feedback correct' }

    if (comboEl) {
      comboEl.textContent = `🔥 ${gameSession.currentCombo} COMBO!`
      comboEl.className = `combo-display active lvl-${Math.min(gameSession.currentCombo, 10)}`
      setTimeout(() => { if (comboEl) { comboEl.textContent = ''; comboEl.className = 'combo-display' } }, 2000)
    }
    showTechniqueSteps(q.difficulty, isCorrect)
  } else {
    audioManager.play('incorrect')
    gameSession.wrongCount++
    gameSession.currentCombo = 0; gameSession.starMultiplier = 1
    gameSession.streakPoints = Math.max(0, gameSession.streakPoints - 1)
    gameSession.wrongQueue.push({ ...q, id: `${q.id}_retry_${Date.now()}` })
    if (feedback) { feedback.textContent = `❌ 正确答案是 ${q.answer}`; feedback.className = 'answer-feedback wrong' }
    speakText(`正确答案是 ${q.answer}`)
    showTechniqueSteps(q.difficulty, isCorrect)
    updateRewards(-1, 0)
  }
  render()
  setTimeout(() => { if (feedback) { feedback.textContent = ''; feedback.className = 'answer-feedback' }; advanceToNext() }, isCorrect ? 1200 : 2500)
}

function advanceToNext() {
  if (!gameSession) return
  const allDone = gameSession.currentIndex >= gameSession.questions.length - 1

  if (allDone) {
    if (gameSession.wrongQueue.length > 0) {
      gameSession.questions.push(...gameSession.wrongQueue)
      gameSession.wrongQueue = []; gameSession.currentIndex++
      gameSession.questionStartTime = Date.now()
      if (countdownInterval) clearInterval(countdownInterval)
      countdownSeconds = gameSession.timeLimit; startCountdown()
      const stepsEl = document.getElementById('technique-steps')
      if (stepsEl) { stepsEl.innerHTML = ''; stepsEl.style.display = 'none' }
      render(); speakCurrentQuestion(); return
    }

    gameSession.isFinished = true
    if (countdownInterval) clearInterval(countdownInterval)
    checkAutoUpgrade()

    if (gameSession.levelId && currentUser) {
      const level = getLevelById(gameSession.levelId)
      if (level) {
        const stars = getLevelStars(gameSession.levelId, gameSession.correctCount, gameSession.correctCount + gameSession.wrongCount)
        const currentBest = currentUser.levelProgress[level.worldId] || 0
        if (level.order > currentBest) currentUser.levelProgress[level.worldId] = level.order
        if (stars >= 1) {
          const rb = getCharacterBonus().rewardBoost
          const earnedS = Math.ceil(level.reward.stars * (1 + rb))
          const earnedD = Math.ceil(level.reward.diamonds * (1 + rb))
          gameSession.earnedStars += earnedS; gameSession.earnedDiamonds += earnedD
          updateRewards(earnedS, earnedD)
        }
        if (stars >= 2 && DIFFICULTY_ORDER.includes(level.difficulty)) {
          const idx = DIFFICULTY_ORDER.indexOf(level.difficulty)
          if (idx < DIFFICULTY_ORDER.length - 1) currentUser.difficulty = DIFFICULTY_ORDER[idx + 1]
        }
        currentUser.totalGamesPlayed++; saveUsers()
      }
    }

    screen = 'summary'; render()
    const total = gameSession.correctCount + gameSession.wrongCount
    const rate = total > 0 ? (gameSession.correctCount / total) * 100 : 0
    if (rate >= 90) speakText('太棒了！正确率超过90%！')
    else if (rate >= 70) speakText('做得不错，继续加油！')
    else speakText('没关系，多练习就会越来越好！')
    return
  }

  gameSession.currentIndex++; gameSession.questionStartTime = Date.now()
  if (countdownInterval) clearInterval(countdownInterval)
  countdownSeconds = gameSession.timeLimit; startCountdown()
  const stepsEl = document.getElementById('technique-steps')
  if (stepsEl) { stepsEl.innerHTML = ''; stepsEl.style.display = 'none' }
  render(); speakCurrentQuestion()
}

function pauseGame() { if (!gameSession) return; gameSession.isPaused = true; if (countdownInterval) clearInterval(countdownInterval); window.speechSynthesis?.cancel(); render() }
function resumeGame() { if (!gameSession) return; gameSession.isPaused = false; startCountdown(); render(); speakCurrentQuestion() }
function stopGame() { if (countdownInterval) clearInterval(countdownInterval); window.speechSynthesis?.cancel(); gameSession = null; currentLevelId = null; screen = 'main-menu'; render() }
function returnToMenu() { gameSession = null; currentLevelId = null; screen = 'main-menu'; render() }

// ============== 辅助函数 ==============
function getTotalStars(user: User): number { return user.suns * 100 + user.moons * 10 + user.stars }
function getUnlockedLevels(user: User): number { return Object.values(user.levelProgress).reduce((a, b) => a + b, 0) }

// ============== 自由练习设置 ==============
function renderSetup(): string {
  if (!currentUser) return renderUserSelect()
  const cats = [
    { i: 0, emoji: '🌸', label: '乘法口诀' },
    { i: 1, emoji: '✨', label: '技巧速算' },
    { i: 2, emoji: '🌺', label: '两位数加减' },
    { i: 3, emoji: '🌻', label: '三位数加减' },
    { i: 4, emoji: '🌷', label: '四位数加减' },
  ]

  return `<div class="screen setup-screen">
    <div class="screen-bg"><img src="${meilediPath}" alt="" class="bg-meiledi" onerror="this.style.display='none'" /></div>
    <div class="panel setup-panel">
      <h2 class="panel-title">⚡ 自由练习</h2>
      <div class="setup-section">
        <div class="setup-label">选择题型（可多选）</div>
        <div class="cat-grid">${cats.map(c => `<div class="cat-card" data-action="toggle-category" data-cat="${c.i}"><span class="cat-emoji">${c.emoji}</span><span class="cat-label">${c.label}</span></div>`).join('')}</div>
      </div>
      <div class="setup-section">
        <div class="setup-label">题目数量</div>
        <div class="qcount-row">
          <button class="btn btn-qc sel" data-action="select-qcount" data-qc="20">20题</button>
          <button class="btn btn-qc" data-action="select-qcount" data-qc="30">30题</button>
          <button class="btn btn-qc" data-action="select-qcount" data-qc="50">50题</button>
        </div>
      </div>
      <div class="setup-btns">
        <button class="btn btn-secondary" data-action="back-from-setup">← 返回</button>
        <button class="btn btn-primary btn-xl" data-action="do-start-free">开始！🚀</button>
      </div>
    </div>
  </div>`
}

// ============== 渲染 ==============
function render() {
  switch (screen) {
    case 'user-select': app.innerHTML = renderUserSelect(); break
    case 'main-menu': app.innerHTML = renderMainMenu(); break
    case 'world-map': app.innerHTML = renderWorldMap(); break
    case 'level-select': app.innerHTML = renderLevelSelect(); break
    case 'character-screen': app.innerHTML = renderCharacters(); break
    case 'setup': app.innerHTML = renderSetup(); break
    case 'game': app.innerHTML = renderGame(); attachGameListeners(); break
    case 'summary': app.innerHTML = renderSummary(); break
  }
  attachListeners()
}

// ============== 用户选择页 ==============
function renderUserSelect(): string {
  const usersHtml = users.length === 0
    ? '<p class="empty-hint">还没有小朋友哦，创建你的第一个账号吧！</p>'
    : users.map(u => `
      <div class="user-card" data-action="select-user" data-id="${u.id}">
        <div class="user-avatar-lg">${u.name.charAt(0)}</div>
        <div class="user-info">
          <div class="user-name-lg">${u.name}</div>
          <div class="user-currencies">
            <span class="cur-chip">☀️${u.suns}</span>
            <span class="cur-chip">🌙${u.moons}</span>
            <span class="cur-chip">⭐${u.stars}</span>
            <span class="cur-chip">💎${u.diamonds ?? 0}</span>
          </div>
          <div class="user-meta">${getUnlockedLevels(u)}关已解锁 · ${u.totalGamesPlayed}次游戏</div>
        </div>
        <button class="btn-delete-user" data-action="delete-user" data-id="${u.id}" title="删除">✕</button>
      </div>`).join('')

  return `<div class="screen user-select-screen">
    <div class="screen-bg"><img src="${meilediPath}" alt="" class="bg-meiledi" onerror="this.style.display='none'" /></div>
    <div class="panel user-panel">
      <div class="logo-area"><div class="logo-emoji">🎮</div><h1 class="app-title">儿童计算冒险</h1><p class="logo-sub">闯关 · 升级 · 成为速算大师</p></div>
      <h2 class="panel-sub">选择你的账号</h2>
      <div class="user-list">${usersHtml}</div>
      <div class="create-form">
        <input type="text" id="new-user-name" placeholder="输入名字创建新账号" maxlength="10" />
        <button class="btn btn-pink" data-action="create-user">创建 🎮</button>
      </div>
    </div>
  </div>`
}

// ============== 主菜单 ==============
function renderMainMenu(): string {
  if (!currentUser) return renderUserSelect()
  const char = getCharacterById(currentUser.activeCharacter) || CHARACTERS[0]
  return `<div class="screen main-menu-screen">
    <div class="screen-bg"><img src="${meilediPath}" alt="" class="bg-meiledi" onerror="this.style.display='none'" /></div>
    <div class="panel main-panel">
      <div class="menu-header">
        <div class="user-badge">
          <div class="char-avatar-lg">${char.emoji}</div>
          <div><div class="user-greeting">${currentUser.name}，加油！</div><div class="char-label">${char.name}</div></div>
        </div>
        <button class="btn btn-sm btn-outline" data-action="switch-user">切换</button>
      </div>
      <div class="currency-bar">
        <div class="cur-item"><span class="cur-emoji">💎</span><span class="cur-num">${currentUser.diamonds}</span></div>
        <div class="cur-item"><span class="cur-emoji">⭐</span><span class="cur-num">${currentUser.stars}</span><span class="cur-sub">🌙${currentUser.moons} ☀️${currentUser.suns}</span></div>
        <div class="cur-item"><span class="cur-emoji">🔥</span><span class="cur-num">${currentUser.bestCombo}</span><span class="cur-sub">最高Combo</span></div>
      </div>
      <div class="stat-mini">
        <span>📊 已解锁 ${getUnlockedLevels(currentUser)}/25 关</span>
        <span>🏆 游戏 ${currentUser.totalGamesPlayed} 次</span>
        ${currentUser.streakDays > 1 ? `<span>⚡ 连续${currentUser.streakDays}天</span>` : ''}
      </div>
      <div class="menu-buttons">
        <button class="btn btn-adventure btn-xl" data-action="go-world-map"><span class="btn-icon">🗺️</span><span class="btn-text">开始冒险</span><span class="btn-sub">选择关卡闯关</span></button>
        <button class="btn btn-quick btn-lg" data-action="start-setup"><span class="btn-icon">⚡</span><span class="btn-text">自由练习</span><span class="btn-sub">随机练习无限制</span></button>
        <button class="btn btn-shop btn-lg" data-action="go-characters"><span class="btn-icon">🎭</span><span class="btn-text">角色商店</span><span class="btn-sub">解锁新角色</span></button>
      </div>
    </div>
  </div>`
}

// ============== 世界地图 ==============
function renderWorldMap(): string {
  if (!currentUser) return renderUserSelect()
  const worlds = [
    { id: 'world1', emoji: '🌸', name: '加法森林', color: '#ff6699', desc: '加法从这里开始！' },
    { id: 'world2', emoji: '🌟', name: '减法洞穴', color: '#9b59b6', desc: '减法探险之旅！' },
    { id: 'world3', emoji: '✨', name: '乘法水晶矿', color: '#3498db', desc: '开启速算超能力！' },
    { id: 'world4', emoji: '🔮', name: '除法魔法塔', color: '#e67e22', desc: '挑战除法奥秘！' },
    { id: 'world5', emoji: '🏆', name: '大师赛', color: '#e74c3c', desc: '综合挑战速算之王！' },
  ]

  const worldCards = worlds.map(w => {
    const levels = getWorldLevels(w.id)
    const unlocked = currentUser!.levelProgress[w.id] || 0
    const pct = levels.length > 0 ? (unlocked / levels.length) * 100 : 0
    return `<div class="world-card" data-action="select-world" data-world="${w.id}" style="--wc:${w.color}">
      <div class="world-card-inner">
        <div class="wemoji">${w.emoji}</div>
        <div class="winfo"><div class="wname">${w.name}</div><div class="wdesc">${w.desc}</div></div>
        <div class="wbadge">${w.id === 'world5' ? '👑' : '▶️'}</div>
      </div>
      <div class="wprogress"><div class="wfill" style="width:${pct}%;background:${w.color}"></div></div>
      <div class="wfooter"><span class="wtext">已解锁 ${unlocked}/${levels.length} 关</span></div>
    </div>`
  }).join('')

  return `<div class="screen world-map-screen">
    <div class="map-header">
      <button class="btn btn-back" data-action="back-to-menu">← 返回</button>
      <div class="map-title">🗺️ 世界地图</div>
      <div class="map-currencies"><span class="cur-chip">💎 ${currentUser.diamonds}</span><span class="cur-chip">⭐ ${currentUser.stars}</span></div>
    </div>
    <div class="world-list">${worldCards}</div>
  </div>`
}

// ============== 关卡选择 ==============
function renderLevelSelect(): string {
  if (!currentUser || !currentWorldId) return renderWorldMap()
  const worldMeta: Record<string, { emoji: string; name: string; color: string }> = {
    world1: { emoji: '🌸', name: '加法森林', color: '#ff6699' },
    world2: { emoji: '🌟', name: '减法洞穴', color: '#9b59b6' },
    world3: { emoji: '✨', name: '乘法水晶矿', color: '#3498db' },
    world4: { emoji: '🔮', name: '除法魔法塔', color: '#e67e22' },
    world5: { emoji: '🏆', name: '大师赛', color: '#e74c3c' },
  }
  const wm = worldMeta[currentWorldId] || { emoji: '🌍', name: '未知', color: '#888' }
  const levels = getWorldLevels(currentWorldId)
  const user = currentUser!
  const highestUnlocked = user.levelProgress[currentWorldId] || 0

  const levelCards = levels.map(lv => {
    const unlocked = lv.order <= highestUnlocked + 1 || lv.order === 1
    const isBoss = lv.order === 5
    const locked = lv.order > highestUnlocked + 1 && lv.order > 1
    const starsEarned = getLevelStars(lv.id, user.totalCorrect, user.totalCorrect + user.totalWrong)
    const starsDisplay = locked ? '' : starsEarned > 0 ? `⭐×${starsEarned}` : '未通关'
    const difficultyLabel: Record<string, string> = { ADD2to2: '简单', SUB2to2: '简单', ADD2to3: '中等', SUB3to3: '中等', ADD3to4: '困难', SUB3to4: '困难', ADD4to4: '很难', SUB4to4: '很难', MULTIPLY_1to9: '简单', MULTIPLY_5: '中等', MULTIPLY_9: '中等', SQUARE_END5: '中等', MULTIPLY_11: '困难', DIVIDE_5: '中等', COMPENSATE_ADD: '困难', SAME_TENS_DIFF_ONES: '困难', SPECIAL_SQUARE: '困难' }
    const diffColor: Record<string, string> = { '简单': '#27ae60', '中等': '#f39c12', '困难': '#e74c3c', '很难': '#8e44ad' }
    const dc = diffColor[difficultyLabel[lv.difficulty]] || '#888'

    return `<div class="level-card ${locked ? 'locked' : ''} ${isBoss ? 'boss' : ''}" data-action="${locked ? '' : 'play-level'}" data-level="${lv.id}" ${locked ? '' : `style="--lc:${wm.color}"`}>
      <div class="level-num">${isBoss ? '👑' : lv.order}</div>
      <div class="level-info">
        <div class="level-name">${lv.name}</div>
        <div class="level-desc">${lv.description}</div>
        <div class="level-meta">
          <span class="diff-tag" style="background:${dc}22;color:${dc}">${difficultyLabel[lv.difficulty]}</span>
          <span class="q-tag">${lv.questionCount}题</span>
          <span class="t-tag">⏱${lv.timeLimit}s</span>
        </div>
      </div>
      <div class="level-right">
        ${locked ? `<div class="lock-icon">🔒</div><div class="level-cost">⭐${lv.unlockCost}</div>` : `
        <div class="level-stars">${starsEarned > 0 ? '⭐'.repeat(starsEarned) : '☆'.repeat(3)}</div>
        <div class="level-reward">💎${lv.reward.diamonds}</div>`}
      </div>
    </div>`
  }).join('')

  return `<div class="screen level-select-screen">
    <div class="map-header">
      <button class="btn btn-back" data-action="go-world-map">← 世界</button>
      <div class="map-title">${wm.emoji} ${wm.name}</div>
      <div></div>
    </div>
    <div class="level-list">${levelCards}</div>
  </div>`
}

// ============== 角色商店 ==============
function renderCharacters(): string {
  if (!currentUser) return renderUserSelect()
  const user = currentUser!
  const charCards = CHARACTERS.map(c => {
    const owned = user.unlockedCharacters.includes(c.id)
    const active = user.activeCharacter === c.id
    const canAfford = (user.diamonds ?? 0) >= c.cost
    const bonusLabel = c.bonus === 'extra_time' ? `每题+${c.bonusValue}秒` : c.bonus === 'combo_boost' ? `Combo奖励+${Math.round(c.bonusValue * 100)}%` : `所有奖励+${Math.round(c.bonusValue * 100)}%`
    return `<div class="char-card ${active ? 'active' : ''}" style="--cc:${c.id === 'meiledi' ? '#ff6699' : c.id === 'bear' ? '#8B4513' : c.id === 'fox' ? '#e67e22' : '#e74c3c'}">
      <div class="char-emoji-lg">${c.emoji}</div>
      <div class="char-info"><div class="char-name">${c.name}</div><div class="char-desc">${c.description}</div><div class="char-bonus">💡 ${bonusLabel}</div></div>
      <div class="char-action">
        ${active ? '<span class="char-active-tag">使用中</span>' :
          owned ? `<button class="btn btn-sm btn-outline" data-action="select-char" data-char="${c.id}">使用</button>` :
          canAfford ? `<button class="btn btn-sm btn-pink" data-action="buy-char" data-char="${c.id}" data-cost="${c.cost}">💎${c.cost}</button>` :
          `<span class="char-locked">💎${c.cost}</span>`}
      </div>
    </div>`
  }).join('')

  return `<div class="screen character-screen">
    <div class="map-header">
      <button class="btn btn-back" data-action="back-to-menu">← 返回</button>
      <div class="map-title">🎭 角色商店</div>
      <div class="map-currencies"><span class="cur-chip">💎 ${currentUser.diamonds}</span></div>
    </div>
    <div class="char-list">${charCards}</div>
  </div>`
}

// ============== 游戏界面 ==============
function renderGame(): string {
  if (!gameSession || !currentUser) return ''
  const q = gameSession.questions[gameSession.currentIndex]
  const total = gameSession.questions.length
  const currentNum = gameSession.currentIndex + 1
  const progressPct = ((gameSession.currentIndex) / total) * 100
  const num1Str = String(q.num1)
  const num2Str = String(q.num2)
  const isSquare = q.difficulty === 'SQUARE_END5' || q.difficulty === 'SPECIAL_SQUARE'
  const displayNum1 = isSquare ? `${num1Str}<span class="sqexp">²</span>` : num1Str
  const displayNum2 = isSquare ? '' : `<span class="vop">${q.operator}</span><span class="vsp" style="width:${(Math.max(num1Str.length, num2Str.length) - num2Str.length) * 18}px;display:inline-block"></span><span class="vnum">${num2Str}</span>`
  const techniqueTip = TECHNIQUE_TIPS[q.difficulty]
  const { rewardBoost } = getCharacterBonus()
  const levelName = gameSession.levelId ? (getLevelById(gameSession.levelId)?.name || '') : '自由练习'

  return `<div class="screen game-screen ${gameSession.isPaused ? 'paused' : ''}">
    <div class="game-hud">
      <div class="hud-left">
        <span class="level-badge">${gameSession.levelId ? '🎯' : '⚡'} ${levelName}</span>
        <span class="q-badge">${currentNum}/${total}</span>
      </div>
      <div class="hud-right">
        <span class="hud-chip">💎 ${gameSession.earnedDiamonds}</span>
        <span class="hud-chip combo-chip ${gameSession.currentCombo >= 3 ? 'active' : ''}">🔥 ${gameSession.currentCombo}</span>
        <span class="hud-chip">⚡ ${gameSession.streakPoints}</span>
      </div>
    </div>
    <div class="progress-bar-full"><div class="pfill" style="width:${progressPct}%"></div></div>

    <div id="combo-display" class="combo-display"></div>

    <div class="countdown-center">
      <div class="oring">
        <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="cbg"/><circle cx="50" cy="50" r="42" class="cci" style="stroke-dashoffset:${264 - (264 * countdownSeconds / gameSession.timeLimit)}"/></svg>
        <span id="countdown-num" class="cnum ${countdownSeconds <= 5 ? 'urgent' : ''}">${countdownSeconds}</span>
      </div>
    </div>

    <div id="answer-feedback" class="answer-feedback"></div>

    <div class="prob-box">
      <div class="prob-tag">${q.difficulty}</div>
      <div class="vbox ${isSquare ? 'sqbox' : ''}">
        <div class="vrow">${isSquare ? `<span class="vnum sqnum">${displayNum1}</span>` : `<span class="vnum">${displayNum1}</span>`}</div>
        ${!isSquare ? `<div class="vrow"><span class="vop">${q.operator}</span><span class="vsp" style="width:${(Math.max(num1Str.length, num2Str.length) - num2Str.length) * 18}px;display:inline-block"></span><span class="vnum">${num2Str}</span></div>` : ''}
        ${!isSquare ? '<div class="vline"></div>' : ''}
        ${!isSquare ? `<div class="vrow"><span class="vsp" style="width:${Math.max(num1Str.length, num2Str.length) * 18}px;display:inline-block"></span><input type="number" id="answer-input" class="vinput" placeholder="?" inputmode="numeric" /></div>` : `<input type="number" id="answer-input" class="vinput sqinput" placeholder="?" inputmode="numeric" />`}
      </div>
      ${techniqueTip ? `<div class="tip-box">💡 ${techniqueTip}</div>` : ''}
      <div id="technique-steps" class="steps-box" style="display:none"></div>
      ${upgradeSuggestion ? `<div class="upgrade-tip">💡 建议：${upgradeSuggestion}</div>` : ''}
    </div>

    <div class="gcontrols">
      <button class="btn btn-ghost" data-action="pause-game">⏸</button>
      <button class="btn btn-submit btn-lg" data-action="submit-answer">✓ 提交</button>
      <button class="btn btn-ghost" data-action="stop-game">✕</button>
    </div>

    ${gameSession.isPaused ? `<div class="pause-ov">
      <div class="pause-m">
        <h2>⏸ 游戏暂停</h2>
        <div class="pause-stats">
          <span>✅${gameSession.correctCount}</span>
          <span>❌${gameSession.wrongCount}</span>
          <span>🔥${gameSession.maxComboThisGame}最大Combo</span>
        </div>
        <div class="pause-btns">
          <button class="btn btn-primary btn-xl" data-action="resume-game">继续 ▶️</button>
          <button class="btn btn-secondary" data-action="stop-game">退出</button>
        </div>
      </div>
    </div>` : ''}
  </div>`
}

// ============== 结算界面 ==============
function renderSummary(): string {
  if (!gameSession || !currentUser) return ''
  const total = gameSession.correctCount + gameSession.wrongCount
  const rate = total > 0 ? Math.round((gameSession.correctCount / total) * 100) : 0
  const duration = Math.round((Date.now() - gameSession.startTime - gameSession.totalPausedTime) / 1000)
  const earnedStars = gameSession.earnedStars
  const earnedDiamonds = gameSession.earnedDiamonds
  const levelStars = gameSession.levelId ? getLevelStars(gameSession.levelId, gameSession.correctCount, total) : 0
  const levelName = gameSession.levelId ? (getLevelById(gameSession.levelId)?.name || '') : '自由练习'

  const emoji = rate >= 90 ? '🏆' : rate >= 70 ? '🌟' : '💪'
  const title = rate >= 90 ? '完美通关！' : rate >= 70 ? '做得好！' : '继续加油！'
  const starDisplay = gameSession.levelId ? '⭐'.repeat(levelStars) + '☆'.repeat(3 - levelStars) : ''

  return `<div class="screen summary-screen">
    <div class="screen-bg"><img src="${meilediPath}" alt="" class="bg-meiledi" onerror="this.style.display='none'" /></div>
    <div class="panel summary-panel">
      <div class="summary-emoji">${emoji}</div>
      <h2 class="summary-title">${title}</h2>
      ${gameSession.levelId ? `<div class="summary-level">🎯 ${levelName} ${starDisplay}</div>` : '<div class="summary-level">⚡ 自由练习</div>'}

      <div class="summary-grid">
        <div class="sg correct"><div class="sg-num">${gameSession.correctCount}</div><div class="sg-label">答对</div></div>
        <div class="sg wrong"><div class="sg-num">${gameSession.wrongCount}</div><div class="sg-label">答错</div></div>
        <div class="sg rate"><div class="sg-num">${rate}%</div><div class="sg-label">正确率</div></div>
        <div class="sg time"><div class="sg-num">${duration}s</div><div class="sg-label">用时</div></div>
        <div class="sg combo"><div class="sg-num">🔥${gameSession.maxComboThisGame}</div><div class="sg-label">最高Combo</div></div>
      </div>

      ${(earnedStars > 0 || earnedDiamonds > 0) ? `<div class="reward-row">
        ${earnedStars > 0 ? `<span class="reward-chip star">⭐ +${earnedStars} 星星</span>` : ''}
        ${earnedDiamonds > 0 ? `<span class="reward-chip diamond">💎 +${earnedDiamonds} 钻石</span>` : ''}
      </div>` : ''}

      <div class="summary-actions">
        <button class="btn btn-secondary" data-action="return-menu">🏠 主页</button>
        ${gameSession.levelId ? `<button class="btn btn-primary btn-xl" data-action="replay-level" data-level="${gameSession.levelId}">🔄 再来一关</button>` : `<button class="btn btn-primary btn-xl" data-action="start-setup">🔄 再练一次</button>`}
      </div>
    </div>
  </div>`
}

// ============== 事件绑定 ==============
function attachGameListeners() {
  const input = document.getElementById('answer-input') as HTMLInputElement
  if (input) {
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') submitAnswer()
      else if (e.key === ' ') { e.preventDefault(); if (gameSession) speakCurrentQuestion() }
    })
    setTimeout(() => input.focus(), 80)
  }
}

function submitAnswer() {
  const input = document.getElementById('answer-input') as HTMLInputElement
  if (!input) return
  const val = parseInt(input.value.trim(), 10)
  if (isNaN(val)) { input.classList.add('shake'); setTimeout(() => input.classList.remove('shake'), 500); return }
  handleAnswer(val)
  input.value = ''
}

function attachListeners() {
  document.querySelectorAll('[data-action]').forEach(el => { if ((el as HTMLElement).dataset.action) el.addEventListener('click', handleAction) })
}

function handleAction(e: Event) {
  const target = e.currentTarget as HTMLElement
  const action = target.dataset.action
  const id = target.dataset.id

  switch (action) {
    case 'create-user': {
      const input = document.getElementById('new-user-name') as HTMLInputElement
      const name = input?.value.trim()
      if (!name) { input?.classList.add('shake'); setTimeout(() => input?.classList.remove('shake'), 500); return }
      selectUser(createUser(name)); break
    }
    case 'select-user': { const user = users.find(u => u.id === id); if (user) selectUser(user); break }
    case 'delete-user': { e.stopPropagation(); if (confirm('确定删除？数据将丢失！')) deleteUser(id!); break }
    case 'switch-user': { currentUser = null; gameSession = null; if (countdownInterval) clearInterval(countdownInterval); screen = 'user-select'; render(); break }
    case 'back-to-menu': case 'return-menu': { if (countdownInterval) clearInterval(countdownInterval); gameSession = null; currentLevelId = null; screen = 'main-menu'; render(); break }
    case 'go-world-map': { currentWorldId = null; screen = 'world-map'; render(); break }
    case 'select-world': {
      const wid = target.dataset.world || ''
      if (wid) { currentWorldId = wid; screen = 'level-select'; render() }
      break
    }
    case 'play-level': {
      const lid = target.dataset.level || ''
      const level = getLevelById(lid)
      const user = currentUser!
      if (level) {
        const unlocked = level.order <= (user.levelProgress[level.worldId] || 0) + 1 || level.order === 1
        if (unlocked) { startLevelGame(level) }
        else { alert(`需要先通关前面的关卡！解锁需要 ${level.unlockCost} 星星`) }
      }
      break
    }
    case 'replay-level': {
      const lid = target.dataset.level || ''
      const level = getLevelById(lid)
      if (level) startLevelGame(level)
      break
    }
    case 'go-characters': { screen = 'character-screen'; render(); break }
    case 'buy-char': {
      const cid = target.dataset.char || ''; const cost = parseInt(target.dataset.cost || '0')
      const user = currentUser!
      if (user.diamonds >= cost) {
        user.diamonds -= cost
        user.unlockedCharacters.push(cid)
        saveUsers(); render()
        audioManager.play('correct')
      }
      break
    }
    case 'select-char': {
      const cid = target.dataset.char || ''
      const user = currentUser!
      user.activeCharacter = cid; saveUsers(); render()
      break
    }
    case 'start-setup': { selectedCategories = []; screen = 'setup'; render(); break }
    case 'back-from-setup': { screen = 'main-menu'; render(); break }
    case 'do-start-free': {
      const allDiffs: Difficulty[] = []
      const catMap: Record<number, Difficulty[]> = { 0: ['MULTIPLY_1to9'], 1: ['SQUARE_END5', 'MULTIPLY_5', 'MULTIPLY_9', 'MULTIPLY_11', 'DIVIDE_5', 'COMPENSATE_ADD', 'SAME_TENS_DIFF_ONES', 'SPECIAL_SQUARE'], 2: ['ADD2to2', 'SUB2to2'], 3: ['ADD2to3', 'SUB2to3', 'ADD3to3', 'SUB3to3'], 4: ['ADD3to4', 'SUB3to4', 'ADD4to4', 'SUB4to4'] }
      for (const idx of selectedCategories) allDiffs.push(...(catMap[idx] || []))
      if (allDiffs.length === 0) allDiffs.push(currentUser!.difficulty)
      initDiffStats(allDiffs); startFreeGame(allDiffs, selectedQuestionCount as 30 | 50)
      break
    }
    case 'toggle-category': {
      const catIdx = parseInt(target.dataset.cat || '0')
      if (selectedCategories.includes(catIdx)) { selectedCategories = selectedCategories.filter(i => i !== catIdx); target.classList.remove('sel') }
      else { selectedCategories.push(catIdx); target.classList.add('sel') }
      break
    }
    case 'select-qcount': {
      document.querySelectorAll('[data-action="select-qcount"]').forEach(b => b.classList.remove('sel'))
      target.classList.add('sel')
      selectedQuestionCount = parseInt(target.dataset.qc || '20') as 20 | 30 | 50
      break
    }
    case 'submit-answer': { submitAnswer(); break }
    case 'pause-game': { pauseGame(); break }
    case 'resume-game': { resumeGame(); break }
    case 'stop-game': { stopGame(); break }
  }
}

let selectedCategories: number[] = []

// ============== 启动 ==============
init()

