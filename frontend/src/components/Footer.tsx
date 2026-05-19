import { Link } from 'react-router-dom'
import { Instagram, MessageCircle, MapPin, ArrowUpRight, Clock } from 'lucide-react'
import { Logo } from './ui/Logo'
import { BRAND } from '@/lib/brand'

export function Footer() {
  return (
    <footer className="bg-cream/50 border-t border-mocha-100 mt-12 md:mt-16">
      {/* ──────────────── DESKTOP ──────────────── */}
      <div className="hidden md:grid container-page py-14 gap-10 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-mocha-600 max-w-xs leading-relaxed">
            {BRAND.about.short}
          </p>
          <div className="mt-5 flex gap-2">
            <SocialLink href={BRAND.instagram.url} Icon={Instagram} label={BRAND.instagram.handle} />
            <SocialLink href={BRAND.whatsapp.linkWithMessage} Icon={MessageCircle} label="WhatsApp" />
          </div>
        </div>

        <div>
          <p className="label-eyebrow mb-4">Loja</p>
          <ul className="space-y-2.5 text-sm text-mocha-700">
            <li><Link to="/loja" className="hover:text-mocha-900">Todos os produtos</Link></li>
            <li><Link to="/loja?category=conjunto" className="hover:text-mocha-900">Conjuntos</Link></li>
            <li><Link to="/loja?category=blusa" className="hover:text-mocha-900">Blusas</Link></li>
            <li><Link to="/loja?category=acessorio" className="hover:text-mocha-900">Acessórios</Link></li>
          </ul>
        </div>

        <div>
          <p className="label-eyebrow mb-4">Ajuda</p>
          <ul className="space-y-2.5 text-sm text-mocha-700">
            <li><Link to="/conta/pedidos" className="hover:text-mocha-900">Meus pedidos</Link></li>
            <li><Link to="/loja" className="hover:text-mocha-900">Entrega e frete</Link></li>
            <li><Link to="/loja" className="hover:text-mocha-900">Trocas e devoluções</Link></li>
            <li>
              <a href={BRAND.whatsapp.linkWithMessage} target="_blank" rel="noopener noreferrer" className="hover:text-mocha-900">
                Fale conosco
              </a>
            </li>
          </ul>
        </div>

        <div className="text-sm text-mocha-700 space-y-4">
          <div>
            <p className="label-eyebrow mb-2 flex items-center gap-1.5"><MapPin size={11} /> Loja física</p>
            <p className="text-mocha-900 font-medium leading-snug">
              {BRAND.address.street}, {BRAND.address.number}
            </p>
            <p className="text-mocha-600 leading-relaxed">
              {BRAND.address.district} · {BRAND.address.city}/{BRAND.address.state}<br/>
              <span className="text-xs">{BRAND.hours[0].day}: {BRAND.hours[0].value} · Sáb: {BRAND.hours[1].value}</span>
            </p>
          </div>
          <div className="text-xs text-mocha-600">
            <a href={BRAND.whatsapp.linkWithMessage} target="_blank" rel="noopener noreferrer" className="hover:text-mocha-900">
              <strong className="text-mocha-900">WhatsApp:</strong> {BRAND.whatsapp.display}
            </a>
            <span className="block mt-1 text-pix-600 font-medium">{BRAND.hoursNote}</span>
          </div>
        </div>
      </div>

      {/* ──────────────── MOBILE ──────────────── */}
      <div className="md:hidden">
        {/* CTA Hero — atendimento WhatsApp */}
        <div className="container-page pt-10">
          <a
            href={BRAND.whatsapp.linkWithMessage}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-3xl bg-mocha-900 text-cream p-6 active:scale-[0.98] transition"
          >
            <div className="flex items-start gap-4">
              <span className="rounded-full bg-cream/10 p-3">
                <MessageCircle size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-cream/60">Atendimento humanizado</p>
                <p className="mt-1 h-display text-2xl">Bora conversar?</p>
                <p className="mt-1 text-[12px] text-cream/70 leading-relaxed">
                  Estamos online no WhatsApp em qualquer horário.
                </p>
              </div>
              <ArrowUpRight size={18} className="text-cream/70 mt-2" />
            </div>
          </a>
        </div>

        {/* Marca */}
        <div className="container-page pt-8">
          <Logo />
          <p className="mt-3 text-[13.5px] text-mocha-600 leading-relaxed">
            {BRAND.about.short}
          </p>
          <div className="mt-4 flex gap-2">
            <SocialLink href={BRAND.instagram.url} Icon={Instagram} label={BRAND.instagram.handle} />
            <SocialLink href={BRAND.whatsapp.linkWithMessage} Icon={MessageCircle} label="WhatsApp" />
          </div>
        </div>

        {/* Links em 2 colunas */}
        <div className="container-page pt-8 grid grid-cols-2 gap-x-6 gap-y-8">
          <div>
            <p className="label-eyebrow mb-3">Loja</p>
            <ul className="space-y-2 text-[13.5px] text-mocha-700">
              <li><Link to="/loja" className="hover:text-mocha-900">Produtos</Link></li>
              <li><Link to="/loja?category=conjunto" className="hover:text-mocha-900">Conjuntos</Link></li>
              <li><Link to="/loja?category=blusa" className="hover:text-mocha-900">Blusas</Link></li>
              <li><Link to="/loja?category=acessorio" className="hover:text-mocha-900">Acessórios</Link></li>
            </ul>
          </div>
          <div>
            <p className="label-eyebrow mb-3">Ajuda</p>
            <ul className="space-y-2 text-[13.5px] text-mocha-700">
              <li><Link to="/conta/pedidos" className="hover:text-mocha-900">Meus pedidos</Link></li>
              <li><Link to="/loja" className="hover:text-mocha-900">Entrega</Link></li>
              <li><Link to="/loja" className="hover:text-mocha-900">Trocas</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-mocha-900">Privacidade</Link></li>
            </ul>
          </div>
        </div>

        {/* Card de endereço */}
        <div className="container-page pt-8">
          <div className="rounded-2xl border border-mocha-100 bg-paper p-5">
            <p className="label-eyebrow flex items-center gap-1.5"><MapPin size={11} /> Loja física</p>
            <p className="mt-2 text-[14px] font-medium text-mocha-900 leading-snug">
              {BRAND.address.street}, {BRAND.address.number}
            </p>
            <p className="text-[12.5px] text-mocha-600">
              {BRAND.address.district} · {BRAND.address.city}/{BRAND.address.state}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-mocha-700">
              <Clock size={11} className="text-mocha-400" />
              Seg–Sex {BRAND.hours[0].value} · Sáb {BRAND.hours[1].value}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${BRAND.address.street}, ${BRAND.address.number} - ${BRAND.address.district}, ${BRAND.address.city}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-mocha-900 underline-offset-4 hover:underline"
            >
              Ver no mapa <ArrowUpRight size={12} />
            </a>
          </div>
        </div>

        {/* Selo de confiança */}
        <div className="container-page pt-6 pb-2 text-center">
          <p className="h-display italic text-mocha-700 text-lg">
            +{BRAND.yearsInMarket} anos vestindo o Brasil.
          </p>
        </div>
      </div>

      {/* ──────────────── RODAPÉ FINAL ──────────────── */}
      <div className="border-t border-mocha-100 mt-8 md:mt-0">
        <div className="container-page py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] md:text-xs text-mocha-500 text-center md:text-left">
          <span>© {new Date().getFullYear()} {BRAND.name}. Todos os direitos reservados.</span>
          <span>PIX · Cartão (até 5x) · Boleto</span>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ href, Icon, label }: { href: string; Icon: any; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="rounded-full border border-mocha-200 bg-paper p-2.5 text-mocha-700 hover:bg-mocha-900 hover:border-mocha-900 hover:text-cream transition"
    >
      <Icon size={15} />
    </a>
  )
}
