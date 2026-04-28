import type { ReactNode } from 'react'
import { Star } from 'lucide-react'

type ModalTone = 'primary' | 'success' | 'danger' | 'warning'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  tone?: ModalTone
  confirmLabel?: string
  cancelLabel?: string
  showCancel?: boolean
  onConfirm?: () => void
  onCancel?: () => void
  children?: ReactNode
}

const toneColors: Record<ModalTone, string> = {
  primary: 'from-primary-500/90 to-accent-500/80',
  success: 'from-emerald-500/90 to-xp-500/80',
  danger: 'from-rose-500/90 to-orange-500/80',
  warning: 'from-amber-400/90 to-orange-500/80',
}

export function Modal({
  open,
  title,
  description,
  tone = 'primary',
  confirmLabel = "Tasdiqlash",
  cancelLabel = "Bekor qilish",
  showCancel = true,
  onConfirm,
  onCancel,
  children,
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 shadow-soft overflow-hidden">
        <div className={`absolute inset-x-0 -top-24 h-40 bg-gradient-to-br ${toneColors[tone]} blur-3xl opacity-50`} />
        <div className="relative px-6 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-9 w-9 rounded-2xl bg-slate-950/80 border border-slate-700 flex items-center justify-center">
              <Star size={16} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-50">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-slate-300">
                  {description}
                </p>
              )}
            </div>
          </div>
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>
        <div className="relative flex justify-end gap-2 px-6 py-3 border-t border-slate-800 bg-slate-950/70">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-200 border border-slate-700 hover:bg-slate-800/80 transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow hover:shadow-soft hover:brightness-110 transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

