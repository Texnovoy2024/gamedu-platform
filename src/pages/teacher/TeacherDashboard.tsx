import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, Users, Trophy, Plus, TrendingUp, Star, ChevronRight } from 'lucide-react'
import { getTasks, getUsers, getRanking, getTitleForLevel } from '../../storage'
import type { Task, User, StudentStats } from '../../types'
import { useEffect, useState } from 'react'

export function TeacherDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [ranking, setRanking] = useState<StudentStats[]>([])

  useEffect(() => {
    async function load() {
      const [t, u, r] = await Promise.all([getTasks(), getUsers(), getRanking()])
      setTasks(t)
      setStudents(u.filter(u => u.role === 'student'))
      setRanking(r.slice(0, 5))
    }
    load()
  }, [])

  const publishedTasks = tasks.filter(t => t.isPublished)
  const topStudent = ranking[0]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div>
          <div className="text-xs text-slate-500 mb-1.5">GamEdu o'qituvchi paneli</div>
          <h1 className="text-2xl font-bold text-slate-50">Boshqaruv paneli</h1>
          <p className="mt-1 text-sm text-slate-400 max-w-xl">
            Gamifikatsiyalangan topshiriqlarni boshqaring va o'quvchilar progressini kuzating.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/teacher/tasks/create"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-glow hover:brightness-110 transition-all"
          >
            <Plus size={15} /> Yangi topshiriq
          </Link>
          <Link
            to="/teacher/students"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900/80 transition-all"
          >
            <Users size={15} /> O'quvchilar
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'Faol topshiriqlar', value: publishedTasks.length, sub: `Jami: ${tasks.length} ta`, color: 'text-primary-300', Icon: ClipboardList, delay: 0.08 },
          { label: "Faol o'quvchilar",  value: students.length,       sub: "Ro'yxatdan o'tgan",       color: 'text-emerald-300', Icon: Users,         delay: 0.13 },
        ].map(({ label, value, sub, color, Icon, delay }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }}
            className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5"
          >
            <div className="flex items-center gap-2 mb-3 text-slate-400">
              <Icon size={15} />
              <span className="text-xs">{label}</span>
            </div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{sub}</div>
          </motion.div>
        ))}

        {/* Top student */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18 }}
          className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5"
        >
          <div className="flex items-center gap-2 mb-3 text-slate-400">
            <Trophy size={15} />
            <span className="text-xs">Reyting lideri</span>
          </div>
          {topStudent ? (
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                  <Star size={18} className="text-yellow-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-50">{topStudent.studentId}</div>
                  <div className="flex items-center gap-1 text-xs text-emerald-300">
                    <TrendingUp size={10} /> {topStudent.totalXp} XP · {topStudent.level}-daraja
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-2">{getTitleForLevel(topStudent.level)}</div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Hozircha reyting shakllanmagan</div>
          )}
        </motion.div>
      </div>

      {/* Top 5 */}
      {ranking.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Trophy size={14} />
              <span className="text-sm font-semibold">Top 5 o'quvchi</span>
            </div>
            <Link to="/teacher/stats" className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
              Barchasini ko'rish <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-800/50">
            {ranking.map((row, i) => (
              <div key={row.studentId} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-yellow-500/20 text-yellow-400'
                  : i === 1 ? 'bg-slate-500/20 text-slate-300'
                  : i === 2 ? 'bg-amber-600/20 text-amber-500'
                  : 'bg-slate-800 text-slate-500'
                }`}>
                  {i + 1}
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <Star size={13} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-100 truncate">{row.studentId}</div>
                  <div className="text-xs text-slate-500">{getTitleForLevel(row.level)} · {row.completedTasks} topshiriq</div>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-emerald-300 shrink-0">
                  <TrendingUp size={12} /> {row.totalXp}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
