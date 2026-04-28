import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Coins,
  ChevronRight,
  Timer,
  HelpCircle,
  Trophy,
  Target,
  RotateCcw,
  Package,
  Type,
} from 'lucide-react'
import {
  awardXpForTask,
  getCurrentUserId,
  getTasks,
  getProgress,
} from '../../storage'
import { LevelUpModal } from '../../components/LevelUpModal'
import { SpinWheelGame } from '../../components/games/SpinWheelGame'
import { MysteryBoxGame } from '../../components/games/MysteryBoxGame'
import { AnagramGame } from '../../components/games/AnagramGame'
import type { Task, AnyQuestion, MultipleChoiceQuestion } from '../../types'

type GamePhase = 'intro' | 'playing' | 'result'

interface QuestionResult {
  correct: boolean
  timeTaken: number
  speedBonus: number
}

export function StudentTaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const currentId = getCurrentUserId()

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Game state
  const [phase, setPhase] = useState<GamePhase>('intro')
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [fillAnswers, setFillAnswers] = useState<Record<string, string>>({})
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([])
  const [questionTimer, setQuestionTimer] = useState(30)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [totalTimer, setTotalTimer] = useState<number | null>(null)
  const [gameStartTime] = useState(Date.now())

  // Result state
  const [earnedXp, setEarnedXp] = useState(0)
  const [earnedCoins, setEarnedCoins] = useState(0)
  const [newLevel, setNewLevel] = useState(1)
  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    if (!taskId || !currentId) {
      navigate('/student/tasks')
      return
    }
    setLoading(true)
    const foundTask = getTasks().find(t => t.id === taskId && t.isPublished)
    if (!foundTask) {
      setError('Topshiriq topilmadi yoki nashr qilinmagan')
      setLoading(false)
      return
    }
    setTask(foundTask)
    if (foundTask.timeLimit) {
      setTotalTimer(foundTask.timeLimit * 60)
    }
    setLoading(false)
  }, [taskId, currentId, navigate])

  const isCompleted = !!task && getProgress().some(
    p => p.studentId === currentId && p.taskId === task.id && p.status === 'completed'
  )

  const questions = task?.questions?.filter(q => q.questionText?.trim()) ?? []
  const currentQ = questions[currentQIndex]
  const isLastQuestion = currentQIndex >= questions.length - 1

  // Question timer
  useEffect(() => {
    if (phase !== 'playing' || showFeedback) return
    setQuestionTimer(30)
    setQuestionStartTime(Date.now())
    const interval = setInterval(() => {
      setQuestionTimer(prev => {
        if (prev <= 1) {
          handleTimeOut()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [currentQIndex, phase, showFeedback])

  // Total timer
  useEffect(() => {
    if (totalTimer === null || phase !== 'playing') return
    const interval = setInterval(() => {
      setTotalTimer(prev => {
        if (prev !== null && prev <= 1) {
          finishGame()
          return 0
        }
        return prev !== null ? prev - 1 : null
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [totalTimer, phase])

  const handleTimeOut = useCallback(() => {
    if (showFeedback) return
    setIsCorrect(false)
    setShowFeedback(true)
    setQuestionResults(prev => [...prev, { correct: false, timeTaken: 30, speedBonus: 0 }])
    setTimeout(() => {
      setShowFeedback(false)
      if (isLastQuestion) {
        finishGame()
      } else {
        setCurrentQIndex(i => i + 1)
        setSelectedAnswer(null)
        setFillAnswers({})
      }
    }, 1500)
  }, [showFeedback, isLastQuestion])

  const checkAnswer = (q: AnyQuestion, answer: string | Record<string, string>): boolean => {
    if (q.type === 'multiple-choice') {
      const correct = q.options.find(o => o.endsWith(' *'))?.replace(' *', '').trim()
      return answer === correct
    }
    if (q.type === 'true-false') {
      return answer === String(q.correctAnswer)
    }
    if (q.type === 'fill-blank' && typeof answer === 'object') {
      return q.blanks.every((b, i) =>
        (answer[`${currentQIndex}-${i}`] || '').trim().toLowerCase() === b.trim().toLowerCase()
      )
    }
    return false
  }

  const handleAnswer = (answer: string) => {
    if (showFeedback || !currentQ) return
    setSelectedAnswer(answer)

    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000)
    const correct = checkAnswer(currentQ, answer)
    const speedBonus = correct ? Math.max(0, Math.round((30 - timeTaken) / 3)) : 0

    setIsCorrect(correct)
    setShowFeedback(true)
    setQuestionResults(prev => [...prev, { correct, timeTaken, speedBonus }])

    setTimeout(() => {
      setShowFeedback(false)
      setSelectedAnswer(null)
      if (isLastQuestion) {
        finishGame([...questionResults, { correct, timeTaken, speedBonus }])
      } else {
        setCurrentQIndex(i => i + 1)
      }
    }, 1200)
  }

  const handleFillSubmit = () => {
    if (!currentQ || currentQ.type !== 'fill-blank') return
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000)
    const correct = checkAnswer(currentQ, fillAnswers)
    const speedBonus = correct ? Math.max(0, Math.round((30 - timeTaken) / 3)) : 0

    setIsCorrect(correct)
    setShowFeedback(true)
    setQuestionResults(prev => [...prev, { correct, timeTaken, speedBonus }])

    setTimeout(() => {
      setShowFeedback(false)
      setFillAnswers({})
      if (isLastQuestion) {
        finishGame([...questionResults, { correct, timeTaken, speedBonus }])
      } else {
        setCurrentQIndex(i => i + 1)
      }
    }, 1200)
  }

  const finishGame = (results?: QuestionResult[]) => {
    const finalResults = results ?? questionResults
    if (!task || !currentId) return

    const correctCount = finalResults.filter(r => r.correct).length
    const totalCount = questions.length || 1
    const speedBonusTotal = finalResults.reduce((s, r) => s + r.speedBonus, 0)

    const result = awardXpForTask(currentId, task, correctCount, totalCount)
    if (!result) {
      setPhase('result')
      return
    }

    setEarnedXp(result.earnedXp + speedBonusTotal)
    setEarnedCoins(result.earnedCoins)
    if (result.leveledUp) {
      setNewLevel(result.newStats.level)
      setShowLevelUp(true)
    }
    setPhase('result')

    if (result.leveledUp) {
      setTimeout(() => setShowLevelUp(true), 800)
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (loading) return <div className="p-10 text-center text-slate-400">Yuklanmoqda...</div>
  if (error) return <div className="p-10 text-center text-rose-400">{error}</div>
  if (!task) return null

  // ─── INTRO PHASE ─────────────────────────────────────────────────────────────
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl border border-emerald-700/50 bg-emerald-950/30">
          <Trophy size={56} className="text-emerald-400 mx-auto" />
          <h2 className="text-2xl font-bold text-emerald-300">Allaqachon bajarilgan!</h2>
          <p className="text-slate-300">Bu topshiriqni qayta bajarish mumkin emas.</p>
          <button
            onClick={() => navigate('/student/tasks')}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all"
          >
            Topshiriqlarga qaytish
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full space-y-6"
        >
          <button
            onClick={() => navigate('/student/tasks')}
            className="text-slate-400 hover:text-slate-200 text-sm flex items-center gap-1.5"
          >
            <ArrowLeft size={15} /> Orqaga
          </button>

          <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 space-y-6">
            {/* Difficulty badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                task.difficulty === 'advanced'
                  ? 'bg-rose-900/50 text-rose-300'
                  : task.difficulty === 'intermediate'
                  ? 'bg-yellow-900/50 text-yellow-300'
                  : 'bg-emerald-900/50 text-emerald-300'
              }`}>
                {task.difficulty === 'advanced' ? 'Murakkab' : task.difficulty === 'intermediate' ? "O'rta" : "Boshlang'ich"}
              </span>
              {task.type === 'spin-wheel' && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-900/50 text-indigo-300">
                  <RotateCcw size={11} /> Omad g'ildiragi
                </span>
              )}
              {task.type === 'mystery-box' && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-900/50 text-purple-300">
                  <Package size={11} /> Sirli quti
                </span>
              )}
              {task.type === 'anagram' && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-900/50 text-teal-300">
                  <Type size={11} /> Anagram
                </span>
              )}
              {!['spin-wheel','mystery-box','anagram'].includes(task.type) && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <HelpCircle size={11} /> {questions.length} ta savol
                </span>
              )}
              {task.type === 'anagram' && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <HelpCircle size={11} /> {task.anagramWords?.length ?? 0} ta so'z
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-50">{task.title}</h1>
              {task.description && (
                <p className="mt-2 text-slate-400 text-sm">{task.description}</p>
              )}
            </div>

            {/* Rewards preview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-800/50 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xl font-bold text-emerald-400">
                  <TrendingUp size={16} /> {task.xp} XP
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Asosiy mukofot</div>
              </div>
              {task.bonusXp ? (
                <div className="rounded-2xl bg-slate-800/50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xl font-bold text-yellow-400">
                    <Zap size={16} /> +{task.bonusXp} XP
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Mukammal natija uchun</div>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-800/50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xl font-bold text-blue-400">
                    <Timer size={16} /> Tezlik
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Tez javob = bonus XP</div>
                </div>
              )}
            </div>

            {/* Rules */}
            <div className="space-y-2 text-sm text-slate-400">
              {task.type === 'spin-wheel' ? [
                "G'ildirakni aylantiring — tasodifiy savol tushadi",
                "Har bir savolga to'g'ri javob bering",
                "Barcha savollarni bajaring va XP yig'ing",
              ] : task.type === 'mystery-box' ? [
                "Har bir qutini bosib oching",
                "Ichidagi javob to'g'rimi yoki noto'g'rimi?",
                "To'g'ri topgan sari ko'proq XP",
              ] : task.type === 'anagram' ? [
                "Aralashtirilgan harflarni to'g'ri tartibga soling",
                "Harflarni bosib javob qatoriga qo'shing",
                "Tezroq topsangiz — ko'proq XP",
              ] : [
                'Har bir savol uchun 30 soniya vaqt',
                "Tezroq javob bersangiz, ko'proq bonus XP",
                "Barcha savolni to'g'ri javoblasangiz bonus XP",
              ].map(rule => (
                <div key={rule} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase('playing')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-lg transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              O'yinni boshlash <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ─── GAME COMPONENTS (spin-wheel, mystery-box, anagram) ─────────────────────
  const handleGameFinish = (correctCount: number, totalCount: number) => {
    if (!task || !currentId) return
    const result = awardXpForTask(currentId, task, correctCount, totalCount)
    if (!result) { setPhase('result'); return }
    setEarnedXp(result.earnedXp)
    setEarnedCoins(result.earnedCoins)
    if (result.leveledUp) {
      setNewLevel(result.newStats.level)
      setShowLevelUp(true)
    }
    setPhase('result')
    if (result.leveledUp) setTimeout(() => setShowLevelUp(true), 800)
  }

  if (phase === 'playing' && task.type === 'spin-wheel') {
    const mcQuestions = (task.questions ?? []).filter(
      q => q.type === 'multiple-choice'
    ) as MultipleChoiceQuestion[]
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="max-w-2xl mx-auto pt-6 space-y-6">
          <div className="flex items-center gap-3">
            <RotateCcw size={20} className="text-indigo-400" />
            <h1 className="text-xl font-bold text-slate-50">{task.title}</h1>
          </div>
          <SpinWheelGame
            questions={mcQuestions}
            taskXp={task.xp}
            onFinish={handleGameFinish}
          />
        </div>
      </div>
    )
  }

  if (phase === 'playing' && task.type === 'mystery-box') {
    const mcQuestions = (task.questions ?? []).filter(
      q => q.type === 'multiple-choice'
    ) as MultipleChoiceQuestion[]
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="max-w-2xl mx-auto pt-6 space-y-6">
          <div className="flex items-center gap-3">
            <Package size={20} className="text-purple-400" />
            <h1 className="text-xl font-bold text-slate-50">{task.title}</h1>
          </div>
          <MysteryBoxGame
            questions={mcQuestions}
            onFinish={handleGameFinish}
          />
        </div>
      </div>
    )
  }

  if (phase === 'playing' && task.type === 'anagram') {
    const words = task.anagramWords ?? []
    const hints = (task as any).anagramHints ?? []
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="max-w-2xl mx-auto pt-6 space-y-6">
          <div className="flex items-center gap-3">
            <Type size={20} className="text-teal-400" />
            <h1 className="text-xl font-bold text-slate-50">{task.title}</h1>
          </div>
          <AnagramGame
            words={words}
            hints={hints.length > 0 ? hints : undefined}
            onFinish={handleGameFinish}
          />
        </div>
      </div>
    )
  }

  // ─── PLAYING PHASE ───────────────────────────────────────────────────────────
  if (phase === 'playing' && currentQ) {
    const timerPercent = (questionTimer / 30) * 100
    const timerColor = questionTimer > 15 ? 'bg-emerald-500' : questionTimer > 7 ? 'bg-yellow-500' : 'bg-rose-500'

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-sm font-bold text-slate-300">
                {currentQIndex + 1} / {questions.length}
              </div>
              {totalTimer !== null && (
                <div className={`flex items-center gap-1 text-sm font-medium ${totalTimer < 60 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                  <Clock size={13} /> {formatTime(totalTimer)}
                </div>
              )}
            </div>

            {/* Question timer bar */}
            <div className="flex-1 max-w-xs">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
            </div>

            <div className={`text-2xl font-bold ${questionTimer <= 7 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
              {questionTimer}
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {/* Question text */}
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 mb-6">
                  <div className="text-xs text-slate-500 mb-2">Savol #{currentQIndex + 1}</div>
                  <h2 className="text-xl font-semibold text-slate-50">{currentQ.questionText}</h2>
                </div>

                {/* Feedback overlay */}
                {showFeedback && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                  >
                    <div className={`${isCorrect ? 'animate-bounce' : 'animate-pulse'}`}>
                      {isCorrect
                        ? <CheckCircle2 size={96} className="text-emerald-400 drop-shadow-lg" />
                        : <XCircle     size={96} className="text-rose-400 drop-shadow-lg" />
                      }
                    </div>
                  </motion.div>
                )}

                {/* Multiple choice */}
                {currentQ.type === 'multiple-choice' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQ.options.map((opt, i) => {
                      const clean = opt.replace(' *', '').trim()
                      const isSelected = selectedAnswer === clean
                      const isCorrectOpt = opt.endsWith(' *')
                      const colors = ['from-blue-600 to-blue-700', 'from-rose-600 to-rose-700', 'from-yellow-600 to-yellow-700', 'from-emerald-600 to-emerald-700']
                      const letters = ['A', 'B', 'C', 'D']

                      let btnClass = `bg-gradient-to-r ${colors[i % 4]} hover:brightness-110`
                      if (showFeedback) {
                        if (isCorrectOpt) btnClass = 'bg-emerald-500 ring-4 ring-emerald-300'
                        else if (isSelected && !isCorrectOpt) btnClass = 'bg-rose-700 opacity-70'
                        else btnClass = `bg-gradient-to-r ${colors[i % 4]} opacity-50`
                      }

                      return (
                        <motion.button
                          key={i}
                          whileHover={!showFeedback ? { scale: 1.02 } : {}}
                          whileTap={!showFeedback ? { scale: 0.98 } : {}}
                          onClick={() => !showFeedback && handleAnswer(clean)}
                          disabled={showFeedback}
                          className={`${btnClass} rounded-2xl p-4 text-left text-white font-medium transition-all flex items-center gap-3`}
                        >
                          <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">
                            {letters[i]}
                          </span>
                          <span>{clean}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                )}

                {/* True/False */}
                {currentQ.type === 'true-false' && (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'true',  label: "To'g'ri",   Icon: CheckCircle2, color: 'from-emerald-600 to-emerald-700' },
                      { value: 'false', label: "Noto'g'ri", Icon: XCircle,      color: 'from-rose-600 to-rose-700' },
                    ].map(opt => {
                      const isCorrectOpt = opt.value === String(currentQ.correctAnswer)
                      let btnClass = `bg-gradient-to-r ${opt.color} hover:brightness-110`
                      if (showFeedback) {
                        if (isCorrectOpt) btnClass = `bg-gradient-to-r ${opt.color} ring-4 ring-white/50`
                        else btnClass = `bg-gradient-to-r ${opt.color} opacity-40`
                      }
                      return (
                        <motion.button
                          key={opt.value}
                          whileHover={!showFeedback ? { scale: 1.03 } : {}}
                          whileTap={!showFeedback ? { scale: 0.97 } : {}}
                          onClick={() => !showFeedback && handleAnswer(opt.value)}
                          disabled={showFeedback}
                          className={`${btnClass} rounded-2xl py-8 text-white font-bold text-xl transition-all flex flex-col items-center gap-3`}
                        >
                          <opt.Icon size={40} />
                          <span>{opt.label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                )}

                {/* Fill blank */}
                {currentQ.type === 'fill-blank' && (
                  <div className="space-y-4">
                    <div className="text-slate-300 leading-relaxed text-lg">
                      {(() => {
                        const text = currentQ.questionText || ''
                        let parts: string[] = []
                        if (text.includes('[blank]')) parts = text.split('[blank]')
                        else if (text.includes('_')) parts = text.split('_')
                        else parts = [text]

                        if (parts.length <= 1) {
                          return currentQ.blanks.map((_, bIdx) => (
                            <input
                              key={bIdx}
                              type="text"
                              value={fillAnswers[`${currentQIndex}-${bIdx}`] || ''}
                              onChange={e => setFillAnswers(prev => ({ ...prev, [`${currentQIndex}-${bIdx}`]: e.target.value }))}
                              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-slate-50 focus:outline-none focus:border-indigo-500"
                              placeholder={`Javob ${bIdx + 1}`}
                              disabled={showFeedback}
                            />
                          ))
                        }

                        return parts.map((part, pIdx, arr) => (
                          <span key={pIdx}>
                            {part}
                            {pIdx < arr.length - 1 && (
                              <input
                                type="text"
                                value={fillAnswers[`${currentQIndex}-${pIdx}`] || ''}
                                onChange={e => setFillAnswers(prev => ({ ...prev, [`${currentQIndex}-${pIdx}`]: e.target.value }))}
                                className="mx-2 w-32 px-3 py-1 bg-slate-800 border border-slate-600 rounded-lg text-slate-50 text-center focus:outline-none focus:border-indigo-500 inline-block"
                                placeholder="..."
                                disabled={showFeedback}
                              />
                            )}
                          </span>
                        ))
                      })()}
                    </div>
                    <button
                      onClick={handleFillSubmit}
                      disabled={showFeedback}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-medium transition-all"
                    >
                      Javobni tekshirish
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    )
  }

  // ─── RESULT PHASE ────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const correctCount = questionResults.filter(r => r.correct).length
    const totalCount = questions.length || 1
    const accuracy = Math.round((correctCount / totalCount) * 100)
    const totalTime = Math.round((Date.now() - gameStartTime) / 1000)
    const speedBonusTotal = questionResults.reduce((s, r) => s + r.speedBonus, 0)

    const grade =
      accuracy === 100 ? { label: 'Mukammal!',      Icon: Trophy,       color: 'text-yellow-400' }
      : accuracy >= 80 ? { label: 'Ajoyib!',         Icon: Target,       color: 'text-emerald-400' }
      : accuracy >= 60 ? { label: 'Yaxshi!',         Icon: TrendingUp,   color: 'text-blue-400' }
      : accuracy >= 40 ? { label: "O'rtacha",        Icon: HelpCircle,   color: 'text-yellow-400' }
      : { label: "Harakat qiling!",                  Icon: Zap,          color: 'text-rose-400' }

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg space-y-4"
        >
          {/* Grade card */}
          <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 text-center space-y-4">
            <grade.Icon size={56} className={`${grade.color} mx-auto`} />
            <h2 className={`text-3xl font-bold ${grade.color}`}>{grade.label}</h2>
            <div className="text-6xl font-bold text-white">{accuracy}%</div>
            <div className="text-slate-400">{correctCount}/{totalCount} to'g'ri javob</div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col items-center gap-1">
              <TrendingUp size={16} className="text-emerald-400" />
              <div className="text-xl font-bold text-emerald-400">+{earnedXp}</div>
              <div className="text-xs text-slate-500">XP</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col items-center gap-1">
              <Coins size={16} className="text-yellow-400" />
              <div className="text-xl font-bold text-yellow-400">+{earnedCoins}</div>
              <div className="text-xs text-slate-500">Tanga</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col items-center gap-1">
              <Clock size={16} className="text-blue-400" />
              <div className="text-xl font-bold text-blue-400">{formatTime(totalTime)}</div>
              <div className="text-xs text-slate-500">Vaqt</div>
            </div>
          </div>

          {speedBonusTotal > 0 && (
            <div className="rounded-2xl border border-blue-500/30 bg-blue-950/30 p-3 flex items-center justify-center gap-2 text-sm text-blue-300">
              <Zap size={14} /> Tezlik bonusi: +{speedBonusTotal} XP
            </div>
          )}

          {/* Question breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="text-xs text-slate-500 mb-3">Savollar bo'yicha natija:</div>
            <div className="flex flex-wrap gap-2">
              {questionResults.map((r, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    r.correct ? 'bg-emerald-600 text-white' : 'bg-rose-700 text-white'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/student/tasks')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
          >
            Topshiriqlarga qaytish <ChevronRight size={20} />
          </button>
        </motion.div>

        <LevelUpModal
          open={showLevelUp}
          newLevel={newLevel}
          earnedXp={earnedXp}
          earnedCoins={earnedCoins}
          onClose={() => setShowLevelUp(false)}
        />
      </div>
    )
  }

  return null
}
