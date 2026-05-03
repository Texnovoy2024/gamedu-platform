
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronRight, CheckCircle2, TrendingUp, Coins, ArrowLeft } from 'lucide-react'
import { playCorrect, playWrong, playCombo, playVictory, playDefeat } from '../../../utils/gameAudio'

// ─── Bayroqlar ma'lumotlar bazasi ─────────────────────────────────────────────
// flagcdn.com — bepul, hech qanday API key kerak emas
const FLAGS = [
  { code: 'uz', name: "O'zbekiston",   capital: "Toshkent",    continent: "Osiyo" },
  { code: 'us', name: "AQSh",          capital: "Vashington",  continent: "Amerika" },
  { code: 'gb', name: "Buyuk Britaniya",capital: "London",     continent: "Yevropa" },
  { code: 'de', name: "Germaniya",     capital: "Berlin",      continent: "Yevropa" },
  { code: 'fr', name: "Fransiya",      capital: "Parij",       continent: "Yevropa" },
  { code: 'jp', name: "Yaponiya",      capital: "Tokio",       continent: "Osiyo" },
  { code: 'cn', name: "Xitoy",         capital: "Pekin",       continent: "Osiyo" },
  { code: 'ru', name: "Rossiya",       capital: "Moskva",      continent: "Yevropa" },
  { code: 'br', name: "Braziliya",     capital: "Braziliya",   continent: "Amerika" },
  { code: 'in', name: "Hindiston",     capital: "Nyu-Dehli",   continent: "Osiyo" },
  { code: 'au', name: "Avstraliya",    capital: "Kanberra",    continent: "Avstraliya" },
  { code: 'ca', name: "Kanada",        capital: "Ottava",      continent: "Amerika" },
  { code: 'it', name: "Italiya",       capital: "Rim",         continent: "Yevropa" },
  { code: 'es', name: "Ispaniya",      capital: "Madrid",      continent: "Yevropa" },
  { code: 'tr', name: "Turkiya",       capital: "Ankara",      continent: "Osiyo" },
  { code: 'kz', name: "Qozog'iston",  capital: "Astana",      continent: "Osiyo" },
  { code: 'kg', name: "Qirg'iziston", capital: "Bishkek",     continent: "Osiyo" },
  { code: 'tj', name: "Tojikiston",   capital: "Dushanbe",    continent: "Osiyo" },
  { code: 'tm', name: "Turkmaniston", capital: "Ashxobod",    continent: "Osiyo" },
  { code: 'az', name: "Ozarbayjon",   capital: "Boku",        continent: "Osiyo" },
  { code: 'ge', name: "Gruziya",      capital: "Tbilisi",     continent: "Osiyo" },
  { code: 'kr', name: "Janubiy Koreya",capital: "Seul",       continent: "Osiyo" },
  { code: 'sa', name: "Saudiya Arabistoni",capital: "Ar-Riyod",continent: "Osiyo" },
  { code: 'eg', name: "Misr",         capital: "Qohira",      continent: "Afrika" },
  { code: 'za', name: "Janubiy Afrika",capital: "Pretoriya",  continent: "Afrika" },
  { code: 'ng', name: "Nigeriya",     capital: "Abujo",       continent: "Afrika" },
  { code: 'mx', name: "Meksika",      capital: "Mexiko",      continent: "Amerika" },
  { code: 'ar', name: "Argentina",    capital: "Buenos-Ayres",continent: "Amerika" },
  { code: 'pl', name: "Polsha",       capital: "Varshava",    continent: "Yevropa" },
  { code: 'nl', name: "Niderlandiya", capital: "Amsterdam",   continent: "Yevropa" },
  { code: 'se', name: "Shvetsiya",    capital: "Stokgolm",    continent: "Yevropa" },
  { code: 'no', name: "Norvegiya",    capital: "Oslo",        continent: "Yevropa" },
  { code: 'ch', name: "Shveytsariya", capital: "Bern",        continent: "Yevropa" },
  { code: 'pt', name: "Portugaliya",  capital: "Lissabon",    continent: "Yevropa" },
  { code: 'gr', name: "Gretsiya",     capital: "Afina",       continent: "Yevropa" },
  { code: 'pk', name: "Pokiston",     capital: "Islomobod",   continent: "Osiyo" },
  { code: 'id', name: "Indoneziya",   capital: "Jakarta",     continent: "Osiyo" },
  { code: 'th', name: "Tailand",      capital: "Bangkok",     continent: "Osiyo" },
  { code: 'vn', name: "Vyetnam",      capital: "Xanoy",       continent: "Osiyo" },
  { code: 'ph', name: "Filippin",     capital: "Manila",      continent: "Osiyo" },
]

function flagUrl(code: string) {
  // SVG format — barcha bayroqlar uchun ishonchli ishlaydi
  return `https://flagcdn.com/${code.toLowerCase()}.svg`
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function getOptions(correct: typeof FLAGS[0], all: typeof FLAGS): string[] {
  const wrong = shuffle(all.filter(f => f.code !== correct.code)).slice(0, 3)
  return shuffle([correct, ...wrong]).map(f => f.name)
}

type Phase = 'intro' | 'playing' | 'result'

interface Props {
  onEnd: (xp: number) => void
}

const TOTAL_ROUNDS = 15
const XP_PER_CORRECT = 12
const SPEED_BONUS_MAX = 8

export function FlagQuizGame({ onEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [questions, setQuestions] = useState<typeof FLAGS>([])
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timeLeft, setTimeLeft] = useState(10)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [emojiVal, setEmojiVal] = useState('')

  // O'yin boshlash
  const startGame = () => {
    const q = shuffle(FLAGS).slice(0, TOTAL_ROUNDS)
    setQuestions(q)
    setRound(0)
    setScore(0)
    setStreak(0)
    setMaxStreak(0)
    setCorrect(0)
    setSelected(null)
    setFeedback(null)
    setTimeLeft(10)
    setImgLoaded(false)
    setPhase('playing')
  }

  // Savol o'zgarganda variantlarni yangilash
  useEffect(() => {
    if (phase !== 'playing' || questions.length === 0) return
    const q = questions[round]
    if (!q) return
    setOptions(getOptions(q, FLAGS))
    setImgLoaded(false)
    setTimeLeft(10)
    setSelected(null)
    setFeedback(null)
  }, [round, phase, questions])

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return
    if (timeLeft <= 0) {
      handleAnswer(null) // vaqt tugadi
      return
    }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, phase, feedback])

  const handleAnswer = (ans: string | null) => {
    if (feedback !== null) return
    const q = questions[round]
    const isCorrect = ans === q?.name
    setSelected(ans)
    setFeedback(isCorrect ? 'correct' : 'wrong')

    if (isCorrect) {
      const speedBonus = Math.round((timeLeft / 10) * SPEED_BONUS_MAX)
      const newStreak = streak + 1
      const comboBonus = newStreak >= 3 ? 5 : 0
      const gained = XP_PER_CORRECT + speedBonus + comboBonus
      setScore(s => Math.min(150, s + gained))
      setStreak(newStreak)
      setMaxStreak(ms => Math.max(ms, newStreak))
      setCorrect(c => c + 1)
      playCorrect()
      if (newStreak >= 3) {
        playCombo()
        setEmojiVal('🔥')
      } else {
        setEmojiVal('✅')
      }
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
        const finalXp = Math.min(150, score + (isCorrect ? XP_PER_CORRECT : 0))
        if (finalXp > 75) { playVictory() }
        else { playDefeat() }
        setPhase('result')
      } else {
        setRound(next)
      }
    }, 1200)
  }

  const earnedXp = Math.min(150, score)
  const accuracy = TOTAL_ROUNDS > 0 ? Math.round((correct / TOTAL_ROUNDS) * 100) : 0
  const currentQ = questions[round]

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #0d1b2e 0%, #0a2040 100%)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-5"
        >
          <button onClick={() => onEnd(0)} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm">
            <ArrowLeft size={15} /> Orqaga
          </button>

          <div className="rounded-3xl border border-blue-500/30 bg-white/5 backdrop-blur-sm p-8 space-y-5 text-center">
            {/* Flag preview grid */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {['uz','us','jp','de','fr','gb','cn','ru'].map(code => (
                <motion.img
                  key={code}
                  src={flagUrl(code)}
                  alt={code}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.random() * 0.5 }}
                  className="w-full h-8 object-cover rounded-lg shadow-md border border-white/10"
                />
              ))}
            </div>

            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mx-auto shadow-lg`}>
              <Globe size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Bayroq Tanish</h2>
            <p className="text-slate-400 text-sm">Bayroqni ko'rib, qaysi davlatga tegishli ekanini toping!</p>

            <div className="space-y-2 text-left">
              {[
                `${TOTAL_ROUNDS} ta bayroq ko'rsatiladi`,
                "Har to'g'ri javob = 12 XP",
                "Tezroq javob = bonus XP",
                "Ketma-ket to'g'ri = combo bonus",
                "Har savolga 10 soniya vaqt",
              ].map(r => (
                <div key={r} className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  {r}
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Boshlash 🌍
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const grade =
      accuracy >= 90 ? { label: 'Geografiya ustasi!', color: 'text-yellow-400' }
      : accuracy >= 70 ? { label: 'Zo\'r natija!', color: 'text-emerald-400' }
      : accuracy >= 50 ? { label: 'Yaxshi harakat!', color: 'text-blue-400' }
      : { label: 'Ko\'proq o\'rgan!', color: 'text-rose-400' }

    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #0d1b2e 0%, #0a2040 100%)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-4"
        >
          <div className="rounded-3xl border border-blue-500/30 bg-white/5 backdrop-blur-sm p-8 text-center space-y-4">
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ fontSize: '56px' }}
            >
              {accuracy >= 70 ? '🏆' : '🌍'}
            </motion.div>
            <h2 className="text-2xl font-black text-white">O'yin tugadi!</h2>
            <div className={`text-xl font-bold ${grade.color}`}>{grade.label}</div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
              className="text-5xl font-black text-emerald-400"
            >
              +{earnedXp} XP
            </motion.div>
            <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm">
              <Coins size={14} /> +{Math.floor(earnedXp / 10)} tanga
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "To'g'ri", value: `${correct}/${TOTAL_ROUNDS}`, color: 'text-emerald-400' },
              { label: 'Aniqlik', value: `${accuracy}%`, color: 'text-blue-400' },
              { label: 'Max seriya', value: String(maxStreak), color: 'text-orange-400' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onEnd(earnedXp)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white font-bold transition-all flex items-center justify-center gap-2"
          >
            <ChevronRight size={18} /> O'yinlarga qaytish
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  if (!currentQ) return null

  const timerPct = (timeLeft / 10) * 100
  const timerColor = timeLeft > 6 ? 'bg-emerald-500' : timeLeft > 3 ? 'bg-yellow-500' : 'bg-rose-500'

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0d1b2e 0%, #0a2040 100%)' }}>

      {/* Emoji reaction */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1], opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-5xl"
          >
            {emojiVal}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky header */}
      <div className="sticky top-0 z-30 px-4 pt-3 pb-2"
        style={{ background: 'linear-gradient(135deg, #0d1b2e 0%, #0a2040 100%)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Globe size={14} />
            <span>{round + 1}/{TOTAL_ROUNDS}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
            <TrendingUp size={14} /> {score} XP
          </div>
          {streak >= 2 && (
            <div className="text-orange-400 text-sm font-bold">🔥 x{streak}</div>
          )}
        </div>
        {/* Timer bar */}
        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
        <div className={`text-right text-xs mt-0.5 font-bold ${timeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
          {timeLeft}s
        </div>
      </div>

      {/* Content — scroll bo'lmaydi, compact */}
      <div className="flex-1 flex flex-col items-center px-4 pt-2 pb-4 gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={round}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm"
          >
            {/* Flag */}
            <div className={`rounded-2xl overflow-hidden border-4 shadow-xl transition-all ${
              feedback === 'correct' ? 'border-emerald-400' :
              feedback === 'wrong'   ? 'border-rose-400'    :
              'border-white/20'
            }`}>
              {!imgLoaded && (
                <div className="w-full h-36 bg-white/10 animate-pulse flex items-center justify-center">
                  <Globe size={28} className="text-slate-600" />
                </div>
              )}
              <img
                src={flagUrl(currentQ.code)}
                alt="Bayroq"
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-36 object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0 absolute'}`}
              />
            </div>

            {/* Question */}
            <div className="text-center mt-2">
              <p className="text-white font-bold text-base">Bu qaysi davlatning bayrog'i?</p>
              {feedback && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm mt-1 font-semibold ${feedback === 'correct' ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {feedback === 'correct' ? `✓ ${currentQ.name} — ${currentQ.capital}` : `✗ To'g'ri javob: ${currentQ.name}`}
                </motion.p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Options */}
        <div className="w-full max-w-sm grid grid-cols-2 gap-2.5">
          {options.map((opt, i) => {
            const isSelected = selected === opt
            const isCorrectOpt = opt === currentQ.name
            const colors = [
              'from-blue-600 to-blue-700',
              'from-rose-600 to-rose-700',
              'from-yellow-600 to-yellow-700',
              'from-emerald-600 to-emerald-700',
            ]
            let cls = `bg-gradient-to-r ${colors[i]} hover:brightness-110`
            if (feedback) {
              if (isCorrectOpt) cls = 'bg-emerald-500 ring-2 ring-emerald-300'
              else if (isSelected) cls = 'bg-rose-700 opacity-70'
              else cls = `bg-gradient-to-r ${colors[i]} opacity-30`
            }
            return (
              <motion.button
                key={opt}
                whileTap={!feedback ? { scale: 0.96 } : {}}
                onClick={() => !feedback && handleAnswer(opt)}
                disabled={!!feedback}
                className={`${cls} rounded-xl py-3 px-2 text-white text-sm font-semibold transition-all text-center`}
              >
                {opt}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
