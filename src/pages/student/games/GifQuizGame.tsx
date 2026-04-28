
import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion'
import { Film, ChevronRight, CheckCircle2, TrendingUp, Coins, ArrowLeft } from 'lucide-react'
import { playCorrect, playWrong, playCombo, playVictory, playDefeat } from '../../../utils/gameAudio'
import type { MascotMood } from '../MiniGamesPage'
import { AvatarSVG } from '../MiniGamesPage'

// ─── GIF ma'lumotlar bazasi ───────────────────────────────────────────────────
// Tenor.com dan bepul GIF URLlar — hech qanday API key kerak emas
const GIF_QUESTIONS = [
  {
    gif: 'https://media.tenor.com/images/fb832e8b7a5e5e5e5e5e5e5e5e5e5e5e/tenor.gif',
    // Fallback: CSS animatsiya bilan o'zimiz yasaymiz
    type: 'css',
    animation: 'bounce',
    emoji: '⚽',
    label: 'Futbol',
    options: ['Futbol', 'Basketbol', 'Tennis', 'Suzish'],
    correct: 'Futbol',
    color: '#22c55e',
  },
  {
    type: 'css',
    animation: 'spin',
    emoji: '🌍',
    label: 'Yer aylanishi',
    options: ['Yer aylanishi', 'Quyosh', 'Oy', 'Yulduz'],
    correct: 'Yer aylanishi',
    color: '#3b82f6',
  },
  {
    type: 'css',
    animation: 'wave',
    emoji: '🌊',
    label: 'To\'lqin',
    options: ['To\'lqin', 'Shamol', 'Yomg\'ir', 'Qor'],
    correct: 'To\'lqin',
    color: '#06b6d4',
  },
  {
    type: 'css',
    animation: 'fire',
    emoji: '🔥',
    label: 'Olov',
    options: ['Olov', 'Quyosh', 'Yulduz', 'Chaqmoq'],
    correct: 'Olov',
    color: '#f97316',
  },
  {
    type: 'css',
    animation: 'heart',
    emoji: '❤️',
    label: 'Yurak',
    options: ['Yurak', 'Gul', 'Olma', 'Qo\'ng\'iroq'],
    correct: 'Yurak',
    color: '#ef4444',
  },
  {
    type: 'css',
    animation: 'rocket',
    emoji: '🚀',
    label: 'Raketa',
    options: ['Raketa', 'Samolyot', 'Kema', 'Mashina'],
    correct: 'Raketa',
    color: '#8b5cf6',
  },
  {
    type: 'css',
    animation: 'rain',
    emoji: '🌧️',
    label: 'Yomg\'ir',
    options: ['Yomg\'ir', 'Qor', 'Shamol', 'Momaqaldiroq'],
    correct: 'Yomg\'ir',
    color: '#64748b',
  },
  {
    type: 'css',
    animation: 'star',
    emoji: '⭐',
    label: 'Yulduz',
    options: ['Yulduz', 'Quyosh', 'Oy', 'Komet'],
    correct: 'Yulduz',
    color: '#eab308',
  },
  {
    type: 'css',
    animation: 'butterfly',
    emoji: '🦋',
    label: 'Kapalak',
    options: ['Kapalak', 'Qush', 'Ari', 'Chivin'],
    correct: 'Kapalak',
    color: '#a855f7',
  },
  {
    type: 'css',
    animation: 'snow',
    emoji: '❄️',
    label: 'Qor',
    options: ['Qor', 'Yomg\'ir', 'Dol', 'Tuman'],
    correct: 'Qor',
    color: '#bae6fd',
  },
  {
    type: 'css',
    animation: 'lightning',
    emoji: '⚡',
    label: 'Chaqmoq',
    options: ['Chaqmoq', 'Olov', 'Quyosh', 'Yulduz'],
    correct: 'Chaqmoq',
    color: '#fbbf24',
  },
  {
    type: 'css',
    animation: 'fish',
    emoji: '🐟',
    label: 'Baliq',
    options: ['Baliq', 'Qush', 'Ilon', 'Qurbaqa'],
    correct: 'Baliq',
    color: '#0ea5e9',
  },
]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// CSS animatsiya bilan GIF o'rnini bosuvchi komponent
function AnimatedEmoji({ animation, emoji, color }: { animation: string; emoji: string; color: string }) {
  const animations: Record<string, TargetAndTransition> = {
    bounce:    { y: [0, -30, 0, -20, 0], transition: { duration: 0.8, repeat: Infinity } },
    spin:      { rotate: [0, 360], transition: { duration: 2, repeat: Infinity, ease: 'linear' } },
    wave:      { x: [-20, 20, -20], y: [0, -10, 0], transition: { duration: 1.5, repeat: Infinity } },
    fire:      { scale: [1, 1.2, 0.9, 1.1, 1], rotate: [-5, 5, -3, 3, 0], transition: { duration: 0.6, repeat: Infinity } },
    heart:     { scale: [1, 1.3, 1, 1.2, 1], transition: { duration: 0.8, repeat: Infinity } },
    rocket:    { y: [0, -40, 0], x: [0, 10, 0], rotate: [-5, 5, -5], transition: { duration: 1.2, repeat: Infinity } },
    rain:      { y: [0, 20, 0], opacity: [1, 0.5, 1], transition: { duration: 0.8, repeat: Infinity } },
    star:      { rotate: [0, 180, 360], scale: [1, 1.3, 1], transition: { duration: 1.5, repeat: Infinity } },
    butterfly: { x: [-15, 15, -15], y: [-10, 10, -10], rotate: [-10, 10, -10], transition: { duration: 1.8, repeat: Infinity } },
    snow:      { y: [0, 30, 0], x: [-10, 10, -10], rotate: [0, 360], transition: { duration: 2, repeat: Infinity, ease: 'linear' } },
    lightning: { opacity: [1, 0.2, 1, 0.3, 1], scale: [1, 1.2, 1], transition: { duration: 0.4, repeat: Infinity } },
    fish:      { x: [-20, 20, -20], y: [-5, 5, -5], transition: { duration: 1.5, repeat: Infinity } },
  }

  return (
    <div
      className="w-full h-48 rounded-2xl flex items-center justify-center relative overflow-hidden"
      style={{ background: `radial-gradient(circle, ${color}30 0%, ${color}10 60%, transparent 100%)` }}
    >
      {/* Background particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full opacity-30"
          style={{ background: color, left: `${10 + i * 11}%`, top: `${20 + (i % 3) * 25}%` }}
          animate={{ y: [-5, 5, -5], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      {/* Main emoji */}
      <motion.div
        animate={animations[animation] || animations.bounce}
        style={{ fontSize: '80px', filter: `drop-shadow(0 0 20px ${color})` }}
      >
        {emoji}
      </motion.div>
    </div>
  )
}

type Phase = 'intro' | 'playing' | 'result'

interface Props {
  onEnd: (xp: number) => void
}

const TOTAL_ROUNDS = 10
const XP_PER_CORRECT = 12
const TIME_PER_ROUND = 8

export function GifQuizGame({ onEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [questions, setQuestions] = useState<typeof GIF_QUESTIONS>([])
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND)
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle')
  const [showEmoji, setShowEmoji] = useState(false)
  const [emojiVal, setEmojiVal] = useState('')

  const startGame = () => {
    setQuestions(shuffle(GIF_QUESTIONS).slice(0, TOTAL_ROUNDS))
    setRound(0)
    setScore(0)
    setCorrect(0)
    setStreak(0)
    setMaxStreak(0)
    setSelected(null)
    setFeedback(null)
    setTimeLeft(TIME_PER_ROUND)
    setMascotMood('thinking')
    setPhase('playing')
  }

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return
    if (timeLeft <= 0) {
      handleAnswer(null)
      return
    }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, phase, feedback])

  // Reset timer on round change
  useEffect(() => {
    if (phase === 'playing') {
      setTimeLeft(TIME_PER_ROUND)
      setSelected(null)
      setFeedback(null)
    }
  }, [round, phase])

  const handleAnswer = (ans: string | null) => {
    if (feedback !== null) return
    const q = questions[round]
    const isCorrect = ans === q?.correct
    setSelected(ans)
    setFeedback(isCorrect ? 'correct' : 'wrong')

    if (isCorrect) {
      const speedBonus = Math.round((timeLeft / TIME_PER_ROUND) * 6)
      const newStreak = streak + 1
      const comboBonus = newStreak >= 3 ? 5 : 0
      setScore(s => s + XP_PER_CORRECT + speedBonus + comboBonus)
      setStreak(newStreak)
      setMaxStreak(ms => Math.max(ms, newStreak))
      setCorrect(c => c + 1)
      if (newStreak >= 3) { playCombo(); setMascotMood('excited'); setEmojiVal('🔥') }
      else { playCorrect(); setMascotMood('happy'); setEmojiVal('✅') }
    } else {
      setStreak(0)
      playWrong()
      setMascotMood('sad')
      setEmojiVal(ans === null ? '⏰' : '❌')
    }

    setShowEmoji(true)
    setTimeout(() => setShowEmoji(false), 900)

    setTimeout(() => {
      const next = round + 1
      if (next >= TOTAL_ROUNDS) {
        const finalXp = Math.min(150, score + (isCorrect ? XP_PER_CORRECT : 0))
        if (finalXp > 70) { playVictory(); setMascotMood('victory') }
        else { playDefeat(); setMascotMood('sad') }
        setPhase('result')
      } else {
        setRound(next)
        setMascotMood('thinking')
      }
    }, 1200)
  }

  const earnedXp = Math.min(150, score)
  const accuracy = TOTAL_ROUNDS > 0 ? Math.round((correct / TOTAL_ROUNDS) * 100) : 0
  const currentQ = questions[round]
  const timerPct = (timeLeft / TIME_PER_ROUND) * 100
  const timerColor = timeLeft > 5 ? 'bg-emerald-500' : timeLeft > 2 ? 'bg-yellow-500' : 'bg-rose-500'

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #0a1a2e 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-5">
          <button onClick={() => onEnd(0)} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm">
            <ArrowLeft size={15} /> Orqaga
          </button>
          <div className="rounded-3xl border border-pink-500/30 bg-white/5 backdrop-blur-sm p-8 space-y-5 text-center">
            {/* Preview animations */}
            <div className="flex justify-center gap-4 text-4xl mb-2">
              {['⚽','🌍','🔥','⭐','🦋'].map((e, i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -8, 0], rotate: [-5, 5, -5] }}
                  transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
                >
                  {e}
                </motion.span>
              ))}
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center mx-auto shadow-lg">
              <Film size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">GIF Topish</h2>
            <p className="text-slate-400 text-sm">Harakatlanuvchi animatsiyani ko'rib, nima ekanini toping!</p>
            <div className="space-y-2 text-left">
              {[
                `${TOTAL_ROUNDS} ta animatsiya ko'rsatiladi`,
                "Har to'g'ri javob = 12 XP",
                "Tezroq javob = bonus XP",
                `Har savolga ${TIME_PER_ROUND} soniya`,
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
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:brightness-110 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Boshlash 🎬
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
        style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #0a1a2e 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-4">
          <div className="rounded-3xl border border-pink-500/30 bg-white/5 backdrop-blur-sm p-8 text-center space-y-4">
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.8, delay: 0.2 }} style={{ fontSize: '56px' }}>
              {accuracy >= 70 ? '🎬' : '📽️'}
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
              { label: 'Aniqlik', value: `${accuracy}%`, color: 'text-pink-400' },
              { label: 'Max streak', value: String(maxStreak), color: 'text-orange-400' },
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
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:brightness-110 text-white font-bold transition-all flex items-center justify-center gap-2"
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
      style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #0a1a2e 100%)' }}>

      {/* Emoji reaction */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: 1, y: -30 }}
            exit={{ opacity: 0, y: -80 }}
            transition={{ duration: 0.5 }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-7xl"
          >
            {emojiVal}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot */}
      <div className="fixed bottom-20 right-3 z-40">
        <AvatarSVG mood={mascotMood} />
      </div>

      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Film size={14} />
          <span>{round + 1}/{TOTAL_ROUNDS}</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
          <TrendingUp size={14} /> {score} XP
        </div>
        {streak >= 2 && (
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.3 }} className="text-orange-400 text-sm font-bold">
            🔥 x{streak}
          </motion.div>
        )}
      </div>

      {/* Timer */}
      <div className="px-4 mb-2">
        <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/5">
          <motion.div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPct}%` }} />
        </div>
        <div className={`text-right text-xs mt-1 font-bold ${timeLeft <= 2 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
          {timeLeft}s
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-5">
        <div className="w-full max-w-xs space-y-5">
          {/* Animated GIF */}
          <AnimatePresence mode="wait">
            <motion.div
              key={round}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl overflow-hidden border-4 transition-all ${
                feedback === 'correct' ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]' :
                feedback === 'wrong' ? 'border-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]' :
                'border-white/20'
              }`}
            >
              <AnimatedEmoji
                animation={currentQ.animation}
                emoji={currentQ.emoji}
                color={currentQ.color}
              />
            </motion.div>
          </AnimatePresence>

          <p className="text-white font-bold text-lg text-center">Bu nima?</p>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {currentQ.options.map((opt, i) => {
              const isSelected = selected === opt
              const isCorrectOpt = opt === currentQ.correct
              const colors = ['from-blue-600 to-blue-700', 'from-rose-600 to-rose-700', 'from-yellow-600 to-yellow-700', 'from-emerald-600 to-emerald-700']
              let cls = `bg-gradient-to-r ${colors[i]} hover:brightness-110`
              if (feedback) {
                if (isCorrectOpt) cls = 'bg-emerald-500 ring-2 ring-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                else if (isSelected) cls = 'bg-rose-700 opacity-70'
                else cls = `bg-gradient-to-r ${colors[i]} opacity-30`
              }
              return (
                <motion.button
                  key={opt}
                  whileHover={!feedback ? { scale: 1.04, y: -2 } : {}}
                  whileTap={!feedback ? { scale: 0.96 } : {}}
                  onClick={() => !feedback && handleAnswer(opt)}
                  disabled={!!feedback}
                  className={`${cls} rounded-xl py-3 px-3 text-white text-sm font-semibold transition-all text-center`}
                >
                  {opt}
                </motion.button>
              )
            })}
          </div>

          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center text-sm font-bold ${feedback === 'correct' ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {feedback === 'correct' ? `✓ To'g'ri! Bu "${currentQ.correct}"` : `✗ To'g'ri javob: "${currentQ.correct}"`}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
