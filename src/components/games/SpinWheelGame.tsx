import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, CheckCircle2, XCircle, ChevronRight, Layers } from 'lucide-react'
import type { MultipleChoiceQuestion } from '../../types'

interface Props {
  questions: MultipleChoiceQuestion[]
  taskXp: number
  onFinish: (correctCount: number, totalCount: number) => void
}

export function SpinWheelGame({ questions, onFinish }: Props) {
  const [phase, setPhase] = useState<'spin' | 'answer' | 'feedback'>('spin')
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [currentQIndex, setCurrentQIndex] = useState<number | null>(null)
  const [usedIndices, setUsedIndices] = useState<number[]>([])
  const [results, setResults] = useState<boolean[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  // Oxirgi savol ekanligini track qilamiz — state sifatida, stale closure muammosiz
  const [isFinishing, setIsFinishing] = useState(false)
  const spinRef = useRef(0)

  const handleSpin = () => {
    if (spinning || usedIndices.length >= questions.length) return
    setSpinning(true)
    setSelectedAnswer(null)
    setIsFinishing(false)

    const availableIndices = questions
      .map((_, i) => i)
      .filter(i => !usedIndices.includes(i))
    const pickedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]

    const extraSpins = 5 + Math.random() * 5
    const segmentAngle = 360 / questions.length
    const targetAngle = 360 - (pickedIndex * segmentAngle + segmentAngle / 2)
    const totalRotation = spinRef.current + extraSpins * 360 + targetAngle
    spinRef.current = totalRotation % 360

    setRotation(totalRotation)

    setTimeout(() => {
      setSpinning(false)
      setCurrentQIndex(pickedIndex)
      setPhase('answer')
    }, 3000)
  }

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null || currentQIndex === null) return
    const q = questions[currentQIndex]
    const correct = q.options.find(o => o.endsWith(' *'))?.replace(' *', '').trim()
    const ok = answer === correct

    setSelectedAnswer(answer)
    setIsCorrect(ok)

    const newResults = [...results, ok]
    const newUsed = [...usedIndices, currentQIndex]
    setResults(newResults)
    setUsedIndices(newUsed)
    setPhase('feedback')

    // Bu oxirgi savol bo'lsa — finish
    const isLast = newUsed.length >= questions.length
    if (isLast) {
      setIsFinishing(true)
      setTimeout(() => {
        const correctCount = newResults.filter(Boolean).length
        onFinish(correctCount, questions.length)
      }, 1800)
    }
  }

  const handleNext = () => {
    setPhase('spin')
    setCurrentQIndex(null)
    setSelectedAnswer(null)
    setIsFinishing(false)
  }

  const q = currentQIndex !== null ? questions[currentQIndex] : null

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Layers size={13} />
          <span>{usedIndices.length}/{questions.length} savol bajarildi</span>
        </div>
        <div className="flex gap-1">
          {questions.map((_, i) => {
            const usedPos = usedIndices.indexOf(i)
            return (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  usedPos >= 0
                    ? results[usedPos] ? 'bg-emerald-500' : 'bg-rose-500'
                    : 'bg-slate-700'
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* SPIN PHASE */}
      {phase === 'spin' && (
        <div className="flex flex-col items-center gap-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-50">G'ildirakni aylantiring!</h2>
            <p className="text-sm text-slate-400 mt-1">
              Qaysi savol tushishini bilmaysiz — omad sinab ko'ring
            </p>
          </div>

          {/* Wheel */}
          <div className="relative w-64 h-64">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-yellow-400" />
            </div>

            {/* Wheel SVG */}
            <motion.div
              className="w-full h-full rounded-full overflow-hidden border-4 border-slate-700 shadow-2xl"
              animate={{ rotate: rotation }}
              transition={{ duration: 3, ease: [0.17, 0.67, 0.12, 0.99] }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {questions.map((_q, i) => {
                  const angle = (360 / questions.length) * i
                  const rad = (angle * Math.PI) / 180
                  const nextRad = (((angle + 360 / questions.length) * Math.PI) / 180)
                  const x1 = 100 + 95 * Math.cos(rad)
                  const y1 = 100 + 95 * Math.sin(rad)
                  const x2 = 100 + 95 * Math.cos(nextRad)
                  const y2 = 100 + 95 * Math.sin(nextRad)
                  const midAngle = angle + 360 / questions.length / 2
                  const midRad = (midAngle * Math.PI) / 180
                  const tx = 100 + 60 * Math.cos(midRad)
                  const ty = 100 + 60 * Math.sin(midRad)
                  const largeArc = 360 / questions.length > 180 ? 1 : 0

                  const colors = ['#4f46e5','#dc2626','#059669','#d97706','#7c3aed','#2563eb','#ea580c','#0d9488']
                  const fill = usedIndices.includes(i) ? '#334155' : colors[i % colors.length]

                  return (
                    <g key={i}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={fill}
                        stroke="#1e293b"
                        strokeWidth="1"
                      />
                      <text
                        x={tx} y={ty}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        transform={`rotate(${midAngle}, ${tx}, ${ty})`}
                      >
                        {i + 1}
                      </text>
                    </g>
                  )
                })}
                <circle cx="100" cy="100" r="12" fill="#1e293b" stroke="#475569" strokeWidth="2" />
              </svg>
            </motion.div>
          </div>

          <button
            onClick={handleSpin}
            disabled={spinning}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-lg transition-all shadow-lg disabled:opacity-50"
          >
            <RotateCcw size={20} className={spinning ? 'animate-spin' : ''} />
            {spinning ? 'Aylanmoqda...' : "Aylantirish!"}
          </button>
        </div>
      )}

      {/* ANSWER PHASE */}
      {phase === 'answer' && q && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5">
              <div className="text-xs text-indigo-400 mb-2">Savol #{currentQIndex! + 1}</div>
              <h3 className="text-lg font-semibold text-slate-50">{q.questionText}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.options.map((opt, i) => {
                const clean = opt.replace(' *', '').trim()
                const colors = [
                  'from-blue-600 to-blue-700',
                  'from-rose-600 to-rose-700',
                  'from-yellow-600 to-yellow-700',
                  'from-emerald-600 to-emerald-700',
                ]
                const letters = ['A', 'B', 'C', 'D']
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(clean)}
                    className={`bg-gradient-to-r ${colors[i % 4]} rounded-2xl p-4 text-left text-white font-medium flex items-center gap-3 hover:brightness-110 transition-all`}
                  >
                    <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">
                      {letters[i]}
                    </span>
                    <span>{clean}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* FEEDBACK PHASE */}
      {phase === 'feedback' && q && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5"
        >
          <div className={`rounded-2xl border p-6 text-center space-y-3 ${
            isCorrect
              ? 'border-emerald-500/40 bg-emerald-950/30'
              : 'border-rose-500/40 bg-rose-950/30'
          }`}>
            {isCorrect
              ? <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
              : <XCircle     size={48} className="text-rose-400 mx-auto" />
            }
            <h3 className={`text-xl font-bold ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
              {isCorrect ? "To'g'ri!" : "Noto'g'ri!"}
            </h3>
            {!isCorrect && (
              <p className="text-sm text-slate-400">
                To'g'ri javob:{' '}
                <span className="text-emerald-300 font-semibold">
                  {q.options.find(o => o.endsWith(' *'))?.replace(' *', '').trim()}
                </span>
              </p>
            )}
          </div>

          {/* Oxirgi savol emas — keyingi tugma */}
          {!isFinishing && (
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-semibold flex items-center justify-center gap-2 transition-all"
            >
              Keyingi savol <ChevronRight size={18} />
            </button>
          )}

          {/* Oxirgi savol — natija hisoblanmoqda */}
          {isFinishing && (
            <div className="text-center py-3 text-sm text-slate-400 animate-pulse">
              Natijalar hisoblanmoqda...
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
