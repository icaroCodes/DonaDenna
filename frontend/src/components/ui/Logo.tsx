import { Link } from 'react-router-dom'

export function Logo({ invert = false }: { invert?: boolean }) {
  return (
    <Link to="/" aria-label="DonaDenna — início" className="group inline-flex items-baseline gap-1.5">
      <span className={`font-display text-[26px] md:text-[28px] font-medium tracking-tight italic ${invert ? 'text-cream' : 'text-mocha-900'}`}>
        DonaDenna
      </span>
      <span className={`h-1.5 w-1.5 rounded-full transition-transform duration-300 group-hover:scale-150 ${invert ? 'bg-cream' : 'bg-mocha-600'}`} />
    </Link>
  )
}
