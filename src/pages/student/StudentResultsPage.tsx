import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, CheckCircle2, Coins, Flame, ClipboardList,
  Circle, Clock, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { getCurrentUserId, getProgress, getTasks, getCoinData } from '../../storage'
import type { Task, StudentTaskProgress, CoinData } from '../../types'

const ITEMS_PER_PAGE = 10

export function StudentResultsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [allProgress, setAllProgress] = useState<StudentTaskProgress[]>([])
  const [tasks,    setTasks]    = useState<Task[]>([])
  const [coinData, setCoinData] = useState<CoinData | null>(null)
  const currentId = getCurrentUserId()

  useEffect(() => {
    async function load() {
      const [prog, t, coins] = await Promise.all([
        getProgress(),
        getTasks(),
        currentId ? getCoinData(currentId) : Promise.resolve(null),
      ])
      const filtered = prog
        .filter(p => p.studentId === currentId && p.status === 'completed')
        .sort((a, b) =>
          (b.completedAt ? new Date(b.completedAt).getTime() : 0) -
          (a.completedAt ? new Date(a.completedAt).getTime() : 0)
        )
      setAllProgress(filtered)
      setTasks(t)
      setCoinData(coins)
    }
    load()
  }, [currentId])

  const totalPages = Math.ceil(allProgress.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const progress   = allProgress.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  const totalXp    = allProgress.reduce((s, p) => s + p.earnedXp, 0)

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-slate-500 mb-1.5">Tarix va natijalar</div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">Natijalarim</h1>
        <p className="mt-1 text-xs text-slate-400 max-w-xl">
          Barcha bajarilgan topshiriqlar va ular uchun olgan mukofotlar tarixi.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col items-center gap-1">
          <TrendingUp size={18} className="text-emerald-400" />
          <div className="text-xl font-bold text-emerald-300">{totalXp}</div>
          <div className="text-xs text-slate-500">Jami XP</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col items-center gap-1">
          <CheckCircle2 size={18} className="text-accent-400" />
          <div className="text-xl font-bold text-accent-400">{allProgress.length}</div>
          <div className="text-xs text-slate-500">Topshiriqlar</div>
        </div>
        <div className="rounded-2xl border border-yellow-500/25 bg-yellow-950/15 p-4 flex flex-col items-center gap-1">
          <Coins size={18} className="text-yellow-400" />
          <div className="text-xl font-bold text-yellow-300">{coinData?.coins ?? 0}</div>
          <div className="text-xs text-slate-500">Tangalar</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ClipboardList size={13} />
            <span>Bajarilgan topshiriqlar</span>
          </div>
          <span>{allProgress.length} ta</span>
        </div>

        {allProgress.length === 0 ? (
          <div className="px-4 py-10 text-center text-slate-500 text-sm">
            Hozircha hech qanday topshiriq bajarilmagan.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {progress.map((record, i) => {
              const task        = tasks.find(t => t.id === record.taskId)
              const isStreak    = record.taskId.startsWith('streak_')
              const isQuest     = record.taskId.startsWith('quest_')
              const isSpecial   = isStreak || isQuest
              const earnedCoins = Math.max(1, Math.floor(record.earnedXp / 10))
              const diffColor   =
                task?.difficulty === 'advanced'     ? 'text-rose-400' :
                task?.difficulty === 'intermediate' ? 'text-yellow-400' : 'text-emerald-400'

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}
                  className="px-4 py-3 flex items-center gap-3"
                >
                  <div className="shrink-0">
                    {isStreak ? <Flame size={18} className="text-orange-400" />
                     : isQuest ? <ClipboardList size={18} className="text-blue-400" />
                     : <Circle size={18} className={diffColor} fill="currentColor" fillOpacity={0.2} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-100 truncate">
                      {isStreak ? 'Streak bonusi' : isQuest ? 'Kunlik vazifa bonusi' : task?.title || 'Topshiriq'}
                    </div>
                    {record.completedAt && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Clock size={10} />
                        {new Date(record.completedAt).toLocaleString('uz-UZ', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <div className="flex items-center justify-end gap-1 text-sm font-bold text-emerald-300">
                      <TrendingUp size={12} /> +{record.earnedXp}
                    </div>
                    {!isSpecial && (
                      <div className="flex items-center justify-end gap-0.5 text-xs text-yellow-400">
                        <Coins size={10} /> +{earnedCoins}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <ChevronLeft size={14} /> Oldingi
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              Keyingi <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
