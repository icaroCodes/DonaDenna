import { Link } from 'react-router-dom'
import { ArrowLeft, Cookie, Settings, Shield, BarChart3 } from 'lucide-react'
import { BRAND } from '@/lib/brand'

export default function CookiePolicyPage() {
  return (
    <div className="container-page py-10 md:py-16 max-w-3xl">
      <Link to="/" className="btn-link mb-8"><ArrowLeft size={14} /> Voltar para o início</Link>

      <header>
        <div className="inline-flex items-center justify-center rounded-full bg-cream border border-mocha-100 p-3">
          <Cookie size={22} className="text-mocha-700" />
        </div>
        <p className="label-eyebrow mt-6">Política de Cookies</p>
        <h1 className="mt-2 h-display text-4xl md:text-5xl text-mocha-900">
          Como a DonaDenna usa cookies.
        </h1>
        <p className="mt-4 text-[15px] text-mocha-600 leading-relaxed max-w-2xl">
          Esta página explica, de forma clara, o que são cookies, por que usamos e o controle que você tem sobre eles. Última atualização em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
        </p>
      </header>

      <section className="mt-12 space-y-10 text-[15px] leading-relaxed text-mocha-700">
        <Block title="O que são cookies?">
          <p>
            Cookies são pequenos arquivos de texto que ficam guardados no seu navegador quando você visita um site. Eles ajudam o site a lembrar de você na próxima vez — preferências, itens no carrinho, se você já fez login, e por aí vai.
          </p>
          <p>
            Não são vírus. Não acessam outros arquivos do seu computador. São só um caderninho de anotações que cada site mantém pra te oferecer uma experiência melhor.
          </p>
        </Block>

        <Block title="Tipos de cookies que usamos">
          <div className="grid sm:grid-cols-2 gap-3">
            <Card icon={Shield} title="Essenciais">
              Necessários para o site funcionar — login, carrinho, segurança. Sem eles, você não consegue fazer um pedido. Esses não dá pra desativar.
            </Card>
            <Card icon={Settings} title="Preferências">
              Lembram suas escolhas — endereços salvos, modo de exibição, favoritos. Tornam sua próxima visita mais rápida.
            </Card>
            <Card icon={BarChart3} title="Análise">
              Nos contam, de forma anônima, quais páginas são mais visitadas e como você navega pelo site. Usamos esses dados pra entender o que melhorar.
            </Card>
            <Card icon={Cookie} title="Marketing">
              Permitem mostrar conteúdos e promoções relevantes em outros sites e redes sociais. Só ativamos se você aceitar.
            </Card>
          </div>
        </Block>

        <Block title="Como você controla">
          <p>
            Quando você visita o site pela primeira vez, perguntamos se aceita cookies opcionais (preferências, análise e marketing). Os essenciais ficam sempre ativos porque o site precisa deles.
          </p>
          <p>
            Você pode mudar de ideia a qualquer momento limpando os cookies do navegador. Aí a gente pergunta de novo na próxima visita.
          </p>
          <p className="text-mocha-600 text-sm">
            Em Chrome: <em>Configurações → Privacidade e segurança → Cookies</em>.<br/>
            Em Safari: <em>Preferências → Privacidade → Gerenciar dados do site</em>.
          </p>
        </Block>

        <Block title="Cookies de terceiros">
          <p>
            Alguns parceiros que ajudam a loja a funcionar também colocam cookies — por exemplo, o serviço de pagamento e ferramentas de análise. Cada um tem sua própria política, mas nós só trabalhamos com fornecedores que respeitam a LGPD.
          </p>
        </Block>

        <Block title="Seus direitos (LGPD)">
          <p>
            Você tem direito a saber quais dados pessoais a gente coleta, pedir uma cópia, corrigir, ou pedir a exclusão. É só falar com a gente — respondemos rápido pelo WhatsApp.
          </p>
        </Block>

        <Block title="Dúvidas?">
          <p>
            Fala com a gente pelos canais oficiais:
          </p>
          <ul className="mt-2 space-y-1">
            <li>
              <a href={BRAND.whatsapp.linkWithMessage} target="_blank" rel="noopener noreferrer" className="text-mocha-900 underline-offset-4 hover:underline">
                WhatsApp · {BRAND.whatsapp.display}
              </a>
            </li>
            <li>
              <a href={BRAND.instagram.url} target="_blank" rel="noopener noreferrer" className="text-mocha-900 underline-offset-4 hover:underline">
                Instagram · {BRAND.instagram.handle}
              </a>
            </li>
            <li className="text-mocha-600">
              {BRAND.address.street}, {BRAND.address.number} · {BRAND.address.district} · {BRAND.address.city}/{BRAND.address.state}
            </li>
          </ul>
        </Block>
      </section>

      <footer className="mt-14 border-t border-mocha-100 pt-8 text-xs text-mocha-500">
        © {new Date().getFullYear()} {BRAND.name} · {BRAND.yearsInMarket} anos no mercado.
      </footer>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="h-display text-2xl md:text-3xl text-mocha-900">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  )
}

function Card({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-mocha-100 bg-cream/40 p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-paper border border-mocha-100 p-2">
          <Icon size={15} className="text-mocha-700" />
        </span>
        <p className="text-[14px] font-semibold text-mocha-900">{title}</p>
      </div>
      <p className="mt-3 text-[13.5px] text-mocha-600 leading-relaxed">{children}</p>
    </div>
  )
}
