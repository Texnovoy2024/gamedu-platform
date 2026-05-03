import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
  color?: string // active button color class, e.g. 'bg-purple-600'
}

// Smart page numbers: always show first, last, current ±1, with ellipsis
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = []
  const add = (n: number | '...') => {
    if (pages[pages.length - 1] !== n) pages.push(n)
  }

  add(1)
  if (current > 3) add('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) add(i)
  if (current < total - 2) add('...')
  add(total)

  return pages
}

export function Pagination({ page, totalPages, onChange, color = 'bg-primary-600' }: Props) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(page, totalPages)

  return (
    <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-2">
      {/* Oldingi */}
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 hover:bg-slate-800 shrink-0"
      >
        <ChevronLeft size={14} /> Oldingi
      </button>

      {/* Desktop: raqamlar — sm va undan katta ekranlarda */}
      <div className="hidden sm:flex items-center gap-1">
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="w-8 text-center text-slate-600 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                page === p
                  ? `${color} text-white shadow-lg`
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      {/* Mobile: faqat "joriy / jami" */}
      <div className="flex sm:hidden items-center gap-1.5">
        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${color} text-white`}>{page}</span>
        <span className="text-slate-600 text-xs">/</span>
        <span className="text-slate-400 text-xs font-medium">{totalPages}</span>
      </div>

      {/* Keyingi */}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 hover:bg-slate-800 shrink-0"
      >
        Keyingi <ChevronRight size={14} />
      </button>
    </div>
  )
}
