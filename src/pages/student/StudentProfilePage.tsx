import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Star,
  TrendingUp,
  CheckCircle2,
  Coins,
  Flame,
  Save,
  KeyRound,
  Palette,
} from 'lucide-react'
import {
  getCurrentUserId,
  getUsers,
  upsertUser,
  calculateStudentStats,
  getCoinData,
  getStreak,
  getTitleForLevel,
} from '../../storage'
import type { User as UserType } from '../../types'
import { Modal } from '../../components/Modal'
import { XpBar } from '../../components/XpBar'

// Avatar options — lucide icon names mapped to components
import {
  Rocket, Sword, Shield, Zap, Crown, Gem, Leaf, Target,
  Flame as FlameIcon, Globe, Cpu,
} from 'lucide-react'

const AVATAR_ICONS: { key: string; Icon: React.ElementType; color: string }[] = [
  { key: 'leaf',    Icon: Leaf,      color: 'text-emerald-400' },
  { key: 'target',  Icon: Target,    color: 'text-rose-400' },
  { key: 'trophy',  Icon: Star,      color: 'text-yellow-400' },
  { key: 'zap',     Icon: Zap,       color: 'text-blue-400' },
  { key: 'gem',     Icon: Gem,       color: 'text-purple-400' },
  { key: 'flame',   Icon: FlameIcon, color: 'text-orange-400' },
  { key: 'crown',   Icon: Crown,     color: 'text-yellow-300' },
  { key: 'rocket',  Icon: Rocket,    color: 'text-indigo-400' },
  { key: 'sword',   Icon: Sword,     color: 'text-slate-300' },
  { key: 'shield',  Icon: Shield,    color: 'text-teal-400' },
  { key: 'globe',   Icon: Globe,     color: 'text-cyan-400' },
  { key: 'cpu',     Icon: Cpu,       color: 'text-pink-400' },
]

export function StudentProfilePage() {
  const currentId = getCurrentUserId()
  const user      = getUsers().find(u => u.id === currentId && u.role === 'student') as UserType | undefined
  const stats     = currentId ? calculateStudentStats(currentId) : null
  const coinData  = currentId ? getCoinData(currentId) : null
  const streak    = currentId ? getStreak(currentId) : null

  const [name,           setName]           = useState(user?.name ?? '')
  const [password,       setPassword]       = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar ?? 'leaf')
  const [savedModal,     setSavedModal]     = useState(false)

  const title       = getTitleForLevel(stats?.level ?? 1)
  const AvatarIcon  = AVATAR_ICONS.find(a => a.key === selectedAvatar) ?? AVATAR_ICONS[0]

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    upsertUser({ ...user, name: name.trim() || user.name, password: password.trim() || user.password, avatar: selectedAvatar })
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

      {/* Profile hero */}
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
                <Star size={11} /> {stats?.level ?? 1}-daraja
              </span>
              <span className="flex items-center gap-1 text-emerald-300">
                <TrendingUp size={11} /> {stats?.totalXp ?? 0} XP
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

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Daraja',      value: stats.level,          color: 'text-primary-300', Icon: Star },
            { label: 'Umumiy XP',   value: stats.totalXp,        color: 'text-emerald-300', Icon: TrendingUp },
            { label: 'Topshiriqlar',value: stats.completedTasks, color: 'text-accent-400',  Icon: CheckCircle2 },
            { label: 'Tangalar',    value: coinData?.coins ?? 0, color: 'text-yellow-300',  Icon: Coins },
          ].map(({ label, value, color, Icon }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col items-center gap-1">
              <Icon size={15} className={`${color} opacity-70`} />
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Avatar picker */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <Palette size={14} />
          Avatar tanlash
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

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <User size={14} />
          Ma'lumotlarni tahrirlash
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
          <Save size={14} />
          O'zgarishlarni saqlash
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
