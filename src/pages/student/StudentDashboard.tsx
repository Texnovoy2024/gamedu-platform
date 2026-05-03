import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Flame, Coins, Star, CheckCircle2, ClipboardList, Calendar,
  Zap, Target, LogIn, TrendingUp, Leaf, Rocket, Crown, Gem, Trophy,
  Flame as FlameIcon,
} from 'lucide-react'
import {
  getCurrentUserId, calculateStudentStats, getStreak, getCoinData,
  getDailyQuests, updateStreak, getTitleForLevel, getAvatarForLevel,
  xpForLevel, getUsers,
} from '../../storage'
import { XpBar } from '../../components/XpBar'
import type { DailyQuest, StreakData, CoinData, StudentStats } from '../../types'

const questIcons: Record<string, React.ReactNode> = {
  complete_tasks: <ClipboardList size={20} className="text-blue-400" />,
  earn_xp:        <Zap size={20} className="text-yellow-400" />,
  perfect_score:  <Target size={20} className="text-rose-400" />,
  login:          <LogIn size={20} className="text-emerald-400" />,
}

const AVATAR_ICON_MAP: Record<string, React.ElementType> = {
  leaf: Leaf, target: Target, trophy: Trophy, zap: Zap,
  gem: Gem, flame: FlameIcon, crown: Crown, rocket: Rocket, star: Star,
}

export function StudentDashboard() {
  const currentId = getCurrentUserId()
  const [stats, setStats] = useState<StudentStats>({ totalXp: 0, level: 1, completedTasks: 0, studentId: '' })
  const [streak, setStreak] = useState<StreakData>({ userId: '', currentStreak: 0, longestStreak: 0, lastActiveDate: '', activeDates: [] })
  const [coinData, setCoinData] = useState<CoinData>({ userId: '', coins: 0, totalEarned: 0 })
  const [quests, setQuests] = useState<DailyQuest[]>([])
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (!currentId) return
    async function load() {
      const [s, str, coins, q, users] = await Promise.all([
        calculateStudentStats(currentId!),
        getStreak(currentId!),
        getCoinData(currentId!),
        getDailyQuests(currentId!),
        getUsers(),
      ])
      await updateStreak(currentId!)
      setStats(s)
      setStreak(str)
      setCoinData(coins)
      setQuests(q)
      const user = users.find(u => u.id === currentId)
      setUserName(user?.name || currentId!)
    }
    load()
  }, [currentId])

  const title      = getTitleForLevel(stats.level)
  const avatarKey  = getAvatarForLevel(stats.level)
  const AvatarIcon = AVATAR_ICON_MAP[avatarKey] ?? Star
  const nextLevelXp = xpForLevel(stats.level + 1)
  const prevLevelXp = xpForLevel(stats.level)
  const xpProgress = Math.round(((stats.totalXp - prevLevelXp) / Math.max(1, nextLevelXp - prevLevelXp)) * 100)
  const xpToNext = nextLevelXp - stats.totalXp
  const completedQuests = quests.filter(q => q.completed).length

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="text-xs text-slate-500 mb-1">GamEdu o'quvchi paneli</div>
        <h1 className="text-2xl font-bold text-slate-50">Xush kelibsiz, {userName}!</h1>
        <p className="mt-1 text-sm text-slate-400">{title} · {stats.level}-daraja</p>
      </motion.div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 }}
          className="col-span-2 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 mb-1">Joriy daraja</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary-300">{stats.level}</span>
                <span className="text-sm text-slate-400">{title}</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <AvatarIcon size={28} className="text-yellow-400" />
            </div>
          </div>
          <XpBar currentXp={stats.totalXp} level={stats.level} />
          <div className="text-xs text-slate-500">
            Keyingi darajaga <span className="text-primary-300 font-semibold">{xpToNext} XP</span> qoldi
            &nbsp;·&nbsp;
            <span className="text-emerald-400 font-semibold">{xpProgress}%</span> bajarildi
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.13 }}
          className="rounded-2xl border border-orange-500/25 bg-gradient-to-br from-orange-950/30 to-slate-950 p-4 space-y-2"
        >
          <div className="flex items-center gap-2 text-orange-400">
            <Flame size={16} />
            <span className="text-xs font-semibold">Seriya</span>
          </div>
          <div className="text-3xl font-bold text-orange-300">{streak.currentStreak}</div>
          <div className="text-xs text-slate-500">
            Eng uzun: <span className="text-orange-300 font-medium">{streak.longestStreak}</span> kun
          </div>
          {streak.currentStreak >= 3 && (
            <div className="text-xs text-orange-400 font-medium">
              +{streak.currentStreak >= 7 ? 50 : streak.currentStreak >= 5 ? 30 : 15} XP bonus
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18 }}
          className="rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-950/30 to-slate-950 p-4 space-y-2"
        >
          <div className="flex items-center gap-2 text-yellow-400">
            <Coins size={16} />
            <span className="text-xs font-semibold">Tangalar</span>
          </div>
          <div className="text-3xl font-bold text-yellow-300">{coinData.coins}</div>
          <div className="text-xs text-slate-500">
            Jami: <span className="text-yellow-300 font-medium">{coinData.totalEarned}</span>
          </div>
        </motion.div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Umumiy XP',   value: stats.totalXp,                        color: 'text-emerald-300', Icon: TrendingUp },
          { label: 'Topshiriqlar', value: stats.completedTasks,                 color: 'text-accent-400',  Icon: CheckCircle2 },
          { label: 'Kunlik vazifa', value: `${completedQuests}/${quests.length}`, color: 'text-blue-300',   Icon: ClipboardList },
        ].map(({ label, value, color, Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 + i * 0.05 }}
            className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col items-center gap-1"
          >
            <Icon size={16} className={`${color} opacity-70`} />
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Daily Quests */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
        className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200">
            <ClipboardList size={15} />
            <span className="text-sm font-semibold">Kunlik vazifalar</span>
          </div>
          <span className="text-xs text-slate-500">{completedQuests}/{quests.length} bajarildi</span>
        </div>
        <div className="divide-y divide-slate-800/50">
          {quests.map((quest, i) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.42 + i * 0.05 }}
              className={`px-4 py-3 flex items-center gap-3 ${quest.completed ? 'opacity-55' : ''}`}
            >
              <div className="shrink-0">
                {questIcons[quest.type] ?? <ClipboardList size={20} className="text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${quest.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {quest.title}
                  </span>
                  {quest.completed && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={10} /> Bajarildi
                    </span>
                  )}
                </div>
                <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      quest.completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary-500 to-accent-500'
                    }`}
                    style={{ width: `${Math.min(100, (quest.currentCount / quest.targetCount) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">{quest.currentCount}/{quest.targetCount}</div>
              </div>
              <div className="text-right shrink-0 space-y-0.5">
                <div className="text-xs text-emerald-400 font-semibold">+{quest.rewardXp} XP</div>
                <div className="flex items-center justify-end gap-0.5 text-xs text-yellow-400">
                  <Coins size={10} />
                  <span>+{quest.rewardCoins}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Seriya taqvimi */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}
        className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4"
      >
        <div className="flex items-center gap-2 mb-3 text-slate-300">
          <Calendar size={15} />
          <span className="text-sm font-semibold">Faollik taqvimi — so'nggi 30 kun</span>
        </div>
        <StreakCalendar activeDates={streak.activeDates} />
      </motion.div>
    </div>
  )
}

function StreakCalendar({ activeDates }: { activeDates: string[] }) {
  const today = new Date()
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (29 - i))
    const dateStr = d.toISOString().split('T')[0]
    return { date: dateStr, active: activeDates.includes(dateStr), isToday: i === 29 }
  })
  return (
    <div className="flex flex-wrap gap-1.5">
      {days.map(day => (
        <div
          key={day.date}
          title={day.date}
          className={`w-6 h-6 rounded-md transition-all ${
            day.isToday
              ? day.active ? 'bg-orange-400 ring-2 ring-orange-300/60' : 'bg-slate-700 ring-2 ring-slate-500/60'
              : day.active ? 'bg-emerald-500/80' : 'bg-slate-800'
          }`}
        />
      ))}
    </div>
  )
}
