import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Coins, TrendingUp, Rocket, Crown, Zap } from 'lucide-react'
import { getTitleForLevel } from '../storage'

interface Props {
  open: boolean
  newLevel: number
  earnedXp: number
  earnedCoins: number
  onClose: () => void
}

const levelIcons = [Star, Zap, Crown, Rocket, TrendingUp]

export function LevelUpModal({ open, newLevel, earnedXp, earnedCoins, onClose }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (open) setShow(true)
  }, [open])

  const title   = getTitleForLevel(newLevel)
  const IconComp = levelIcons[newLevel % levelIcons.length]

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm"
        >
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 0, x: 0 }}
                animate={{ opacity: [0, 1, 0], y: -120, x: (i % 2 === 0 ? 1 : -1) * (20 + i * 8) }}
                transition={{ duration: 2 + i * 0.2, delay: i * 0.1, repeat: Infinity }}
                className="absolute bottom-1/3"
                style={{ left: `${10 + i * 7}%` }}
              >
                <Star size={10 + (i % 3) * 6} className="text-yellow-400 fill-yellow-400/40" />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="relative w-full max-w-sm mx-4 rounded-3xl border border-yellow-500/30 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl overflow-hidden"
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/8 to-transparent pointer-events-none" />

            <div className="relative px-8 py-10 text-center space-y-6">
              {/* Icon */}
              <motion.div
                animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/20"
              >
                <IconComp size={44} className="text-yellow-400" />
              </motion.div>

              {/* Level */}
              <div>
                <div className="text-xs text-yellow-500 font-semibold tracking-widest uppercase mb-2">
                  Yangi daraja!
                </div>
                <h2 className="text-4xl font-bold text-white">{newLevel}-daraja</h2>
                <div className="text-lg text-yellow-300 font-medium mt-1">{title}</div>
              </div>

              {/* Rewards */}
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-emerald-400">
                    <TrendingUp size={18} />
                    +{earnedXp}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">XP</div>
                </div>
                <div className="w-px bg-slate-800" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-yellow-400">
                    <Coins size={18} />
                    +{earnedCoins}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Tanga</div>
                </div>
              </div>

              <p className="text-sm text-slate-400">
                Tabriklaymiz! Yangi darajaga ko'tarildingiz. Davom eting!
              </p>

              <button
                onClick={() => { setShow(false); onClose() }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-slate-900 font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-yellow-500/25 flex items-center justify-center gap-2"
              >
                <Rocket size={16} />
                Davom etish
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
