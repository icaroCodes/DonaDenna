import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { PublicLayout } from '@/layouts/PublicLayout'

const Home              = lazy(() => import('@/pages/Home'))
const Catalog           = lazy(() => import('@/pages/Catalog'))
const Product           = lazy(() => import('@/pages/Product'))
const Cart              = lazy(() => import('@/pages/Cart'))
const Checkout          = lazy(() => import('@/pages/Checkout'))
const OrderConfirmation = lazy(() => import('@/pages/OrderConfirmation'))
const CookiePolicy      = lazy(() => import('@/pages/CookiePolicy'))
const Account           = lazy(() => import('@/pages/account/Account'))
const Overview          = lazy(() => import('@/pages/account/Overview'))
const Orders            = lazy(() => import('@/pages/account/Orders'))
const Addresses         = lazy(() => import('@/pages/account/Addresses'))
const Favorites         = lazy(() => import('@/pages/account/Favorites'))

function Boundary({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="container-page py-20 text-neutral-400 text-sm">Carregando…</div>}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/',                element: <Boundary><Home /></Boundary> },
      { path: '/loja',            element: <Boundary><Catalog /></Boundary> },
      { path: '/produto/:id',     element: <Boundary><Product /></Boundary> },
      { path: '/carrinho',        element: <Boundary><Cart /></Boundary> },
      { path: '/checkout',        element: <Boundary><Checkout /></Boundary> },
      { path: '/pedido/:id',      element: <Boundary><OrderConfirmation /></Boundary> },
      { path: '/cookie-policy',   element: <Boundary><CookiePolicy /></Boundary> },
      {
        path: '/conta',
        element: <Boundary><Account /></Boundary>,
        children: [
          { index: true,          element: <Boundary><Overview /></Boundary> },
          { path: 'pedidos',      element: <Boundary><Orders /></Boundary> },
          { path: 'enderecos',    element: <Boundary><Addresses /></Boundary> },
          { path: 'favoritos',    element: <Boundary><Favorites /></Boundary> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
