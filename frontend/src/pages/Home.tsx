import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUpRight, ArrowLeft, ArrowRight, CreditCard, ShieldCheck, Truck, Sparkles, Play,
  Shirt, Footprints, Watch, Gem, Gift, ChevronLeft, ChevronRight, Image as ImageIcon,
  Check, Instagram, MapPin, MessageCircle,
} from 'lucide-react'
import { getFeatured, getBestsellers, getSiteContent, type SiteContent, type SiteHeroSlide, type SiteShort } from '@/services/api'
import type { Product } from '@/types/catalog'
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard'
import { VideoModal } from '@/components/VideoModal'
import { BRAND } from '@/lib/brand'

/** Fallback de embed quando o admin ainda não configurou o vídeo no Site. */
const DEFAULT_VIDEO_EMBED = ''

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[] | null>(null)
  const [best, setBest] = useState<Product[] | null>(null)
  const [site, setSite] = useState<SiteContent>({})

  useEffect(() => {
    getFeatured().then((r) => setFeatured(r.products)).catch(() => setFeatured([]))
    getBestsellers().then((r) => setBest(r.products)).catch(() => setBest([]))
    getSiteContent().then(setSite).catch(() => setSite({}))
  }, [])

  return (
    <>
      <HeroBanner slides={site.hero_slides || []} />
      <TrustStrip />
      <CategoriesCarousel />
      <ProductSection
        eyebrow="Destaques"
        title="Os mais queridinhos da loja"
        action={{ to: '/loja?sort=recent', label: 'Ver tudo' }}
        items={featured}
      />
      <PromoBanner video={site.hero_video || {}} />
      <ProductSection
        eyebrow="Novidades"
        title="Produtos imperdíveis"
        action={{ to: '/loja', label: 'Explorar loja' }}
        items={best}
      />
      <VideoStrip shorts={site.shorts || []} />
      <AboutSection storePhoto={site.store_photo?.image_url || ''} />
      <ReasonsSection />
      <VisitSection />
    </>
  )
}

/* ───────────────────────── HERO CARROSSEL ─────────────────────────
   Banner full-bleed com múltiplos slides.
   Pra colocar suas imagens:
   1) Salve os arquivos em `frontend/public/` (ex.: hero-1.jpg, hero-2.jpg)
   2) Adicione cada um no array HERO_SLIDES abaixo
   Recomendado: 2400x900px+, JPG otimizado ou WebP.
─────────────────────────────────────────────────────────── */
function HeroBanner({ slides }: { slides: SiteHeroSlide[] }) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = Math.max(slides.length, 1)
  const hasImages = slides.length > 0
  const touchStart = useRef<number | null>(null)

  useEffect(() => { setIdx(0) }, [slides.length])
  useEffect(() => {
    if (slides.length <= 1 || paused) return
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 6000)
    return () => clearInterval(t)
  }, [slides.length, paused])

  const next = () => setIdx((i) => (i + 1) % total)
  const prev = () => setIdx((i) => (i - 1 + total) % total)

  function onTouchStart(e: React.TouchEvent) { touchStart.current = e.touches[0].clientX; setPaused(true) }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current
    touchStart.current = null
    if (start == null) return
    const dx = e.changedTouches[0].clientX - start
    if (Math.abs(dx) > 40) (dx < 0 ? next() : prev())
    setTimeout(() => setPaused(false), 4000)
  }

  return (
    <section className="relative w-full">
      <div
        className="relative w-full overflow-hidden bg-mocha-700 group select-none
                   h-[78vh] max-h-[640px] min-h-[480px]
                   sm:h-auto sm:aspect-[16/9] sm:max-h-none sm:min-h-0
                   md:aspect-[21/9]
                   lg:aspect-auto lg:h-[clamp(420px,52vw,720px)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Slides
            Cada slide pode ter duas imagens — uma desktop e uma mobile.
            O navegador escolhe sozinho via <picture>/<source media>. Se
            a mobile não existir, cai pra desktop com foco à esquerda. */}
        <AnimatePresence mode="wait">
          {hasImages ? (
            <motion.picture
              key={idx}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 block h-full w-full"
            >
              {slides[idx].image_url_mobile && (
                <source media="(max-width: 640px)" srcSet={slides[idx].image_url_mobile} />
              )}
              <img
                src={slides[idx].image_url}
                alt={slides[idx].alt || ''}
                draggable={false}
                className={`h-full w-full object-cover sm:object-center ${
                  slides[idx].image_url_mobile ? 'object-center' : 'object-[25%_center]'
                }`}
              />
            </motion.picture>
          ) : (
            <PlaceholderSlot key="placeholder" />
          )}
        </AnimatePresence>

        {/* Setas — visíveis sempre no mobile (sem hover), suaves no desktop */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Slide anterior"
              className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-paper/85 backdrop-blur text-mocha-900 shadow-soft transition opacity-90 md:opacity-0 md:group-hover:opacity-100 active:scale-95 hover:bg-paper hover:scale-105"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={next}
              aria-label="Próximo slide"
              className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-paper/85 backdrop-blur text-mocha-900 shadow-soft transition opacity-90 md:opacity-0 md:group-hover:opacity-100 active:scale-95 hover:bg-paper hover:scale-105"
            >
              <ArrowRight size={18} />
            </button>
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-8 bg-cream' : 'w-1.5 bg-cream/40 hover:bg-cream/70'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* Placeholder mostrado quando HERO_SLIDES está vazio.
   Some automaticamente assim que você adicionar um slide. */
function PlaceholderSlot() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex flex-col items-center justify-center text-center text-cream"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-mocha-700 via-mocha-600 to-mocha-800" />
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-px opacity-[0.05]">
        {Array.from({ length: 72 }).map((_, i) => <div key={i} className="bg-cream" />)}
      </div>
      <div className="relative flex flex-col items-center gap-4 px-6">
        <div className="rounded-full border-2 border-dashed border-cream/40 p-6">
          <ImageIcon size={42} strokeWidth={1.2} className="text-cream/70" />
        </div>
        <p className="h-display italic text-3xl md:text-4xl text-cream">Em breve, novidades</p>
        <p className="max-w-md text-sm text-cream/70 leading-relaxed">
          Estamos preparando algo lindo para você. Volte em instantes.
        </p>
      </div>
    </motion.div>
  )
}

/* ───────────────────────── TRUST STRIP ───────────────────────── */
function TrustStrip() {
  const items = [
    { icon: CreditCard,  title: 'Parcele suas compras',  desc: 'Em até 4x sem juros' },
    { icon: ShieldCheck, title: 'Compra 100% segura',    desc: 'Pagamento garantido e certificado' },
    { icon: Sparkles,    title: 'Promoções exclusivas',  desc: 'Vantagens e descontos diários' },
    { icon: Truck,       title: 'Frete diferenciado',    desc: 'Prático e rápido' },
  ]
  return (
    <section className="py-6 md:py-14 md:container-page">
      <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar px-5 md:px-0">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="shrink-0 w-[240px] md:w-auto snap-center flex flex-col items-center text-center gap-3 rounded-3xl border border-mocha-100 bg-cream/30 p-5 md:p-6 hover:border-mocha-300 hover:bg-cream transition">
            <div className="rounded-full bg-paper border border-mocha-100 p-3">
              <Icon size={20} strokeWidth={1.5} className="text-mocha-700" />
            </div>
            <div>
              <p className="text-[11px] md:text-[12px] uppercase font-bold tracking-widest text-mocha-900">{title}</p>
              <p className="mt-1.5 text-[13px] text-mocha-500 leading-snug max-w-[180px]">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── CATEGORIES ───────────────────────── */
function CategoriesCarousel() {
  const cats = [
    { slug: 'blusa',       name: 'Blusas',       icon: Shirt },
    { slug: 'tshirt',      name: 'Tshirts',      icon: Shirt },
    { slug: 'calca',       name: 'Calças',       icon: Footprints },
    { slug: 'cropped',     name: 'Croppeds',     icon: Shirt },
    { slug: 'macaquinho',  name: 'Macaquinhos',  icon: Gift },
    { slug: 'short',       name: 'Shorts',       icon: Footprints },
    { slug: 'short_tlf',   name: 'Shorts TLF',   icon: Footprints },
    { slug: 'body',        name: 'Bodies',       icon: Shirt },
    { slug: 'conjunto',    name: 'Conjuntos',    icon: Gift },
    { slug: 'acessorio',   name: 'Acessórios',   icon: Gem },
    { slug: 'acessorio',   name: 'Bolsas',       icon: Gift },
    { slug: 'acessorio',   name: 'Joias',        icon: Watch },
  ]
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  function updateButtons() {
    const el = scrollerRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateButtons()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener('scroll', updateButtons, { passive: true })
    window.addEventListener('resize', updateButtons)
    return () => {
      el.removeEventListener('scroll', updateButtons)
      window.removeEventListener('resize', updateButtons)
    }
  }, [])

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    const step = Math.max(200, Math.round(el.clientWidth * 0.7))
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  return (
    <section className="container-page py-6 md:py-8">
      <header className="mb-6 md:mb-8 text-center">
        <p className="label-eyebrow">Departamentos</p>
        <h2 className="mt-1 h-display text-3xl md:text-4xl text-mocha-900">Busque pelos nossos departamentos</h2>
      </header>

      <div className="relative">
        {/* Botão anterior */}
        <button
          aria-label="Categorias anteriores"
          onClick={() => scrollBy(-1)}
          disabled={!canPrev}
          className={`
            absolute left-0 top-[48px] md:top-[55px] -translate-y-1/2 z-10
            flex h-10 w-10 items-center justify-center rounded-full
            bg-paper border border-mocha-200 text-mocha-900 shadow-soft
            transition hover:bg-mocha-900 hover:text-cream hover:border-mocha-900
            disabled:opacity-0 disabled:pointer-events-none
            -ml-1 md:-ml-4
          `}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Botão próximo */}
        <button
          aria-label="Próximas categorias"
          onClick={() => scrollBy(1)}
          disabled={!canNext}
          className={`
            absolute right-0 top-[48px] md:top-[55px] -translate-y-1/2 z-10
            flex h-10 w-10 items-center justify-center rounded-full
            bg-paper border border-mocha-200 text-mocha-900 shadow-soft
            transition hover:bg-mocha-900 hover:text-cream hover:border-mocha-900
            disabled:opacity-0 disabled:pointer-events-none
            -mr-1 md:-mr-4
          `}
        >
          <ChevronRight size={18} />
        </button>

        {/* Fade nas bordas, só quando há scroll */}
        {canPrev && <div className="absolute left-0 top-0 bottom-0 w-10 z-[1] bg-gradient-to-r from-paper to-transparent pointer-events-none" />}
        {canNext && <div className="absolute right-0 top-0 bottom-0 w-10 z-[1] bg-gradient-to-l from-paper to-transparent pointer-events-none" />}

        <div
          ref={scrollerRef}
          className="flex gap-3 md:gap-5 overflow-x-auto no-scrollbar pb-2 scroll-smooth px-2 md:px-6"
        >
          {cats.map((c, i) => (
            <Link
              key={i}
              to={`/loja?category=${c.slug}`}
              className="group shrink-0 flex flex-col items-center gap-2.5 w-[88px] md:w-[110px]"
            >
              <div className="aspect-square w-full rounded-full bg-cream/60 border border-mocha-100 flex items-center justify-center transition group-hover:bg-mocha-600 group-hover:border-mocha-600 group-hover:scale-[1.03]">
                <c.icon size={32} strokeWidth={1.4} className="text-mocha-700 transition group-hover:text-cream" />
              </div>
              <span className="text-[11px] md:text-xs font-medium text-mocha-700 group-hover:text-mocha-900 transition">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── PRODUCT SECTION ───────────────────────── */
function ProductSection({ eyebrow, title, action, items }: {
  eyebrow: string; title: string; action: { to: string; label: string }; items: Product[] | null
}) {
  return (
    <section className="container-page py-10 md:py-14">
      <header className="mb-7 md:mb-9 text-center">
        <p className="label-eyebrow">{eyebrow}</p>
        <h2 className="mt-1 h-display text-3xl md:text-4xl text-mocha-900">{title}</h2>
      </header>
      {items === null ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-mocha-500 text-center">Em breve — novas peças chegando.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {items.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
      <div className="mt-10 flex justify-center">
        <Link to={action.to} className="btn-ghost">{action.label} <ChevronRight size={14} /></Link>
      </div>
    </section>
  )
}

/* ───────────────────────── PROMO BANNER (vídeo / branding) ───────────────────────── */
function PromoBanner({ video }: { video: { embed_url?: string; thumb_url?: string; title?: string } }) {
  const [videoOpen, setVideoOpen] = useState(false)
  const embed = video.embed_url || DEFAULT_VIDEO_EMBED
  const thumb = video.thumb_url
  return (
    <section className="container-page py-10 md:py-14">
      <header className="mb-7 md:mb-9 text-center">
        <p className="label-eyebrow">Assista nosso conteúdo</p>
        <h2 className="mt-1 h-display text-3xl md:text-4xl text-mocha-900">Veja o que preparamos para você</h2>
      </header>
      <div className="grid md:grid-cols-[2fr_1fr] gap-4">
        <button
          type="button"
          onClick={() => setVideoOpen(true)}
          aria-label="Assistir vídeo institucional"
          className="group relative aspect-[16/9] md:aspect-[16/8] overflow-hidden rounded-3xl bg-mocha-700 text-cream active:scale-[0.99] transition"
        >
          {thumb ? (
            <img src={thumb} alt={video.title || ''} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-8 gap-px opacity-[0.06]">
                {Array.from({ length: 96 }).map((_, i) => <div key={i} className="bg-cream" />)}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="h-display text-4xl md:text-6xl italic">DonaDenna</span>
                <span className="mt-2 tracking-[0.3em] text-xs md:text-sm uppercase text-cream/70">Atelier · Fortaleza</span>
              </div>
            </>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-cream/95 p-5 group-hover:scale-110 transition shadow-warm">
              <Play size={22} className="text-mocha-900 fill-mocha-900 translate-x-0.5" />
            </span>
          </div>
        </button>
        <Link to="/loja?sort=recent" className="group relative aspect-[16/9] md:aspect-auto overflow-hidden rounded-3xl bg-cream flex flex-col p-6 hover:bg-mocha-50 transition">
          <p className="label-eyebrow">Lançamentos</p>
          <h3 className="mt-2 h-display text-2xl md:text-3xl text-mocha-900">Peças que acabaram de chegar</h3>
          <p className="mt-auto pt-4 flex items-center gap-2 text-sm font-medium text-mocha-900">
            Ver tudo <ArrowUpRight size={16} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </p>
        </Link>
      </div>

      <VideoModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        embedUrl={embed}
        title={video.title || 'DonaDenna · Atelier · Fortaleza'}
      />
    </section>
  )
}

/* ───────────────────────── VIDEO STRIP (YouTube Shorts) ───────────────────────── */
function VideoStrip({ shorts }: { shorts: SiteShort[] }) {
  const items = (shorts && shorts.length ? shorts : [{}, {}, {}, {}]).slice(0, 4)
  return (
    <section className="bg-cream/40 py-10 md:py-14">
      <div className="container-page">
        <header className="mb-7 md:mb-9 text-center">
          <p className="label-eyebrow">Shorts do Youtube</p>
          <h2 className="mt-1 h-display text-3xl md:text-4xl text-mocha-900">Dicas para você ficar ainda mais linda</h2>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {items.map((s, i) => {
            const inner = (
              <>
                {s.thumb_url && (
                  <img src={s.thumb_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-paper/95 p-3 group-hover:scale-110 transition">
                    <Play size={18} className="text-mocha-900 fill-mocha-900" />
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <span className="h-display italic text-cream text-sm drop-shadow">DonaDenna</span>
                </div>
              </>
            )
            return s.embed_url ? (
              <a key={i} href={s.embed_url} target="_blank" rel="noopener" className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-mocha-100 block">
                {inner}
              </a>
            ) : (
              <button key={i} className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-mocha-100">
                {inner}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── SOBRE A MARCA ───────────────────────── */
function AboutSection({ storePhoto }: { storePhoto: string }) {
  return (
    <section className="container-page py-12 md:py-24">
      <div className="grid md:grid-cols-[1.1fr_1fr] gap-8 md:gap-16 items-center">
        <div className="relative aspect-[4/3] md:aspect-[4/5] overflow-hidden rounded-3xl bg-mocha-100">
          {storePhoto ? (
            <img src={storePhoto} alt="Loja física DonaDenna em Bom Jardim, Fortaleza" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-10 gap-px opacity-[0.06]">
                {Array.from({ length: 80 }).map((_, i) => <div key={i} className="bg-mocha-900" />)}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-mocha-700">
                <ImageIcon size={32} strokeWidth={1.2} className="opacity-60" />
                <p className="mt-3 text-[11px] uppercase tracking-wider opacity-60">Foto da loja física · Bom Jardim</p>
              </div>
            </>
          )}
        </div>
        <div>
          <p className="label-eyebrow">Sobre a DonaDenna</p>
          <h2 className="mt-3 h-display text-4xl md:text-5xl text-mocha-900">
            Há mais de {BRAND.yearsInMarket} anos vestindo mulheres em todo o Brasil.
          </h2>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-mocha-700">
            {BRAND.about.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={BRAND.whatsapp.linkWithMessage} target="_blank" rel="noopener noreferrer" className="btn-primary">
              <MessageCircle size={16} /> Falar no WhatsApp
            </a>
            <a href={BRAND.instagram.url} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <Instagram size={16} /> {BRAND.instagram.handle}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── POR QUE ESCOLHER ───────────────────────── */
function ReasonsSection() {
  return (
    <section className="bg-mocha-900 text-cream py-16 md:py-24">
      <div className="container-page">
        <header className="text-center max-w-2xl mx-auto">
          <p className="label-eyebrow text-cream/60">Por que escolher</p>
          <h2 className="mt-3 h-display text-4xl md:text-5xl">
            Mais do que <em className="italic">roupa</em> —{' '}
            <span className="text-mocha-200">confiança, qualidade e atendimento de verdade.</span>
          </h2>
        </header>
        <ul className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BRAND.reasonsToBuy.map((reason, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.3) }}
              className="flex items-start gap-3 rounded-2xl border border-cream/10 bg-mocha-800/40 p-5"
            >
              <span className="rounded-full bg-cream/10 p-1.5 mt-0.5">
                <Check size={14} className="text-cream" />
              </span>
              <span className="text-[14px] leading-snug text-cream/90">{reason}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ───────────────────────── VISITE A LOJA ───────────────────────── */
function VisitSection() {
  return (
    <section className="container-page py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="label-eyebrow flex items-center gap-2"><MapPin size={12} /> Loja física &amp; atelier</p>
          <h2 className="mt-3 h-display text-4xl md:text-5xl text-mocha-900">
            Venha conhecer a gente em <em className="italic">Bom Jardim</em>.
          </h2>
          <p className="mt-5 text-[15px] text-mocha-600 leading-relaxed max-w-md">
            Te esperamos no balcão pra experimentar, conversar e escolher com calma.
            Ou, se preferir, conversamos por WhatsApp — atendemos online em qualquer horário.
          </p>
          <div className="mt-6 rounded-3xl border border-mocha-100 bg-cream/40 p-6">
            <p className="text-[15px] font-medium text-mocha-900">
              {BRAND.address.street}, {BRAND.address.number}
            </p>
            <p className="mt-1 text-sm text-mocha-600">
              {BRAND.address.district} · {BRAND.address.city}/{BRAND.address.state} · CEP {BRAND.address.cep}
            </p>
            <div className="mt-5 grid sm:grid-cols-3 gap-x-6 gap-y-2 text-[13px]">
              {BRAND.hours.map((h) => (
                <div key={h.day}>
                  <p className="label-eyebrow">{h.day}</p>
                  <p className="mt-1 text-mocha-900 font-medium">{h.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-pix-600 font-medium">{BRAND.hoursNote}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${BRAND.address.street}, ${BRAND.address.number} - ${BRAND.address.district}, ${BRAND.address.city}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="btn-primary"
            ><MapPin size={16} /> Como chegar</a>
            <a
              href={BRAND.whatsapp.linkWithMessage}
              target="_blank" rel="noopener noreferrer"
              className="btn-ghost"
            ><MessageCircle size={16} /> {BRAND.whatsapp.display}</a>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-mocha-100">
          <iframe
            title="Mapa DonaDenna"
            loading="lazy"
            className="absolute inset-0 h-full w-full grayscale-[20%]"
            src={`https://www.google.com/maps?q=${encodeURIComponent(`${BRAND.address.street}, ${BRAND.address.number} - ${BRAND.address.district}, ${BRAND.address.city}, ${BRAND.address.state}`)}&output=embed`}
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  )
}
