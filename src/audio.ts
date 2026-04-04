type SoundName = 'correct' | 'incorrect'

class AudioManager {
  private sounds: Map<SoundName, HTMLAudioElement> = new Map()
  private fallback: HTMLAudioElement | null = null
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return

    // 尝试从 Electron 加载音频文件
    const soundFiles: Record<SoundName, string> = {
      correct: 'correct.mp3',
      incorrect: 'incorrect.mp3',
    }

    for (const [name, file] of Object.entries(soundFiles)) {
      try {
        const result = await window.electronAPI?.getAudioBase64(file)
        if (result?.success && result.data) {
          const audio = new Audio(result.data)
          audio.volume = 0.8
          this.sounds.set(name as SoundName, audio)
        }
      } catch {
        // 文件不存在，静默跳过
      }
    }

    // 创建 Web Audio API 回退（生成简单的提示音）
    this.createFallbackAudio()

    this.initialized = true
  }

  private createFallbackAudio(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.fallback = null as any

      // 直接用 HTMLAudioElement + Data URI 更简单
      // 这里使用内联的 base64 音频（小声音效果）
      this.fallback = new Audio()
    } catch {
      // 完全静默回退
    }
  }

  async play(name: SoundName): Promise<void> {
    if (!this.initialized) await this.init()

    const audio = this.sounds.get(name)
    if (audio) {
      try {
        audio.currentTime = 0
        await audio.play()
        return
      } catch {
        // fallback
      }
    }

    // 回退：使用 Web Audio API 生成简单音调
    this.playTone(name === 'correct' ? 880 : 220, name === 'correct' ? 0.3 : 0.4)
  }

  private playTone(frequency: number, duration: number): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch {
      // 完全静默
    }
  }
}

export const audioManager = new AudioManager()
