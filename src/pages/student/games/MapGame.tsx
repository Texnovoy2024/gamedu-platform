import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ChevronRight, CheckCircle2, TrendingUp, Coins, ArrowLeft, Globe2 } from 'lucide-react'
import { playCorrect, playWrong, playCombo, playVictory, playDefeat } from '../../../utils/gameAudio'

// ─── Mamlakatlar va poytaxtlar ────────────────────────────────────────────────
const COUNTRIES = [
  // O'zbekiston va qo'shni davlatlar
  { name: "O'zbekiston", capital: 'Toshkent', region: 'Markaziy Osiyo', emoji: '🇺🇿', color: '#0099ff', x: 65, y: 40 },
  { name: 'Qozog\'iston', capital: 'Astana', region: 'Markaziy Osiyo', emoji: '🇰🇿', color: '#00ccff', x: 68, y: 35 },
  { name: 'Qirg\'iziston', capital: 'Bishkek', region: 'Markaziy Osiyo', emoji: '🇰🇬', color: '#ff3366', x: 72, y: 42 },
  { name: 'Tojikiston', capital: 'Dushanbe', region: 'Markaziy Osiyo', emoji: '🇹🇯', color: '#009966', x: 70, y: 45 },
  { name: 'Turkmaniston', capital: 'Ashxobod', region: 'Markaziy Osiyo', emoji: '🇹🇲', color: '#00cc66', x: 60, y: 45 },
  
  // Yevropа
  { name: 'Fransiya', capital: 'Parij', region: 'Yevropa', emoji: '🇫🇷', color: '#0055aa', x: 48, y: 35 },
  { name: 'Germaniya', capital: 'Berlin', region: 'Yevropa', emoji: '🇩🇪', color: '#000000', x: 50, y: 33 },
  { name: 'Italiya', capital: 'Rim', region: 'Yevropa', emoji: '🇮🇹', color: '#009246', x: 52, y: 40 },
  { name: 'Ispaniya', capital: 'Madrid', region: 'Yevropa', emoji: '🇪🇸', color: '#aa151b', x: 45, y: 40 },
  { name: 'Buyuk Britaniya', capital: 'London', region: 'Yevropa', emoji: '🇬🇧', color: '#012169', x: 47, y: 32 },
  { name: 'Rossiya', capital: 'Moskva', region: 'Yevropa/Osiyo', emoji: '🇷🇺', color: '#0039a6', x: 58, y: 30 },
  { name: 'Turkiya', capital: 'Ankara', region: 'Yevropa/Osiyo', emoji: '🇹🇷', color: '#e30a17', x: 55, y: 43 },
  
  // Osiyo
  { name: 'Xitoy', capital: 'Pekin', region: 'Osiyo', emoji: '🇨🇳', color: '#de2910', x: 78, y: 40 },
  { name: 'Yaponiya', capital: 'Tokio', region: 'Osiyo', emoji: '🇯🇵', color: '#bc002d', x: 85, y: 42 },
  { name: 'Hindiston', capital: 'Nyu-Dehli', region: 'Osiyo', emoji: '🇮🇳', color: '#ff9933', x: 72, y: 50 },
  { name: 'Janubiy Koreya', capital: 'Seul', region: 'Osiyo', emoji: '🇰🇷', color: '#003478', x: 82, y: 43 },
  { name: 'Tailand', capital: 'Bangkok', region: 'Osiyo', emoji: '🇹🇭', color: '#a51931', x: 77, y: 52 },
  { name: 'Indoneziya', capital: 'Jakarta', region: 'Osiyo', emoji: '🇮🇩', color: '#ff0000', x: 78, y: 58 },
  
  // Amerika
  { name: 'AQSh', capital: 'Vashington', region: 'Shimoliy Amerika', emoji: '🇺🇸', color: '#3c3b6e', x: 20, y: 40 },
  { name: 'Kanada', capital: 'Ottava', region: 'Shimoliy Amerika', emoji: '🇨🇦', color: '#ff0000', x: 22, y: 30 },
  { name: 'Meksika', capital: 'Mexiko', region: 'Shimoliy Amerika', emoji: '🇲🇽', color: '#006847', x: 18, y: 48 },
  { name: 'Braziliya', capital: 'Braziliya', region: 'Janubiy Amerika', emoji: '🇧🇷', color: '#009c3b', x: 32, y: 62 },
  { name: 'Argentina', capital: 'Buenos-Ayres', region: 'Janubiy Amerika', emoji: '🇦🇷', color: '#74acdf', x: 30, y: 72 },
  
  // Afrika
  { name: 'Misr', capital: 'Qohira', region: 'Afrika', emoji: '🇪🇬', color: '#ce1126', x: 54, y: 50 },
  { name: 'Janubiy Afrika', capital: 'Pretoriya', region: 'Afrika', emoji: '🇿🇦', color: '#007a4d', x: 55, y: 72 },
  { name: 'Nigeriya', capital: 'Abujo', region: 'Afrika', emoji: '🇳🇬', color: '#008751', x: 48, y: 55 },
  
  // Okeaniya
  { name: 'Avstraliya', capital: 'Kanberra', region: 'Okeaniya', emoji: '🇦🇺', color: '#00008b', x: 85, y: 72 },
]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function getOptions(correct: typeof COUNTRIES[0], all: typeof COUNTRIES): string[] {
  // Bir xil region dan variantlar
  const sameRegion = all.filter(c => c.region === correct.region && c.name !== correct.name)
  const others = all.filter(c => c.region !== correct.region && c.name !== correct.name)
  
  let wrong: typeof COUNTRIES = []
  if (sameRegion.length >= 3) {
    wrong = shuffle(sameRegion).slice(0, 3)
  } else {
    wrong = [...sameRegion, ...shuffle(others)].slice(0, 3)
  }
  
  return shuffle([correct.capital, ...wrong.map(c => c.capital)])
}

type Phase = 'intro' | 'playing' | 'result'

interface Props {
  onEnd: (xp: number) => void
}

const TOTAL_ROUNDS = 12
const XP_PER_CORRECT = 12
const TIME_PER_ROUND = 10

export function MapGame({ onEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [questions, setQuestions] = useState<typeof COUNTRIES>([])
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND)
  const [showEmoji, setShowEmoji] = useState(false)
  const [emojiVal, setEmojiVal] = useState('')
  const [options, setOptions] = useState<string[]>([])

  const startGame = () => {
    const q = shuffle(COUNTRIES).slice(0, TOTAL_ROUNDS)
    setQuestions(q)
    setRound(0)
    setScore(0)
    setCorrect(0)
    setStreak(0)
    setMaxStreak(0)
    setSelected(null)
    setFeedback(null)
    setTimeLeft(TIME_PER_ROUND)
    setPhase('playing')
  }

  // Options yangilash
  useEffect(() => {
    if (phase !== 'playing' || questions.length === 0) return
    const q = questions[round]
    if (!q) return
    setOptions(getOptions(q, COUNTRIES))
    setTimeLeft(TIME_PER_ROUND)
    setSelected(null)
    setFeedback(null)
  }, [round, phase, questions])

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

  const handleAnswer = (ans: string | null) => {
    if (feedback !== null) return
    const q = questions[round]
    const isCorrect = ans === q?.capital
    setSelected(ans)
    setFeedback(isCorrect ? 'correct' : 'wrong')

    if (isCorrect) {
      const speedBonus = Math.round((timeLeft / TIME_PER_ROUND) * 6)
      const newStreak = streak + 1
      const comboBonus = newStreak >= 3 ? 5 : 0
      setScore(s => Math.min(160, s + XP_PER_CORRECT + speedBonus + comboBonus))
      setStreak(newStreak)
      setMaxStreak(ms => Math.max(ms, newStreak))
      setCorrect(c => c + 1)
      if (newStreak >= 3) { playCombo(); setEmojiVal('🔥') }
      else { playCorrect(); setEmojiVal('✅') }
    } else {
      setStreak(0)
      playWrong()
      setEmojiVal(ans === null ? '⏰' : '❌')
    }

    setShowEmoji(true)
    setTimeout(() => setShowEmoji(false), 900)

    setTimeout(() => {
      const next = round + 1
      if (next >= TOTAL_ROUNDS) {
        const finalXp = Math.min(160, score + (isCorrect ? XP_PER_CORRECT : 0))
        if (finalXp > 80) { playVictory() }
        else { playDefeat() }
        setPhase('result')
      } else {
        setRound(next)
      }
    }, 1200)
  }

  const earnedXp = Math.min(160, score)
  const accuracy = TOTAL_ROUNDS > 0 ? Math.round((correct / TOTAL_ROUNDS) * 100) : 0
  const currentQ = questions[round]
  const timerPct = (timeLeft / TIME_PER_ROUND) * 100
  const timerColor = timeLeft > 6 ? 'bg-emerald-500' : timeLeft > 3 ? 'bg-yellow-500' : 'bg-rose-500'

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #0a1f2e 0%, #1a3a4e 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-5">
          <button onClick={() => onEnd(0)} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm">
            <ArrowLeft size={15} /> Orqaga
          </button>
          <div className="rounded-3xl border border-teal-500/30 bg-white/5 backdrop-blur-sm p-8 space-y-5 text-center">
            {/* World map preview */}
            <div className="relative w-full h-24 mb-2 rounded-xl overflow-hidden bg-gradient-to-br from-teal-900/30 to-blue-900/30 border border-teal-500/20">
              {/* Simplified world map dots */}
              {shuffle(COUNTRIES).slice(0, 15).map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.6 }}
                  transition={{ delay: i * 0.05 }}
                  className="absolute w-2 h-2 rounded-full bg-teal-400"
                  style={{ left: `${c.x}%`, top: `${c.y}%` }}
                />
              ))}
            </div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center mx-auto shadow-lg">
              <Globe2 size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Xarita O'yini</h2>
            <p className="text-slate-400 text-sm">Mamlakatni xaritada ko'rib, poytaxtini toping!</p>

            <div className="space-y-2 text-left">
              {[
                `${TOTAL_ROUNDS} ta mamlakat ko'rsatiladi`,
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
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:brightness-110 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Boshlash 🗺️
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
        style={{ background: 'linear-gradient(135deg, #0a1f2e 0%, #1a3a4e 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-4">
          <div className="rounded-3xl border border-teal-500/30 bg-white/5 backdrop-blur-sm p-8 text-center space-y-4">
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.8, delay: 0.2 }} style={{ fontSize: '56px' }}>
              {accuracy >= 70 ? '🌍' : '🗺️'}
            </motion.div>
            <h2 className="text-2xl font-black text-white">Sayohat tugadi!</h2>
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
              { label: 'Aniqlik', value: `${accuracy}%`, color: 'text-teal-400' },
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
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:brightness-110 text-white font-bold transition-all flex items-center justify-center gap-2"
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
      style={{ background: 'linear-gradient(135deg, #0a1f2e 0%, #1a3a4e 100%)' }}>

      {/* Emoji reaction */}
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

      {/* Sticky Header + Timer */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-2" style={{ background: 'linear-gradient(135deg, #0a1f2e 0%, #1a3a4e 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Globe2 size={14} />
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
        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden border border-white/5">
          <motion.div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPct}%` }} />
        </div>
        <div className={`text-right text-xs mt-1 font-bold ${timeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
          {timeLeft}s
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center pt-2 pb-4 px-4 gap-5">
        <div className="w-full max-w-sm space-y-5">
          {/* Map display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={round}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl overflow-hidden border-4 transition-all ${
                feedback === 'correct' ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]' :
                feedback === 'wrong' ? 'border-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]' :
                'border-teal-500/30'
              }`}
            >
              {/* Simplified world map with country highlight */}
              <div className="relative w-full h-56 bg-gradient-to-br from-slate-900 to-slate-800">
                {/* Grid lines */}
                <svg className="absolute inset-0 w-full h-full opacity-10">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-teal-400" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Other countries (faded) */}
                {COUNTRIES.filter(c => c.name !== currentQ.name).slice(0, 12).map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.2 }}
                    transition={{ delay: i * 0.03 }}
                    className="absolute w-2 h-2 rounded-full bg-slate-500"
                    style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  />
                ))}

                {/* Current country (highlighted) */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                  className="absolute"
                  style={{ left: `${currentQ.x}%`, top: `${currentQ.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className="relative">
                    {/* Pulsing ring */}
                    <motion.div
                      animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full"
                      style={{ background: `radial-gradient(circle, ${currentQ.color}80 0%, transparent 70%)`, width: '40px', height: '40px', left: '-12px', top: '-12px' }}
                    />
                    
                    {/* Pin */}
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="relative z-10"
                    >
                      <MapPin size={32} className="text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.8)]" fill="currentColor" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Country emoji badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="absolute top-3 left-3 text-4xl drop-shadow-lg"
                >
                  {currentQ.emoji}
                </motion.div>

                {/* Region badge */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-teal-500/30">
                  <span className="text-xs text-teal-300 font-semibold">{currentQ.region}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Question */}
          <div className="text-center space-y-2">
            <p className="text-white font-bold text-xl">{currentQ.name}</p>
            <p className="text-slate-400 text-sm">Poytaxti qaysi shahar?</p>
            {feedback && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm font-semibold ${feedback === 'correct' ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {feedback === 'correct' ? `✓ To'g'ri! ${currentQ.capital}` : `✗ To'g'ri javob: ${currentQ.capital}`}
              </motion.p>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-2.5">
            {options.map((opt, i) => {
              const isSelected = selected === opt
              const isCorrectOpt = opt === currentQ.capital
              const colors = [
                'from-teal-600 to-teal-700',
                'from-cyan-600 to-cyan-700',
                'from-blue-600 to-blue-700',
                'from-emerald-600 to-emerald-700',
              ]
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
        </div>
      </div>
    </div>
  )
}
