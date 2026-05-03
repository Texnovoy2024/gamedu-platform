import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  User, Star, TrendingUp, CheckCircle2, Coins, Flame, Save, KeyRound, Palette,
  Lock, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  getCurrentUserId, getUsers, upsertUser, calculateStudentStats,
  getCoinData, getStreak, getTitleForLevel, xpForLevel,
} from '../../storage'
import type { User as UserType, StudentStats, CoinData, StreakData } from '../../types'
import { Modal } from '../../components/Modal'
import { XpBar } from '../../components/XpBar'
import {
  Rocket, Sword, Shield, Zap, Crown, Gem, Leaf, Target,
  Flame as FlameIcon, Globe, Cpu,
} from 'lucide-react'

// ─── Avatar icons ─────────────────────────────────────────────────────────────
const AVATAR_ICONS: { key: string; Icon: React.ElementType; color: string }[] = [
  { key: 'leaf',   Icon: Leaf,      color: 'text-emerald-400' },
  { key: 'target', Icon: Target,    color: 'text-rose-400' },
  { key: 'trophy', Icon: Star,      color: 'text-yellow-400' },
  { key: 'zap',    Icon: Zap,       color: 'text-blue-400' },
  { key: 'gem',    Icon: Gem,       color: 'text-purple-400' },
  { key: 'flame',  Icon: FlameIcon, color: 'text-orange-400' },
  { key: 'crown',  Icon: Crown,     color: 'text-yellow-300' },
  { key: 'rocket', Icon: Rocket,    color: 'text-indigo-400' },
  { key: 'sword',  Icon: Sword,     color: 'text-slate-300' },
  { key: 'shield', Icon: Shield,    color: 'text-teal-400' },
  { key: 'globe',  Icon: Globe,     color: 'text-cyan-400' },
  { key: 'cpu',    Icon: Cpu,       color: 'text-pink-400' },
]

// ─── Daraja konfiguratsiyasi ──────────────────────────────────────────────────
const LEVEL_TIERS = [
  { range: [1, 2],   title: "Yangi o'quvchi", color: 'text-slate-300',   bg: 'bg-slate-700/40',   border: 'border-slate-600/40',   icon: '🌱', rarity: 'Oddiy' },
  { range: [3, 4],   title: "O'rganuvchi",    color: 'text-emerald-300', bg: 'bg-emerald-900/30', border: 'border-emerald-600/40', icon: '📚', rarity: 'Oddiy' },
  { range: [5, 6],   title: 'Tajribali',      color: 'text-blue-300',    bg: 'bg-blue-900/30',    border: 'border-blue-600/40',    icon: '⚡', rarity: 'Noyob' },
  { range: [7, 9],   title: "Ilg'or",         color: 'text-orange-300',  bg: 'bg-orange-900/30',  border: 'border-orange-600/40',  icon: '🔥', rarity: 'Noyob' },
  { range: [10, 14], title: 'Ekspert',         color: 'text-cyan-300',    bg: 'bg-cyan-900/30',    border: 'border-cyan-600/40',    icon: '💎', rarity: 'Epik' },
  { range: [15, 19], title: 'Ustoz',           color: 'text-purple-300',  bg: 'bg-purple-900/30',  border: 'border-purple-600/40',  icon: '🏆', rarity: 'Epik' },
  { range: [20, 29], title: 'Grandmaster',     color: 'text-pink-300',    bg: 'bg-pink-900/30',    border: 'border-pink-600/40',    icon: '👑', rarity: 'Afsonaviy' },
  { range: [30, 30], title: 'Afsonaviy',       color: 'text-yellow-300',  bg: 'bg-yellow-900/30',  border: 'border-yellow-600/40',  icon: '⭐', rarity: 'Afsonaviy' },
]

function getTierForLevel(level: number) {
  return LEVEL_TIERS.find(t => level >= t.range[0] && level <= t.range[1]) ?? LEVEL_TIERS[0]
}

const RARITY_COLOR: Record<string, string> = {
  'Oddiy':     'text-slate-400 bg-slate-800/60 border-slate-600/40',
  'Noyob':     'text-blue-300 bg-blue-900/40 border-blue-500/40',
  'Epik':      'text-purple-300 bg-purple-900/40 border-purple-500/40',
  'Afsonaviy': 'text-yellow-300 bg-yellow-900/40 border-yellow-500/40',
}

function getLevelXpRange(level: number) {
  const from = xpForLevel(level)
  const to   = xpForLevel(level + 1)
  return { from, to, needed: Math.max(1, to - from) }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function StudentProfilePage() {
  const currentId = getCurrentUserId()
  const [user,           setUser]           = useState<UserType | null>(null)
  const [stats,          setStats]          = useState<StudentStats | null>(null)
  const [coinData,       setCoinData]       = useState<CoinData | null>(null)
  const [streak,         setStreak]         = useState<StreakData | null>(null)
  const [name,           setName]           = useState('')
  const [password,       setPassword]       = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('leaf')
  const [savedModal,     setSavedModal]     = useState(false)
  const [showAllLevels,  setShowAllLevels]  = useState(false)

  useEffect(() => {
    if (!currentId) return
    async function load() {
      const [users, s, coins, str] = await Promise.all([
        getUsers(),
        calculateStudentStats(currentId!),
        getCoinData(currentId!),
        getStreak(currentId!),
      ])
      const u = users.find(u => u.id === currentId && u.role === 'student') ?? null
      setUser(u)
      setStats(s)
      setCoinData(coins)
      setStreak(str)
      if (u) {
        setName(u.name)
        setSelectedAvatar(u.avatar ?? 'leaf')
      }
    }
    load()
  }, [currentId])

  const title        = getTitleForLevel(stats?.level ?? 1)
  const AvatarIcon   = AVATAR_ICONS.find(a => a.key === selectedAvatar) ?? AVATAR_ICONS[0]
  const currentLevel = stats?.level ?? 1
  const TOTAL_LEVELS = 30
  const visibleLevels = showAllLevels
    ? TOTAL_LEVELS
    : Math.min(TOTAL_LEVELS, Math.max(10, currentLevel + 3))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    await upsertUser({
      ...user,
      name:     name.trim()     || user.name,
      password: password.trim() || user.password,
      avatar:   selectedAvatar,
    })
    setSavedModal(true)
    setPassword('')
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-6 text-sm text-slate-400">
        Profil ma'lumotlarini ko'rish uchun avval tizimga kiring.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-slate-500 mb-1.5">Shaxsiy ma'lumotlar</div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">Profil</h1>
      </div>

      {/* ── Profil kartasi ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6"
      >
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600/40 to-accent-500/40 border border-slate-700 flex items-center justify-center shadow-lg">
            <AvatarIcon.Icon size={36} className={AvatarIcon.color} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-50">{user.name}</h2>
            <div className="text-sm text-slate-400 mt-0.5">{title}</div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1 text-primary-300 font-medium">
                <Star size={11} /> {currentLevel}-daraja
              </span>
              <span className="flex items-center gap-1 text-emerald-300">
                <TrendingUp size={11} /> {(stats?.totalXp ?? 0).toLocaleString()} XP
              </span>
              {coinData && (
                <span className="flex items-center gap-1 text-yellow-300">
                  <Coins size={11} /> {coinData.coins}
                </span>
              )}
              {streak && streak.currentStreak > 0 && (
                <span className="flex items-center gap-1 text-orange-300">
                  <Flame size={11} /> {streak.currentStreak} kun
                </span>
              )}
            </div>
          </div>
        </div>
        {stats && <div className="mt-4"><XpBar currentXp={stats.totalXp} level={stats.level} /></div>}
      </motion.div>

      {/* ── Mini stats ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Daraja',       value: stats.level,                        color: 'text-primary-300', Icon: Star },
            { label: 'Umumiy XP',    value: stats.totalXp.toLocaleString(),     color: 'text-emerald-300', Icon: TrendingUp },
            { label: 'Topshiriqlar', value: stats.completedTasks,               color: 'text-accent-400',  Icon: CheckCircle2 },
            { label: 'Tangalar',     value: coinData?.coins ?? 0,               color: 'text-yellow-300',  Icon: Coins },
          ].map(({ label, value, color, Icon }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col items-center gap-1">
              <Icon size={15} className={`${color} opacity-70`} />
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Darajalar bo'limi ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star size={15} className="text-yellow-400" />
            <span className="text-sm font-semibold text-slate-200">Darajalar</span>
          </div>
          <span className="text-xs text-slate-500">{currentLevel}/{TOTAL_LEVELS} erishildi</span>
        </div>

        <div className="p-4 space-y-2">
          {Array.from({ length: visibleLevels }, (_, i) => {
            const lvl      = i + 1
            const unlocked = lvl <= currentLevel
            const isCurrent = lvl === currentLevel
            const tier     = getTierForLevel(lvl)
            const { from, to, needed } = getLevelXpRange(lvl)
            const totalXp  = stats?.totalXp ?? 0
            const progress = isCurrent
              ? Math.min(100, Math.round(((totalXp - from) / needed) * 100))
              : unlocked ? 100 : 0

            return (
              <motion.div
                key={lvl}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`rounded-xl border p-3 flex items-center gap-3 transition-all ${
                  isCurrent
                    ? `${tier.border} ${tier.bg}`
                    : unlocked
                    ? `${tier.border} ${tier.bg} opacity-80`
                    : 'border-slate-800/60 bg-slate-900/30 opacity-40'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                  unlocked ? tier.bg : 'bg-slate-800'
                }`}>
                  {unlocked ? tier.icon : <Lock size={14} className="text-slate-600" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-bold ${unlocked ? tier.color : 'text-slate-600'}`}>
                      {lvl}-daraja
                    </span>
                    <span className={`text-xs ${unlocked ? tier.color : 'text-slate-600'}`}>
                      {tier.title}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 font-semibold">
                        Joriy
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${RARITY_COLOR[tier.rarity]}`}>
                      {tier.rarity}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {unlocked && !isCurrent
                      ? `✓ ${from.toLocaleString()} XP dan erishildi`
                      : isCurrent
                      ? `${totalXp.toLocaleString()} / ${to.toLocaleString()} XP`
                      : `${from.toLocaleString()} XP kerak`
                    }
                  </div>
                  {isCurrent && (
                    <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${tier.color.replace('text-', 'bg-')}`}
                        style={{ width: `${Math.max(4, progress)}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  {unlocked && !isCurrent ? (
                    <CheckCircle2 size={18} className={tier.color} />
                  ) : isCurrent ? (
                    <div className={`text-xs font-bold ${tier.color}`}>{progress}%</div>
                  ) : (
                    <div className="text-[10px] text-slate-600">+{needed.toLocaleString()} XP</div>
                  )}
                </div>
              </motion.div>
            )
          })}

          <button
            onClick={() => setShowAllLevels(v => !v)}
            className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 text-xs text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center gap-1.5 mt-1"
          >
            {showAllLevels
              ? <><ChevronUp size={13} /> Kamroq ko'rsatish</>
              : <><ChevronDown size={13} /> Barcha {TOTAL_LEVELS} darajani ko'rish</>
            }
          </button>
        </div>
      </motion.div>

      {/* ── Avatar tanlash ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <Palette size={14} /> Avatar tanlash
        </div>
        <div className="flex flex-wrap gap-2">
          {AVATAR_ICONS.map(({ key, Icon, color }) => (
            <button
              key={key}
              onClick={() => setSelectedAvatar(key)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                selectedAvatar === key
                  ? 'bg-primary-500/25 ring-2 ring-primary-400'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <Icon size={20} className={color} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Ma'lumotlarni tahrirlash ── */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <User size={14} /> Ma'lumotlarni tahrirlash
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500">Foydalanuvchi ID</label>
          <input
            value={user.id} disabled
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500">To'liq ism</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Ismingiz va familiyangiz"
          />
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            <KeyRound size={11} /> Yangi parol (ixtiyoriy)
          </label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Bo'sh qoldirsangiz, eski parol saqlanadi"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:brightness-110 transition-all"
        >
          <Save size={14} /> O'zgarishlarni saqlash
        </button>
      </form>

      <Modal
        open={savedModal}
        title="Ma'lumotlar saqlandi"
        description="Profil ma'lumotlaringiz muvaffaqiyatli yangilandi."
        tone="success"
        confirmLabel="Yopish"
        showCancel={false}
        onConfirm={() => setSavedModal(false)}
      />
    </div>
  )
}
