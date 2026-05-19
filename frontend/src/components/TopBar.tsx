import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const MESSAGES = [
  'PARCELAMOS EM ATÉ 4x SEM JUROS · ENVIAMOS PARA TODO O BRASIL',
  'FRETE GRÁTIS em Fortaleza nas compras acima de R$ 100',
  '+15 ANOS NO MERCADO · QUASE 10 MIL SEGUIDORAS NO INSTAGRAM',
]

export function TopBar() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="bg-mocha-900 text-cream/90 text-[11px] md:text-xs tracking-wider">
      <div className="container-page flex items-center justify-center h-9">
        <div className="relative w-full h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center uppercase font-medium text-center px-4"
            >
              {MESSAGES[idx]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
