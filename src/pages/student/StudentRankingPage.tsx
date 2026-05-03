import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Star, Users, TrendingUp } from 'lucide-react'
import { Pagination } from '../../components/Pagination'
import { getRanking, getCurrentUserId, getTitleForLevel, getUsers } from '../../storage'
import type { StudentStats, User } from '../../types'

const rankIcons = [
  <Trophy size={16} className="text-yellow-400" />,
  <Medal  size={16} className="text-slate-300" />,
  <Medal  size={16} className="text-amber-600" />,
]

const podiumHeights = ['h-20', 'h-28', 'h-16']
const podiumBg      = ['bg-slate-500', 'bg-yellow-400', 'bg-amber-600']
const podiumOrder   = [1, 0, 2]

const ITEMS_PER_PAGE = 10

export function StudentRankingPage() {
  const [ranking, setRanking] = useState<StudentStats[]>([])
  const [users,   setUsers]   = useState<User[]>([])
  const [page,    setPage]    = useState(1)
  const currentId = getCurrentUserId()

  useEffect(() => {
    async function load() {
      const [r, u] = await Promise.all([getRanking(), getUsers()])
      setRanking(r)
      setUsers(u)
    }
    load()
  }, [])

  const getName = (id: string) => users.find(u => u.id === id)?.name || id
  const top3 = ranking.slice(0, 3)

  const totalPages = Math.ceil(ranking.length / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const paginated  = ranking.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const myRankIndex = ranking.findIndex(r => r.studentId === currentId)
  const myPage      = myRankIndex >= 0 ? Math.ceil((myRankIndex + 1) / ITEMS_PER_PAGE) : null

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-slate-500 mb-1.5">XP bo'yicha raqobat</div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">Reyting</h1>
        <p className="mt-1 text-xs text-slate-400 max-w-xl">
          Topshiriqlarni bajaring, XP to'plang va reytingda yuqoriga chiqing!
        </p>
      </div>

      {ranking.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-10 text-center text-slate-500">
          <Users size={32} className="mx-auto mb-3 opacity-40" />
          Reyting hali shakllanmagan. Topshiriqlarni bajarib, birinchi bo'ling!
        </div>
      ) : (
        <>
          {/* ── Top 3 podium ── */}
          {top3.length >= 2 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
              <div className="text-xs text-slate-500 text-center mb-6 flex items-center justify-center gap-1.5">
                <Trophy size={12} /> Top 3 o'quvchi
              </div>
              <div className="flex items-end justify-center gap-4">
                {podiumOrder.map((rankIdx, colIdx) => {
                  const row = top3[rankIdx]
                  if (!row) return null
                  const title = getTitleForLevel(row.level)
                  const isMe  = row.studentId === currentId
                  return (
                    <motion.div
                      key={row.studentId}
                      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: colIdx * 0.12 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className={`w-12 h-12 rounded-full bg-slate-800 border-2 flex items-center justify-center ${isMe ? 'border-primary-400' : 'border-slate-600'}`}>
                        <Star size={22} className={rankIdx === 0 ? 'text-yellow-400 fill-yellow-400/30' : 'text-slate-400'} />
                      </div>
                      <div>{rankIcons[rankIdx]}</div>
                      <div className="text-center">
                        <div className={`text-xs font-semibold truncate max-w-[80px] ${isMe ? 'text-primary-300' : 'text-slate-200'}`}>
                          {getName(row.studentId)}
                        </div>
                        <div className="text-[10px] text-slate-500">{title}</div>
                      </div>
                      <div className={`w-20 ${podiumHeights[colIdx]} ${podiumBg[colIdx]} rounded-t-xl flex flex-col items-center justify-center gap-0.5`}>
                        <span className="text-slate-900 font-bold text-sm">{rankIdx + 1}</span>
                        <span className="text-slate-800 text-[10px] font-medium">{row.totalXp} XP</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Ro'yxat ── */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-500 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users size={13} />
                <span>Barcha o'quvchilar</span>
              </div>
              <div className="flex items-center gap-3">
                {myPage && myPage !== page && (
                  <button
                    onClick={() => setPage(myPage)}
                    className="text-primary-400 hover:text-primary-300 text-xs font-medium transition-colors"
                  >
                    Mening o'rnim →
                  </button>
                )}
                <span>{ranking.length} nafar</span>
              </div>
            </div>

            <div className="divide-y divide-slate-800/50">
              {paginated.map((row, idx) => {
                const index = startIndex + idx
                const title = getTitleForLevel(row.level)
                const isMe  = row.studentId === currentId
                return (
                  <motion.div
                    key={row.studentId}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.025 }}
                    className={`px-4 py-3 flex items-center gap-3 ${isMe ? 'bg-primary-500/10 border-l-2 border-primary-500' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400'
                      : index === 1 ? 'bg-slate-500/20 text-slate-300'
                      : index === 2 ? 'bg-amber-600/20 text-amber-500'
                      : 'bg-slate-800 text-slate-500'
                    }`}>
                      {index < 3 ? rankIcons[index] : <span className="text-xs font-bold">{index + 1}</span>}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <Star size={14} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isMe ? 'text-primary-300' : 'text-slate-100'}`}>
                        {getName(row.studentId)}
                        {isMe && <span className="ml-2 text-xs text-primary-500">(Siz)</span>}
                      </div>
                      <div className="text-xs text-slate-500">
                        {title} · {row.level}-daraja · {row.completedTasks} topshiriq
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-300 font-bold text-sm shrink-0">
                      <TrendingUp size={13} /> {row.totalXp}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} color="bg-primary-600" />
          </div>
        </>
      )}
    </div>
  )
}
