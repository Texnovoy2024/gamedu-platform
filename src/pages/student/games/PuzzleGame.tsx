
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Puzzle, ChevronRight, CheckCircle2, TrendingUp, Coins, ArrowLeft, Clock } from 'lucide-react'
import { playCorrect, playWrong, playFlip, playVictory, playDefeat } from '../../../utils/gameAudio'
import type { MascotMood } from '../MiniGamesPage'
import { AvatarSVG } from '../MiniGamesPage'

// ─── Puzzle rasmlar (emoji grid) ──────────────────────────────────────────────
const PUZZLES = [
  {
    name: 'Quyosh tizimi',
    emoji: ['☀️','🌍','🌙','⭐','🪐','☄️','🌟','💫','🌠','🌌','🔭','🛸'],
    cols: 4, rows: 3,
    hint: 'Koinot ob\'ektlari',
    color: '#1e3a5f',
  },
  {
    name: 'Hayvonlar',
    emoji: ['🦁','🐘','🦒','🐆','🦓','🦏','🐊','🦛','🦍','🐅','🦅','🐍'],
    cols: 4, rows: 3,
    hint: 'Yovvoyi hayvonlar',
    color: '#2d4a1e',
  },
  {
    name: 'Mevalar',
    emoji: ['🍎','🍊','🍋','🍇','🍓','🍑','🍒','🥭','🍍','🥝','🍌','🍉'],
    cols: 4, rows: 3,
    hint: 'Turli mevalar',
    color: '#4a1e2d',
  },
  {
    name: 'Transport',
    emoji: ['🚗','✈️','🚢','🚂','🚁','🛸','🚀','🏎️','🚌','🛻','🚑','🚒'],
    cols: 4, rows: 3,
    hint: 'Transport vositalari',
    color: '#1e2d4a',
  },
  {
    name: 'Oziq-ovqat',
    emoji: ['🍕','🍔','🌮','🍜','🍣','🍦','🎂','🍩','🥗','🍱','🥘','🍛'],
    cols: 4, rows: 3,
    hint: 'Turli taomlar',
    color: '#3d2a0a',
  },
  {
    name: 'Sport',
    emoji: ['⚽','🏀','🎾','🏈','⚾','🏐','🎱','🏓','🥊','🎯','🏹','🥋'],
    cols: 4, rows: 3,
    hint: 'Sport turlari',
    color: '#0a2d1e',
  },
]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

type Phase = 'intro' | 'preview' | 'playing' | 'result'

interface PuzzlePiece {
  id: number
  emoji: string
  correctPos: number
  currentPos: number
}

interface Props {
  onEnd: (xp: number) => void
}

const TOTAL_PUZZLES = 4
const PREVIEW_TIME = 3
const XP_PER_PUZZLE = 25

export function PuzzleGame({ onEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [puzzles, setPuzzles] = useState<typeof PUZZLES>([])
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [score, setScore] = useState(0)
  const [solved, setSolved] = useState(0)
  const [previewLeft, setPreviewLeft] = useState(PREVIEW_TIME)
  const [timeLeft, setTimeLeft] = useState(60)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle')
  const [showEmoji, setShowEmoji] = useState(false)
  const [emojiVal, setEmojiVal] = useState('')
  const [moves, setMoves] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  const startGame = () => {
    const selected = shuffle(PUZZLES).slice(0, TOTAL_PUZZLES)
    setPuzzles(selected)
    setPuzzleIndex(0)
    setScore(0)
    setSolved(0)
    setMoves(0)
    setMascotMood('thinking')
    loadPuzzle(selected[0])
    setPhase('preview')
    setPreviewLeft(PREVIEW_TIME)
  }

  const loadPuzzle = (puzzle: typeof PUZZLES[0]) => {
    const ps: PuzzlePiece[] = puzzle.emoji.map((e, i) => ({
      id: i, emoji: e, correctPos: i, currentPos: i,
    }))
    // Shuffle positions
    const shuffledPositions = shuffle(ps.map(p => p.currentPos))
    const shuffled = ps.map((p, i) => ({ ...p, currentPos: shuffledPositions[i] }))
    setPieces(shuffled)
    setMoves(0)
    setStartTime(Date.now())
  }

  // Preview countdown
  useEffect(() => {
    if (phase !== 'preview') return
    if (previewLeft <= 0) {
      setPhase('playing')
      setTimeLeft(60)
      return
    }
    const t = setTimeout(() => setPreviewLeft(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [previewLeft, phase])

  // Game timer
  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) {
      handlePuzzleEnd(false)
      return
    }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, phase])

  // Elapsed time
  useEffect(() => {
    if (phase !== 'playing') return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500)
    return () => clearInterval(t)
  }, [phase, startTime])

  const handleDrop = (toPos: number) => {
    if (dragFrom === null || dragFrom === toPos) { setDragFrom(null); return }

    playFlip()
    setMoves(m => m + 1)

    setPieces(prev => {
      const newPieces = [...prev]
      const fromIdx = newPieces.findIndex(p => p.currentPos === dragFrom)
      const toIdx   = newPieces.findIndex(p => p.currentPos === toPos)
      if (fromIdx === -1 || toIdx === -1) return prev
      newPieces[fromIdx] = { ...newPieces[fromIdx], currentPos: toPos }
      newPieces[toIdx]   = { ...newPieces[toIdx],   currentPos: dragFrom }
      return newPieces
    })

    setDragFrom(null)

    // Check if solved
    setTimeout(() => {
      setPieces(current => {
        const isSolved = current.every(p => p.currentPos === p.correctPos)
        if (isSolved) handlePuzzleEnd(true)
        return current
      })
    }, 100)
  }

  const handlePuzzleEnd = (success: boolean) => {
    if (success) {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000)
      const timeBonus = Math.max(0, 15 - Math.floor(timeTaken / 4))
      const moveBonus = Math.max(0, 10 - Math.floor(moves / 3))
      const gained = XP_PER_PUZZLE + timeBonus + moveBonus
      setScore(s => s + gained)
      setSolved(s => s + 1)
      playCorrect()
      setMascotMood('excited')
      setEmojiVal('🧩✅')
    } else {
      playWrong()
      setMascotMood('sad')
      setEmojiVal('⏰')
    }

    setShowEmoji(true)
    setTimeout(() => setShowEmoji(false), 900)

    setTimeout(() => {
      const next = puzzleIndex + 1
      if (next >= TOTAL_PUZZLES) {
        const finalXp = Math.min(120, score + (success ? XP_PER_PUZZLE : 0))
        if (finalXp > 60) { playVictory(); setMascotMood('victory') }
        else { playDefeat(); setMascotMood('sad') }
        setPhase('result')
      } else {
        setPuzzleIndex(next)
        loadPuzzle(puzzles[next])
        setPhase('preview')
        setPreviewLeft(PREVIEW_TIME)
        setMascotMood('thinking')
      }
    }, 1500)
  }

  const earnedXp = Math.min(120, score)
  const currentPuzzle = puzzles[puzzleIndex]

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #1a1040 0%, #0d1a30 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-5">
          <button onClick={() => onEnd(0)} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm">
            <ArrowLeft size={15} /> Orqaga
          </button>
          <div className="rounded-3xl border border-violet-500/30 bg-white/5 backdrop-blur-sm p-8 space-y-5 text-center">
            {/* Preview puzzle */}
            <div className="grid grid-cols-4 gap-1 max-w-[160px] mx-auto mb-2">
              {['🦁','🐘','🦒','🐆','🦓','🦏','🐊','🦛','🦍','🐅','🦅','🐍'].map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-xl border border-white/10"
                >
                  {e}
                </motion.div>
              ))}
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg">
              <Puzzle size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Puzzle O'yini</h2>
            <p className="text-slate-400 text-sm">Aralashtirilgan bo'laklarni to'g'ri joylashtiring!</p>
            <div className="space-y-2 text-left">
              {[
                `${TOTAL_PUZZLES} ta puzzle`,
                `Avval ${PREVIEW_TIME} soniya ko'rasiz`,
                "Keyin bo'laklar aralashtiriladi",
                "Bosib, keyin joyiga qo'ying",
                "Tezroq = ko'proq XP",
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
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Boshlash 🧩
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
        style={{ background: 'linear-gradient(135deg, #1a1040 0%, #0d1a30 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-4">
          <div className="rounded-3xl border border-violet-500/30 bg-white/5 backdrop-blur-sm p-8 text-center space-y-4">
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.8, delay: 0.2 }} style={{ fontSize: '56px' }}>
              {solved >= TOTAL_PUZZLES ? '🏆' : '🧩'}
            </motion.div>
            <h2 className="text-2xl font-black text-white">Puzzle tugadi!</h2>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.3 }} className="text-5xl font-black text-emerald-400">
              +{earnedXp} XP
            </motion.div>
            <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm">
              <Coins size={14} /> +{Math.floor(earnedXp / 10)} tanga
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Yechildi', value: `${solved}/${TOTAL_PUZZLES}`, color: 'text-violet-400' },
              { label: 'Harakatlar', value: String(moves), color: 'text-blue-400' },
              { label: 'Vaqt', value: `${elapsed}s`, color: 'text-orange-400' },
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
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white font-bold transition-all flex items-center justify-center gap-2"
          >
            <ChevronRight size={18} /> O'yinlarga qaytish
          </motion.button>
        </motion.div>
      </div>
    )
  }

  if (!currentPuzzle) return null

  // ── PREVIEW ────────────────────────────────────────────────────────────────
  if (phase === 'preview') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${currentPuzzle.color} 0%, #0d0b1e 100%)` }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xs space-y-5 text-center">
          <div className="text-white font-bold text-lg">{currentPuzzle.name}</div>
          <div className="text-slate-400 text-sm">{previewLeft} soniyada aralashtiriladi...</div>

          {/* Preview grid */}
          <div
            className="grid gap-2 mx-auto"
            style={{ gridTemplateColumns: `repeat(${currentPuzzle.cols}, 1fr)`, maxWidth: '280px' }}
          >
            {currentPuzzle.emoji.map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="aspect-square rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl"
              >
                {e}
              </motion.div>
            ))}
          </div>

          <div className="text-slate-500 text-xs">{currentPuzzle.hint}</div>

          {/* Countdown */}
          <div className="flex justify-center">
            <div className={`w-14 h-14 rounded-full border-4 border-violet-500 flex items-center justify-center text-2xl font-black text-violet-300`}>
              {previewLeft}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  // Build grid: position → piece
  const grid: (PuzzlePiece | null)[] = Array(currentPuzzle.emoji.length).fill(null)
  pieces.forEach(p => { grid[p.currentPos] = p })

  const timerPct = (timeLeft / 60) * 100
  const timerColor = timeLeft > 30 ? 'bg-emerald-500' : timeLeft > 10 ? 'bg-yellow-500' : 'bg-rose-500'

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: `linear-gradient(135deg, ${currentPuzzle.color} 0%, #0d0b1e 100%)` }}>

      {/* Emoji reaction */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: 1, y: -30 }}
            exit={{ opacity: 0, y: -80 }}
            transition={{ duration: 0.5 }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-6xl"
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
          <Puzzle size={14} />
          <span>{puzzleIndex + 1}/{TOTAL_PUZZLES}</span>
        </div>
        <div className="text-white font-bold text-sm">{currentPuzzle.name}</div>
        <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
          <TrendingUp size={14} /> {score} XP
        </div>
      </div>

      {/* Timer */}
      <div className="px-4 mb-2">
        <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/5">
          <motion.div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPct}%` }} />
        </div>
        <div className="flex justify-between text-xs mt-1 text-slate-500">
          <span className="flex items-center gap-1"><Clock size={10} /> {timeLeft}s</span>
          <span>{moves} harakat</span>
        </div>
      </div>

      {/* Puzzle grid */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${currentPuzzle.cols}, 1fr)`,
            maxWidth: '320px',
            width: '100%',
          }}
        >
          {grid.map((piece, pos) => (
            <motion.div
              key={pos}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (dragFrom === null) {
                  if (piece) { setDragFrom(pos); playFlip() }
                } else {
                  handleDrop(pos)
                }
              }}
              className={`aspect-square rounded-xl flex items-center justify-center text-3xl cursor-pointer transition-all border-2 ${
                dragFrom === pos
                  ? 'border-violet-400 bg-violet-500/30 scale-110 shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                  : piece && piece.currentPos === piece.correctPos
                  ? 'border-emerald-500/60 bg-emerald-950/30'
                  : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
              }`}
            >
              {piece ? piece.emoji : ''}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Instruction */}
      <div className="text-center pb-4 text-xs text-slate-500">
        {dragFrom !== null
          ? '📍 Joylashtirish uchun boshqa katakni bosing'
          : '👆 Bo\'lakni tanlang, keyin joyiga qo\'ying'}
      </div>
    </div>
  )
}
