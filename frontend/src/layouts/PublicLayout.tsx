import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { MobileNav } from '@/components/MobileNav'
import { AuthModal } from '@/components/AuthModal'
import { WhatsAppFab } from '@/components/WhatsAppFab'
import { CookieConsent } from '@/components/CookieConsent'
import { ToastContainer } from '@/components/ui/Toast'

export function PublicLayout() {
  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <AuthModal />
      <WhatsAppFab />
      <CookieConsent />
      <ToastContainer />
      <ScrollRestoration />
    </div>
  )
}
