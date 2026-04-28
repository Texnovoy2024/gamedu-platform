
// ─── Web Audio API — hech qanday fayl kerak emas ─────────────────────────────

let ctx: AudioContext | null = null
export let isMuted = false
export function setMusicMuted(val: boolean) { isMuted = val }

function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return ctx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.3,
  fadeOut = true
) {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ac.currentTime)
    gain.gain.setValueAtTime(volume, ac.currentTime)
    if (fadeOut) gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + duration)
  } catch { /* silent fail */ }
}

// ✅ To'g'ri javob — yuqori, quvnoq ton
export function playCorrect() {
  playTone(523, 0.1, 'sine', 0.3)
  setTimeout(() => playTone(659, 0.1, 'sine', 0.3), 80)
  setTimeout(() => playTone(784, 0.2, 'sine', 0.35), 160)
}

// ❌ Noto'g'ri javob — past, xira ton
export function playWrong() {
  playTone(200, 0.15, 'sawtooth', 0.2)
  setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.15), 100)
}

// 🔥 Streak / combo — quvnoq fanfar
export function playCombo() {
  ;[523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.12, 'sine', 0.25), i * 70)
  })
}

// ⏰ Vaqt tugayapti — tez-tez beep
export function playTick() {
  playTone(880, 0.05, 'square', 0.15, false)
}

// 🏆 O'yin tugadi — g'alaba musiqasi
export function playVictory() {
  const notes = [523, 659, 784, 659, 784, 1047]
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.18, 'sine', 0.3), i * 100)
  })
}

// 💀 O'yin tugadi — mag'lubiyat
export function playDefeat() {
  ;[400, 350, 300, 250].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.2, 'sawtooth', 0.2), i * 120)
  })
}

// 🃏 Karta ochildi
export function playFlip() {
  playTone(440, 0.08, 'sine', 0.15)
}

// 🎯 Nishon urildi
export function playHit() {
  playTone(660, 0.05, 'sine', 0.2)
  setTimeout(() => playTone(880, 0.1, 'sine', 0.25), 50)
}

// ⏱ Countdown beep
export function playCountdown() {
  playTone(440, 0.08, 'sine', 0.2, false)
}

// ─── BACKGROUND MUSIC ENGINE ─────────────────────────────────────────────────
// Web Audio API bilan procedural musiqa — hech qanday fayl kerak emas

let bgMusicNodes: { stop: () => void }[] = []
let bgMusicRunning = false

function stopBgMusic() {
  bgMusicNodes.forEach(n => { try { n.stop() } catch { /* ignore */ } })
  bgMusicNodes = []
  bgMusicRunning = false
}

function scheduleNote(
  ac: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  vol = 0.08,
  type: OscillatorType = 'sine'
) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.02)
  gain.gain.setValueAtTime(vol, startTime + duration - 0.05)
  gain.gain.linearRampToValueAtTime(0, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration)
  bgMusicNodes.push({ stop: () => { try { osc.stop() } catch { /* */ } } })
}

// ── LOBBY MUSIC — quvnoq, energetik ──────────────────────────────────────────
export function playLobbyMusic() {
  if (isMuted) return
  stopBgMusic()
  bgMusicRunning = true
  try {
    const ac = getCtx()
    const bpm = 128
    const beat = 60 / bpm
    const loopLen = beat * 16
    const now = ac.currentTime + 0.1

    // Melody — C major pentatonic: C D E G A
    const melody = [523, 587, 659, 784, 880, 784, 659, 587, 523, 659, 784, 880, 784, 659, 523, 523]
    const melodyRhythm = [1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1]

    function scheduleLoop(startAt: number) {
      if (!bgMusicRunning) return
      let t = startAt
      // Bass line
      const bass = [131, 131, 147, 131, 131, 147, 165, 147]
      bass.forEach((f, i) => {
        scheduleNote(ac, f, t + i * beat * 2, beat * 1.8, 0.12, 'triangle')
      })
      // Melody
      let mt = startAt
      melody.forEach((f, i) => {
        const dur = melodyRhythm[i] * beat
        scheduleNote(ac, f, mt, dur * 0.85, 0.07, 'sine')
        mt += dur
      })
      // Hi-hat pattern
      for (let i = 0; i < 16; i++) {
        scheduleNote(ac, 8000 + Math.random() * 2000, t + i * beat * 0.5, 0.04, 0.03, 'square')
      }
      // Schedule next loop
      setTimeout(() => { if (bgMusicRunning) scheduleLoop(startAt + loopLen) }, (loopLen - 0.5) * 1000)
    }

    scheduleLoop(now)
  } catch { /* silent fail */ }
}

// ── BLITZ QUIZ MUSIC — tez, intensiv ─────────────────────────────────────────
export function playBlitzMusic() {
  if (isMuted) return
  stopBgMusic()
  bgMusicRunning = true
  try {
    const ac = getCtx()
    const bpm = 160
    const beat = 60 / bpm
    const now = ac.currentTime + 0.1

    // Fast arpeggio: Am pentatonic
    const arp = [220, 277, 330, 415, 440, 415, 330, 277]

    function scheduleLoop(startAt: number) {
      if (!bgMusicRunning) return
      let t = startAt
      // Arpeggio x2
      for (let rep = 0; rep < 2; rep++) {
        arp.forEach((f, i) => {
          scheduleNote(ac, f, t + i * beat * 0.5, beat * 0.4, 0.06, 'sawtooth')
        })
        t += beat * 4
      }
      // Pulse bass
      for (let i = 0; i < 8; i++) {
        scheduleNote(ac, 110, startAt + i * beat, beat * 0.7, 0.1, 'triangle')
      }
      setTimeout(() => { if (bgMusicRunning) scheduleLoop(startAt + beat * 8) }, (beat * 8 - 0.3) * 1000)
    }

    scheduleLoop(now)
  } catch { /* silent fail */ }
}

// ── MATH CHAIN MUSIC — ritmik, konsentratsiya ─────────────────────────────────
export function playMathMusic() {
  if (isMuted) return
  stopBgMusic()
  bgMusicRunning = true
  try {
    const ac = getCtx()
    const bpm = 100
    const beat = 60 / bpm
    const now = ac.currentTime + 0.1

    // Steady, methodical pattern — C minor
    const pattern = [261, 311, 349, 392, 349, 311, 261, 233]

    function scheduleLoop(startAt: number) {
      if (!bgMusicRunning) return
      pattern.forEach((f, i) => {
        scheduleNote(ac, f, startAt + i * beat, beat * 0.8, 0.07, 'triangle')
        // Harmony a 5th up
        scheduleNote(ac, f * 1.5, startAt + i * beat, beat * 0.6, 0.04, 'sine')
      })
      // Metronome click
      for (let i = 0; i < 8; i++) {
        scheduleNote(ac, i % 4 === 0 ? 1200 : 800, startAt + i * beat, 0.05, 0.04, 'square')
      }
      setTimeout(() => { if (bgMusicRunning) scheduleLoop(startAt + beat * 8) }, (beat * 8 - 0.3) * 1000)
    }

    scheduleLoop(now)
  } catch { /* silent fail */ }
}

// ── TARGET SHOT MUSIC — action, tez ──────────────────────────────────────────
export function playTargetMusic() {
  if (isMuted) return
  stopBgMusic()
  bgMusicRunning = true
  try {
    const ac = getCtx()
    const bpm = 180
    const beat = 60 / bpm
    const now = ac.currentTime + 0.1

    // Aggressive, driving pattern
    const riff = [196, 196, 220, 196, 175, 196, 220, 247]

    function scheduleLoop(startAt: number) {
      if (!bgMusicRunning) return
      riff.forEach((f, i) => {
        scheduleNote(ac, f, startAt + i * beat, beat * 0.5, 0.09, 'sawtooth')
        scheduleNote(ac, f * 2, startAt + i * beat, beat * 0.3, 0.04, 'square')
      })
      // Driving bass
      for (let i = 0; i < 8; i++) {
        scheduleNote(ac, 98, startAt + i * beat, beat * 0.4, 0.12, 'triangle')
      }
      // Snare on 2 and 4
      ;[1, 3, 5, 7].forEach(i => {
        scheduleNote(ac, 300 + Math.random() * 200, startAt + i * beat, 0.08, 0.05, 'sawtooth')
      })
      setTimeout(() => { if (bgMusicRunning) scheduleLoop(startAt + beat * 8) }, (beat * 8 - 0.3) * 1000)
    }

    scheduleLoop(now)
  } catch { /* silent fail */ }
}

// ── MEMORY MATCH MUSIC — yumshoq, ambient ────────────────────────────────────
export function playMemoryMusic() {
  if (isMuted) return
  stopBgMusic()
  bgMusicRunning = true
  try {
    const ac = getCtx()
    const beat = 0.8 // slow
    const now = ac.currentTime + 0.1

    // Gentle, flowing — C major
    const chords = [
      [261, 329, 392], // C
      [293, 369, 440], // D
      [329, 415, 494], // E
      [349, 440, 523], // F
    ]

    function scheduleLoop(startAt: number) {
      if (!bgMusicRunning) return
      chords.forEach((chord, ci) => {
        chord.forEach((f, fi) => {
          scheduleNote(ac, f, startAt + ci * beat * 2 + fi * 0.08, beat * 1.8, 0.05, 'sine')
        })
      })
      // Soft melody
      const mel = [523, 587, 659, 698, 659, 587, 523, 494]
      mel.forEach((f, i) => {
        scheduleNote(ac, f, startAt + i * beat, beat * 0.9, 0.06, 'sine')
      })
      setTimeout(() => { if (bgMusicRunning) scheduleLoop(startAt + beat * 8) }, (beat * 8 - 0.3) * 1000)
    }

    scheduleLoop(now)
  } catch { /* silent fail */ }
}

export { stopBgMusic }
