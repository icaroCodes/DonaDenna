import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { BRAND } from '@/lib/brand'

const STORAGE_KEY = 'donadenna.wa.dismissed'

export function WhatsAppFab() {
  const [show, setShow] = useState(false)
  const [openCard, setOpenCard] = useState(false)

  useEffect(() => {
    // Espera o usuário decidir sobre cookies antes de aparecer (evita poluição visual no primeiro load)
    const cookieDecided = () => !!localStorage.getItem('donadenna.cookies.v1')
    const dismissed = sessionStorage.getItem(STORAGE_KEY) === '1'

    const tryShow = () => {
      if (!cookieDecided()) return
      setShow(true)
      if (!dismissed) {
        setTimeout(() => setOpenCard(true), 1200)
      }
    }

    const t = setTimeout(tryShow, 800)
    const poll = setInterval(() => {
      if (cookieDecided()) {
        tryShow()
        clearInterval(poll)
      }
    }, 500)
    return () => { clearTimeout(t); clearInterval(poll) }
  }, [])

  function dismissCard() {
    setOpenCard(false)
    sessionStorage.setItem(STORAGE_KEY, '1')
  }

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.a
            href={BRAND.whatsapp.linkWithMessage}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar no WhatsApp"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[88px] md:bottom-6 right-4 md:right-6 z-30 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-warm hover:shadow-lg transition"
          >
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
            <MessageCircle size={24} strokeWidth={2} className="relative md:w-[26px] md:h-[26px]" />
          </motion.a>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openCard && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-44 md:bottom-24 right-5 md:right-6 z-30 w-[300px] rounded-2xl bg-paper p-5 shadow-warm border border-mocha-100"
          >
            <button
              onClick={dismissCard}
              aria-label="Fechar"
              className="absolute top-2.5 right-2.5 rounded-full p-1 text-mocha-400 hover:text-mocha-900"
            ><X size={14} /></button>
            <p className="label-eyebrow">Atendimento DonaDenna</p>
            <p className="mt-2 text-[14px] font-medium text-mocha-900 leading-snug">
              Olá! Tem alguma dúvida sobre um produto?
            </p>
            <p className="mt-1.5 text-[12px] text-mocha-500 leading-relaxed">
              Atendemos online em qualquer horário. Bora conversar?
            </p>
            <a
              href={BRAND.whatsapp.linkWithMessage}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1faa54] transition"
            >
              <MessageCircle size={14} /> Iniciar conversa
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
