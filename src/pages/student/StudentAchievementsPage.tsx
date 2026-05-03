import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, CheckCircle2, Sprout, Star, TrendingUp,
  ClipboardList, Dumbbell, Flame, Crown, Zap, Gem,
  Coins, Wallet, Trophy, Target, Rocket, Award,
  ShieldCheck, Infinity, Sparkles,
} from 'lucide-react'
import { calculateStudentStats, getCurrentUserId, getProgress, getStreak, getCoinData } from '../../storage'
import { AchievementUnlockModal } from './AchievementUnlockModal'
import type { Achievement, AchievementCategory } from '../../types'
import type { UnlockedAchievement } from './AchievementUnlockModal'

const ICON_MAP: Record<string, React.ElementType> = {
  'first-step': Sprout, 'xp-100': Star, 'xp-500': TrendingUp, 'level-2': TrendingUp,
  'tasks-5': ClipboardList, 'tasks-10': Dumbbell, 'tasks-25': Dumbbell, 'tasks-50': Trophy,
  'xp-1500': Gem, 'xp-5000': Flame, 'level-5': Trophy, 'level-10': Zap, 'level-20': Crown,
  'coins-100': Coins, 'coins-500': Wallet, 'streak-3': Flame, 'streak-7': ShieldCheck,
  'streak-14': Zap, 'streak-30': Infinity, 'xp-10000': Rocket, 'tasks-100': Target,
}

const rarityCard = {
  oddiy:     'border-slate-500/50 bg-slate-900/60 hover:border-slate-400/70 hover:bg-slate-800/60',
  noyob:     'border-blue-500/50 bg-blue-950/30 hover:border-blue-400/70 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]',
  epik:      'border-purple-500/50 bg-purple-950/30 hover:border-purple-400/70 hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]',
  afsonaviy: 'border-yellow-500/50 bg-yellow-950/30 hover:border-yellow-400/70 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]',
}
const rarityBadge = {
  oddiy: 'bg-slate-700/80 text-slate-300', noyob: 'bg-blue-900/60 text-blue-300',
  epik: 'bg-purple-900/60 text-purple-300', afsonaviy: 'bg-yellow-900/60 text-yellow-300',
}
const rarityIconBg = {
  oddiy: 'bg-slate-800 text-slate-300', noyob: 'bg-blue-900/60 text-blue-300',
  epik: 'bg-purple-900/60 text-purple-300', afsonaviy: 'bg-yellow-900/60 text-yellow-300',
}
const rarityGlow = {
  oddiy: '', noyob: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
  epik: 'shadow-[0_0_20px_rgba(139,92,246,0.2)]', afsonaviy: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
}

const catConfig: Record<AchievementCategory | 'all', { label: string; Icon: React.ElementType }> = {
  all:         { label: 'Barchasi',     Icon: Award },
  boshlangich: { label: "Boshlang'ich", Icon: Sprout },
  faollik:     { label: 'Faollik',      Icon: ClipboardList },
  mahorat:     { label: 'Mahorat',      Icon: Zap },
  streak:      { label: 'Seriya',       Icon: Flame },
  maxsus:      { label: 'Maxsus',       Icon: Crown },
}
const categories = Object.keys(catConfig) as (AchievementCategory | 'all')[]

export function StudentAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all')
  const [celebrateAch, setCelebrateAch] = useState<UnlockedAchievement | null>(null)

  useEffect(() => {
    const currentId = getCurrentUserId()
    if (!currentId) return
    async function load() {
      const [stats, allProg, streak, coins] = await Promise.all([
        calculateStudentStats(currentId!),
        getProgress(),
        getStreak(currentId!),
        getCoinData(currentId!),
      ])
      const progress = allProg.filter(p => p.studentId === currentId && p.status === 'completed')

      const list: Achievement[] = [
        { id: 'first-step', title: 'Birinchi qadam',     description: 'Birinchi topshiriqni yakunladingiz.',   icon: '', category: 'boshlangich', rarity: 'oddiy',     unlocked: progress.length >= 1 },
        { id: 'xp-100',     title: 'XP boshlanishi',     description: '500 XP to\'pladingiz.',                 icon: '', category: 'boshlangich', rarity: 'oddiy',     unlocked: stats.totalXp >= 500 },
        { id: 'xp-500',     title: 'XP yo\'li',          description: '2 500 XP to\'pladingiz.',               icon: '', category: 'boshlangich', rarity: 'oddiy',     unlocked: stats.totalXp >= 2500 },
        { id: 'level-2',    title: 'O\'sish boshlandi',  description: '2-darajaga chiqdingiz.',                icon: '', category: 'boshlangich', rarity: 'oddiy',     unlocked: stats.level >= 2 },
        { id: 'tasks-5',    title: 'Faol o\'quvchi',     description: '15 ta topshiriq yakunladingiz.',        icon: '', category: 'faollik',     rarity: 'oddiy',     unlocked: progress.length >= 15 },
        { id: 'tasks-10',   title: 'Marafonchi',         description: '30 ta topshiriq yakunladingiz.',        icon: '', category: 'faollik',     rarity: 'noyob',     unlocked: progress.length >= 30 },
        { id: 'tasks-25',   title: 'Charchamaydigan',    description: '75 ta topshiriq yakunladingiz.',        icon: '', category: 'faollik',     rarity: 'noyob',     unlocked: progress.length >= 75 },
        { id: 'tasks-50',   title: 'Topshiriq ustasi',   description: '150 ta topshiriq yakunladingiz.',       icon: '', category: 'faollik',     rarity: 'epik',      unlocked: progress.length >= 150 },
        { id: 'xp-1500',    title: 'Barqaror o\'sish',   description: '8 000 XP to\'pladingiz.',               icon: '', category: 'faollik',     rarity: 'noyob',     unlocked: stats.totalXp >= 8000 },
        { id: 'xp-5000',    title: 'XP Qahramoni',       description: '25 000 XP to\'pladingiz.',              icon: '', category: 'faollik',     rarity: 'epik',      unlocked: stats.totalXp >= 25000 },
        { id: 'level-5',    title: 'Daraja ustasi',      description: '5-darajaga chiqdingiz.',                icon: '', category: 'mahorat',     rarity: 'noyob',     unlocked: stats.level >= 5 },
        { id: 'level-10',   title: 'Ekspert',            description: '10-darajaga chiqdingiz.',               icon: '', category: 'mahorat',     rarity: 'epik',      unlocked: stats.level >= 10 },
        { id: 'level-20',   title: 'Grandmaster',        description: '20-darajaga chiqdingiz.',               icon: '', category: 'mahorat',     rarity: 'afsonaviy', unlocked: stats.level >= 20 },
        { id: 'coins-100',  title: 'Tanga yig\'uvchi',   description: '500 tanga to\'pladingiz.',              icon: '', category: 'mahorat',     rarity: 'oddiy',     unlocked: coins.totalEarned >= 500 },
        { id: 'coins-500',  title: 'Boylik',             description: '2 000 tanga to\'pladingiz.',            icon: '', category: 'mahorat',     rarity: 'noyob',     unlocked: coins.totalEarned >= 2000 },
        { id: 'streak-3',   title: 'Ketma-ket 3 kun',    description: '3 kun ketma-ket kirdingiz.',            icon: '', category: 'streak',      rarity: 'oddiy',     unlocked: streak.longestStreak >= 3 },
        { id: 'streak-7',   title: 'Haftalik chempion',  description: '7 kun ketma-ket kirdingiz.',            icon: '', category: 'streak',      rarity: 'noyob',     unlocked: streak.longestStreak >= 7 },
        { id: 'streak-14',  title: '2 haftalik jasorat', description: '14 kun ketma-ket kirdingiz.',           icon: '', category: 'streak',      rarity: 'epik',      unlocked: streak.longestStreak >= 14 },
        { id: 'streak-30',  title: 'Oylik afsonaviy',    description: '30 kun ketma-ket kirdingiz.',           icon: '', category: 'streak',      rarity: 'afsonaviy', unlocked: streak.longestStreak >= 30 },
        { id: 'xp-10000',   title: 'Afsonaviy o\'quvchi',description: '80 000 XP to\'pladingiz!',             icon: '', category: 'maxsus',      rarity: 'afsonaviy', unlocked: stats.totalXp >= 80000 },
        { id: 'tasks-100',  title: 'Yuz topshiriq',      description: '300 ta topshiriq yakunladingiz.',       icon: '', category: 'maxsus',      rarity: 'afsonaviy', unlocked: progress.length >= 300 },
      ]
      setAchievements(list)
    }
    load()
  }, [])

  const filtered      = activeCategory === 'all' ? achievements : achievements.filter(a => a.category === activeCategory)
  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount    = achievements.length

  const handleAchClick = (ach: Achievement) => {
    if (!ach.unlocked) return
    setCelebrateAch({ id: ach.id, title: ach.title, description: ach.description, rarity: ach.rarity, category: ach.category })
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-slate-500 mb-1.5">Badge va yutuqlar</div>
        <h1 className="text-xl font-bold text-slate-50">Yutuqlar</h1>
        <p className="mt-1 text-xs text-slate-400 max-w-xl">Ochilgan yutuqni bosib, uni nishonlang!</p>
      </div>

      <div className="rounded-2xl border border-purple-900/40 bg-black/30 p-4 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1.5 text-violet-300 font-semibold">
            <Award size={14} /> Umumiy progress
          </div>
          <span className="text-emerald-400 font-bold">{unlockedCount}/{totalCount}</span>
        </div>
        <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full xp-bar-fill"
          />
        </div>
        <div className="flex justify-between text-xs text-slate-600">
          <span>{totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}% to'ldirildi</span>
          <span className="text-violet-500">{totalCount - unlockedCount} ta qoldi</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-900/20 border border-violet-500/20 text-xs text-violet-300">
        <Sparkles size={13} /> Ochilgan yutuqni bosib, uni nishonlang!
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const { label, Icon } = catConfig[cat]
          const count = cat === 'all'
            ? achievements.filter(a => a.unlocked).length
            : achievements.filter(a => a.category === cat && a.unlocked).length
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/10'
              }`}
            >
              <Icon size={12} />
              {label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeCategory === cat ? 'bg-white/20 text-white' : 'bg-emerald-900/60 text-emerald-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <AnimatePresence>
          {filtered.map((ach, i) => {
            const IconComp = ICON_MAP[ach.id] ?? Award
            const isUnlocked = ach.unlocked
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleAchClick(ach)}
                className={`rounded-2xl border p-4 transition-all duration-200 ${
                  isUnlocked
                    ? `${rarityCard[ach.rarity]} ${rarityGlow[ach.rarity]} cursor-pointer active:scale-95`
                    : 'border-white/5 bg-white/3 opacity-40 grayscale cursor-not-allowed'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isUnlocked ? rarityIconBg[ach.rarity] : 'bg-slate-900 text-slate-700'
                  }`}>
                    {isUnlocked ? <IconComp size={22} /> : <Lock size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-sm ${isUnlocked ? 'text-slate-100' : 'text-slate-600'}`}>
                        {ach.title}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${rarityBadge[ach.rarity]}`}>
                        {ach.rarity}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${isUnlocked ? 'text-slate-400' : 'text-slate-700'}`}>
                      {ach.description}
                    </p>
                    {isUnlocked && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <CheckCircle2 size={11} className="text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-medium">Ochilgan</span>
                        <span className="text-[10px] text-slate-600 ml-1">· bosib nishonlang</span>
                      </div>
                    )}
                  </div>
                  {isUnlocked && (
                    <div className="shrink-0 self-center">
                      <Sparkles size={14} className={`${
                        ach.rarity === 'afsonaviy' ? 'text-yellow-400' :
                        ach.rarity === 'epik' ? 'text-purple-400' :
                        ach.rarity === 'noyob' ? 'text-blue-400' : 'text-slate-500'
                      } animate-pulse`} />
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {celebrateAch && (
        <AchievementUnlockModal
          key={celebrateAch.id + Date.now()}
          achievements={[celebrateAch]}
          onClose={() => setCelebrateAch(null)}
        />
      )}
    </div>
  )
}
