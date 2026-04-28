
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Hash, Target, TrendingUp,
  Coins, Play, ChevronRight, CheckCircle2,
  Clock, Star, Flame, Volume2, VolumeX, Globe, Music, Type, Film, Puzzle, Globe2,
} from 'lucide-react'
import { getCurrentUserId, addCoins, calculateStudentStats, getProgress, saveProgress } from '../../storage'
import { LevelUpModal } from '../../components/LevelUpModal'
import { playCorrect, playWrong, playCombo, playVictory, playDefeat, playFlip, playHit, playTick, playCountdown, stopBgMusic } from '../../utils/gameAudio'
import type { StudentTaskProgress } from '../../types'

import blitzImg   from '../../assets/games/Tezkor Viktorina.png'
import mathImg    from '../../assets/games/Matematik Zanjir.png'
import targetImg  from "../../assets/games/Nishon O'yini.png"
import memoryImg  from "../../assets/games/Xotira O'yini.png"
import flagImg    from "../../assets/games/Bayroq tanish.png"
import musicImg   from "../../assets/games/Qo'shiq Topish.png"
import wordImg    from "../../assets/games/So'z Zanjiri.png"
import gifImg     from "../../assets/games/GIF Topish.png"
import puzzleImg  from "../../assets/games/Puzzle O'yini.png"
import mapImg     from "../../assets/games/Xarita O'yini.png"
import { FlagQuizGame } from './games/FlagQuizGame'
import { MusicQuizGame } from './games/MusicQuizGame'
import { WordChainGame } from './games/WordChainGame'
import { GifQuizGame } from './games/GifQuizGame'
import { PuzzleGame } from './games/PuzzleGame'
import { MapGame } from './games/MapGame'

// ─── Global mute state ────────────────────────────────────────────────────────
let globalMuted = false
const safePlay = (fn: () => void) => { if (!globalMuted) fn() }

// ─── Emoji Reaction Component ─────────────────────────────────────────────────
const REACTIONS = {
  correct:  ['😄','🎉','✨','🔥','💪','🥳','👏','⭐'],
  wrong:    ['😅','😬','🙈','💀','😤','🤦','😮','😱'],
  combo:    ['🚀','💥','⚡','🌟','🏆','👑','🎯','💎'],
  timeout:  ['⏰','😰','🏃','💨','😓','🤯','😵','⌛'],
  victory:  ['🏆','🎊','🥇','👑','🌟','🎉','💯','🔥'],
  defeat:   ['😢','💔','😞','🙁','😔','💪','🔄','📚'],
}

function EmojiReaction({ type, show }: { type: keyof typeof REACTIONS; show: boolean }) {
  const emoji = REACTIONS[type][Math.floor(Math.random() * REACTIONS[type].length)]
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={`${type}-${Date.now()}`}
          initial={{ scale: 0, opacity: 0, y: 0 }}
          animate={{ scale: [0, 1.4, 1], opacity: 1, y: -20 }}
          exit={{ scale: 0, opacity: 0, y: -60 }}
          transition={{ duration: 0.5, times: [0, 0.4, 1] }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none"
          style={{ fontSize: '80px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
        >
          {emoji}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Mascot Component — SVG Avatar ───────────────────────────────────────────
export type MascotMood = 'idle' | 'happy' | 'sad' | 'excited' | 'thinking' | 'victory'

const MASCOT_MESSAGES: Record<MascotMood, string[]> = {
  idle:     ["Tayyor!", "Boshlaylik!", "Keling o'ynaymiz!"],
  happy:    ["Zo'r!", "Ajoyib!", "Davom et!"],
  sad:      ["Xafa bo'lma!", "Keyingi safar!", "Harakat qil!"],
  excited:  ["COMBO!", "Zo'r ketayapsan!", "To'xtatma!"],
  thinking: ["O'ylayapman...", "Qiyin savol...", "Diqqat!"],
  victory:  ["G'alaba!", "Chempion!", "Zo'r o'yin!"],
}

// SVG Avatar — kayfiyatga qarab yuz ifodasi o'zgaradi
export function AvatarSVG({ mood }: { mood: MascotMood }) {
  // Skin, hair, eyes, mouth — mood ga qarab
  const configs: Record<MascotMood, {
    eyeY: number; eyeH: number; pupilY: number
    mouthD: string; eyebrowD: string; blush: boolean
    headColor: string; hairColor: string
  }> = {
    idle: {
      eyeY: 38, eyeH: 8, pupilY: 40,
      mouthD: 'M 36 58 Q 44 63 52 58',
      eyebrowD: 'M 30 32 Q 36 29 42 32 M 46 32 Q 52 29 58 32',
      blush: false, headColor: '#FBBF7C', hairColor: '#7C3AED',
    },
    happy: {
      eyeY: 38, eyeH: 7, pupilY: 40,
      mouthD: 'M 33 56 Q 44 68 55 56',
      eyebrowD: 'M 30 30 Q 36 26 42 30 M 46 30 Q 52 26 58 30',
      blush: true, headColor: '#FBBF7C', hairColor: '#7C3AED',
    },
    sad: {
      eyeY: 40, eyeH: 6, pupilY: 43,
      mouthD: 'M 33 62 Q 44 54 55 62',
      eyebrowD: 'M 30 34 Q 36 38 42 34 M 46 34 Q 52 38 58 34',
      blush: false, headColor: '#FBBF7C', hairColor: '#7C3AED',
    },
    excited: {
      eyeY: 36, eyeH: 10, pupilY: 38,
      mouthD: 'M 32 54 Q 44 70 56 54',
      eyebrowD: 'M 28 28 Q 36 22 42 28 M 46 28 Q 52 22 58 28',
      blush: true, headColor: '#FBBF7C', hairColor: '#DB2777',
    },
    thinking: {
      eyeY: 38, eyeH: 7, pupilY: 39,
      mouthD: 'M 36 59 Q 44 62 52 57',
      eyebrowD: 'M 30 32 Q 36 28 42 33 M 46 30 Q 52 27 58 32',
      blush: false, headColor: '#FBBF7C', hairColor: '#7C3AED',
    },
    victory: {
      eyeY: 37, eyeH: 9, pupilY: 39,
      mouthD: 'M 30 54 Q 44 72 58 54',
      eyebrowD: 'M 28 27 Q 36 22 42 27 M 46 27 Q 52 22 58 27',
      blush: true, headColor: '#FBBF7C', hairColor: '#F59E0B',
    },
  }

  const c = configs[mood]

  return (
    <svg viewBox="0 0 88 100" width="72" height="82" xmlns="http://www.w3.org/2000/svg">
      {/* Hair / top */}
      <ellipse cx="44" cy="22" rx="26" ry="20" fill={c.hairColor} />
      <rect x="18" y="22" width="52" height="12" fill={c.hairColor} />
      {/* Hair strands */}
      <ellipse cx="22" cy="18" rx="7" ry="9" fill={c.hairColor} />
      <ellipse cx="44" cy="10" rx="8" ry="10" fill={c.hairColor} />
      <ellipse cx="66" cy="18" rx="7" ry="9" fill={c.hairColor} />

      {/* Head */}
      <ellipse cx="44" cy="52" rx="26" ry="28" fill={c.headColor} />

      {/* Ears */}
      <ellipse cx="18" cy="52" rx="5" ry="7" fill={c.headColor} />
      <ellipse cx="70" cy="52" rx="5" ry="7" fill={c.headColor} />
      <ellipse cx="18" cy="52" rx="3" ry="5" fill="#F9A87A" />
      <ellipse cx="70" cy="52" rx="3" ry="5" fill="#F9A87A" />

      {/* Eyes white */}
      <ellipse cx="36" cy={c.eyeY + 2} rx="7" ry={c.eyeH} fill="white" />
      <ellipse cx="52" cy={c.eyeY + 2} rx="7" ry={c.eyeH} fill="white" />
      {/* Pupils */}
      <circle cx="36" cy={c.pupilY} r="4" fill="#1e1b4b" />
      <circle cx="52" cy={c.pupilY} r="4" fill="#1e1b4b" />
      {/* Eye shine */}
      <circle cx="38" cy={c.pupilY - 1} r="1.5" fill="white" />
      <circle cx="54" cy={c.pupilY - 1} r="1.5" fill="white" />

      {/* Eyebrows */}
      <path d={c.eyebrowD} stroke="#5B3A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <ellipse cx="44" cy="52" rx="3" ry="2" fill="#E8956A" />

      {/* Mouth */}
      <path d={c.mouthD} stroke="#C0392B" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Blush */}
      {c.blush && (
        <>
          <ellipse cx="26" cy="56" rx="6" ry="4" fill="#F87171" opacity="0.4" />
          <ellipse cx="62" cy="56" rx="6" ry="4" fill="#F87171" opacity="0.4" />
        </>
      )}

      {/* Neck */}
      <rect x="36" y="78" width="16" height="10" rx="4" fill={c.headColor} />

      {/* Body / shirt */}
      <path d="M 20 88 Q 20 100 44 100 Q 68 100 68 88 L 64 82 Q 54 86 44 86 Q 34 86 24 82 Z"
        fill={c.hairColor} opacity="0.9" />

      {/* Mood extras */}
      {mood === 'excited' && (
        <>
          <text x="68" y="30" fontSize="14" fill="#F59E0B">✨</text>
          <text x="4" y="30" fontSize="14" fill="#F59E0B">✨</text>
        </>
      )}
      {mood === 'victory' && (
        <text x="30" y="14" fontSize="16" fill="#F59E0B">👑</text>
      )}
      {mood === 'thinking' && (
        <text x="62" y="28" fontSize="14" fill="white">💭</text>
      )}
    </svg>
  )
}

function Mascot({ mood, visible }: { mood: MascotMood; visible: boolean }) {
  const msgs = MASCOT_MESSAGES[mood]
  const msg = msgs[Math.floor(Math.random() * msgs.length)]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.7 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.7 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="fixed bottom-20 right-3 z-40 flex flex-col items-end gap-1.5"
        >
          {/* Speech bubble */}
          <motion.div
            key={msg}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-2xl rounded-br-none shadow-lg max-w-[110px] text-center leading-tight"
          >
            {msg}
          </motion.div>

          {/* Avatar */}
          <motion.div
            animate={
              mood === 'happy' || mood === 'excited' || mood === 'victory'
                ? { rotate: [-4, 4, -3, 3, 0], y: [0, -4, 0] }
                : mood === 'sad'
                ? { y: [0, 3, 0], rotate: [-2, 2, 0] }
                : mood === 'thinking'
                ? { rotate: [0, -5, 0] }
                : { y: [0, -2, 0] }
            }
            transition={{
              duration: 0.7,
              repeat: mood === 'idle' ? Infinity : 0,
              repeatDelay: 2,
            }}
            className="drop-shadow-[0_4px_12px_rgba(124,58,237,0.5)]"
          >
            <AvatarSVG mood={mood} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Animated Background ──────────────────────────────────────────────────────
const GAME_BACKGROUNDS: Record<string, { from: string; to: string; particles: string }> = {
  'blitz-quiz':   { from: '#0d0b1e', to: '#1a0a3e', particles: '#7c3aed' },
  'math-chain':   { from: '#0a1e0d', to: '#0a2e1a', particles: '#059669' },
  'target-shot':  { from: '#1e0a0a', to: '#2e0a0a', particles: '#dc2626' },
  'memory-match': { from: '#1e1a0a', to: '#2e250a', particles: '#d97706' },
}

function GameBackground({ gameId, children }: { gameId: string; children: React.ReactNode }) {
  const bg = GAME_BACKGROUNDS[gameId] ?? GAME_BACKGROUNDS['blitz-quiz']
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${bg.from} 0%, ${bg.to} 100%)` }}
    >
      {/* Animated orbs */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-10 pointer-events-none"
          style={{
            width: `${120 + i * 60}px`,
            height: `${120 + i * 60}px`,
            background: bg.particles,
            left: `${[10, 60, 20, 75][i]}%`,
            top: `${[10, 60, 80, 20][i]}%`,
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 1.5,
          }}
        />
      ))}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// ─── XP berish yordamchi ─────────────────────────────────────────────────────
function awardMiniGameXp(userId: string, gameId: string, xp: number): { leveledUp: boolean; newLevel: number; earnedCoins: number } {
  const coins = Math.max(1, Math.floor(xp / 10))
  const progress = getProgress()
  const id = `minigame_${gameId}_${userId}_${Date.now()}`
  const record: StudentTaskProgress = {
    id, studentId: userId, taskId: `minigame_${gameId}`,
    status: 'completed', earnedXp: xp, completedAt: new Date().toISOString(),
  }
  progress.push(record)
  saveProgress(progress)
  addCoins(userId, coins)
  const oldLevel = calculateStudentStats(userId).level
  const newStats = calculateStudentStats(userId)
  return { leveledUp: newStats.level > oldLevel, newLevel: newStats.level, earnedCoins: coins }
}

// ─── SAVOL BANKI (mini-game uchun) ───────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { q: "O'zbekiston poytaxti?", options: ["Samarqand", "Toshkent", "Buxoro", "Namangan"], correct: "Toshkent" },
  { q: "2 × 8 = ?", options: ["14", "16", "18", "12"], correct: "16" },
  { q: "HTML nima?", options: ["Dasturlash tili", "Belgilash tili", "Ma'lumotlar bazasi", "Operatsion tizim"], correct: "Belgilash tili" },
  { q: "Quyosh sistemasidagi eng katta sayyora?", options: ["Saturn", "Neptun", "Yupiter", "Uran"], correct: "Yupiter" },
  { q: "√81 = ?", options: ["7", "8", "9", "10"], correct: "9" },
  { q: "Python qaysi turdagi til?", options: ["Kompilyatsiya", "Interpretatsiya", "Assembler", "Mashina"], correct: "Interpretatsiya" },
  { q: "Inson tanasida nechta suyak bor?", options: ["180", "196", "206", "220"], correct: "206" },
  { q: "1 km = necha metr?", options: ["100", "500", "1000", "10000"], correct: "1000" },
  { q: "Amir Temur qaysi asrda yashagan?", options: ["XII", "XIII", "XIV", "XV"], correct: "XIV" },
  { q: "CSS nima uchun ishlatiladi?", options: ["Ma'lumot saqlash", "Sahifa bezash", "Server boshqarish", "Hisoblash"], correct: "Sahifa bezash" },
  { q: "3² + 4² = ?", options: ["20", "25", "30", "35"], correct: "25" },
  { q: "Fotosintez qayerda sodir bo'ladi?", options: ["Ildiz", "Poya", "Barg", "Gul"], correct: "Barg" },
  { q: "JavaScript'da 'typeof null' nima qaytaradi?", options: ["null", "undefined", "object", "string"], correct: "object" },
  { q: "Eng katta okean qaysi?", options: ["Atlantika", "Hind", "Tinch", "Arktika"], correct: "Tinch" },
  { q: "5! (faktorial) = ?", options: ["60", "100", "120", "150"], correct: "120" },
  { q: "Yorug'lik tezligi taxminan?", options: ["150 000 km/s", "300 000 km/s", "500 000 km/s", "1 000 000 km/s"], correct: "300 000 km/s" },
  { q: "HTML'da rasm qo'shish tegi?", options: ["<pic>", "<image>", "<img>", "<photo>"], correct: "<img>" },
  { q: "Suv formulasi?", options: ["CO2", "H2O", "NaCl", "O2"], correct: "H2O" },
  { q: "Birinchi kompyuter qachon yaratilgan?", options: ["1930s", "1940s", "1950s", "1960s"], correct: "1940s" },
  { q: "100 ning 15% i?", options: ["10", "12", "15", "20"], correct: "15" },
]

// ─── MATEMATIK ZANJIR ────────────────────────────────────────────────────────
function generateMathChain(level: number): { question: string; answer: number } {
  const ops = ['+', '-', '×']
  const op = ops[Math.floor(Math.random() * (level < 3 ? 2 : 3))]
  const max = level < 3 ? 10 : level < 6 ? 20 : 50
  const a = Math.floor(Math.random() * max) + 1
  const b = Math.floor(Math.random() * (op === '-' ? a : max)) + 1
  let answer: number
  let question: string
  if (op === '+') { answer = a + b; question = `${a} + ${b} = ?` }
  else if (op === '-') { answer = a - b; question = `${a} - ${b} = ?` }
  else { answer = a * b; question = `${a} × ${b} = ?` }
  return { question, answer }
}

// ─── NISHON O'YINI uchun savollar ────────────────────────────────────────────
const TARGET_QUESTIONS = [
  { q: "2 + 2", a: "4" }, { q: "5 × 3", a: "15" }, { q: "10 - 7", a: "3" },
  { q: "8 ÷ 2", a: "4" }, { q: "3²", a: "9" }, { q: "√25", a: "5" },
  { q: "7 × 7", a: "49" }, { q: "100 ÷ 4", a: "25" }, { q: "15 + 27", a: "42" },
  { q: "9 × 6", a: "54" }, { q: "2⁵", a: "32" }, { q: "√64", a: "8" },
]

// ─── GAME CONFIGS ─────────────────────────────────────────────────────────────
const GAMES = [
  {
    id: 'blitz-quiz',
    title: 'Tezkor Viktorina',
    desc: '60 soniyada imkon qadar ko\'p savol yeching',
    icon: Brain,
    color: 'from-indigo-600 to-purple-600',
    border: 'border-indigo-500/40',
    glowColor: '#7c3aed',
    image: blitzImg,
    maxXp: 200,
  },
  {
    id: 'math-chain',
    title: 'Matematik Zanjir',
    desc: 'Ketma-ket matematik amallarni yeching, xato = o\'yin tugaydi',
    icon: Hash,
    color: 'from-emerald-600 to-teal-600',
    border: 'border-emerald-500/40',
    glowColor: '#059669',
    image: mathImg,
    maxXp: 150,
  },
  {
    id: 'target-shot',
    title: 'Nishon O\'yini',
    desc: 'Tez paydo bo\'ladigan savollarni yeching — tezlik = ko\'proq XP',
    icon: Target,
    color: 'from-rose-600 to-orange-600',
    border: 'border-rose-500/40',
    glowColor: '#dc2626',
    image: targetImg,
    maxXp: 180,
  },
  {
    id: 'memory-match',
    title: 'Xotira O\'yini',
    desc: 'Juft kartochkalarni toping — xotira va diqqatni sinang',
    icon: Star,
    color: 'from-yellow-600 to-amber-600',
    border: 'border-yellow-500/40',
    glowColor: '#d97706',
    image: memoryImg,
    maxXp: 120,
  },
  {
    id: 'flag-quiz',
    title: 'Bayroq Tanish',
    desc: 'Davlat bayrog\'ini ko\'rib, qaysi mamlakatga tegishli ekanini toping',
    icon: Globe,
    color: 'from-blue-600 to-cyan-600',
    border: 'border-blue-500/40',
    glowColor: '#0284c7',
    image: flagImg,
    maxXp: 200,
  },
  {
    id: 'music-quiz',
    title: 'Qo\'shiq Topish',
    desc: 'Melodiyani eshitib, qo\'shiq nomini toping',
    icon: Music,
    color: 'from-purple-600 to-pink-600',
    border: 'border-purple-500/40',
    glowColor: '#9333ea',
    image: musicImg,
    maxXp: 150,
  },
  {
    id: 'word-chain',
    title: 'So\'z Zanjiri',
    desc: 'Oxirgi harfdan yangi so\'z toping — O\'zbek tilida',
    icon: Type,
    color: 'from-cyan-600 to-blue-600',
    border: 'border-cyan-500/40',
    glowColor: '#0891b2',
    image: wordImg,
    maxXp: 150,
  },
  {
    id: 'gif-quiz',
    title: 'GIF Topish',
    desc: 'Harakatlanuvchi animatsiyani ko\'rib, nima ekanini toping',
    icon: Film,
    color: 'from-pink-600 to-rose-600',
    border: 'border-pink-500/40',
    glowColor: '#db2777',
    image: gifImg,
    maxXp: 150,
  },
  {
    id: 'puzzle',
    title: 'Puzzle O\'yini',
    desc: 'Aralashtirilgan bo\'laklarni to\'g\'ri joylashtiring',
    icon: Puzzle,
    color: 'from-violet-600 to-indigo-600',
    border: 'border-violet-500/40',
    glowColor: '#7c3aed',
    image: puzzleImg,
    maxXp: 120,
  },
  {
    id: 'map-game',
    title: 'Xarita O\'yini',
    desc: 'Mamlakatni xaritada ko\'rib, poytaxtini toping',
    icon: Globe2,
    color: 'from-teal-600 to-cyan-600',
    border: 'border-teal-500/40',
    glowColor: '#14b8a6',
    image: mapImg,
    maxXp: 180,
  },
]

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function MiniGamesPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpData, setLevelUpData] = useState({ newLevel: 1, earnedXp: 0, earnedCoins: 0 })
  const [muted, setMuted] = useState(false)
  const userId = getCurrentUserId()

  // Faqat o'yin ichida musiqa — lobby da yo'q
  useEffect(() => {
    return () => {
      stopBgMusic()
    }
  }, [])

  const toggleMute = () => {
    const newMuted = !muted
    globalMuted = newMuted
    setMuted(newMuted)
    if (newMuted) stopBgMusic()
  }

  const handleGameStart = (gameId: string) => {
    stopBgMusic()
    setActiveGame(gameId)
  }

  const handleGameEnd = (xp: number, gameId: string) => {
    stopBgMusic()
    if (!userId || xp <= 0) { setActiveGame(null); return }
    const result = awardMiniGameXp(userId, `${gameId}_${Date.now()}`, xp)
    setActiveGame(null)
    if (result.leveledUp) {
      setLevelUpData({ newLevel: result.newLevel, earnedXp: xp, earnedCoins: result.earnedCoins })
      setTimeout(() => setShowLevelUp(true), 300)
    }
  }

  if (activeGame === 'blitz-quiz')   return <BlitzQuiz   onEnd={xp => handleGameEnd(xp, 'blitz')} />
  if (activeGame === 'math-chain')   return <MathChain   onEnd={xp => handleGameEnd(xp, 'math')} />
  if (activeGame === 'target-shot')  return <TargetShot  onEnd={xp => handleGameEnd(xp, 'target')} />
  if (activeGame === 'memory-match') return <MemoryMatch onEnd={xp => handleGameEnd(xp, 'memory')} />
  if (activeGame === 'flag-quiz')    return <FlagQuizGame  onEnd={xp => handleGameEnd(xp, 'flag')} />
  if (activeGame === 'music-quiz')   return <MusicQuizGame onEnd={xp => handleGameEnd(xp, 'music')} />
  if (activeGame === 'word-chain')   return <WordChainGame  onEnd={xp => handleGameEnd(xp, 'word')} />
  if (activeGame === 'gif-quiz')     return <GifQuizGame    onEnd={xp => handleGameEnd(xp, 'gif')} />
  if (activeGame === 'puzzle')       return <PuzzleGame      onEnd={xp => handleGameEnd(xp, 'puzzle')} />
  if (activeGame === 'map-game')     return <MapGame         onEnd={xp => handleGameEnd(xp, 'map')} />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500 mb-1">Mini-o'yinlar</div>
          <h1 className="text-2xl font-bold text-slate-50">Mini O'yinlar</h1>
          <p className="mt-1 text-sm text-slate-400">O'ynang, XP to'plang — teacher kerak emas!</p>
        </div>
        <button
          onClick={toggleMute}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
          title={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {GAMES.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-2xl border ${game.border} overflow-hidden relative group cursor-pointer`}
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {/* Cover image */}
            <div className="relative h-36 overflow-hidden">
              {game.image ? (
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                  <game.icon size={56} className="text-white/60" />
                </div>
              )}
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent`} />
              {/* Glow overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                style={{ background: game.glowColor }}
              />
              {/* XP badge */}
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-emerald-400 font-bold border border-emerald-500/30">
                <TrendingUp size={10} />
                max {game.maxXp} XP
              </div>
              {/* Game icon badge */}
              <div className={`absolute top-3 left-3 w-9 h-9 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center shadow-lg`}>
                <game.icon size={18} className="text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-slate-50 text-base">{game.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{game.desc}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleGameStart(game.id)}
                className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${game.color} hover:brightness-110 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md`}
              >
                <Play size={14} /> O'ynash
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      <LevelUpModal
        open={showLevelUp}
        newLevel={levelUpData.newLevel}
        earnedXp={levelUpData.earnedXp}
        earnedCoins={levelUpData.earnedCoins}
        onClose={() => setShowLevelUp(false)}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. TEZKOR VIKTORINA — 60 soniyada imkon qadar ko'p savol
// ═══════════════════════════════════════════════════════════════════════════════
function BlitzQuiz({ onEnd }: { onEnd: (xp: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro')
  const [timeLeft, setTimeLeft] = useState(60)
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [emojiType, setEmojiType] = useState<keyof typeof REACTIONS>('correct')
  const [showEmoji, setShowEmoji] = useState(false)
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle')
  const [shuffled] = useState(() => [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5))

  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) {
      safePlay(playDefeat)
      setMascotMood('sad')
      setPhase('result')
      return
    }
    if (timeLeft <= 10) safePlay(playCountdown)
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, phase])

  const handleAnswer = (opt: string) => {
    if (feedback) return
    const q = shuffled[qIndex % shuffled.length]
    const correct = opt === q.correct
    setFeedback(correct ? 'correct' : 'wrong')

    if (correct) {
      const newStreak = streak + 1
      const bonus = newStreak >= 3 ? 15 : newStreak >= 2 ? 10 : 5
      setScore(s => s + bonus)
      setStreak(newStreak)
      if (newStreak >= 3) {
        safePlay(playCombo)
        setEmojiType('combo')
        setMascotMood('excited')
      } else {
        safePlay(playCorrect)
        setEmojiType('correct')
        setMascotMood('happy')
      }
    } else {
      setStreak(0)
      safePlay(playWrong)
      setEmojiType('wrong')
      setMascotMood('sad')
    }

    setShowEmoji(true)
    setTimeout(() => setShowEmoji(false), 800)
    setTimeout(() => {
      setFeedback(null)
      setQIndex(i => i + 1)
      setMascotMood('thinking')
    }, 600)
  }

  const earnedXp = Math.min(200, score)
  const q = shuffled[qIndex % shuffled.length]
  const timerColor = timeLeft > 30 ? 'text-emerald-400' : timeLeft > 10 ? 'text-yellow-400' : 'text-rose-400 animate-pulse'

  if (phase === 'intro') return (
    <GameIntro
      title="Tezkor Viktorina"
      icon={<Brain size={32} className="text-indigo-400" />}
      color="from-indigo-600 to-purple-600"
      gameId="blitz-quiz"
      rules={["60 soniya vaqt beriladi", "Har to'g'ri javob = 5 XP", "Ketma-ket to'g'ri = bonus XP", "Xato qilsangiz streak yo'qoladi"]}
      onStart={() => { setPhase('playing'); setMascotMood('thinking') }}
      onBack={() => onEnd(0)}
    />
  )

  if (phase === 'result') {
    safePlay(earnedXp > 50 ? playVictory : playDefeat)
    stopBgMusic()
    return (
      <GameResult
        title="Tezkor Viktorina"
        earnedXp={earnedXp}
        gameId="blitz-quiz"
        mood={earnedXp > 50 ? 'victory' : 'sad'}
        stats={[
          { label: "To'g'ri javoblar", value: String(Math.floor(score / 5)) },
          { label: 'Eng uzun streak', value: String(streak) },
        ]}
        onEnd={() => onEnd(earnedXp)}
      />
    )
  }

  return (
    <GameBackground gameId="blitz-quiz">
      <EmojiReaction type={emojiType} show={showEmoji} />
      <Mascot mood={mascotMood} visible={phase === 'playing'} />

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg space-y-5">
          {/* Timer + score */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 text-2xl font-bold ${timerColor}`}>
              <Clock size={20} /> {timeLeft}s
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <TrendingUp size={16} /> {score} XP
            </div>
            {streak >= 2 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-1 text-orange-400 text-sm font-bold"
              >
                <Flame size={14} /> x{streak}
              </motion.div>
            )}
          </div>

          {/* Timer bar */}
          <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className={`h-full rounded-full transition-all duration-1000 ${
                timeLeft > 30 ? 'bg-emerald-500' : timeLeft > 10 ? 'bg-yellow-500' : 'bg-rose-500'
              }`}
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={qIndex}
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.95 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6"
            >
              <p className="text-lg font-semibold text-slate-50 mb-5">{q.q}</p>
              <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt, i) => {
                  const colors = ['from-blue-600 to-blue-700', 'from-rose-600 to-rose-700', 'from-yellow-600 to-yellow-700', 'from-emerald-600 to-emerald-700']
                  let cls = `bg-gradient-to-r ${colors[i]} hover:brightness-110`
                  if (feedback) {
                    if (opt === q.correct) cls = 'bg-emerald-500 ring-2 ring-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                    else cls = `bg-gradient-to-r ${colors[i]} opacity-30`
                  }
                  return (
                    <motion.button
                      key={opt}
                      whileHover={!feedback ? { scale: 1.03, y: -2 } : {}}
                      whileTap={!feedback ? { scale: 0.96 } : {}}
                      onClick={() => handleAnswer(opt)}
                      disabled={!!feedback}
                      className={`${cls} rounded-xl py-3 px-4 text-white text-sm font-medium transition-all text-left`}
                    >
                      {opt}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </GameBackground>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. MATEMATIK ZANJIR — xato qilmasdan davom et
// ═══════════════════════════════════════════════════════════════════════════════
function MathChain({ onEnd }: { onEnd: (xp: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro')
  const [level, setLevel] = useState(1)
  const [current, setCurrent] = useState(() => generateMathChain(1))
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [emojiType, setEmojiType] = useState<keyof typeof REACTIONS>('correct')
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phase === 'playing') inputRef.current?.focus()
  }, [phase, current])

  const handleSubmit = () => {
    const userAnswer = parseInt(input.trim())
    if (isNaN(userAnswer)) return
    if (userAnswer === current.answer) {
      const xp = 5 + level * 2
      setScore(s => s + xp)
      setLevel(l => l + 1)
      setCurrent(generateMathChain(level + 1))
      setInput('')
      setFlash('correct')
      safePlay(level % 5 === 0 ? playCombo : playCorrect)
      setEmojiType(level % 5 === 0 ? 'combo' : 'correct')
      setMascotMood(level % 5 === 0 ? 'excited' : 'happy')
      setShowEmoji(true)
      setTimeout(() => { setFlash(null); setShowEmoji(false); setMascotMood('thinking') }, 500)
    } else {
      const newLives = lives - 1
      setLives(newLives)
      setShake(true)
      setFlash('wrong')
      safePlay(playWrong)
      setEmojiType('wrong')
      setMascotMood('sad')
      setShowEmoji(true)
      setTimeout(() => { setShake(false); setFlash(null); setShowEmoji(false) }, 600)
      setInput('')
      if (newLives <= 0) {
        safePlay(playDefeat)
        setPhase('result')
      }
    }
  }

  const earnedXp = Math.min(150, score)

  if (phase === 'intro') return (
    <GameIntro
      title="Matematik Zanjir"
      icon={<Hash size={32} className="text-emerald-400" />}
      color="from-emerald-600 to-teal-600"
      gameId="math-chain"
      rules={["Matematik amallarni yeching", "Har to'g'ri javob XP beradi", "3 ta xato = o'yin tugaydi", "Daraja oshgan sari qiyinlashadi"]}
      onStart={() => { setPhase('playing'); setMascotMood('thinking') }}
      onBack={() => onEnd(0)}
    />
  )

  if (phase === 'result') return (
    <GameResult
      title="Matematik Zanjir"
      earnedXp={earnedXp}
      gameId="math-chain"
      mood={earnedXp > 40 ? 'victory' : 'sad'}
      stats={[
        { label: 'Yetilgan daraja', value: String(level) },
        { label: "To'g'ri javoblar", value: String(level - 1) },
      ]}
      onEnd={() => onEnd(earnedXp)}
    />
  )

  return (
    <GameBackground gameId="math-chain">
      <EmojiReaction type={emojiType} show={showEmoji} />
      <Mascot mood={mascotMood} visible={phase === 'playing'} />

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={i >= lives ? { scale: [1, 1.3, 0] } : {}}
                  className={`w-4 h-4 rounded-full ${i < lives ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-slate-700'}`}
                />
              ))}
            </div>
            <div className="text-sm text-slate-400">Daraja: <span className="text-emerald-400 font-bold">{level}</span></div>
            <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
              <TrendingUp size={14} /> {score} XP
            </div>
          </div>

          <motion.div
            animate={shake ? { x: [-8, 8, -6, 6, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={`rounded-2xl border p-8 text-center transition-all ${
              flash === 'correct'
                ? 'border-emerald-500 bg-emerald-950/30 shadow-[0_0_20px_rgba(52,211,153,0.2)]'
                : flash === 'wrong'
                ? 'border-rose-500 bg-rose-950/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                : 'border-white/10 bg-white/5 backdrop-blur-sm'
            }`}
          >
            <div className="text-4xl font-bold text-slate-50 mb-6">{current.question}</div>
            <input
              ref={inputRef}
              type="number"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full text-center text-2xl font-bold bg-black/30 border border-white/20 rounded-xl py-3 text-slate-50 focus:outline-none focus:border-emerald-500"
              placeholder="?"
            />
          </motion.div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-lg transition-all"
          >
            Tasdiqlash
          </button>
        </div>
      </div>
    </GameBackground>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. NISHON O'YINI — tez paydo bo'ladigan savollar
// ═══════════════════════════════════════════════════════════════════════════════
function TargetShot({ onEnd }: { onEnd: (xp: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro')
  const [score, setScore] = useState(0)
  const [missed, setMissed] = useState(0)
  const [round, setRound] = useState(0)
  const [current, setCurrent] = useState(TARGET_QUESTIONS[0])
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(5)
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [emojiType, setEmojiType] = useState<keyof typeof REACTIONS>('correct')
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle')
  const TOTAL_ROUNDS = 12

  const nextRound = useCallback((hit: boolean) => {
    if (hit) {
      setScore(s => s + Math.max(5, timeLeft * 3))
      safePlay(playHit)
      setEmojiType('correct')
      setMascotMood('happy')
    } else {
      setMissed(m => m + 1)
      safePlay(playWrong)
      setEmojiType('timeout')
      setMascotMood('sad')
    }
    setFlash(hit ? 'hit' : 'miss')
    setShowEmoji(true)
    setTimeout(() => {
      setFlash(null)
      setShowEmoji(false)
      const next = round + 1
      if (next >= TOTAL_ROUNDS) {
        safePlay(playVictory)
        setPhase('result')
        return
      }
      setRound(next)
      setCurrent(TARGET_QUESTIONS[next % TARGET_QUESTIONS.length])
      setInput('')
      setTimeLeft(5)
      setMascotMood('thinking')
    }, 500)
  }, [round, timeLeft])

  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) { nextRound(false); return }
    if (timeLeft <= 2) safePlay(playTick)
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, phase, nextRound])

  const handleSubmit = () => {
    if (input.trim() === current.a) nextRound(true)
    else nextRound(false)
  }

  const earnedXp = Math.min(180, score)

  if (phase === 'intro') return (
    <GameIntro
      title="Nishon O'yini"
      icon={<Target size={32} className="text-rose-400" />}
      color="from-rose-600 to-orange-600"
      gameId="target-shot"
      rules={["Har savolga 5 soniya vaqt", "Tezroq javob = ko'proq XP", "Vaqt tugasa nishon o'tkazib yuboriladi", `Jami ${TOTAL_ROUNDS} ta nishon`]}
      onStart={() => { setPhase('playing'); setMascotMood('thinking') }}
      onBack={() => onEnd(0)}
    />
  )

  if (phase === 'result') return (
    <GameResult
      title="Nishon O'yini"
      earnedXp={earnedXp}
      gameId="target-shot"
      mood={missed < 4 ? 'victory' : 'sad'}
      stats={[
        { label: 'Urilgan nishon', value: String(round - missed) },
        { label: "O'tkazib yuborilgan", value: String(missed) },
      ]}
      onEnd={() => onEnd(earnedXp)}
    />
  )

  return (
    <GameBackground gameId="target-shot">
      <EmojiReaction type={emojiType} show={showEmoji} />
      <Mascot mood={mascotMood} visible={phase === 'playing'} />

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm space-y-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{round + 1}/{TOTAL_ROUNDS}</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp size={14} /> {score} XP
            </span>
          </div>

          <div className="flex justify-center">
            <motion.div
              animate={timeLeft <= 2 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3, repeat: timeLeft <= 2 ? Infinity : 0 }}
              className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-bold transition-colors ${
                timeLeft > 3 ? 'border-emerald-500 text-emerald-400' :
                timeLeft > 1 ? 'border-yellow-500 text-yellow-400' :
                'border-rose-500 text-rose-400'
              }`}
            >
              {timeLeft}
            </motion.div>
          </div>

          <motion.div
            key={round}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-2xl border p-8 text-center transition-all ${
              flash === 'hit'  ? 'border-emerald-500 bg-emerald-950/40 shadow-[0_0_25px_rgba(52,211,153,0.3)]' :
              flash === 'miss' ? 'border-rose-500 bg-rose-950/40 shadow-[0_0_25px_rgba(239,68,68,0.3)]' :
              'border-white/10 bg-white/5 backdrop-blur-sm'
            }`}
          >
            <div className="text-xs text-slate-500 mb-2">Hisoblang:</div>
            <div className="text-4xl font-bold text-slate-50 mb-5">{current.q} = ?</div>
            <input
              autoFocus
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full text-center text-2xl font-bold bg-black/30 border border-white/20 rounded-xl py-3 text-slate-50 focus:outline-none focus:border-rose-500"
              placeholder="Javob"
            />
          </motion.div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 hover:brightness-110 text-white font-bold text-lg transition-all"
          >
            Nishonga ur! 🎯
          </button>
        </div>
      </div>
    </GameBackground>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. XOTIRA O'YINI — juft kartochkalarni toping
// ═══════════════════════════════════════════════════════════════════════════════
const MEMORY_PAIRS = [
  { id: 'a', label: 'HTML' }, { id: 'b', label: 'CSS' },
  { id: 'c', label: 'JS' }, { id: 'd', label: 'Python' },
  { id: 'e', label: 'React' }, { id: 'f', label: 'SQL' },
  { id: 'g', label: 'Git' }, { id: 'h', label: 'API' },
]

function MemoryMatch({ onEnd }: { onEnd: (xp: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro')
  const [cards, setCards] = useState<{ id: string; label: string; key: number; flipped: boolean; matched: boolean }[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [showEmoji, setShowEmoji] = useState(false)
  const [emojiType, setEmojiType] = useState<keyof typeof REACTIONS>('correct')
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle')

  const initGame = () => {
    const doubled = [...MEMORY_PAIRS, ...MEMORY_PAIRS]
      .map((p, i) => ({ ...p, key: i, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5)
    setCards(doubled)
    setSelected([])
    setMoves(0)
    setMatches(0)
    setStartTime(Date.now())
    setPhase('playing')
    setMascotMood('thinking')
  }

  useEffect(() => {
    if (phase !== 'playing') return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(t)
  }, [phase, startTime])

  const handleFlip = (key: number) => {
    if (selected.length === 2) return
    const card = cards[key]
    if (card.flipped || card.matched) return

    safePlay(playFlip)
    const newCards = cards.map((c, i) => i === key ? { ...c, flipped: true } : c)
    setCards(newCards)
    const newSelected = [...selected, key]
    setSelected(newSelected)

    if (newSelected.length === 2) {
      setMoves(m => m + 1)
      const [a, b] = newSelected
      if (newCards[a].id === newCards[b].id) {
        safePlay(playCorrect)
        setEmojiType('correct')
        setMascotMood('happy')
        setShowEmoji(true)
        setTimeout(() => setShowEmoji(false), 700)
        setTimeout(() => {
          setCards(prev => prev.map((c, i) =>
            i === a || i === b ? { ...c, matched: true } : c
          ))
          setSelected([])
          const newMatches = matches + 1
          setMatches(newMatches)
          if (newMatches === MEMORY_PAIRS.length) {
            safePlay(playVictory)
            setMascotMood('victory')
            setPhase('result')
          } else {
            setMascotMood('thinking')
          }
        }, 400)
      } else {
        safePlay(playWrong)
        setEmojiType('wrong')
        setMascotMood('sad')
        setShowEmoji(true)
        setTimeout(() => { setShowEmoji(false); setMascotMood('thinking') }, 700)
        setTimeout(() => {
          setCards(prev => prev.map((c, i) =>
            i === a || i === b ? { ...c, flipped: false } : c
          ))
          setSelected([])
        }, 800)
      }
    }
  }

  const earnedXp = Math.max(20, Math.min(120, 120 - moves * 3 - Math.floor(elapsed / 5)))

  if (phase === 'intro') return (
    <GameIntro
      title="Xotira O'yini"
      icon={<Star size={32} className="text-yellow-400" />}
      color="from-yellow-600 to-amber-600"
      gameId="memory-match"
      rules={["Juft kartochkalarni toping", "Kam harakat = ko'proq XP", "Tezroq tugatish = bonus XP", "Barcha juftlarni toping"]}
      onStart={initGame}
      onBack={() => onEnd(0)}
    />
  )

  if (phase === 'result') return (
    <GameResult
      title="Xotira O'yini"
      earnedXp={earnedXp}
      gameId="memory-match"
      mood="victory"
      stats={[
        { label: 'Harakatlar soni', value: String(moves) },
        { label: 'Vaqt', value: `${elapsed}s` },
      ]}
      onEnd={() => onEnd(earnedXp)}
    />
  )

  return (
    <GameBackground gameId="memory-match">
      <EmojiReaction type={emojiType} show={showEmoji} />
      <Mascot mood={mascotMood} visible={phase === 'playing'} />

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Harakatlar: <span className="text-yellow-400 font-bold">{moves}</span></span>
            <span className="text-slate-400">Vaqt: <span className="text-yellow-400 font-bold">{elapsed}s</span></span>
            <span className="text-emerald-400 font-bold">{matches}/{MEMORY_PAIRS.length} juft</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {cards.map((card, i) => (
              <motion.button
                key={card.key}
                onClick={() => handleFlip(i)}
                whileHover={!card.flipped && !card.matched ? { scale: 1.05, y: -2 } : {}}
                whileTap={!card.flipped && !card.matched ? { scale: 0.9 } : {}}
                animate={card.matched ? { scale: [1, 1.1, 1] } : {}}
                className={`aspect-square rounded-xl text-xs font-bold transition-all ${
                  card.matched
                    ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                    : card.flipped
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white/10 text-transparent hover:bg-white/15 border border-white/10'
                }`}
              >
                {(card.flipped || card.matched) ? card.label : '?'}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </GameBackground>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
function GameIntro({ title, icon, color, gameId, rules, onStart, onBack }: {
  title: string; icon: React.ReactNode; color: string; gameId: string
  rules: string[]; onStart: () => void; onBack: () => void
}) {
  return (
    <GameBackground gameId={gameId}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-5">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-200 text-sm flex items-center gap-1">
            ← Orqaga
          </button>
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 space-y-5">
            <motion.div
              animate={{ rotate: [-5, 5, -5, 5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 1, delay: 0.3 }}
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto shadow-lg`}
            >
              {icon}
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-50 text-center">{title}</h2>
            <div className="space-y-2">
              {rules.map(r => (
                <div key={r} className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  {r}
                </div>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onStart}
              className={`w-full py-4 rounded-2xl bg-gradient-to-r ${color} hover:brightness-110 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg`}
            >
              <Play size={18} /> Boshlash
            </motion.button>
          </div>
        </motion.div>
      </div>
    </GameBackground>
  )
}

function GameResult({ title, earnedXp, gameId, mood, stats, onEnd }: {
  title: string; earnedXp: number; gameId: string; mood: MascotMood
  stats: { label: string; value: string }[]; onEnd: () => void
}) {
  const isWin = mood === 'victory'
  return (
    <GameBackground gameId={gameId}>
      <Mascot mood={mood} visible />
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center space-y-4">
            <motion.div
              animate={{ rotate: isWin ? [0, -10, 10, -5, 5, 0] : [0, -5, 5, 0] }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ fontSize: '56px' }}
            >
              {isWin ? '🏆' : '💪'}
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-50">{title} tugadi!</h2>
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
          <div className="grid grid-cols-2 gap-3">
            {stats.map(s => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-lg font-bold text-slate-200">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onEnd}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold transition-all flex items-center justify-center gap-2"
          >
            <ChevronRight size={18} /> O'yinlarga qaytish
          </motion.button>
        </motion.div>
      </div>
    </GameBackground>
  )
}
