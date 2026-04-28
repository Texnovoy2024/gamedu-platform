import { TrendingUp } from 'lucide-react'

interface Props {
  currentXp: number
  level: number
}

function xpForLevel(level: number) {
  return (level + 1) ** 2 * 120
}

export function XpBar({ currentXp, level }: Props) {
  const nextLevelTarget = xpForLevel(level)
  const prevLevelTarget = xpForLevel(Math.max(level - 1, 0))
  const span            = nextLevelTarget - prevLevelTarget || 1
  const progress        = Math.max(0, Math.min(1, (currentXp - prevLevelTarget) / span))
  const pct             = Math.round(progress * 100)

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <TrendingUp size={11} />
          <span>XP darajasi</span>
        </div>
        <span>
          {currentXp} XP &nbsp;·&nbsp;{' '}
          {pct >= 100 ? 'Keyingi daraja tayyor' : `${pct}%`}
        </span>
      </div>

      <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-xp-300 via-xp-500 to-primary-500 shadow-glow transition-all duration-700"
          style={{ width: `${Math.max(6, progress * 100)}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{level}-daraja</span>
        <span>{nextLevelTarget} XP</span>
      </div>
    </div>
  )
}
