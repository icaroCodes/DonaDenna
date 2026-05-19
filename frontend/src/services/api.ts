import { supabase } from './supabase'
import type {
  Product, ShippingQuoteResult, ShopperAddress, Customer, Order,
} from '@/types/catalog'

const BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001'

async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  if (auth) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) {
    const msg = body?.error || `Erro ${res.status}`
    throw new Error(msg)
  }
  return body as T
}

// ─── STOREFRONT ───────────────────────────────────────────────────────────────
export const getCategoriesApi = () =>
  request<{ slug: string; name: string; subcategories?: any[] }[]>('/storefront/categories')

export const listProducts = (params: Record<string, string | number | undefined> = {}) => {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  const q = qs.toString()
  return request<{ products: Product[]; page: number; limit: number }>(
    `/storefront/products${q ? `?${q}` : ''}`,
  )
}

export const getProduct = (id: string) =>
  request<Product>(`/storefront/products/${id}`)

export const getFeatured = () =>
  request<{ products: Product[] }>('/storefront/featured')

export const getBestsellers = () =>
  request<{ products: Product[] }>('/storefront/bestsellers')

export const searchProducts = (q: string) =>
  request<{ products: Product[] }>(`/storefront/search?q=${encodeURIComponent(q)}`)

export const quoteShipping = (body: { destination_cep: string; items: { variant_id: string; quantity: number }[] }) =>
  request<ShippingQuoteResult>('/storefront/shipping/quote', { method: 'POST', body: JSON.stringify(body) })

export const getStore = () =>
  request<{ origin: ShippingQuoteResult['origin'] }>('/storefront/store')

export interface SiteHeroSlide {
  image_url: string             // desktop / fallback
  image_url_mobile?: string     // versão para telas pequenas (≤ 640px)
  alt?: string
  href?: string
}
export interface SiteShort { embed_url?: string; thumb_url?: string }
export interface SiteContent {
  hero_slides?: SiteHeroSlide[]
  hero_video?: { embed_url?: string; thumb_url?: string; title?: string }
  shorts?: SiteShort[]
  store_photo?: { image_url?: string }
}
export const getSiteContent = () => request<SiteContent>('/storefront/site')

// ─── SHOPPER (auth) ───────────────────────────────────────────────────────────
export const getMe = () =>
  request<{ user: { id: string; email: string }; customer: Customer }>('/shopper/me', {}, true)

export const updateMe = (body: Partial<Customer>) =>
  request<Customer>('/shopper/me', { method: 'PUT', body: JSON.stringify(body) }, true)

export const listAddresses = () =>
  request<ShopperAddress[]>('/shopper/addresses', {}, true)

export const createAddress = (body: Omit<ShopperAddress, 'id' | 'customer_id' | 'created_at'>) =>
  request<ShopperAddress>('/shopper/addresses', { method: 'POST', body: JSON.stringify(body) }, true)

export const updateAddress = (id: string, body: Partial<ShopperAddress>) =>
  request<ShopperAddress>(`/shopper/addresses/${id}`, { method: 'PUT', body: JSON.stringify(body) }, true)

export const deleteAddress = (id: string) =>
  request<void>(`/shopper/addresses/${id}`, { method: 'DELETE' }, true)

export const listFavorites = () =>
  request<any[]>('/shopper/favorites', {}, true)

export const addFavorite = (product_id: string) =>
  request<any>('/shopper/favorites', { method: 'POST', body: JSON.stringify({ product_id }) }, true)

export const removeFavorite = (product_id: string) =>
  request<void>(`/shopper/favorites/${product_id}`, { method: 'DELETE' }, true)

export const bulkAddFavorites = (product_ids: string[]) =>
  request<{ imported: number }>('/shopper/favorites/bulk', {
    method: 'POST', body: JSON.stringify({ product_ids }),
  }, true)

// ─── Carrinho salvo na conta ─────────────────────────────────────────────────
export interface SavedCartRow { id: string; variant_id: string; quantity: number; snapshot: any | null; updated_at: string }
export interface SavedCartItemInput { variant_id: string; quantity: number; snapshot?: any }

export const getSavedCart = () =>
  request<SavedCartRow[]>('/shopper/cart', {}, true)

export const saveCart = (items: SavedCartItemInput[]) =>
  request<{ saved: number }>('/shopper/cart', {
    method: 'PUT', body: JSON.stringify({ items }),
  }, true)

export const mergeCart = (items: SavedCartItemInput[]) =>
  request<{ merged: number }>('/shopper/cart/merge', {
    method: 'POST', body: JSON.stringify({ items }),
  }, true)

// ─── ORDERS (auth) ────────────────────────────────────────────────────────────
export interface CreateOrderPayload {
  items: { variant_id: string; quantity: number }[]
  payment_method: 'pix' | 'card' | 'boleto'
  notes?: string
  delivery: {
    mode: 'pickup' | 'shipping'
    provider?: string
    service?: string
    amount?: number
    eta_min_days?: number
    eta_max_days?: number
    address_id?: string
    // address inline (caso não tenha address_id)
    recipient?: string
    cep?: string
    street?: string
    number?: string
    complement?: string
    district?: string
    city?: string
    state?: string
    phone?: string
  }
}

export const createOrder = (body: CreateOrderPayload) =>
  request<Order>('/orders', { method: 'POST', body: JSON.stringify(body) }, true)

export const listOrders = () =>
  request<Order[]>('/orders', {}, true)

export const getOrder = (id: string) =>
  request<Order>(`/orders/${id}`, {}, true)
