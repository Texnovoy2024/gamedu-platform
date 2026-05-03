import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { deleteUser, generateId, getUsers, upsertUser } from '../../storage'
import type { User } from '../../types'
import { Pagination } from '../../components/Pagination'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Trash2, X, ShieldAlert,
  UserPlus, UserCog, Eye, EyeOff, Hash, User as UserIcon, Lock, Save,
} from 'lucide-react'

const ITEMS_PER_PAGE = 10

const INPUT = `w-full rounded-2xl border bg-slate-950/80 px-4 py-3 text-sm text-slate-50
  placeholder:text-slate-600 focus:outline-none transition-all
  border-slate-700/60 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40`

export function TeacherStudentsPage() {
  const [students,      setStudents]      = useState<User[]>([])
  const [editing,       setEditing]       = useState<User | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)
  const [form, setForm] = useState<{ id: string; name: string; password: string }>({
    id: '', name: '', password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [page, setPage] = useState(1)

  async function loadStudents() {
    const users = await getUsers()
    setStudents(users.filter(u => u.role === 'student'))
  }

  useEffect(() => { loadStudents() }, [])

  function openCreate() {
    setEditing({ id: '', name: '', password: '', role: 'student', createdAt: new Date().toISOString() })
    setForm({ id: '', name: '', password: '' })
    setShowPassword(false)
  }

  function openEdit(student: User) {
    setEditing(student)
    setForm({ id: student.id, name: student.name, password: student.password })
    setShowPassword(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    if (!form.name.trim()) return

    const now   = new Date().toISOString()
    const isNew = !editing.id

    const next: User = {
      ...editing,
      id:        isNew ? (form.id.trim() || generateId('s')) : editing.id,
      name:      form.name.trim(),
      password:  form.password.trim() || editing.password,
      role:      'student',
      createdAt: isNew ? now : editing.createdAt,
    }

    await upsertUser(next)
    setEditing(null)
    loadStudents()
  }

  async function handleDeleteConfirm() {
    if (confirmDelete) {
      await deleteUser(confirmDelete.id)
      setConfirmDelete(null)
      loadStudents()
    }
  }

  const totalPages = Math.ceil(students.length / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const paginated  = students.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  const isNew      = editing ? !editing.id : false

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="text-xs text-slate-300 mb-1.5">O'quvchi hisoblari</div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">O'quvchilar</h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            O'quvchilarni ID orqali boshqaring, ism va parollarni tahrirlang.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-primary-500 px-4 py-2 text-xs font-semibold text-white shadow-glow hover:brightness-110 transition-all"
        >
          <UserPlus size={14} /> Yangi o'quvchi yaratish
        </button>
      </div>

      {/* ── Ro'yxat ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80">
        <div className="px-4 py-2.5 border-b border-slate-800 text-[11px] text-slate-300 flex justify-between">
          <span>O'quvchilar ro'yxati</span>
          <span>{students.length} nafar</span>
        </div>

        {students.length === 0 ? (
          <div className="px-4 py-6 text-xs text-slate-400">
            Hozircha birorta ham o'quvchi yaratilmagan.
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-800 text-xs">
              {paginated.map((student) => (
                <div key={student.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-50">{student.name}</span>
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-200">
                        ID: {student.id}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      Yaralgan sana: {new Date(student.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => openEdit(student)}
                      className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-100 hover:bg-slate-800/80 transition-colors"
                    >
                      Tahrirlash
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(student)}
                      className="rounded-xl border border-rose-500/60 bg-rose-500/15 px-3 py-1 text-[11px] text-rose-100 hover:bg-rose-500/25 transition-colors"
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} color="bg-emerald-600" />
          </>
        )}
      </div>

      {/* ── Yaratish / Tahrirlash modali ── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={e => e.target === e.currentTarget && setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(160deg, #0a0f1e 0%, #0d1a2e 100%)',
                border: '1px solid rgba(99,102,241,0.3)',
                boxShadow: '0 0 60px rgba(99,102,241,0.12), 0 25px 50px rgba(0,0,0,0.6)',
              }}
            >
              {/* Yuqori gradient chiziq */}
              <div className={`h-1 w-full bg-gradient-to-r ${isNew ? 'from-emerald-500 via-primary-500 to-indigo-500' : 'from-blue-500 via-indigo-500 to-purple-500'}`} />

              <div className="p-6 space-y-5">
                {/* Icon + yopish */}
                <div className="flex items-start justify-between">
                  <motion.div
                    animate={{ rotate: [0, -5, 5, -3, 3, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      isNew
                        ? 'bg-emerald-500/15 border border-emerald-500/30'
                        : 'bg-indigo-500/15 border border-indigo-500/30'
                    }`}
                  >
                    {isNew
                      ? <UserPlus size={26} className="text-emerald-400" />
                      : <UserCog  size={26} className="text-indigo-400" />
                    }
                  </motion.div>
                  <button
                    onClick={() => setEditing(null)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                  >
                    <X size={14} className="text-slate-400" />
                  </button>
                </div>

                {/* Sarlavha */}
                <div>
                  <h2 className="text-lg font-black text-white">
                    {isNew ? "Yangi o'quvchi yaratish" : "O'quvchini tahrirlash"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isNew
                      ? "Yangi o'quvchi uchun ma'lumotlarni to'ldiring"
                      : `"${editing.name}" ma'lumotlarini yangilang`
                    }
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* ID maydoni — faqat yangi yaratishda */}
                  {isNew && (
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                        <Hash size={12} className="text-slate-500" />
                        O'quvchi ID
                        <span className="text-slate-600 font-normal">(ixtiyoriy)</span>
                      </label>
                      <input
                        value={form.id}
                        onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                        className={INPUT}
                        placeholder="Masalan: ali123 — bo'sh qolsa avtomatik yaratiladi"
                      />
                    </div>
                  )}

                  {/* Ism */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                      <UserIcon size={12} className="text-slate-500" />
                      To'liq ism <span className="text-rose-400">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className={INPUT}
                      placeholder="O'quvchi ismi va familiyasi"
                      required
                    />
                  </div>

                  {/* Parol */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                      <Lock size={12} className="text-slate-500" />
                      Parol
                      {!isNew && <span className="text-slate-600 font-normal">(bo'sh qolsa o'zgarmaydi)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className={INPUT + ' pr-12'}
                        placeholder={isNew ? 'Kuchli parol kiriting' : 'Yangi parol (ixtiyoriy)'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Tugmalar */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="py-3 rounded-2xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 text-sm font-semibold text-slate-200 transition-all"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      className={`py-3 rounded-2xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                        isNew
                          ? 'bg-gradient-to-r from-emerald-500 to-primary-500 hover:brightness-110 shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:brightness-110 shadow-indigo-500/20'
                      }`}
                    >
                      {isNew ? <><UserPlus size={15} /> Yaratish</> : <><Save size={15} /> Saqlash</>}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── O'chirish ogohlantirish modali ── */}
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
              <div className="h-1 w-full bg-gradient-to-r from-rose-700 via-red-500 to-rose-700" />

              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <motion.div
                    animate={{ rotate: [-3, 3, -2, 2, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center"
                  >
                    <ShieldAlert size={28} className="text-rose-400" />
                  </motion.div>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                  >
                    <X size={14} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-2">
                  <h2 className="text-lg font-black text-white">
                    O'quvchini o'chirishni tasdiqlang
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    <span className="text-white font-semibold">"{confirmDelete.name}"</span> nomli
                    o'quvchi va unga tegishli{' '}
                    <span className="text-rose-300 font-medium">barcha ma'lumotlar</span> butunlay
                    o'chirib tashlanadi.
                  </p>
                </div>

                <div className="rounded-2xl bg-rose-950/30 border border-rose-500/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold mb-1">
                    <AlertTriangle size={13} />
                    Quyidagilar butunlay yo'qoladi:
                  </div>
                  {[
                    "Hisob ma'lumotlari (ID, ism, parol)",
                    'Barcha XP va topshiriq tarixi',
                    'Tangalar va mukofotlar',
                    'Kunlik vazifalar va seriya',
                    'Yutuqlar va natijalar',
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
