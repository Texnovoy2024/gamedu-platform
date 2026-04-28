
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Trophy, Zap, Crown, Gem, Flame, Shield, Rocket, Award } from 'lucide-react'

export interface UnlockedAchievement {
  id: string
  title: string
  description: string
  rarity: 'oddiy' | 'noyob' | 'epik' | 'afsonaviy'
  category: string
}

interface Props {
  achievements: UnlockedAchievement[]
  onClose: () => void
}

const rarityConfig = {
  oddiy:     { label: 'Oddiy',     color: 'text-slate-300',  bg: 'from-slate-600/40 to-slate-700/20',   border: 'border-slate-500/50',   glow: '' },
  noyob:     { label: 'Noyob',     color: 'text-blue-300',   bg: 'from-blue-600/40 to-blue-700/20',     border: 'border-blue-500/50',    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.4)]' },
  epik:      { label: 'Epik',      color: 'text-purple-300', bg: 'from-purple-600/40 to-violet-700/20', border: 'border-purple-500/50',  glow: 'shadow-[0_0_40px_rgba(139,92,246,0.5)]' },
  afsonaviy: { label: 'Afsonaviy', color: 'text-yellow-300', bg: 'from-yellow-600/40 to-amber-700/20',  border: 'border-yellow-500/50',  glow: 'shadow-[0_0_50px_rgba(245,158,11,0.6)]' },
}

const ICON_MAP: Record<string, React.ElementType> = {
  'first-step': Star,   'xp-100': Star,    'xp-500': Zap,
  'level-2': Rocket,    'tasks-5': Award,  'tasks-10': Trophy,
  'tasks-25': Trophy,   'tasks-50': Crown, 'xp-1500': Gem,
  'xp-5000': Flame,     'level-5': Trophy, 'level-10': Zap,
  'level-20': Crown,    'coins-100': Star, 'coins-500': Gem,
  'streak-3': Flame,    'streak-7': Shield,'streak-14': Zap,
  'streak-30': Crown,   'xp-10000': Crown, 'tasks-100': Trophy,
}

// Confetti particle
function ConfettiParticle({ index }: { index: number }) {
  const colors = ['#7c3aed','#db2777','#f59e0b','#06b6d4','#10b981','#f97316','#8b5cf6','#ec4899']
  const color  = colors[index % colors.length]
  const size   = 6 + (index % 4) * 3
  const left   = `${(index * 7.3) % 100}%`
  const delay  = (index * 0.08) % 1.2
  const dur    = 1.5 + (index % 4) * 0.4

  return (
    <motion.div
      initial={{ y: -20, x: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{ y: 400, x: (index % 2 === 0 ? 1 : -1) * (20 + (index % 5) * 15), opacity: 0, rotate: 360 * (index % 3 + 1), scale: 0.3 }}
      transition={{ duration: dur, delay, ease: 'easeIn' }}
      className="absolute pointer-events-none"
      style={{ left, top: 0, width: size, height: size, background: color, borderRadius: index % 3 === 0 ? '50%' : '2px' }}
    />
  )
}

export function AchievementUnlockModal({ achievements, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showConfetti, setShowConfetti] = useState(true)

  const current = achievements[currentIndex]
  const isLast  = currentIndex === achievements.length - 1
  const cfg     = rarityConfig[current?.rarity ?? 'oddiy']
  const IconComp = ICON_MAP[current?.id ?? ''] ?? Award

  useEffect(() => {
    setShowConfetti(true)
    const t = setTimeout(() => setShowConfetti(false), 2000)
    return () => clearTimeout(t)
  }, [currentIndex])

  const handleNext = () => {
    if (isLast) onClose()
    else { setCurrentIndex(i => i + 1); setShowConfetti(true) }
  }

  if (!current) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {showConfetti && Array.from({ length: 30 }).map((_, i) => (
            <ConfettiParticle key={`${currentIndex}-${i}`} index={i} />
          ))}
        </div>

        {/* Modal */}
        <motion.div
          key={currentIndex}
          initial={{ scale: 0.5, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className={`relative w-full max-w-sm rounded-3xl border ${cfg.border} ${cfg.glow} overflow-hidden`}
          style={{ background: 'linear-gradient(135deg, #0d0b1e 0%, #1a1040 100%)' }}
        >
          {/* Top glow */}
          <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${cfg.bg} opacity-60 pointer-events-none`} />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <X size={14} className="text-slate-300" />
          </button>

          <div className="relative px-6 pt-8 pb-6 text-center space-y-5">
            {/* Badge count */}
            {achievements.length > 1 && (
              <div className="flex justify-center gap-1.5 mb-2">
                {achievements.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? `w-6 ${cfg.color.replace('text-','bg-')}` : 'w-1.5 bg-slate-700'}`} />
                ))}
              </div>
            )}

            {/* Animated icon */}
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 4, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative inline-block"
            >
              {/* Outer ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className={`w-28 h-28 rounded-full border-2 border-dashed ${cfg.border} flex items-center justify-center mx-auto`}
              >
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${cfg.bg} border ${cfg.border} flex items-center justify-center ${cfg.glow}`}>
                  <IconComp size={36} className={cfg.color} />
                </div>
              </motion.div>

              {/* Sparkles */}
              {['top-0 right-2', 'bottom-1 left-1', 'top-2 left-0'].map((pos, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, delay: 0.3 + i * 0.2, repeat: Infinity, repeatDelay: 1 }}
                  className={`absolute ${pos}`}
                >
                  <Star size={12} className={cfg.color} fill="currentColor" />
                </motion.div>
              ))}
            </motion.div>

            {/* Text */}
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-xs font-bold tracking-widest uppercase ${cfg.color}`}
              >
                🎉 Yangi yutuq ochildi!
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-black text-white"
              >
                {current.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-slate-400"
              >
                {current.description}
              </motion.p>

              {/* Rarity badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 }}
                className="flex justify-center"
              >
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.border} ${cfg.color} bg-black/30`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {cfg.label}
                </span>
              </motion.div>
            </div>

            {/* Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleNext}
              className={`w-full py-3.5 rounded-2xl font-bold text-base text-white transition-all bg-gradient-to-r ${cfg.bg.replace('/40','').replace('/20','')} border ${cfg.border} hover:brightness-125 ${cfg.glow}`}
              style={{ background: current.rarity === 'afsonaviy' ? 'linear-gradient(135deg,#d97706,#b45309)' : current.rarity === 'epik' ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : current.rarity === 'noyob' ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'linear-gradient(135deg,#475569,#334155)' }}
            >
              {isLast ? "Zo'r, davom etaman! 🚀" : `Keyingisi (${currentIndex + 2}/${achievements.length})`}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
