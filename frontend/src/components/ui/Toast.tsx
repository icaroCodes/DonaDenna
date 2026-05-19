import { AnimatePresence, motion, useMotionValue } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToast, type ToastItem } from '@/contexts/ToastContext'

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed inset-x-0 top-0 z-[200] flex flex-col items-center gap-2 pointer-events-none px-4"
      style={{ paddingTop: 'max(14px, env(safe-area-inset-top))' }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const y = useMotionValue(0)
  const duration = item.duration ?? 2800

  return (
    <motion.div
      role="alert"
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: -10,
        scale: 0.95,
        transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
      }}
      transition={{ type: 'spring', stiffness: 520, damping: 40, mass: 0.75 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.55, bottom: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.y < -36 || info.velocity.y < -320) onDismiss()
      }}
      style={{ y }}
      className="pointer-events-auto w-full max-w-[360px] cursor-grab active:cursor-grabbing select-none will-change-transform"
    >
      <div
        className="relative overflow-hidden rounded-[18px] border shadow-[0_8px_28px_rgba(92,63,40,0.13),0_2px_6px_rgba(92,63,40,0.07)]"
        style={{
          background: 'rgba(250,246,241,0.92)',
          backdropFilter: 'blur(24px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
          borderColor: 'rgba(232,223,211,0.65)',
        }}
      >
        <div className="flex items-start gap-3 pl-3.5 pr-3 py-3">
          <LeadVisual item={item} />

          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-[13.5px] font-semibold text-mocha-900 leading-tight truncate">
              {item.title}
            </p>
            {item.description && (
              <p className="mt-0.5 text-[12px] text-mocha-500 leading-snug truncate">
                {item.description}
              </p>
            )}
            {item.action && (
              <button
                type="button"
                onClick={() => {
                  item.action!.onClick()
                  onDismiss()
                }}
                className="mt-2 text-[12px] font-semibold text-mocha-700 hover:text-mocha-900 transition-colors"
              >
                {item.action.label} →
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fechar"
            className="-mt-0.5 w-6 h-6 flex items-center justify-center rounded-full text-mocha-400 hover:text-mocha-700 hover:bg-mocha-100 transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        </div>

        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear', delay: 0.15 }}
          style={{ transformOrigin: '0% 50%' }}
          className={`absolute bottom-0 left-0 right-0 h-[1.5px] opacity-50 ${
            item.type === 'success'
              ? 'bg-emerald-500'
              : item.type === 'error'
                ? 'bg-red-400'
                : 'bg-mocha-400'
          }`}
        />
      </div>
    </motion.div>
  )
}

function LeadVisual({ item }: { item: ToastItem }) {
  const badgeColor = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-mocha-600',
  }[item.type]

  if (item.image) {
    return (
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-cream ring-1 ring-black/5">
          <img
            src={item.image}
            alt=""
            draggable={false}
            className="w-full h-full object-cover"
          />
        </div>
        <div
          className={`absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${badgeColor}`}
          style={{ borderColor: 'rgba(250,246,241,0.95)' }}
        >
          {item.type === 'success' && (
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path
                d="M1 3L3 5L7 1"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {item.type === 'error' && (
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
              <path
                d="M1 1L6 6M6 1L1 6"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      </div>
    )
  }

  const iconClass = {
    success: 'bg-emerald-50 text-emerald-600',
    error: 'bg-red-50 text-red-500',
    info: 'bg-mocha-50 text-mocha-600',
  }[item.type]

  const Icon =
    item.type === 'success' ? CheckCircle2 : item.type === 'error' ? AlertCircle : Info

  return (
    <div
      className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${iconClass}`}
    >
      <Icon size={16} />
    </div>
  )
}
