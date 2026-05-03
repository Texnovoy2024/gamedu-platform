import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronRight,
  Zap,
  HelpCircle,
  ToggleLeft,
  PenLine,
  Layers,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { Pagination } from '../../components/Pagination'
import {
  getCurrentUserId,
  getTasks,
  getProgress,
  getDailyAutoTasks,
  isDailyAutoTaskDone,
  completeDailyAutoTask,
} from '../../storage'
import { LevelUpModal } from '../../components/LevelUpModal'
import type { Task, StudentTaskProgress } from '../../types'
import type { Subject } from '../../data/dailyTasksBank'

const typeConfig: Record<string, { label: string; Icon: React.ElementType }> = {
  'multiple-choice': { label: "Ko'p variantli", Icon: Layers },
  'true-false':      { label: "To'g'ri/Noto'g'ri", Icon: ToggleLeft },
  'fill-blank':      { label: "Bo'sh joy", Icon: PenLine },
  'simple':          { label: 'Oddiy', Icon: HelpCircle },
  'question':        { label: 'Savol', Icon: HelpCircle },
  'project':         { label: 'Loyiha', Icon: BookOpen },
  'spin-wheel':      { label: "Omad g'ildiragi", Icon: Zap },
  'mystery-box':     { label: 'Sirli quti', Icon: HelpCircle },
  'anagram':         { label: 'Anagram', Icon: HelpCircle },
}

const difficultyConfig: Record<string, { label: string; bg: string; dot: string }> = {
  beginner:     { label: "Boshlang'ich", bg: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40', dot: 'bg-emerald-400' },
  intermediate: { label: "O'rta",        bg: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',   dot: 'bg-yellow-400' },
  advanced:     { label: 'Murakkab',     bg: 'bg-rose-900/40 text-rose-300 border-rose-700/40',         dot: 'bg-rose-400' },
}

type FilterType = 'all' | 'pending' | 'completed'

const ITEMS_PER_PAGE = 12

export function StudentTasksPage() {
  const currentId = getCurrentUserId()
  const [filter, setFilter] = useState<FilterType>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [tasks,     setTasks]     = useState<Task[]>([])
  const [progress,  setProgress]  = useState<StudentTaskProgress[]>([])
  const [doneDailyMap, setDoneDailyMap] = useState<Record<string, boolean>>({})

  const [dailyTasks] = useState(() => getDailyAutoTasks())
  const [activeQuestion, setActiveQuestion] = useState<{ subjectId: Subject; answer: string | null } | null>(null)
  const [dailyFeedback, setDailyFeedback] = useState<{ subjectId: Subject; correct: boolean; xp: number } | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpData, setLevelUpData] = useState({ newLevel: 1, earnedXp: 0, earnedCoins: 0 })

  useEffect(() => {
    if (!currentId) return
    async function load() {
      const [t, p] = await Promise.all([getTasks(), getProgress()])
      setTasks(t.filter(t => t.isPublished))
      setProgress(p)
      // Check done status for each daily task
      const doneMap: Record<string, boolean> = {}
      await Promise.all(dailyTasks.map(async dt => {
        doneMap[dt.subjectId] = await isDailyAutoTaskDone(currentId!, dt.subjectId)
      }))
      setDoneDailyMap(doneMap)
    }
    load()
  }, [currentId])

  if (!currentId) {
    return <div className="p-6 text-center text-slate-400">Hisob topilmadi. Iltimos, qayta tizimga kiring.</div>
  }

  const handleDailyAnswer = (_subjectId: Subject, answer: string) => {
    setActiveQuestion(prev => prev ? { ...prev, answer } : null)
  }

  const handleDailySubmit = async (subjectId: Subject) => {
    if (!currentId || !activeQuestion) return
    const task = dailyTasks.find(t => t.subjectId === subjectId)
    if (!task) return

    const q = task.question
    let correct = false
    if (q.type === 'multiple-choice') {
      const correctOpt = q.options.find(o => o.endsWith(' *'))?.replace(' *', '').trim()
      correct = activeQuestion.answer === correctOpt
    } else if (q.type === 'true-false') {
      correct = activeQuestion.answer === String(q.correctAnswer)
    }

    const xpToAward = correct ? task.xpReward : Math.floor(task.xpReward * 0.3)
    const result = await completeDailyAutoTask(currentId, subjectId, xpToAward)

    setDailyFeedback({ subjectId, correct, xp: xpToAward })
    setActiveQuestion(null)
    setDoneDailyMap(prev => ({ ...prev, [subjectId]: true }))

    if (result?.leveledUp) {
      setTimeout(() => {
        setLevelUpData({ newLevel: result.newLevel, earnedXp: xpToAward, earnedCoins: result.earnedCoins })
        setShowLevelUp(true)
      }, 800)
    }

    setTimeout(() => setDailyFeedback(null), 2500)
  }

  const isCompleted = (taskId: string) =>
    progress.some(p => p.studentId === currentId && p.taskId === taskId && p.status === 'completed')

  const isOverdue = (task: Task) =>
    task.deadline ? new Date() > new Date(task.deadline) : false

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return isCompleted(task.id)
    if (filter === 'pending')   return !isCompleted(task.id) && !isOverdue(task)
    return true
  })

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex)

  const completedCount = tasks.filter(t => isCompleted(t.id)).length
  const pendingCount   = tasks.filter(t => !isCompleted(t.id) && !isOverdue(t)).length

  const tabs: { key: FilterType; label: string }[] = [
    { key: 'all',       label: `Barchasi (${tasks.length})` },
    { key: 'pending',   label: `Bajarilmagan (${pendingCount})` },
    { key: 'completed', label: `Bajarilgan (${completedCount})` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Topshiriqlar</h1>
        <p className="mt-1 text-sm text-slate-400">
          XP to'plang, darajangizni oshiring va reytingda yuqoriga chiqing!
        </p>
      </div>

      {/* ── KUNLIK AVTOMATIK TOPSHIRIQLAR ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-primary-500/30 bg-gradient-to-br from-primary-950/30 to-slate-950 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-primary-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary-400" />
            <span className="text-sm font-semibold text-primary-200">Bugungi kunlik topshiriqlar</span>
          </div>
          <span className="text-xs text-slate-500">
            {dailyTasks.filter(t => doneDailyMap[t.subjectId]).length}/{dailyTasks.length} bajarildi
          </span>
        </div>

        <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dailyTasks.map(task => {
            const done = doneDailyMap[task.subjectId] ?? false
            const isActive = activeQuestion?.subjectId === task.subjectId
            const feedback = dailyFeedback?.subjectId === task.subjectId ? dailyFeedback : null
            const q = task.question

            return (
              <motion.div
                key={task.subjectId}
                layout
                className={`rounded-xl border p-4 space-y-3 transition-all ${
                  done
                    ? 'border-emerald-600/30 bg-emerald-950/20 opacity-70'
                    : task.subjectBorderColor
                }`}
              >
                {/* Subject header */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${task.subjectColor}`}>
                    {task.subjectLabel}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                    <TrendingUp size={11} />
                    +{task.xpReward} XP
                  </div>
                </div>

                {/* Feedback */}
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`rounded-lg p-2 text-center text-sm font-semibold flex items-center justify-center gap-2 ${
                        feedback.correct
                          ? 'bg-emerald-900/50 text-emerald-300'
                          : 'bg-rose-900/50 text-rose-300'
                      }`}
                    >
                      {feedback.correct
                        ? <><CheckCircle2 size={14} /> To'g'ri! +{feedback.xp} XP</>
                        : <><XCircle size={14} /> Noto'g'ri! +{feedback.xp} XP</>
                      }
                    </motion.div>
                  )}
                </AnimatePresence>

                {done && !feedback ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 size={13} /> Bajarildi
                  </div>
                ) : !feedback ? (
                  <>
                    {/* Question */}
                    <p className="text-xs text-slate-300 leading-relaxed">{q.questionText}</p>

                    {/* Answers */}
                    {!isActive ? (
                      <button
                        onClick={() => setActiveQuestion({ subjectId: task.subjectId, answer: null })}
                        className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-all flex items-center justify-center gap-1"
                      >
                        Javob berish <ChevronRight size={12} />
                      </button>
                    ) : (
                      <div className="space-y-2">
                        {q.type === 'multiple-choice' && q.options.map((opt, i) => {
                          const clean = opt.replace(' *', '').trim()
                          const selected = activeQuestion?.answer === clean
                          return (
                            <button
                              key={i}
                              onClick={() => handleDailyAnswer(task.subjectId, clean)}
                              className={`w-full px-3 py-2 rounded-lg text-xs text-left transition-all ${
                                selected
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              {clean}
                            </button>
                          )
                        })}

                        {q.type === 'true-false' && (
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { val: 'true', label: "To'g'ri" },
                              { val: 'false', label: "Noto'g'ri" },
                            ].map(opt => (
                              <button
                                key={opt.val}
                                onClick={() => handleDailyAnswer(task.subjectId, opt.val)}
                                className={`py-2 rounded-lg text-xs font-medium transition-all ${
                                  activeQuestion?.answer === opt.val
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {activeQuestion?.answer && (
                          <button
                            onClick={() => handleDailySubmit(task.subjectId)}
                            className="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 size={12} /> Tasdiqlash
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Teacher topshiriqlari */}
      <div>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">O'qituvchi topshiriqlari</h2>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setFilter(tab.key)
              setCurrentPage(1) // Reset to first page when filter changes
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-primary-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="p-10 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
          {filter === 'completed'
            ? 'Hali hech qanday topshiriq bajarilmagan.'
            : filter === 'pending'
            ? 'Barcha topshiriqlar bajarilgan!'
            : 'Hozircha faol topshiriq mavjud emas.'}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedTasks.map((task, i) => {
            const completed = isCompleted(task.id)
            const overdue   = isOverdue(task)
            const diff      = difficultyConfig[task.difficulty] ?? difficultyConfig.beginner
            const typeConf  = typeConfig[task.type] ?? typeConfig['simple']
            const TypeIcon  = typeConf.Icon
            const qCount    = task.questions?.filter(q => q.questionText?.trim()).length ?? 0

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-200 ${
                  completed
                    ? 'border-emerald-600/40 bg-emerald-950/20'
                    : overdue
                    ? 'border-rose-600/40 bg-rose-950/20 opacity-70'
                    : 'border-slate-700 bg-slate-900/80 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-base text-slate-50 line-clamp-2 flex-1">
                    {task.title}
                  </h3>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-emerald-400">{task.xp} XP</div>
                    {task.bonusXp ? (
                      <div className="flex items-center justify-end gap-0.5 text-xs text-yellow-400">
                        <Zap size={10} />
                        <span>+{task.bonusXp}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {task.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${diff.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                    {diff.label}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400">
                    <TypeIcon size={10} />
                    {typeConf.label}
                  </span>
                  {qCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400">
                      <HelpCircle size={10} />
                      {qCount} savol
                    </span>
                  )}
                  {task.timeLimit ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-900/40 text-blue-300">
                      <Clock size={10} />
                      {task.timeLimit} daqiqa
                    </span>
                  ) : null}
                  {task.deadline && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                      overdue ? 'bg-rose-900/50 text-rose-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Calendar size={10} />
                      {new Date(task.deadline).toLocaleDateString('uz-UZ')}
                    </span>
                  )}
                </div>

                {/* Action */}
                <div className="mt-auto space-y-2">
                  {completed && (() => {
                    const prog = progress.find(p => p.studentId === currentId && p.taskId === task.id && p.status === 'completed')
                    if (!prog) return null
                    const maxXp = task.xp + (task.bonusXp ?? 0)
                    const pct = Math.min(100, Math.round((prog.earnedXp / maxXp) * 100))
                    return (
                      <div className="rounded-xl bg-slate-800/60 px-3 py-2 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Natija:</span>
                        <span className={`font-bold ${pct === 100 ? 'text-yellow-400' : pct >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          +{prog.earnedXp} XP ({pct}%)
                        </span>
                      </div>
                    )
                  })()}
                  <Link
                    to={`/student/tasks/${task.id}`}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      completed
                        ? 'bg-emerald-900/50 text-emerald-300 cursor-default pointer-events-none'
                        : overdue
                        ? 'bg-rose-900/50 text-rose-300 cursor-not-allowed pointer-events-none'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white shadow-md'
                    }`}
                  >
                    {completed ? (
                      <><CheckCircle2 size={15} /> Bajarilgan</>
                    ) : overdue ? (
                      <>Muddati o'tgan</>
                    ) : (
                      <>Boshlash <ChevronRight size={15} /></>
                    )}
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination page={currentPage} totalPages={totalPages} onChange={p => { setCurrentPage(p) }} color="bg-primary-600" />
        )}
      </>
      )}
      </div>

      <LevelUpModal
        open={showLevelUp}
        newLevel={levelUpData.newLevel}
        earnedXp={levelUpData.earnedXp}
        earnedCoins={levelUpData.earnedCoins}
        onClose={() => setShowLevelUp(false)}
      />
    </div>
  )
}
