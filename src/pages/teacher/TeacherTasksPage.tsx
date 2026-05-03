import { Link, useNavigate } from 'react-router-dom'
import { deleteTask, getTasks, upsertTask } from '../../storage'
import type { Task } from '../../types'
import { Pagination } from '../../components/Pagination'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2, X, FileWarning } from 'lucide-react'

const ITEMS_PER_PAGE = 10

export function TeacherTasksPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null)
  const [page, setPage] = useState(1)

  async function loadTasks() {
    setTasks(await getTasks())
  }

  useEffect(() => { loadTasks() }, [])

  async function handleTogglePublish(task: Task) {
    const updated = { ...task, isPublished: !task.isPublished }
    await upsertTask(updated)
    loadTasks()
  }

  async function handleDeleteConfirm() {
    if (confirmDelete) {
      await deleteTask(confirmDelete.id)
      setConfirmDelete(null)
      loadTasks()
    }
  }

  const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const paginated  = tasks.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-1">Topshiriqlar boshqaruvi</div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Topshiriqlar</h1>
          <p className="mt-1.5 text-sm text-slate-300 max-w-2xl">
            O'quvchilar uchun gamifikatsiyalangan topshiriqlarni yarating, nashr qiling va kuzatib boring.
          </p>
        </div>
        <Link
          to="/teacher/tasks/create"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:brightness-110 transition-all"
        >
          + Yangi topshiriq yaratish
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 text-xs text-slate-400 flex justify-between items-center">
          <span>Barcha topshiriqlar ({tasks.length} ta)</span>
          <span>E'lon qilingan: {tasks.filter(t => t.isPublished).length} ta</span>
        </div>

        {tasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            Hozircha hech qanday topshiriq yaratilmagan.
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-800">
              {paginated.map(task => (
                <div
                  key={task.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-slate-50 truncate">{task.title}</h3>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.isPublished
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {task.isPublished ? 'Nashr qilingan' : 'Qoralama'}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400 line-clamp-2">
                      {task.description || 'Tavsif kiritilmagan'}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>{task.xp} XP</span>
                      <span>•</span>
                      <span className="capitalize">{task.difficulty}</span>
                      <span>•</span>
                      <span className="capitalize">{task.type || 'noma\'lum'}</span>
                      {task.deadline && (
                        <>
                          <span>•</span>
                          <span>Muddati: {new Date(task.deadline).toLocaleDateString('uz-UZ')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/teacher/tasks/edit/${task.id}`)}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm text-slate-200 transition-colors"
                    >
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => setConfirmDelete(task)}
                      className="px-3 py-1.5 rounded-lg border border-rose-600/50 bg-rose-600/10 hover:bg-rose-600/20 text-sm text-rose-300 transition-colors"
                    >
                      O'chirish
                    </button>
                    <button
                      onClick={() => handleTogglePublish(task)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-w-[140px] ${
                        task.isPublished
                          ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {task.isPublished ? 'Nashrdan olib tashlash' : 'Nashr qilish'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} color="bg-blue-600" />
          </>
        )}
      </div>

      {/* ── Topshiriqni o'chirish modali ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(160deg, #1a0a0a 0%, #0f0a0a 100%)',
                border: '1px solid rgba(239,68,68,0.3)',
                boxShadow: '0 0 60px rgba(239,68,68,0.15), 0 25px 50px rgba(0,0,0,0.6)',
              }}
            >
              {/* Yuqori qizil chiziq */}
              <div className="h-1 w-full bg-gradient-to-r from-rose-700 via-red-500 to-rose-700" />

              <div className="p-6 space-y-5">
                {/* Icon + yopish */}
                <div className="flex items-start justify-between">
                  <motion.div
                    animate={{ rotate: [-3, 3, -2, 2, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center"
                  >
                    <FileWarning size={28} className="text-rose-400" />
                  </motion.div>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                  >
                    <X size={14} className="text-slate-400" />
                  </button>
                </div>

                {/* Matn */}
                <div className="space-y-2">
                  <h2 className="text-lg font-black text-white">
                    Topshiriqni o'chirishni tasdiqlang
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    <span className="text-white font-semibold">"{confirmDelete.title}"</span> topshirig'i
                    va unga bog'liq{' '}
                    <span className="text-rose-300 font-medium">barcha natijalar</span> butunlay
                    o'chirib tashlanadi.
                  </p>
                </div>

                {/* Nima o'chishi */}
                <div className="rounded-2xl bg-rose-950/30 border border-rose-500/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold mb-1">
                    <AlertTriangle size={13} />
                    Quyidagilar butunlay yo'qoladi:
                  </div>
                  {[
                    'Topshiriq mazmuni va savollari',
                    "O'quvchilarning bu topshiriqdagi natijalari",
                    'Topshiriq uchun berilgan XP yozuvlari',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-500 text-center">
                  Bu amalni ortga qaytarib bo'lmaydi.
                </p>

                {/* Tugmalar */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="py-3 rounded-2xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 text-sm font-semibold text-slate-200 transition-all"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:brightness-110 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25"
                  >
                    <Trash2 size={15} />
                    O'chirish
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
