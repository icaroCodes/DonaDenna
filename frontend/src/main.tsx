import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { AuthModalProvider } from '@/contexts/AuthModalContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { router } from '@/routes/router'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthModalProvider>
        <FavoritesProvider>
          <CartProvider>
            <ToastProvider>
              <RouterProvider router={router} />
            </ToastProvider>
          </CartProvider>
        </FavoritesProvider>
      </AuthModalProvider>
    </AuthProvider>
  </React.StrictMode>,
)
