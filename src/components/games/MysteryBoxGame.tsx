import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, CheckCircle2, XCircle, ChevronRight, Lock } from 'lucide-react'
import type { MultipleChoiceQuestion } from '../../types'

interface Props {
  questions: MultipleChoiceQuestion[]
  onFinish: (correctCount: number, totalCount: number) => void
}

type BoxState = 'closed' | 'open'

export function MysteryBoxGame({ questions, onFinish }: Props) {
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [boxStates, setBoxStates] = useState<BoxState[]>(() =>
    questions[0]?.options.map(() => 'closed') ?? []
  )
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [, setOpenedCount] = useState(0)

  const q = questions[currentQIndex]
  if (!q) return null

  const correctAnswer = q.options.find(o => o.endsWith(' *'))?.replace(' *', '').trim() ?? ''

  const handleOpenBox = (optIndex: number) => {
    if (boxStates[optIndex] === 'open' || selectedAnswer) return

    const newStates = [...boxStates]
    newStates[optIndex] = 'open'
    setBoxStates(newStates)
    setOpenedCount(prev => prev + 1)

    const clean = q.options[optIndex].replace(' *', '').trim()
    const ok = clean === correctAnswer

    setSelectedAnswer(clean)
    setIsCorrect(ok)
    setShowFeedback(true)
    setResults(prev => [...prev, ok])
  }

  const handleNext = () => {
    const nextIndex = currentQIndex + 1
    if (nextIndex >= questions.length) {
      const correct = [...results].filter(Boolean).length
      onFinish(correct, questions.length)
      return
    }
    setCurrentQIndex(nextIndex)
    setBoxStates(questions[nextIndex].options.map(() => 'closed'))
    setSelectedAnswer(null)
    setIsCorrect(false)
    setShowFeedback(false)
    setOpenedCount(0)
  }

  const boxColors = [
    { closed: 'from-indigo-700 to-indigo-800 border-indigo-500/50', open: 'from-indigo-900/50 to-slate-900 border-indigo-500/30' },
    { closed: 'from-rose-700 to-rose-800 border-rose-500/50',       open: 'from-rose-900/50 to-slate-900 border-rose-500/30' },
    { closed: 'from-emerald-700 to-emerald-800 border-emerald-500/50', open: 'from-emerald-900/50 to-slate-900 border-emerald-500/30' },
    { closed: 'from-yellow-700 to-yellow-800 border-yellow-500/50', open: 'from-yellow-900/50 to-slate-900 border-yellow-500/30' },
    { closed: 'from-purple-700 to-purple-800 border-purple-500/50', open: 'from-purple-900/50 to-slate-900 border-purple-500/30' },
    { closed: 'from-teal-700 to-teal-800 border-teal-500/50',       open: 'from-teal-900/50 to-slate-900 border-teal-500/30' },
  ]

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Package size={13} />
          <span>{currentQIndex + 1}/{questions.length} savol</span>
        </div>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < results.length
                  ? results[i] ? 'bg-emerald-500' : 'bg-rose-500'
                  : i === currentQIndex ? 'bg-indigo-400' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
        <div className="text-xs text-slate-500 mb-2">Savol #{currentQIndex + 1}</div>
        <h3 className="text-lg font-semibold text-slate-50">{q.questionText}</h3>
        {!selectedAnswer && (
          <p className="text-xs text-slate-500 mt-2">
            Qutini bosing va ichida nima borligini ko'ring!
          </p>
        )}
      </div>

      {/* Boxes grid */}
      <div className={`grid gap-3 ${q.options.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {q.options.map((opt, i) => {
          const clean = opt.replace(' *', '').trim()
          const isOpen = boxStates[i] === 'open'
          const isThisCorrect = clean === correctAnswer
          const colors = boxColors[i % boxColors.length]

          return (
            <motion.button
              key={i}
              onClick={() => handleOpenBox(i)}
              disabled={isOpen || !!selectedAnswer}
              whileHover={!isOpen && !selectedAnswer ? { scale: 1.04, y: -2 } : {}}
              whileTap={!isOpen && !selectedAnswer ? { scale: 0.96 } : {}}
              className={`relative rounded-2xl border p-4 min-h-[100px] flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                isOpen
                  ? `bg-gradient-to-br ${colors.open} border`
                  : `bg-gradient-to-br ${colors.closed} border cursor-pointer hover:brightness-110`
              } ${selectedAnswer && !isOpen ? 'opacity-40' : ''}`}
            >
              <AnimatePresence mode="wait">
                {!isOpen ? (
                  <motion.div
                    key="closed"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <Lock size={24} className="text-white/70" />
                    <span className="text-white/80 font-bold text-lg">{i + 1}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="open"
                    initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-2 text-center"
                  >
                    {showFeedback && (
                      isThisCorrect
                        ? <CheckCircle2 size={24} className="text-emerald-400" />
                        : <XCircle size={24} className="text-rose-400" />
                    )}
                    <span className="text-sm font-semibold text-slate-100">{clean}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className={`rounded-2xl border p-4 text-center ${
              isCorrect
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                : 'border-rose-500/40 bg-rose-950/30 text-rose-300'
            }`}>
              <div className="font-bold text-lg">
                {isCorrect ? "To'g'ri topding!" : "Noto'g'ri!"}
              </div>
              {!isCorrect && (
                <div className="text-sm text-slate-400 mt-1">
                  To'g'ri javob: <span className="text-emerald-300 font-semibold">{correctAnswer}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {currentQIndex + 1 >= questions.length ? "Natijani ko'rish" : 'Keyingi savol'}
              <ChevronRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
