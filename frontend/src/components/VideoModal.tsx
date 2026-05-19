import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface VideoModalProps {
  open: boolean
  onClose: () => void
  /** URL completa de embed do YouTube/Vimeo. Ex: https://www.youtube.com/embed/VIDEO_ID?autoplay=1 */
  embedUrl?: string
  title?: string
}

export function VideoModal({ open, onClose, embedUrl, title = 'DonaDenna' }: VideoModalProps) {
  // Esc fecha
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    // Bloqueia scroll do body enquanto modal está aberto
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-mocha-900/80 backdrop-blur-md p-0 md:p-6"
        >
          {/* Botão fechar (sempre visível no canto) */}
          <button
            onClick={onClose}
            aria-label="Fechar vídeo"
            className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-paper/95 text-mocha-900 shadow-soft hover:bg-paper hover:scale-105 active:scale-95 transition"
          >
            <X size={20} />
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="
              relative w-full h-full md:h-auto md:max-w-[min(1080px,92vw)]
              md:aspect-video
              flex items-center justify-center
              bg-black md:rounded-3xl overflow-hidden shadow-warm
            "
          >
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <div className="text-center text-cream/80 px-6">
                <p className="h-display italic text-3xl md:text-5xl text-cream">DonaDenna</p>
                <p className="mt-3 text-[12px] uppercase tracking-wider text-cream/60">
                  Em breve · vídeo institucional
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
