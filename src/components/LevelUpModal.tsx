import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Coins, TrendingUp, Rocket, Crown, Zap, Trophy, Flame, Gem } from 'lucide-react'
import { getTitleForLevel } from '../storage'

interface Props {
  open: boolean
  newLevel: number
  earnedXp: number
  earnedCoins: number
  onClose: () => void
}

// ─── Level Up ovozi — Web Audio API ──────────────────────────────────────────
function playLevelUpSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    const ac = new AudioCtx()

    // Fanfar: C E G C' — triumf akkord
    const notes = [
      { f: 523, t: 0,    d: 0.3 },
      { f: 659, t: 0.1,  d: 0.3 },
      { f: 784, t: 0.2,  d: 0.3 },
      { f: 1047,t: 0.35, d: 0.5 },
      { f: 784, t: 0.5,  d: 0.2 },
      { f: 1047,t: 0.65, d: 0.6 },
    ]

    notes.forEach(({ f, t, d }) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, ac.currentTime + t)
      gain.gain.setValueAtTime(0, ac.currentTime + t)
      gain.gain.linearRampToValueAtTime(0.28, ac.currentTime + t + 0.02)
      gain.gain.setValueAtTime(0.28, ac.currentTime + t + d - 0.05)
      gain.gain.linearRampToValueAtTime(0, ac.currentTime + t + d)
      osc.start(ac.currentTime + t)
      osc.stop(ac.currentTime + t + d)
    })

    // Shimmer effect — yuqori chastotali "sparkle"
    setTimeout(() => {
      ;[2093, 2637, 3136].forEach((f, i) => {
        const osc = ac.createOscillator()
        const gain = ac.createGain()
        osc.connect(gain)
        gain.connect(ac.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(f, ac.currentTime)
        gain.gain.setValueAtTime(0.08, ac.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3)
        osc.start(ac.currentTime + i * 0.06)
        osc.stop(ac.currentTime + 0.4)
      })
    }, 700)
  } catch { /* silent fail */ }
}

// ─── Confetti particle ────────────────────────────────────────────────────────
interface Particle {
  id: number
  x: number
  color: string
  size: number
  delay: number
  duration: number
  rotate: number
  shape: 'rect' | 'circle' | 'star'
}

function generateParticles(count: number): Particle[] {
  const colors = [
    '#f59e0b', '#fbbf24', '#10b981', '#3b82f6',
    '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4',
  ]
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    rotate: Math.random() * 720 - 360,
    shape: (['rect', 'circle', 'star'] as const)[Math.floor(Math.random() * 3)],
  }))
}

// ─── Level ga qarab icon va rang ─────────────────────────────────────────────
function getLevelTheme(level: number) {
  if (level >= 20) return { Icon: Crown,  gradient: 'from-yellow-400 to-orange-500', glow: '#f59e0b', label: '👑 AFSONAVIY' }
  if (level >= 15) return { Icon: Trophy, gradient: 'from-purple-400 to-pink-500',   glow: '#a855f7', label: '🏆 GRANDMASTER' }
  if (level >= 10) return { Icon: Gem,    gradient: 'from-cyan-400 to-blue-500',     glow: '#06b6d4', label: '💎 EKSPERT' }
  if (level >= 7)  return { Icon: Flame,  gradient: 'from-orange-400 to-red-500',    glow: '#f97316', label: '🔥 ILG\'OR' }
  if (level >= 5)  return { Icon: Zap,    gradient: 'from-emerald-400 to-teal-500',  glow: '#10b981', label: '⚡ TAJRIBALI' }
  if (level >= 3)  return { Icon: Star,   gradient: 'from-blue-400 to-indigo-500',   glow: '#3b82f6', label: '⭐ O\'RGANUVCHI' }
  return           { Icon: Rocket, gradient: 'from-yellow-400 to-amber-500',         glow: '#f59e0b', label: '🚀 YANGI DARAJA' }
}

export function LevelUpModal({ open, newLevel, earnedXp, earnedCoins, onClose }: Props) {
  const [show, setShow] = useState(false)
  const [particles] = useState(() => generateParticles(40))
  const [phase, setPhase] = useState<'enter' | 'celebrate' | 'idle'>('enter')
  const hasPlayedRef = useRef(false)

  useEffect(() => {
    if (open) {
      setShow(true)
      setPhase('enter')
      hasPlayedRef.current = false
    }
  }, [open])

  // Ovoz va celebrate phase
  useEffect(() => {
    if (!show) return
    const t1 = setTimeout(() => {
      if (!hasPlayedRef.current) {
        playLevelUpSound()
        hasPlayedRef.current = true
      }
      setPhase('celebrate')
    }, 200)
    const t2 = setTimeout(() => setPhase('idle'), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [show])

  const title = getTitleForLevel(newLevel)
  const theme = getLevelTheme(newLevel)
  const { Icon } = theme

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(2, 6, 23, 0.88)' }}
        >
          {/* ── Confetti ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: -20, x: `${p.x}vw`, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: ['0vh', '110vh'],
                  rotate: p.rotate,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: 'easeIn',
                }}
                className="absolute top-0"
                style={{
                  width: p.size,
                  height: p.shape === 'circle' ? p.size : p.size * 0.6,
                  background: p.color,
                  borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'star' ? '2px' : '2px',
                  clipPath: p.shape === 'star'
                    ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                    : undefined,
                }}
              />
            ))}
          </div>

          {/* ── Glow pulse ── */}
          <motion.div
            animate={phase === 'celebrate' ? {
              scale: [1, 1.8, 1],
              opacity: [0, 0.3, 0],
            } : {}}
            transition={{ duration: 0.8 }}
            className="absolute w-96 h-96 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${theme.glow}60 0%, transparent 70%)` }}
          />

          {/* ── Modal card ── */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
              border: `1px solid ${theme.glow}40`,
              boxShadow: `0 0 60px ${theme.glow}30, 0 25px 50px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Top gradient bar */}
            <div
              className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`}
            />

            {/* Shimmer overlay */}
            <motion.div
              animate={phase === 'celebrate' ? { x: ['-100%', '200%'] } : {}}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
              }}
            />

            <div className="relative px-8 py-8 text-center space-y-5">

              {/* ── Icon ── */}
              <div className="relative mx-auto w-fit">
                {/* Outer ring pulse */}
                <motion.div
                  animate={phase === 'celebrate' ? {
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 0, 0.6],
                  } : { scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
                  transition={{
                    duration: phase === 'celebrate' ? 0.6 : 2,
                    repeat: phase === 'idle' ? Infinity : 0,
                  }}
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: `${theme.glow}30`, filter: 'blur(8px)' }}
                />

                <motion.div
                  animate={phase === 'celebrate'
                    ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }
                    : { rotate: [0, -3, 3, 0] }
                  }
                  transition={{
                    duration: phase === 'celebrate' ? 0.6 : 3,
                    repeat: phase === 'idle' ? Infinity : 0,
                    repeatDelay: 2,
                  }}
                  className={`relative w-24 h-24 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}
                  style={{ boxShadow: `0 8px 32px ${theme.glow}50` }}
                >
                  <Icon size={44} className="text-white drop-shadow-lg" />
                </motion.div>

                {/* Orbiting stars */}
                {phase !== 'enter' && [0, 120, 240].map((deg, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 w-3 h-3"
                    animate={{ rotate: [deg, deg + 360] }}
                    transition={{ duration: 3 + i, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: '0 0' }}
                  >
                    <motion.div
                      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                      className="w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
                      style={{
                        background: theme.glow,
                        transform: `translateX(44px) translateY(-4px)`,
                        boxShadow: `0 0 6px ${theme.glow}`,
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* ── Badge ── */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div
                  className="inline-block px-3 py-1 rounded-full text-xs font-black tracking-widest mb-2"
                  style={{
                    background: `${theme.glow}20`,
                    border: `1px solid ${theme.glow}50`,
                    color: theme.glow,
                  }}
                >
                  {theme.label}
                </div>
              </motion.div>

              {/* ── Level number ── */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
              >
                <h2 className="text-5xl font-black text-white leading-none">
                  {newLevel}
                  <span className="text-2xl font-bold text-slate-400 ml-1">-daraja</span>
                </h2>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg font-semibold mt-1"
                  style={{ color: theme.glow }}
                >
                  {title}
                </motion.div>
              </motion.div>

              {/* ── Rewards ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center gap-4"
              >
                <div
                  className="flex-1 rounded-2xl py-3 px-4 text-center"
                  style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}
                >
                  <div className="flex items-center justify-center gap-1 text-2xl font-black text-emerald-400">
                    <TrendingUp size={16} />
                    +{earnedXp}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">XP</div>
                </div>
                <div
                  className="flex-1 rounded-2xl py-3 px-4 text-center"
                  style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}
                >
                  <div className="flex items-center justify-center gap-1 text-2xl font-black text-yellow-400">
                    <Coins size={16} />
                    +{earnedCoins}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Tanga</div>
                </div>
              </motion.div>

              {/* ── Message ── */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-slate-400 leading-relaxed"
              >
                Tabriklaymiz! Siz <span className="text-white font-semibold">{newLevel}-darajaga</span> ko'tarildingiz.
                Davom eting!
              </motion.p>

              {/* ── Button ── */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setShow(false); onClose() }}
                className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2`}
                style={{ boxShadow: `0 8px 24px ${theme.glow}40` }}
              >
                <Rocket size={16} />
                Davom etish
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
