import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

const STORAGE_KEY = 'donadenna.cookies.v1'

type Choice = 'accepted' | 'declined'

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      const t = setTimeout(() => setShow(true), 900)
      return () => clearTimeout(t)
    }
  }, [])

  function decide(choice: Choice) {
    localStorage.setItem(STORAGE_KEY, choice)
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            role="dialog"
            aria-label="Aceitar cookies"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="
              fixed z-[56]
              inset-x-4 md:inset-x-auto md:left-6
              bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6
              md:w-[420px] mx-auto md:mx-0
              max-w-[440px]
              rounded-3xl bg-paper p-5 sm:p-6
              shadow-warm border border-mocha-100
            "
          >
            <h2 className="text-[17px] sm:text-[18px] font-semibold tracking-tight text-mocha-900 leading-snug">
              Você aceita cookies opcionais?
            </h2>
            <p className="mt-2 text-[13px] sm:text-[13.5px] leading-relaxed text-mocha-500">
              Eles nos ajudam a entender como você usa o site, melhorar sua experiência e mostrar conteúdos relevantes. Só usamos se você permitir.
            </p>
            <Link
              to="/cookie-policy"
              onClick={() => setShow(false)}
              className="mt-3 inline-block text-[13px] font-medium text-mocha-900 underline-offset-4 hover:underline"
            >
              Saiba mais
            </Link>

            <div className="mt-5 flex items-center justify-end gap-3 sm:gap-4">
              <button
                onClick={() => decide('declined')}
                className="text-[13.5px] font-medium text-mocha-500 hover:text-mocha-900 transition px-2 py-2"
              >
                Recusar
              </button>
              <button
                onClick={() => decide('accepted')}
                className="rounded-full bg-mocha-900 px-7 py-3 text-[13.5px] font-medium text-cream hover:bg-mocha-800 active:scale-[0.98] transition"
              >
                Aceitar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
