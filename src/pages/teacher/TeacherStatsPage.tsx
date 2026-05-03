import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, CheckCircle2, ClipboardList, Users, Star, Trophy, Medal } from 'lucide-react'
import { Pagination } from '../../components/Pagination'
import { getRanking, getTasks, getUsers, getTitleForLevel } from '../../storage'
import type { Task, User, StudentStats } from '../../types'

const rankIcons = [
  <Trophy size={14} className="text-yellow-400" />,
  <Medal  size={14} className="text-slate-300" />,
  <Medal  size={14} className="text-amber-600" />,
]

const ITEMS_PER_PAGE = 10

export function TeacherStatsPage() {
  const [ranking,  setRanking]  = useState<StudentStats[]>([])
  const [tasks,    setTasks]    = useState<Task[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [users,    setUsers]    = useState<User[]>([])
  const [page,     setPage]     = useState(1)

  useEffect(() => {
    async function load() {
      const [r, t, u] = await Promise.all([getRanking(), getTasks(), getUsers()])
      setRanking(r)
      setTasks(t)
      setStudents(u.filter(u => u.role === 'student'))
      setUsers(u)
    }
    load()
  }, [])

  const getName = (id: string) => users.find(u => u.id === id)?.name || id

  const totalXp        = ranking.reduce((s, r) => s + r.totalXp, 0)
  const completedTasks = ranking.reduce((s, r) => s + r.completedTasks, 0)
  const publishedTasks = tasks.filter(t => t.isPublished).length
  const avgXp          = students.length > 0 ? Math.round(totalXp / students.length) : 0

  const summaryCards = [
    { label: 'Umumiy XP',              value: totalXp,        color: 'text-emerald-300', Icon: TrendingUp },
    { label: 'Bajarilgan topshiriqlar', value: completedTasks, color: 'text-primary-300', Icon: CheckCircle2 },
    { label: 'Faol topshiriqlar',       value: publishedTasks, color: 'text-accent-400',  Icon: ClipboardList },
    { label: "O'rtacha XP",             value: avgXp,          color: 'text-yellow-300',  Icon: BarChart3 },
  ]

  const totalPages = Math.ceil(ranking.length / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const paginated  = ranking.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-slate-500 mb-1.5">Gamifikatsiya statistikasi</div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">Statistika</h1>
        <p className="mt-1 text-xs text-slate-400 max-w-xl">
          Platformadagi umumiy faollik va o'quvchilar progressi.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value, color, Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4"
          >
            <div className="flex items-center gap-2 mb-2 text-slate-500">
              <Icon size={14} />
              <span className="text-xs">{label}</span>
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users size={13} />
            <span>Reyting jadvali</span>
          </div>
          <span>{ranking.length} nafar o'quvchi</span>
        </div>

        {ranking.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            Hozircha reyting shakllanmagan.
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-800/50 text-sm">
              {paginated.map((row, idx) => {
                const index = startIndex + idx
                return (
                  <motion.div
                    key={row.studentId}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.025 }}
                    className="px-4 py-3 flex items-center gap-3"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      index === 0 ? 'bg-yellow-500/15'
                      : index === 1 ? 'bg-slate-500/15'
                      : index === 2 ? 'bg-amber-600/15'
                      : 'bg-slate-800'
                    }`}>
                      {index < 3 ? rankIcons[index] : <span className="text-xs font-bold text-slate-500">{index + 1}</span>}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <Star size={13} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-100 truncate">{getName(row.studentId)}</div>
                      <div className="text-xs text-slate-500">
                        {getTitleForLevel(row.level)} · {row.level}-daraja · {row.completedTasks} topshiriq
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-emerald-300 shrink-0">
                      <TrendingUp size={12} /> {row.totalXp}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} color="bg-indigo-600" />
          </>
        )}
      </div>
    </div>
  )
}
