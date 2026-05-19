import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface CountdownProps {
  endDate: string
  className?: string
}

export function Countdown({ endDate, className = '' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null)

  useEffect(() => {
    const target = new Date(endDate).getTime()

    const update = () => {
      const now = new Date().getTime()
      const diff = target - now

      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 })
        return
      }

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000)
      })
    }

    update()
    const int = setInterval(update, 1000)
    return () => clearInterval(int)
  }, [endDate])

  if (!timeLeft) return null
  if (timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m === 0 && timeLeft.s === 0) return null

  const f = (n: number) => n.toString().padStart(2, '0')

  return (
    <div className={`flex items-center gap-1.5 text-[11px] font-medium ${className}`}>
      <Clock size={12} className="animate-pulse" />
      <span>
        {timeLeft.d > 0 && `${timeLeft.d}d `}
        {f(timeLeft.h)}:{f(timeLeft.m)}:{f(timeLeft.s)}
      </span>
    </div>
  )
}
