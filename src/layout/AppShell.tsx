import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, Users, BarChart3,
  BookOpen, TrendingUp, Trophy, Medal, User,
  LogOut, Flame, Coins, Gamepad2,
} from 'lucide-react'
import { getCurrentUserId, getCoinData, getStreak, setCurrentUserId } from '../storage'
import type { CoinData, StreakData } from '../types'
import logoImg from '../assets/logo.png'

type Variant = 'teacher' | 'student'

interface Props {
  variant: Variant
  children: ReactNode
}

const teacherNav = [
  { to: '/teacher', label: 'Boshqaruv paneli', Icon: LayoutDashboard },
  { to: '/teacher/tasks', label: 'Topshiriqlar', Icon: ClipboardList },
  { to: '/teacher/students', label: "O'quvchilar", Icon: Users },
  { to: '/teacher/stats', label: 'Statistika', Icon: BarChart3 },
]

const studentNav = [
  { to: '/student', label: 'Boshqaruv paneli', Icon: LayoutDashboard },
  { to: '/student/tasks', label: 'Topshiriqlar', Icon: BookOpen },
  { to: '/student/games', label: 'Mini O\'yinlar', Icon: Gamepad2 },
  { to: '/student/results', label: 'Natijalarim', Icon: TrendingUp },
  { to: '/student/ranking', label: 'Reyting', Icon: Trophy },
  { to: '/student/achievements', label: 'Yutuqlar', Icon: Medal },
  { to: '/student/profile', label: 'Profil', Icon: User },
]

export function AppShell({ variant, children }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const items = variant === 'teacher' ? teacherNav : studentNav
  const [showMobileHeader, setShowMobileHeader] = useState(false)
  const [coinData, setCoinData] = useState<CoinData | null>(null)
  const [streak, setStreak] = useState<StreakData | null>(null)

  const currentId = getCurrentUserId()

  useEffect(() => {
    if (variant !== 'student' || !currentId) return
    async function loadData() {
      const [coins, str] = await Promise.all([
        getCoinData(currentId!),
        getStreak(currentId!),
      ])
      setCoinData(coins)
      setStreak(str)
    }
    loadData()
  }, [variant, currentId])

  useEffect(() => {
    const handleScroll = () => {
      setShowMobileHeader(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    setCurrentUserId(null)
    navigate('/')
  }

  return (
    <div className={`min-h-screen text-slate-50 flex ${variant === 'student' ? 'student-bg' : 'teacher-bg'}`}>
      {/* Floating particles — faqat student uchun */}
      {variant === 'student' && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                width:  `${4 + (i % 4) * 3}px`,
                height: `${4 + (i % 4) * 3}px`,
                left:   `${(i * 8.3) % 100}%`,
                background: ['#7c3aed','#db2777','#f59e0b','#06b6d4'][i % 4],
                animationDuration: `${8 + i * 1.5}s`,
                animationDelay:    `${i * 0.8}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Sidebar */}
      <aside className={`hidden md:flex w-64 flex-col fixed left-0 top-0 bottom-0 z-20 ${
        variant === 'student'
          ? 'border-r border-purple-900/40 bg-black/30 backdrop-blur-xl'
          : 'border-r border-slate-800 bg-slate-950/70 backdrop-blur-xl'
      }`}>
        {/* Logo */}
        <div className={`px-5 py-4 border-b ${variant === 'student' ? 'border-purple-900/40' : 'border-slate-800'}`}>
          <Link to="/" className="flex items-center gap-3">
            <img src={logoImg} alt="GamEdu Logo" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <div className={`text-lg font-bold tracking-tight ${variant === 'student' ? 'text-glow-purple text-violet-200' : ''}`}>
                GamEdu
              </div>
              <div className="text-[10px] text-slate-400">
                {variant === 'teacher' ? "O'qituvchi paneli" : "O'quvchi paneli"}
              </div>
            </div>
          </Link>
        </div>

        {/* Student stats bar */}
        {variant === 'student' && (coinData || streak) && (
          <div className="px-4 py-3 border-b border-purple-900/30 flex items-center gap-4">
            {streak && streak.currentStreak > 0 && (
              <div className="flex items-center gap-1.5 text-orange-400 text-xs font-bold">
                <Flame size={14} className="streak-fire" />
                <span>{streak.currentStreak}</span>
              </div>
            )}
            {coinData && (
              <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold">
                <Coins size={14} className="animate-glow-pulse" />
                <span className="text-glow-gold">{coinData.coins}</span>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map(({ to, label, Icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                  variant === 'student'
                    ? active
                      ? 'bg-purple-600/25 text-violet-200 border border-purple-500/40 shadow-glow-purple'
                      : 'text-slate-400 hover:bg-purple-900/20 hover:text-violet-300'
                    : active
                      ? 'bg-primary-500/15 text-primary-200 border border-primary-500/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-50',
                ].join(' ')}
              >
                <Icon size={16} className="shrink-0" />
                <span>{label}</span>
                {active && variant === 'student' && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shadow-glow-purple" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={`px-4 py-4 border-t ${variant === 'student' ? 'border-purple-900/30' : 'border-slate-800'} space-y-2`}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-rose-900/20 hover:text-rose-400 transition-all"
          >
            <LogOut size={14} />
            <span>Chiqish</span>
          </button>
          <div className="text-[10px] text-slate-600 text-center">
            GamEdu · gamifikatsiyalangan ta'lim
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 relative z-10 md:ml-64">
        {/* Mobile header */}
        <div className={`md:hidden px-4 py-3 border-b flex items-center justify-between fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          showMobileHeader
            ? 'backdrop-blur-xl shadow-lg'
            : 'backdrop-blur-sm'
        } ${
          variant === 'student'
            ? showMobileHeader
              ? 'border-purple-900/50 bg-black/90'
              : 'border-purple-900/20 bg-black/40'
            : showMobileHeader
              ? 'border-slate-800 bg-slate-950/95'
              : 'border-slate-800/50 bg-slate-950/70'
        }`}>
          <div className="flex items-center gap-3">
            <Link to="/">
              <img src={logoImg} alt="GamEdu Logo" className="h-9 w-9 rounded-xl object-cover" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {variant === 'student' && streak && streak.currentStreak > 0 && (
              <div className="flex items-center gap-1 text-orange-400 text-xs font-bold">
                <Flame size={13} className="streak-fire" />
                <span>{streak.currentStreak}</span>
              </div>
            )}
            {variant === 'student' && coinData && (
              <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                <Coins size={13} />
                <span>{coinData.coins}</span>
              </div>
            )}
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className={`md:hidden fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md border-t ${
          variant === 'student'
            ? 'bg-black/70 border-purple-900/40'
            : 'bg-slate-950/95 border-slate-800'
        }`}>
          <div className="flex">
            {items.map(({ to, label, Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] transition-all ${
                    variant === 'student'
                      ? active ? 'text-violet-300' : 'text-slate-500'
                      : active ? 'text-primary-300' : 'text-slate-500'
                  }`}
                >
                  <Icon size={18} className={active && variant === 'student' ? 'drop-shadow-[0_0_6px_rgba(167,139,250,0.8)]' : ''} />
                  {active && variant === 'student' && <div className="nav-active-dot" />}
                  <span className="truncate max-w-[56px] text-center leading-tight">
                    {label.split(' ')[0]}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-8 pt-20 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
