import { useState } from 'react'
import type { FormEvent } from 'react'
import { deleteUser, generateId, getUsers, upsertUser } from '../../storage'
import type { User } from '../../types'
import { Modal } from '../../components/Modal'

export function TeacherStudentsPage() {
  const [editing, setEditing] = useState<User | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)

  const students = getUsers().filter((u) => u.role === 'student')

  const [form, setForm] = useState<{ id: string; name: string; password: string }>({
    id: '',
    name: '',
    password: '',
  })

  function openCreate() {
    setEditing({
      id: '',
      name: '',
      password: '',
      role: 'student',
      createdAt: new Date().toISOString(),
    })
    setForm({ id: '', name: '', password: '' })
  }

  function openEdit(student: User) {
    setEditing(student)
    setForm({ id: student.id, name: student.name, password: student.password })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editing) return

    if (!form.name.trim()) return

    const now = new Date().toISOString()
    const isNew = !editing.id

    const next: User = {
      ...editing,
      id: isNew ? (form.id.trim() || generateId('s')) : editing.id,
      name: form.name.trim(),
      password: form.password.trim() || editing.password,
      role: 'student',
      createdAt: isNew ? now : editing.createdAt,
    }

    upsertUser(next)
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="text-xs text-slate-300 mb-1.5">O‘quvchi hisoblari</div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">O‘quvchilar</h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            O‘quvchilarni ID orqali boshqaring, ism va parollarni tahrirlang. Har bir o‘quvchi progressi alohida saqlanadi.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center rounded-2xl bg-gradient-to-r from-emerald-500 to-primary-500 px-4 py-2 text-xs font-semibold text-white shadow-glow hover:brightness-110 transition-all"
        >
          Yangi o‘quvchi yaratish
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/80">
        <div className="px-4 py-2.5 border-b border-slate-800 text-[11px] text-slate-300 flex justify-between">
          <span>O‘quvchilar ro‘yxati</span>
          <span>{students.length} nafar</span>
        </div>
        {students.length === 0 ? (
          <div className="px-4 py-6 text-xs text-slate-400">
            Hozircha birorta ham o‘quvchi yaratilmagan. Siz o‘qituvchi sifatida ID berish orqali o‘quvchi hisobi yarata olasiz.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 text-xs">
            {students.map((student) => (
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
                    O‘chirish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!editing}
        title={editing?.id ? "O‘quvchini tahrirlash" : "Yangi o‘quvchi yaratish"}
        tone="primary"
        confirmLabel={editing?.id ? "Saqlash" : "Yaratish"}
        onCancel={() => setEditing(null)}
        onConfirm={() => {
          const fakeEvent = { preventDefault: () => {} } as unknown as FormEvent
          handleSubmit(fakeEvent)
        }}
      >
        <form className="space-y-3 text-xs" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-200">
              O‘quvchi ID (ixtiyoriy)
            </label>
            <input
              value={form.id}
              disabled={!!editing?.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-50 placeholder:text-slate-500 disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Agar bo‘sh qoldirsangiz, tizim avtomatik yaratadi."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-200">
              To‘liq ism
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="O‘quvchi ismi va familiyasi"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-200">
              Parol
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Agar bo‘sh qoldirsangiz, eski parol saqlanadi."
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirmDelete}
        title="O‘quvchini o‘chirish"
        description="Bu o‘quvchining hisobini o‘chirasiz. Uning XP va natijalari keyingi yangilanishlarda yo‘qolishi mumkin. Ishonchingiz komilmi?"
        tone="danger"
        confirmLabel="Ha, o‘chirish"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteUser(confirmDelete.id)
            setConfirmDelete(null)
          }
        }}
      />
    </div>
  )
}

