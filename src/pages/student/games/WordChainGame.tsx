
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Type, ChevronRight, CheckCircle2, TrendingUp, Coins, ArrowLeft, Zap } from 'lucide-react'
import { playCorrect, playWrong, playCombo, playVictory, playDefeat } from '../../../utils/gameAudio'

// ─── O'zbek so'zlari banki ────────────────────────────────────────────────────
// Har bir so'z: { word, category, emoji }
const WORD_BANK: { word: string; category: string; emoji: string }[] = [
  // A harfi
  { word: 'ALMA', category: 'Meva', emoji: '🍎' },
  { word: 'ANOR', category: 'Meva', emoji: '🍎' },
  { word: 'APELSIN', category: 'Meva', emoji: '🍊' },
  { word: 'ARZON', category: 'Sifat', emoji: '💰' },
  { word: 'ASAL', category: 'Oziq-ovqat', emoji: '🍯' },
  { word: 'ASKAR', category: 'Kasb', emoji: '💂' },
  // B harfi
  { word: 'BOLA', category: 'Odam', emoji: '👦' },
  { word: 'BAHOR', category: 'Fasl', emoji: '🌸' },
  { word: 'BALIQ', category: 'Hayvon', emoji: '🐟' },
  { word: 'BOG', category: 'Joy', emoji: '🌳' },
  { word: 'BULOQ', category: 'Tabiat', emoji: '💧' },
  // D harfi
  { word: 'DARAXT', category: 'Tabiat', emoji: '🌲' },
  { word: 'DAFTAR', category: 'Buyum', emoji: '📓' },
  { word: 'DARYO', category: 'Tabiat', emoji: '🏞️' },
  { word: 'DEHQON', category: 'Kasb', emoji: '👨‍🌾' },
  // G harfi
  { word: 'GUL', category: 'Tabiat', emoji: '🌸' },
  { word: 'GURUCH', category: 'Oziq-ovqat', emoji: '🍚' },
  { word: 'GILAM', category: 'Buyum', emoji: '🪞' },
  // I harfi
  { word: 'ILON', category: 'Hayvon', emoji: '🐍' },
  { word: 'INSON', category: 'Odam', emoji: '👤' },
  { word: 'ILIM', category: 'Fan', emoji: '📚' },
  // K harfi
  { word: 'KITOB', category: 'Buyum', emoji: '📚' },
  { word: 'KO\'CHA', category: 'Joy', emoji: '🛣️' },
  { word: 'KAPALAK', category: 'Hayvon', emoji: '🦋' },
  { word: 'KEMA', category: 'Transport', emoji: '🚢' },
  { word: 'KINO', category: 'San\'at', emoji: '🎬' },
  // M harfi
  { word: 'MAKTAB', category: 'Bino', emoji: '🏫' },
  { word: 'MUZEY', category: 'Bino', emoji: '🏛️' },
  { word: 'MASHINA', category: 'Transport', emoji: '🚗' },
  { word: 'MEVA', category: 'Oziq-ovqat', emoji: '🍎' },
  { word: 'MUZQAYMOQ', category: 'Oziq-ovqat', emoji: '🍦' },
  // N harfi
  { word: 'NON', category: 'Oziq-ovqat', emoji: '🍞' },
  { word: 'NARVON', category: 'Buyum', emoji: '🪜' },
  // O harfi
  { word: 'OT', category: 'Hayvon', emoji: '🐴' },
  { word: 'OLMA', category: 'Meva', emoji: '🍎' },
  { word: 'OLTIN', category: 'Mineral', emoji: '🥇' },
  { word: 'OSMON', category: 'Tabiat', emoji: '☁️' },
  // Q harfi
  { word: 'QO\'Y', category: 'Hayvon', emoji: '🐑' },
  { word: 'QALAM', category: 'Buyum', emoji: '✏️' },
  { word: 'QUYOSH', category: 'Tabiat', emoji: '☀️' },
  { word: 'QOVOQ', category: 'Sabzavot', emoji: '🎃' },
  // R harfi
  { word: 'RASM', category: 'San\'at', emoji: '🖼️' },
  { word: 'RADIO', category: 'Texnika', emoji: '📻' },
  // S harfi
  { word: 'SABZI', category: 'Sabzavot', emoji: '🥕' },
  { word: 'SAMOLYOT', category: 'Transport', emoji: '✈️' },
  { word: 'SHAHAR', category: 'Joy', emoji: '🏙️' },
  { word: 'SHIRIN', category: 'Sifat', emoji: '🍬' },
  // T harfi
  { word: 'TOG\'', category: 'Tabiat', emoji: '⛰️' },
  { word: 'TARVUZ', category: 'Meva', emoji: '🍉' },
  { word: 'TELEFON', category: 'Texnika', emoji: '📱' },
  { word: 'TRAKTOR', category: 'Transport', emoji: '🚜' },
  // U harfi
  { word: 'UZUM', category: 'Meva', emoji: '🍇' },
  { word: 'URUG\'', category: 'Tabiat', emoji: '🌱' },
  // Y harfi
  { word: 'YOG\'OCH', category: 'Material', emoji: '🪵' },
  { word: 'YULDUZ', category: 'Tabiat', emoji: '⭐' },
  { word: 'YOMG\'IR', category: 'Tabiat', emoji: '🌧️' },
  // Z harfi
  { word: 'ZANJIR', category: 'Buyum', emoji: '⛓️' },
  { word: 'ZAMONAVIY', category: 'Sifat', emoji: '🆕' },
]

// So'z oxirgi harfiga qarab keyingi so'zlarni topish
function getWordsStartingWith(letter: string, used: string[]): typeof WORD_BANK {
  return WORD_BANK.filter(
    w => w.word.startsWith(letter.toUpperCase()) && !used.includes(w.word)
  )
}

// So'zning oxirgi harfini olish
function lastLetter(word: string): string {
  return word[word.length - 1].toUpperCase()
}

type Phase = 'intro' | 'playing' | 'result'

interface Props {
  onEnd: (xp: number) => void
}

const TIME_PER_WORD = 15
const XP_PER_WORD = 10
const MAX_ROUNDS = 12

export function WordChainGame({ onEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [chain, setChain] = useState<string[]>([])
  const [usedWords, setUsedWords] = useState<string[]>([])
  const [currentLetter, setCurrentLetter] = useState('A')
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_WORD)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [emojiVal, setEmojiVal] = useState('')
  const [round, setRound] = useState(0)
  const [hint, setHint] = useState<typeof WORD_BANK[0] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const startGame = () => {
    // Boshlang'ich so'z
    const startWords = WORD_BANK.filter(w => w.word.startsWith('A'))
    const first = startWords[Math.floor(Math.random() * startWords.length)]
    setChain([first.word])
    setUsedWords([first.word])
    setCurrentLetter(lastLetter(first.word))
    setInput('')
    setScore(0)
    setStreak(0)
    setMaxStreak(0)
    setTimeLeft(TIME_PER_WORD)
    setFeedback(null)
    setRound(0)
    setHint(null)
    setPhase('playing')
  }

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return
    if (timeLeft <= 0) {
      handleTimeout()
      return
    }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, phase, feedback])

  useEffect(() => {
    if (phase === 'playing' && feedback === null) {
      inputRef.current?.focus()
      // Hint ko'rsatish (5 soniyadan keyin)
      const t = setTimeout(() => {
        const available = getWordsStartingWith(currentLetter, usedWords)
        if (available.length > 0) {
          setHint(available[Math.floor(Math.random() * available.length)])
        }
      }, 5000)
      return () => clearTimeout(t)
    }
  }, [round, phase, feedback])

  const handleTimeout = () => {
    setFeedback('timeout')
    setFeedbackMsg(`Vaqt tugadi! "${currentLetter}" harfidan boshlanadigan so'z kerak edi`)
    playWrong()
    setEmojiVal('⏰')
    setShowEmoji(true)
    setStreak(0)
    setTimeout(() => setShowEmoji(false), 900)

    setTimeout(() => {
      const next = round + 1
      if (next >= MAX_ROUNDS) {
        finishGame()
      } else {
        // Kompyuter so'z topadi
        const available = getWordsStartingWith(currentLetter, usedWords)
        if (available.length > 0) {
          const compWord = available[0]
          setChain(prev => [...prev, `[${compWord.word}]`])
          setUsedWords(prev => [...prev, compWord.word])
          setCurrentLetter(lastLetter(compWord.word))
        }
        setRound(next)
        setFeedback(null)
        setInput('')
        setHint(null)
        setTimeLeft(TIME_PER_WORD)
      }
    }, 1800)
  }

  const handleSubmit = () => {
    if (feedback !== null) return
    const word = input.trim().toUpperCase()
    if (!word) return

    // Tekshirish
    if (!word.startsWith(currentLetter)) {
      setFeedback('wrong')
      setFeedbackMsg(`So'z "${currentLetter}" harfidan boshlanishi kerak!`)
      playWrong()
      setEmojiVal('❌')
      setStreak(0)
    } else if (usedWords.includes(word)) {
      setFeedback('wrong')
      setFeedbackMsg('Bu so\'z allaqachon ishlatilgan!')
      playWrong()
      setEmojiVal('🔄')
      setStreak(0)
    } else if (!WORD_BANK.find(w => w.word === word)) {
      setFeedback('wrong')
      setFeedbackMsg('Bu so\'z lug\'atda topilmadi!')
      playWrong()
      setEmojiVal('❓')
      setStreak(0)
    } else {
      // To'g'ri!
      const newStreak = streak + 1
      const speedBonus = Math.round((timeLeft / TIME_PER_WORD) * 5)
      const comboBonus = newStreak >= 3 ? 5 : 0
      const gained = XP_PER_WORD + speedBonus + comboBonus
      setScore(s => Math.min(250, s + gained))
      setStreak(newStreak)
      setMaxStreak(ms => Math.max(ms, newStreak))
      setChain(prev => [...prev, word])
      setUsedWords(prev => [...prev, word])
      setCurrentLetter(lastLetter(word))
      setFeedback('correct')
      const wordInfo = WORD_BANK.find(w => w.word === word)
      setFeedbackMsg(`${wordInfo?.emoji || '✅'} ${wordInfo?.category || ''} — +${gained} XP`)
      if (newStreak >= 3) { playCombo(); setEmojiVal('🔥') }
      else { playCorrect(); setEmojiVal('✅') }
    }

    setShowEmoji(true)
    setTimeout(() => setShowEmoji(false), 900)

    setTimeout(() => {
      const next = round + 1
      if (next >= MAX_ROUNDS || feedback === 'correct') {
        if (next >= MAX_ROUNDS) { finishGame(); return }
      }
      setRound(next)
      setFeedback(null)
      setInput('')
      setHint(null)
      setTimeLeft(TIME_PER_WORD)
    }, 1400)
  }

  const finishGame = () => {
    const finalXp = Math.min(250, score)
    if (finalXp > 120) { playVictory() }
    else { playDefeat() }
    setPhase('result')
  }

  const earnedXp = Math.min(250, score)
  const timerPct = (timeLeft / TIME_PER_WORD) * 100
  const timerColor = timeLeft > 8 ? 'bg-emerald-500' : timeLeft > 4 ? 'bg-yellow-500' : 'bg-rose-500'

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2840 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-5">
          <button onClick={() => onEnd(0)} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm">
            <ArrowLeft size={15} /> Orqaga
          </button>
          <div className="rounded-3xl border border-cyan-500/30 bg-white/5 backdrop-blur-sm p-8 space-y-5 text-center">
            {/* Animated letters */}
            <div className="flex justify-center gap-2 text-2xl font-black mb-2">
              {['S','O','Z',' ','Z','A','N','J','I','R','I'].map((l, i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -6, 0], color: ['#94a3b8', '#22d3ee', '#94a3b8'] }}
                  transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
                  className="text-slate-300"
                >
                  {l}
                </motion.span>
              ))}
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center mx-auto shadow-lg">
              <Type size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">So'z Zanjiri</h2>
            <p className="text-slate-400 text-sm">Oldingi so'zning oxirgi harfidan boshlanadigan yangi so'z toping!</p>
            <div className="rounded-xl bg-white/5 p-3 text-sm text-slate-300">
              <span className="text-cyan-400 font-bold">KITOB</span>
              {' → '}
              <span className="text-emerald-400 font-bold">BOG</span>
              {' → '}
              <span className="text-yellow-400 font-bold">GUL</span>
              {' → '}
              <span className="text-purple-400 font-bold">LOLA...</span>
            </div>
            <div className="space-y-2 text-left">
              {[
                `${MAX_ROUNDS} ta so'z zanjiri`,
                "Har to'g'ri so'z = 10 XP",
                "Tezroq javob = bonus XP",
                `Har savolga ${TIME_PER_WORD} soniya`,
                "5 soniyadan keyin maslahat beriladi",
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
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Boshlash 🔤
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
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2840 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-4">
          <div className="rounded-3xl border border-cyan-500/30 bg-white/5 backdrop-blur-sm p-8 text-center space-y-4">
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.8, delay: 0.2 }} style={{ fontSize: '56px' }}>
              {earnedXp > 80 ? '🏆' : '📚'}
            </motion.div>
            <h2 className="text-2xl font-black text-white">Zanjir tugadi!</h2>
            <div className="text-sm text-slate-400">
              Zanjir: {chain.slice(-5).join(' → ')}
            </div>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.3 }} className="text-5xl font-black text-emerald-400">
              +{earnedXp} XP
            </motion.div>
            <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm">
              <Coins size={14} /> +{Math.floor(earnedXp / 10)} tanga
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "So'zlar", value: String(chain.length), color: 'text-cyan-400' },
              { label: 'Uzunlik', value: String(chain.length), color: 'text-blue-400' },
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
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-bold transition-all flex items-center justify-center gap-2"
          >
            <ChevronRight size={18} /> O'yinlarga qaytish
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  const lastWord = chain[chain.length - 1]?.replace(/[\[\]]/g, '') || ''

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2840 100%)' }}>

      {/* Emoji */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: 1, y: -30 }}
            exit={{ opacity: 0, y: -80 }}
            transition={{ duration: 0.5 }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-6xl"
          >
            {emojiVal}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Type size={14} />
          <span>{round + 1}/{MAX_ROUNDS}</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
          <TrendingUp size={14} /> {score} XP
        </div>
        {streak >= 2 && (
          <div className="text-orange-400 text-sm font-bold">🔥 x{streak}</div>
        )}
      </div>

      {/* Timer */}
      <div className="px-4 mb-2">
        <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/5">
          <motion.div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPct}%` }} />
        </div>
        <div className={`text-right text-xs mt-1 font-bold ${timeLeft <= 4 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
          {timeLeft}s
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <div className="w-full max-w-xs space-y-4">

          {/* Chain display */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-slate-500 mb-2">Zanjir:</div>
            <div className="flex flex-wrap gap-1.5">
              {chain.slice(-6).map((w, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    w.startsWith('[') ? 'bg-slate-700 text-slate-400' : 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {w.replace(/[\[\]]/g, '')}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Current challenge */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 text-center space-y-2">
            <div className="text-slate-400 text-sm">Oxirgi so'z:</div>
            <div className="text-2xl font-black text-white">{lastWord}</div>
            <div className="flex items-center justify-center gap-2">
              <div className="text-slate-400 text-sm">Keyingi so'z</div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-cyan-500/30">
                {currentLetter}
              </div>
              <div className="text-slate-400 text-sm">harfidan boshlansin</div>
            </div>

            {/* Hint */}
            {hint && !feedback && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-1.5 text-xs text-yellow-400"
              >
                <Zap size={11} />
                Maslahat: {hint.emoji} {hint.category} kategoriyasidan bir so'z
              </motion.div>
            )}
          </div>

          {/* Input */}
          <div className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              disabled={!!feedback}
              className={`w-full text-center text-xl font-bold bg-black/30 border rounded-xl py-3 text-slate-50 focus:outline-none uppercase transition-all ${
                feedback === 'correct' ? 'border-emerald-500 bg-emerald-950/30' :
                feedback === 'wrong' || feedback === 'timeout' ? 'border-rose-500 bg-rose-950/30' :
                'border-white/20 focus:border-cyan-500'
              }`}
              placeholder={`${currentLetter}...`}
            />

            {/* Feedback message */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center text-sm font-semibold ${
                  feedback === 'correct' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {feedbackMsg}
              </motion.div>
            )}

            <motion.button
              whileHover={!feedback ? { scale: 1.02 } : {}}
              whileTap={!feedback ? { scale: 0.97 } : {}}
              onClick={handleSubmit}
              disabled={!!feedback || !input.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> Tasdiqlash
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
