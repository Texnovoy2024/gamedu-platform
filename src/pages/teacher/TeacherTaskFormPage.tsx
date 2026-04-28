
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, Save, Send,
  Upload, RotateCcw, Type, Package, Layers, ToggleLeft,
  PenLine, ChevronDown,
} from 'lucide-react'
import { generateId, getTasks, upsertTask } from '../../storage'
import type { Task, Difficulty, AnyQuestion, TaskType } from '../../types'
import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.js'

// Task turlari konfiguratsiyasi
const TASK_TYPES: { value: TaskType; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'multiple-choice', label: "Ko'p variantli",      desc: "A/B/C/D variantli savollar",           icon: Layers },
  { value: 'true-false',      label: "To'g'ri / Noto'g'ri", desc: "Ha yoki yo'q savollar",                icon: ToggleLeft },
  { value: 'fill-blank',      label: "Bo'sh joy",           desc: "Gapga so'z to'ldirish",                icon: PenLine },
  { value: 'spin-wheel',      label: "Omad g'ildiragi",     desc: "G'ildirak aylantirib savol olish",     icon: RotateCcw },
  { value: 'mystery-box',     label: "Sirli quti",          desc: "Qutini ochib javob topish",            icon: Package },
  { value: 'anagram',         label: "Anagram",             desc: "Harflarni to'g'ri tartibga solish",    icon: Type },
]

// Ko'p variantli savol editorini ishlatadigan turlar
const MC_TYPES: TaskType[] = ['multiple-choice', 'spin-wheel', 'mystery-box']

const INPUT = 'w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-50 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-slate-600'
const LABEL = 'block text-sm text-slate-300 mb-1.5'

export function TeacherTaskFormPage() {
  const { taskId } = useParams<{ taskId?: string }>()
  const navigate = useNavigate()
  const isEdit = !!taskId

  const [loading, setLoading] = useState(isEdit)
  const [fileName, setFileName] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    xp: '100',
    difficulty: 'beginner' as Difficulty,
    type: 'multiple-choice' as TaskType,
    deadline: '',
    bonusXp: '0',
    timeLimit: '0',
    questions: [] as AnyQuestion[],
    anagramWords: '',
    anagramHints: '',
  })

  // ── Edit rejimida mavjud topshiriqni yuklash ──────────────────────────────
  useEffect(() => {
    if (!isEdit) { setLoading(false); return }
    const task = getTasks().find(t => t.id === taskId)
    if (!task) { alert('Topshiriq topilmadi'); navigate('/teacher/tasks'); return }
    setForm({
      title:        task.title,
      description:  task.description || '',
      xp:           String(task.xp),
      difficulty:   task.difficulty,
      type:         task.type || 'multiple-choice',
      deadline:     task.deadline ?? '',
      bonusXp:      String(task.bonusXp ?? 0),
      timeLimit:    String(task.timeLimit ?? 0),
      questions:    task.questions ?? [],
      anagramWords: task.anagramWords?.join('\n') ?? '',
      anagramHints: (task as any).anagramHints?.join('\n') ?? '',
    })
    setLoading(false)
  }, [taskId, isEdit, navigate])

  // ── Vaqtni avtomatik hisoblash ────────────────────────────────────────────
  useEffect(() => {
    if (form.questions.length === 0) return
    const perQ =
      form.type === 'fill-blank' ? 1.2 :
      form.type === 'true-false' ? 0.75 : 0.6
    setForm(f => ({ ...f, timeLimit: String(Math.max(1, Math.round(form.questions.length * perQ))) }))
  }, [form.questions.length, form.type])

  // ── PDF / DOCX yuklash ────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    try {
      const buf = await file.arrayBuffer()
      let text = ''
      if (file.name.endsWith('.docx')) {
        text = (await mammoth.extractRawText({ arrayBuffer: buf })).value
      } else if (file.name.endsWith('.pdf')) {
        const pdf = await (await pdfjsLib.getDocument({ data: buf }).promise)
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const c = await page.getTextContent()
          text += c.items.map((x: any) => x.str).join(' ') + '\n'
        }
      } else { alert('Faqat .pdf yoki .docx'); return }

      const parsed = parseFile(text)
      if (parsed.length) { setForm(f => ({ ...f, questions: parsed })); alert(`${parsed.length} ta savol chiqarildi!`) }
      else alert("Savollar topilmadi. Format: 1. Savol matni / A) ... / Javob: A")
    } catch (err) { alert('Xato: ' + (err as Error).message) }
  }

  const parseFile = (text: string): AnyQuestion[] => {
    const qs: AnyQuestion[] = []
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    let q = '', opts: string[] = [], letter = ''
    for (const line of lines) {
      if (/^\d+\./.test(line)) {
        if (q && opts.length >= 2 && letter) {
          const ci = 'ABCD'.indexOf(letter.toUpperCase())
          if (ci >= 0) opts[ci] += ' *'
          qs.push({ type: 'multiple-choice', questionText: q, options: opts })
        }
        q = line.replace(/^\d+\.\s*/, ''); opts = []; letter = ''
      } else if (/^[A-D]\)/i.test(line)) {
        opts.push(line)
      } else if (/^javob:/i.test(line)) {
        letter = line.split(/javob:/i)[1]?.trim() || ''
      }
    }
    if (q && opts.length >= 2 && letter) {
      const ci = 'ABCD'.indexOf(letter.toUpperCase())
      if (ci >= 0) opts[ci] += ' *'
      qs.push({ type: 'multiple-choice', questionText: q, options: opts })
    }
    return qs
  }

  // ── Savol CRUD ────────────────────────────────────────────────────────────
  const addQuestion = () => {
    let q: AnyQuestion
    if (MC_TYPES.includes(form.type))      q = { type: 'multiple-choice', questionText: '', options: ['', '', '', ''] }
    else if (form.type === 'fill-blank')   q = { type: 'fill-blank', questionText: '', blanks: [''] }
    else if (form.type === 'true-false')   q = { type: 'true-false', questionText: '', correctAnswer: true }
    else return
    setForm(f => ({ ...f, questions: [...f.questions, q] }))
  }

  const setQText = (i: number, v: string) =>
    setForm(p => { const qs = [...p.questions]; qs[i] = { ...qs[i], questionText: v }; return { ...p, questions: qs } })

  const setOption = (qi: number, oi: number, v: string) =>
    setForm(p => {
      const qs = [...p.questions]; const q = qs[qi]
      if (q.type === 'multiple-choice') q.options[oi] = v
      return { ...p, questions: qs }
    })

  const markCorrect = (qi: number, oi: number) =>
    setForm(p => {
      const qs = [...p.questions]; const q = qs[qi]
      if (q.type === 'multiple-choice') {
        q.options = q.options.map(o => o.replace(' *', '').trim())
        q.options[oi] += ' *'
      }
      return { ...p, questions: qs }
    })

  const addOption = (qi: number) =>
    setForm(p => {
      const qs = [...p.questions]; const q = qs[qi]
      if (q.type === 'multiple-choice') q.options.push('')
      return { ...p, questions: qs }
    })

  const setTFAnswer = (qi: number, v: boolean) =>
    setForm(p => {
      const qs = [...p.questions]; const q = qs[qi]
      if (q.type === 'true-false') q.correctAnswer = v
      return { ...p, questions: qs }
    })

  const setTFExplanation = (qi: number, v: string) =>
    setForm(p => {
      const qs = [...p.questions]; const q = qs[qi]
      if (q.type === 'true-false') (q as any).explanation = v
      return { ...p, questions: qs }
    })

  const setBlank = (qi: number, bi: number, v: string) =>
    setForm(p => {
      const qs = [...p.questions]; const q = qs[qi]
      if (q.type === 'fill-blank') q.blanks[bi] = v
      return { ...p, questions: qs }
    })

  const addBlank = (qi: number) =>
    setForm(p => {
      const qs = [...p.questions]; const q = qs[qi]
      if (q.type === 'fill-blank') q.blanks.push('')
      return { ...p, questions: qs }
    })

  const removeBlank = (qi: number, bi: number) =>
    setForm(p => {
      const qs = [...p.questions]; const q = qs[qi]
      if (q.type === 'fill-blank' && q.blanks.length > 1) q.blanks.splice(bi, 1)
      return { ...p, questions: qs }
    })

  const removeQuestion = (i: number) =>
    setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }))

  // ── Saqlash / Nashr ───────────────────────────────────────────────────────
  const handleSubmit = (publish: boolean) => {
    const xp = Number(form.xp)
    if (!form.title.trim() || isNaN(xp) || xp <= 0) {
      alert("Nomi va XP to'g'ri kiritilishi shart!")
      return
    }

    const anagramWordsArr = form.anagramWords
      .split('\n').map(w => w.trim().toUpperCase()).filter(Boolean)

    if (form.type === 'anagram' && anagramWordsArr.length === 0) {
      alert("Anagram uchun kamida 1 ta so'z kiriting!")
      return
    }

    if (MC_TYPES.includes(form.type) && form.questions.length === 0) {
      alert("Kamida 1 ta savol qo'shing!")
      return
    }

    const base = {
      title:       form.title.trim(),
      description: form.description.trim(),
      xp,
      difficulty:  form.difficulty,
      type:        form.type,
      deadline:    form.deadline || null,
      bonusXp:     Number(form.bonusXp),
      timeLimit:   Number(form.timeLimit) || undefined,
      questions:   form.questions.length > 0 ? form.questions : undefined,
      anagramWords: form.type === 'anagram' ? anagramWordsArr : undefined,
      isPublished: publish,
    }

    let task: Task
    if (isEdit && taskId) {
      const orig = getTasks().find(t => t.id === taskId)!
      task = { ...orig, ...base }
    } else {
      task = {
        ...base,
        id:          generateId('task'),
        createdById: 'local-teacher',
        createdAt:   new Date().toISOString(),
      } as Task
    }

    upsertTask(task)
    alert(publish ? 'Nashr qilindi!' : "Qoralama sifatida saqlandi")
    navigate('/teacher/tasks')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      Yuklanmoqda...
    </div>
  )

  // ── JSX ───────────────────────────────────────────────────────────────────
  const selectedTypeConf = TASK_TYPES.find(t => t.value === form.type)!

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/teacher/tasks')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft size={15} /> Orqaga
          </button>
          <h1 className="text-2xl font-bold text-slate-50">
            {isEdit ? 'Topshiriqni tahrirlash' : 'Yangi topshiriq yaratish'}
          </h1>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Asosiy ma'lumotlar ── */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Asosiy ma'lumotlar
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className={LABEL}>Topshiriq nomi *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className={INPUT}
                placeholder="Masalan: O'zbekiston tarixi testi"
              />
            </div>
            <div>
              <label className={LABEL}>XP miqdori *</label>
              <input
                type="number" min={10}
                value={form.xp}
                onChange={e => setForm(f => ({ ...f, xp: e.target.value }))}
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Tavsif</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={INPUT}
              placeholder="Topshiriq haqida qisqacha ma'lumot..."
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className={LABEL}>Qiyinlik</label>
              <select
                value={form.difficulty}
                onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as Difficulty }))}
                className={INPUT}
              >
                <option value="beginner">Boshlang'ich</option>
                <option value="intermediate">O'rta</option>
                <option value="advanced">Murakkab</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Muddat (ixtiyoriy)</label>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Bonus XP</label>
              <input
                type="number" min={0}
                value={form.bonusXp}
                onChange={e => setForm(f => ({ ...f, bonusXp: e.target.value }))}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>
                Vaqt (daqiqa)
                <span className="text-slate-500 text-xs ml-1">avto: {form.timeLimit}</span>
              </label>
              <input
                type="number" min={0}
                value={form.timeLimit}
                onChange={e => setForm(f => ({ ...f, timeLimit: e.target.value }))}
                className={INPUT}
              />
            </div>
          </div>
        </section>

        {/* ── O'yin turi tanlash ── */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            O'yin turi
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TASK_TYPES.map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: value, questions: [] }))}
                className={`rounded-xl border p-4 text-left transition-all ${
                  form.type === value
                    ? 'border-primary-500 bg-primary-500/15 text-primary-200'
                    : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} />
                  <span className="font-semibold text-sm">{label}</span>
                </div>
                <p className="text-xs text-slate-500">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── PDF/DOCX yuklash (MC turlar uchun) ── */}
        {(MC_TYPES.includes(form.type)) && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Upload size={14} /> Fayldan savollar yuklash
            </h2>
            <p className="text-xs text-slate-500">
              PDF yoki DOCX fayldan savollarni avtomatik chiqarish. Format: <br />
              <code className="text-slate-400">1. Savol matni</code> &nbsp;
              <code className="text-slate-400">A) Variant</code> &nbsp;
              <code className="text-slate-400">Javob: A</code>
            </p>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:bg-primary-600 file:text-white hover:file:bg-primary-500 cursor-pointer"
            />
            {fileName && (
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Yuklangan: {fileName}
              </p>
            )}
          </section>
        )}

        {/* ── Ko'p variantli / Omad g'ildiragi / Sirli quti savollari ── */}
        {MC_TYPES.includes(form.type) && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <selectedTypeConf.icon size={14} /> Savollar
              </h2>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all"
              >
                <Plus size={14} /> Savol qo'shish
              </button>
            </div>

            {form.type === 'spin-wheel' && (
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 text-xs text-indigo-300">
                G'ildirak o'yini: o'quvchi g'ildirakni aylantirib tasodifiy savol oladi. Har bir savol uchun to'g'ri variantni belgilang.
              </div>
            )}
            {form.type === 'mystery-box' && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 text-xs text-purple-300">
                Sirli quti: har bir variant quti sifatida ko'rsatiladi. O'quvchi qutini ochib javob topadi.
              </div>
            )}

            {form.questions.length === 0 && (
              <div className="text-center py-10 text-slate-600 text-sm">
                Hozircha savol yo'q. "Savol qo'shish" tugmasini bosing.
              </div>
            )}

            {form.questions.map((q, qi) => {
              if (q.type !== 'multiple-choice') return null
              return (
                <div key={qi} className="rounded-xl border border-slate-700 bg-slate-950 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-300">Savol #{qi + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qi)}
                      className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-xs transition-colors"
                    >
                      <Trash2 size={13} /> O'chirish
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={q.questionText}
                    onChange={e => setQText(qi, e.target.value)}
                    className={INPUT}
                    placeholder="Savol matnini kiriting..."
                  />

                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const clean = opt.replace(' *', '').trim()
                      const isCorrect = opt.endsWith(' *')
                      const letters = ['A', 'B', 'C', 'D', 'E', 'F']
                      return (
                        <div key={oi} className="flex gap-2 items-center">
                          <span className="w-6 text-xs text-slate-500 font-bold shrink-0">{letters[oi]}</span>
                          <input
                            value={clean}
                            onChange={e => setOption(qi, oi, e.target.value)}
                            className={`flex-1 px-3 py-2 bg-slate-900 border rounded-xl text-slate-50 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                              isCorrect ? 'border-emerald-500/60' : 'border-slate-700'
                            }`}
                            placeholder={`Variant ${letters[oi]}`}
                          />
                          <button
                            type="button"
                            onClick={() => markCorrect(qi, oi)}
                            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {isCorrect ? <CheckCircle2 size={14} /> : 'To\'g\'ri'}
                          </button>
                        </div>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => addOption(qi)}
                      className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 mt-1 transition-colors"
                    >
                      <Plus size={12} /> Variant qo'shish
                    </button>
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* ── To'g'ri / Noto'g'ri savollar ── */}
        {form.type === 'true-false' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ToggleLeft size={14} /> To'g'ri / Noto'g'ri savollar
              </h2>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all"
              >
                <Plus size={14} /> Savol qo'shish
              </button>
            </div>

            {form.questions.length === 0 && (
              <div className="text-center py-10 text-slate-600 text-sm">
                Hozircha savol yo'q.
              </div>
            )}

            {form.questions.map((q, qi) => {
              if (q.type !== 'true-false') return null
              const tfQ = q as any
              return (
                <div key={qi} className="rounded-xl border border-slate-700 bg-slate-950 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-300">Savol #{qi + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qi)}
                      className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-xs transition-colors"
                    >
                      <Trash2 size={13} /> O'chirish
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={q.questionText}
                    onChange={e => setQText(qi, e.target.value)}
                    className={INPUT}
                    placeholder="Masalan: O'zbekistonning poytaxti Toshkent shahridir."
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTFAnswer(qi, true)}
                      className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                        tfQ.correctAnswer === true
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <CheckCircle2 size={16} /> To'g'ri
                    </button>
                    <button
                      type="button"
                      onClick={() => setTFAnswer(qi, false)}
                      className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                        tfQ.correctAnswer === false
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <ChevronDown size={16} /> Noto'g'ri
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 block mb-1">
                      Izoh (ixtiyoriy — o'quvchi natijada ko'radi)
                    </label>
                    <textarea
                      rows={2}
                      value={tfQ.explanation || ''}
                      onChange={e => setTFExplanation(qi, e.target.value)}
                      className={INPUT}
                      placeholder="Tushuntirish..."
                    />
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* ── Bo'sh joy to'ldirish ── */}
        {form.type === 'fill-blank' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <PenLine size={14} /> Bo'sh joy to'ldirish
              </h2>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all"
              >
                <Plus size={14} /> Savol qo'shish
              </button>
            </div>

            {form.questions.length === 0 && (
              <div className="text-center py-10 text-slate-600 text-sm">
                Hozircha savol yo'q.
              </div>
            )}

            {form.questions.map((q, qi) => {
              if (q.type !== 'fill-blank') return null
              return (
                <div key={qi} className="rounded-xl border border-slate-700 bg-slate-950 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-300">Savol #{qi + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qi)}
                      className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-xs transition-colors"
                    >
                      <Trash2 size={13} /> O'chirish
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      Savol matni — bo'sh joyni <code className="text-slate-400">[blank]</code> yoki <code className="text-slate-400">_</code> bilan belgilang
                    </label>
                    <textarea
                      rows={3}
                      value={q.questionText}
                      onChange={e => setQText(qi, e.target.value)}
                      className={INPUT}
                      placeholder="Masalan: O'zbekistonning poytaxti [blank] shahridir."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-500">To'g'ri javoblar:</label>
                    {q.blanks.map((blank, bi) => (
                      <div key={bi} className="flex gap-2 items-center">
                        <input
                          value={blank}
                          onChange={e => setBlank(qi, bi, e.target.value)}
                          className={`flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-50 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500`}
                          placeholder={`Bo'sh joy ${bi + 1} uchun javob`}
                        />
                        {q.blanks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBlank(qi, bi)}
                            className="text-rose-400 hover:text-rose-300 p-1 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addBlank(qi)}
                      className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
                    >
                      <Plus size={12} /> Bo'sh joy qo'shish
                    </button>
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* ── Anagram ── */}
        {form.type === 'anagram' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Type size={14} /> Anagram so'zlari
            </h2>

            <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-3 text-xs text-teal-300 space-y-1">
              <p>Har bir qatorda bitta so'z yozing. O'quvchi harflarni to'g'ri tartibga soladi.</p>
              <p>Misol: <code className="text-teal-200">TOSHKENT</code></p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className={LABEL}>So'zlar (har qatorda bitta) *</label>
                <textarea
                  rows={8}
                  value={form.anagramWords}
                  onChange={e => setForm(f => ({ ...f, anagramWords: e.target.value }))}
                  className={INPUT}
                  placeholder={"TOSHKENT\nSAMARQAND\nBUXORO\nNAMANGAN"}
                />
                <p className="text-xs text-slate-600 mt-1">
                  {form.anagramWords.split('\n').filter(w => w.trim()).length} ta so'z
                </p>
              </div>
              <div>
                <label className={LABEL}>Izohlar / Ko'rsatmalar (ixtiyoriy)</label>
                <textarea
                  rows={8}
                  value={form.anagramHints}
                  onChange={e => setForm(f => ({ ...f, anagramHints: e.target.value }))}
                  className={INPUT}
                  placeholder={"O'zbekiston poytaxti\nQadimiy ipak yo'li shahri\nDiniy markaz\nSanoat shahri"}
                />
                <p className="text-xs text-slate-600 mt-1">
                  So'zlar bilan bir xil tartibda yozing
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Saqlash tugmalari ── */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 pb-8">
          <button
            type="button"
            onClick={() => navigate('/teacher/tasks')}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium transition-all"
          >
            <Save size={15} />
            {isEdit ? "O'zgarishlarni saqlash" : 'Qoralama saqlash'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Send size={15} />
            Nashr qilish
          </button>
        </div>
      </div>
    </div>
  )
}
