import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shuffle, CheckCircle2, XCircle, ChevronRight, RotateCcw, Type } from 'lucide-react'

interface Props {
  words: string[]          // teacher kiritgan so'zlar: ["TOSHKENT", "SAMARQAND"]
  hints?: string[]         // ixtiyoriy izohlar: ["O'zbekiston poytaxti", ...]
  onFinish: (correctCount: number, totalCount: number) => void
}

function shuffleWord(word: string): string[] {
  const letters = word.toUpperCase().split('')
  // Asl tartibdan farqli bo'lguncha aralashtir
  let shuffled = [...letters]
  let attempts = 0
  do {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    attempts++
  } while (shuffled.join('') === word.toUpperCase() && attempts < 20)
  return shuffled
}

export function AnagramGame({ words, hints, onFinish }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [shuffledLetters, setShuffledLetters] = useState<string[]>([])
  const [selectedLetters, setSelectedLetters] = useState<{ letter: string; origIdx: number }[]>([])
  const [phase, setPhase] = useState<'play' | 'feedback'>('play')
  const [isCorrect, setIsCorrect] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [shake, setShake] = useState(false)

  const currentWord = words[currentIndex]?.toUpperCase() ?? ''

  useEffect(() => {
    if (currentWord) {
      setShuffledLetters(shuffleWord(currentWord))
      setSelectedLetters([])
      setPhase('play')
    }
  }, [currentIndex, currentWord])

  const handleSelectLetter = (letter: string, origIdx: number) => {
    if (phase !== 'play') return
    if (selectedLetters.some(s => s.origIdx === origIdx)) return
    const newSelected = [...selectedLetters, { letter, origIdx }]
    setSelectedLetters(newSelected)

    // Auto-check when all letters selected
    if (newSelected.length === currentWord.length) {
      const formed = newSelected.map(s => s.letter).join('')
      const ok = formed === currentWord
      setIsCorrect(ok)
      setResults(prev => [...prev, ok])
      setPhase('feedback')
      if (!ok) {
        setShake(true)
        setTimeout(() => setShake(false), 600)
      }
    }
  }

  const handleRemoveLetter = (origIdx: number) => {
    if (phase !== 'play') return
    setSelectedLetters(prev => prev.filter(s => s.origIdx !== origIdx))
  }

  const handleShuffle = () => {
    if (phase !== 'play') return
    setShuffledLetters(shuffleWord(currentWord))
    setSelectedLetters([])
  }

  const handleNext = () => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= words.length) {
      const correct = [...results].filter(Boolean).length
      onFinish(correct, words.length)
      return
    }
    setCurrentIndex(nextIndex)
  }

  const hint = hints?.[currentIndex]

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Type size={13} />
          <span>{currentIndex + 1}/{words.length} so'z</span>
        </div>
        <div className="flex gap-1">
          {words.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < results.length
                  ? results[i] ? 'bg-emerald-500' : 'bg-rose-500'
                  : i === currentIndex ? 'bg-indigo-400' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Hint */}
      {hint && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
          <div className="text-xs text-slate-500 mb-1">Izoh:</div>
          <p className="text-slate-200 font-medium">{hint}</p>
        </div>
      )}

      {/* Answer area — selected letters */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 min-h-[72px]">
        <div className="text-xs text-slate-500 mb-2">Javobingiz:</div>
        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap gap-2"
        >
          {selectedLetters.length === 0 ? (
            <span className="text-slate-600 text-sm">Harflarni bosing...</span>
          ) : (
            selectedLetters.map((s, i) => (
              <motion.button
                key={`${s.origIdx}-${i}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => handleRemoveLetter(s.origIdx)}
                disabled={phase === 'feedback'}
                className={`w-10 h-10 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                  phase === 'feedback'
                    ? isCorrect
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                    : 'bg-primary-600 text-white hover:bg-primary-500 cursor-pointer'
                }`}
              >
                {s.letter}
              </motion.button>
            ))
          )}
        </motion.div>
      </div>

      {/* Shuffled letters */}
      {phase === 'play' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 justify-center">
            {shuffledLetters.map((letter, i) => {
              const isUsed = selectedLetters.some(s => s.origIdx === i)
              return (
                <motion.button
                  key={i}
                  whileHover={!isUsed ? { scale: 1.1, y: -2 } : {}}
                  whileTap={!isUsed ? { scale: 0.9 } : {}}
                  onClick={() => !isUsed && handleSelectLetter(letter, i)}
                  disabled={isUsed}
                  className={`w-11 h-11 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                    isUsed
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-700 text-slate-100 hover:bg-slate-600 cursor-pointer shadow-md'
                  }`}
                >
                  {isUsed ? '' : letter}
                </motion.button>
              )
            })}
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-all"
            >
              <Shuffle size={14} /> Aralashtirish
            </button>
            <button
              onClick={() => setSelectedLetters([])}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-all"
            >
              <RotateCcw size={14} /> Tozalash
            </button>
          </div>
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {phase === 'feedback' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className={`rounded-2xl border p-5 text-center space-y-2 ${
              isCorrect
                ? 'border-emerald-500/40 bg-emerald-950/30'
                : 'border-rose-500/40 bg-rose-950/30'
            }`}>
              {isCorrect
                ? <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
                : <XCircle     size={40} className="text-rose-400 mx-auto" />
              }
              <div className={`font-bold text-xl ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                {isCorrect ? "To'g'ri!" : "Noto'g'ri!"}
              </div>
              {!isCorrect && (
                <div className="text-sm text-slate-400">
                  To'g'ri so'z:{' '}
                  <span className="text-emerald-300 font-bold tracking-widest">{currentWord}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {currentIndex + 1 >= words.length ? "Natijani ko'rish" : 'Keyingi so\'z'}
              <ChevronRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
