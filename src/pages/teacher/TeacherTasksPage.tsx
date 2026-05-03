import { Link, useNavigate } from 'react-router-dom'
import { deleteTask, getTasks, upsertTask } from '../../storage'
import type { Task } from '../../types'
import { Modal } from '../../components/Modal'
import { Pagination } from '../../components/Pagination'
import { useEffect, useState } from 'react'

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

      <Modal
        open={!!confirmDelete}
        title="Topshiriqni o'chirish"
        description="Bu topshiriq va unga bog'liq barcha natijalar o'chiriladi. Ishonchingiz komilmi?"
        tone="danger"
        confirmLabel="Ha, o'chirish"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
