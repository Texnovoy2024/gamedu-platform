
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Play, Square, ChevronRight, CheckCircle2, TrendingUp, Coins, ArrowLeft } from 'lucide-react'
import { playCorrect, playWrong, playVictory, playDefeat } from '../../../utils/gameAudio'

// ─── Qo'shiqlar — Web Audio API bilan melodiya ────────────────────────────────
// Har bir qo'shiq uchun nota ketma-ketligi (Hz) va davomiyligi (ms)
const SONGS = [
  {
    name: "Tug'ilgan kun",
    hint: "Bayram qo'shig'i",
    notes: [
      { f: 264, d: 300 }, { f: 264, d: 300 }, { f: 297, d: 600 }, { f: 264, d: 600 },
      { f: 352, d: 600 }, { f: 330, d: 1200 }, { f: 264, d: 300 }, { f: 264, d: 300 },
      { f: 297, d: 600 }, { f: 264, d: 600 }, { f: 396, d: 600 }, { f: 352, d: 1200 },
    ],
    options: ["Tug'ilgan kun", "Yulduzlar", "Bahor qo'shig'i", "Ona yurt"],
  },
  {
    name: "Do Re Mi",
    hint: "Musiqa darsi qo'shig'i",
    notes: [
      { f: 264, d: 400 }, { f: 297, d: 400 }, { f: 330, d: 400 }, { f: 264, d: 400 },
      { f: 330, d: 400 }, { f: 264, d: 400 }, { f: 330, d: 800 },
      { f: 297, d: 400 }, { f: 330, d: 400 }, { f: 352, d: 400 }, { f: 297, d: 400 },
      { f: 352, d: 400 }, { f: 297, d: 400 }, { f: 352, d: 800 },
    ],
    options: ["Do Re Mi", "Tug'ilgan kun", "Alla", "Musiqa darsi"],
  },
  {
    name: "Alla",
    hint: "Bola uxlatish qo'shig'i",
    notes: [
      { f: 330, d: 600 }, { f: 294, d: 300 }, { f: 330, d: 300 }, { f: 349, d: 600 },
      { f: 330, d: 600 }, { f: 294, d: 600 }, { f: 262, d: 900 },
      { f: 330, d: 600 }, { f: 294, d: 300 }, { f: 330, d: 300 }, { f: 349, d: 600 },
      { f: 392, d: 600 }, { f: 349, d: 600 }, { f: 330, d: 900 },
    ],
    options: ["Alla", "Do Re Mi", "Tug'ilgan kun", "Bahor"],
  },
  {
    name: "Bahor qo'shig'i",
    hint: "Fasl haqida qo'shiq",
    notes: [
      { f: 392, d: 300 }, { f: 392, d: 300 }, { f: 440, d: 600 }, { f: 392, d: 600 },
      { f: 523, d: 600 }, { f: 494, d: 1200 },
      { f: 392, d: 300 }, { f: 392, d: 300 }, { f: 440, d: 600 }, { f: 392, d: 600 },
      { f: 587, d: 600 }, { f: 523, d: 1200 },
    ],
    options: ["Bahor qo'shig'i", "Alla", "Yulduzlar", "Do Re Mi"],
  },
  {
    name: "Yulduzlar",
    hint: "Kecha osmoni haqida",
    notes: [
      { f: 264, d: 400 }, { f: 264, d: 400 }, { f: 396, d: 400 }, { f: 396, d: 400 },
      { f: 440, d: 400 }, { f: 440, d: 400 }, { f: 396, d: 800 },
      { f: 352, d: 400 }, { f: 352, d: 400 }, { f: 330, d: 400 }, { f: 330, d: 400 },
      { f: 297, d: 400 }, { f: 297, d: 400 }, { f: 264, d: 800 },
    ],
    options: ["Yulduzlar", "Bahor qo'shig'i", "Tug'ilgan kun", "Alla"],
  },
  {
    name: "Ona yurt",
    hint: "Vatanparvarlik qo'shig'i",
    notes: [
      { f: 330, d: 400 }, { f: 349, d: 400 }, { f: 392, d: 800 },
      { f: 349, d: 400 }, { f: 330, d: 400 }, { f: 294, d: 800 },
      { f: 262, d: 400 }, { f: 294, d: 400 }, { f: 330, d: 800 },
      { f: 349, d: 400 }, { f: 392, d: 400 }, { f: 440, d: 1200 },
    ],
    options: ["Ona yurt", "Yulduzlar", "Alla", "Bahor qo'shig'i"],
  },
  {
    name: "Musiqa darsi",
    hint: "Maktab qo'shig'i",
    notes: [
      { f: 523, d: 300 }, { f: 494, d: 300 }, { f: 440, d: 300 }, { f: 392, d: 300 },
      { f: 349, d: 300 }, { f: 330, d: 300 }, { f: 294, d: 300 }, { f: 262, d: 600 },
      { f: 294, d: 300 }, { f: 330, d: 300 }, { f: 349, d: 300 }, { f: 392, d: 300 },
      { f: 440, d: 300 }, { f: 494, d: 300 }, { f: 523, d: 600 },
    ],
    options: ["Musiqa darsi", "Do Re Mi", "Ona yurt", "Tug'ilgan kun"],
  },
  {
    name: "Bolalar qo'shig'i",
    hint: "Quvnoq bolalar qo'shig'i",
    notes: [
      { f: 392, d: 300 }, { f: 440, d: 300 }, { f: 494, d: 300 }, { f: 523, d: 600 },
      { f: 494, d: 300 }, { f: 440, d: 300 }, { f: 392, d: 600 },
      { f: 349, d: 300 }, { f: 392, d: 300 }, { f: 440, d: 300 }, { f: 494, d: 600 },
      { f: 440, d: 300 }, { f: 392, d: 300 }, { f: 349, d: 600 },
    ],
    options: ["Bolalar qo'shig'i", "Musiqa darsi", "Yulduzlar", "Bahor qo'shig'i"],
  },
]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// Web Audio API bilan melodiya chalish
function playMelody(
  notes: { f: number; d: number }[],
  onEnd?: () => void
): () => void {
  let stopped = false
  let timeoutIds: ReturnType<typeof setTimeout>[] = []

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    const ac = new AudioCtx()
    let t = ac.currentTime + 0.05

    notes.forEach(({ f, d }) => {
      if (stopped) return
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, t)
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02)
      gain.gain.setValueAtTime(0.25, t + d / 1000 - 0.05)
      gain.gain.linearRampToValueAtTime(0, t + d / 1000)
      osc.start(t)
      osc.stop(t + d / 1000)
      t += d / 1000
    })

    const totalDuration = notes.reduce((s, n) => s + n.d, 0)
    const tid = setTimeout(() => {
      if (!stopped && onEnd) onEnd()
      try { ac.close() } catch { /* */ }
    }, totalDuration + 200)
    timeoutIds.push(tid)

    return () => {
      stopped = true
      timeoutIds.forEach(clearTimeout)
      try { ac.close() } catch { /* */ }
    }
  } catch {
    if (onEnd) onEnd()
    return () => { /* */ }
  }
}

type Phase = 'intro' | 'playing' | 'result'

interface Props {
  onEnd: (xp: number) => void
}

const TOTAL_ROUNDS = 8
const XP_PER_CORRECT = 15

export function MusicQuizGame({ onEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [questions, setQuestions] = useState<typeof SONGS>([])
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [emojiVal, setEmojiVal] = useState('')
  const [playsLeft, setPlaysLeft] = useState(2)
  const stopMelodyRef = useRef<(() => void) | null>(null)

  const startGame = () => {
    const q = shuffle(SONGS).slice(0, TOTAL_ROUNDS).map(song => ({
      ...song,
      options: [...song.options].sort(() => Math.random() - 0.5),
    }))
    setQuestions(q)
    setRound(0)
    setScore(0)
    setCorrect(0)
    setStreak(0)
    setMaxStreak(0)
    setSelected(null)
    setFeedback(null)
    setIsPlaying(false)
    setHasPlayed(false)
    setPlaysLeft(2)
    setPhase('playing')
  }

  const handlePlay = () => {
    if (isPlaying || playsLeft <= 0) return
    const q = questions[round]
    if (!q) return
    setIsPlaying(true)
    setHasPlayed(true)
    setPlaysLeft(p => p - 1)

    stopMelodyRef.current = playMelody(q.notes, () => {
      setIsPlaying(false)
    })
  }

  const handleStop = () => {
    if (stopMelodyRef.current) {
      stopMelodyRef.current()
      stopMelodyRef.current = null
    }
    setIsPlaying(false)
  }

  const handleAnswer = (ans: string) => {
    if (feedback !== null || !hasPlayed) return
    const q = questions[round]
    const isCorrect = ans === q.name
    setSelected(ans)
    setFeedback(isCorrect ? 'correct' : 'wrong')
    handleStop()

    if (isCorrect) {
      const newStreak = streak + 1
      const comboBonus = newStreak >= 3 ? 5 : 0
      setScore(s => Math.min(180, s + XP_PER_CORRECT + comboBonus))
      setStreak(newStreak)
      setMaxStreak(ms => Math.max(ms, newStreak))
      setCorrect(c => c + 1)
      playCorrect()
      setEmojiVal(newStreak >= 3 ? '🎵🔥' : '🎵✅')
    } else {
      setStreak(0)
      playWrong()
      setEmojiVal('🎵❌')
    }

    setShowEmoji(true)
    setTimeout(() => setShowEmoji(false), 900)

    setTimeout(() => {
      const next = round + 1
      if (next >= TOTAL_ROUNDS) {
        const finalXp = Math.min(180, score + (isCorrect ? XP_PER_CORRECT : 0))
        if (finalXp > 90) { playVictory() }
        else { playDefeat() }
        setPhase('result')
      } else {
        setRound(next)
        setSelected(null)
        setFeedback(null)
        setIsPlaying(false)
        setHasPlayed(false)
        setPlaysLeft(2)
      }
    }, 1400)
  }

  const earnedXp = Math.min(180, score)
  const accuracy = TOTAL_ROUNDS > 0 ? Math.round((correct / TOTAL_ROUNDS) * 100) : 0
  const currentQ = questions[round]

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-5">
          <button onClick={() => onEnd(0)} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm">
            <ArrowLeft size={15} /> Orqaga
          </button>
          <div className="rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-sm p-8 space-y-5 text-center">
            {/* Animated music notes */}
            <div className="flex justify-center gap-3 text-3xl mb-2">
              {['🎵','🎶','🎼','🎹','🎸'].map((n, i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -8, 0], rotate: [-5, 5, -5] }}
                  transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                >
                  {n}
                </motion.span>
              ))}
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto shadow-lg">
              <Music size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Qo'shiq Topish</h2>
            <p className="text-slate-400 text-sm">Melodiyani eshitib, qo'shiq nomini toping!</p>
            <div className="space-y-2 text-left">
              {[
                `${TOTAL_ROUNDS} ta melodiya eshittiriladi`,
                "Har to'g'ri javob = 15 XP",
                "Har savolda 2 marta tinglash mumkin",
                "Avval tinglang, keyin javob bering",
                "Ketma-ket to'g'ri = combo bonus",
              ].map(r => (
                <div key={r} className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  {r}
                </div>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Boshlash 🎵
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-4">
          <div className="rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-sm p-8 text-center space-y-4">
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.8, delay: 0.2 }} style={{ fontSize: '56px' }}>
              {accuracy >= 70 ? '🎤' : '🎵'}
            </motion.div>
            <h2 className="text-2xl font-black text-white">O'yin tugadi!</h2>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.3 }} className="text-5xl font-black text-emerald-400">
              +{earnedXp} XP
            </motion.div>
            <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm">
              <Coins size={14} /> +{Math.floor(earnedXp / 10)} tanga
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "To'g'ri", value: `${correct}/${TOTAL_ROUNDS}`, color: 'text-emerald-400' },
              { label: 'Aniqlik', value: `${accuracy}%`, color: 'text-purple-400' },
              { label: 'Max seriya', value: String(maxStreak), color: 'text-orange-400' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => onEnd(earnedXp)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-bold transition-all flex items-center justify-center gap-2"
          >
            <ChevronRight size={18} /> O'yinlarga qaytish
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  if (!currentQ) return null

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)' }}>

      {/* Emoji */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-5xl"
          >
            {emojiVal}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-2" style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Music size={14} />
            <span>{round + 1}/{TOTAL_ROUNDS}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
            <TrendingUp size={14} /> {score} XP
          </div>
          {streak >= 2 && (
            <div className="text-orange-400 text-sm font-bold">🔥 x{streak}</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center pt-2 pb-4 px-4 gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={round}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm space-y-5"
          >
            {/* Music player card */}
            <div className="rounded-2xl border border-purple-500/30 bg-white/5 backdrop-blur-sm p-6 text-center space-y-4">
              {/* Animated waveform */}
              <div className="flex items-center justify-center gap-1 h-12">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 rounded-full bg-purple-400"
                    animate={isPlaying ? {
                      height: [8, 20 + Math.random() * 24, 8],
                    } : { height: 8 }}
                    transition={{
                      duration: 0.4 + Math.random() * 0.3,
                      repeat: isPlaying ? Infinity : 0,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>

              <div>
                <p className="text-white font-bold text-lg">Qo'shiqni toping!</p>
                <p className="text-slate-500 text-xs mt-1">Izoh: {currentQ.hint}</p>
              </div>

              {/* Play/Stop button */}
              <div className="flex items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isPlaying ? handleStop : handlePlay}
                  disabled={playsLeft <= 0 && !isPlaying}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all ${
                    isPlaying
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : playsLeft <= 0
                      ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 shadow-lg shadow-purple-500/30'
                  }`}
                >
                  {isPlaying ? <><Square size={16} /> To'xtatish</> : <><Play size={16} /> Tinglash</>}
                </motion.button>
                <div className={`text-xs font-semibold ${playsLeft > 0 ? 'text-purple-400' : 'text-slate-600'}`}>
                  {playsLeft} marta qoldi
                </div>
              </div>

              {!hasPlayed && (
                <p className="text-xs text-slate-500 animate-pulse">
                  Avval melodiyani tinglang...
                </p>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-2.5">
              {currentQ.options.map((opt, i) => {
                const isSelected = selected === opt
                const isCorrectOpt = opt === currentQ.name
                const colors = ['from-blue-600 to-blue-700', 'from-rose-600 to-rose-700', 'from-yellow-600 to-yellow-700', 'from-emerald-600 to-emerald-700']
                let cls = hasPlayed
                  ? `bg-gradient-to-r ${colors[i]} hover:brightness-110 cursor-pointer`
                  : `bg-gradient-to-r ${colors[i]} opacity-40 cursor-not-allowed`
                if (feedback) {
                  if (isCorrectOpt) cls = 'bg-emerald-500 ring-2 ring-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                  else if (isSelected) cls = 'bg-rose-700 opacity-70'
                  else cls = `bg-gradient-to-r ${colors[i]} opacity-30`
                }
                return (
                  <motion.button
                    key={opt}
                    whileHover={hasPlayed && !feedback ? { scale: 1.04, y: -2 } : {}}
                    whileTap={hasPlayed && !feedback ? { scale: 0.96 } : {}}
                    onClick={() => hasPlayed && !feedback && handleAnswer(opt)}
                    disabled={!hasPlayed || !!feedback}
                    className={`${cls} rounded-xl py-3 px-3 text-white text-sm font-semibold transition-all text-center`}
                  >
                    {opt}
                  </motion.button>
                )
              })}
            </div>

            {/* Feedback */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center text-sm font-bold ${feedback === 'correct' ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {feedback === 'correct' ? `✓ To'g'ri! Bu "${currentQ.name}"` : `✗ To'g'ri javob: "${currentQ.name}"`}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
