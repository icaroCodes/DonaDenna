// Tipos espelhados das tabelas do ERP (campos públicos apenas).

export interface VariantImage {
  id: string
  image_url: string
  color?: string | null
  color_hex?: string | null
  display_order: number
  is_primary: boolean
}

export interface ProductVariant {
  id: string
  product_id: string
  label: string
  size?: string | null
  color?: string | null
  color_hex?: string | null
  stock: number
  price_override?: number | null
  image_url?: string | null
  color_image_url?: string | null
  variant_images?: VariantImage[]
}

export interface Product {
  id: string
  name: string
  description?: string | null
  category?: string | null
  category_slug?: string | null
  subcategory_slug?: string | null
  sale_price: number
  stock: number
  sizes?: string | null
  created_at: string
  // Promoção (todas as formas de pagamento)
  promo_active?: boolean
  promo_type?: 'percentage' | 'fixed_price' | null
  promo_percentage?: number | null
  promo_price?: number | null
  promo_start_date?: string | null
  promo_end_date?: string | null
  promo_indefinite?: boolean | null
  // Desconto exclusivo no PIX (default 5%)
  pix_active?: boolean
  pix_type?: 'percentage' | 'fixed_price' | null
  pix_percentage?: number | null
  pix_price?: number | null
  pix_start_date?: string | null
  pix_end_date?: string | null
  pix_indefinite?: boolean | null
  product_variants: ProductVariant[]
}

export interface Category {
  slug: string
  name: string
  subcategories?: Category[]
}

export interface ShippingOption {
  provider: 'pickup' | 'local' | 'correios' | 'melhor_envio' | string
  service: string
  mode: 'pickup' | 'shipping'
  amount: number
  eta_min_days: number
  eta_max_days: number
  notes?: string
}

export interface ShippingQuoteResult {
  options: ShippingOption[]
  local_eligible: boolean
  origin: {
    name: string; street: string; number: string; district: string
    city: string; state: string; country: string; cep: string
  }
}

export interface ShopperAddress {
  id: string
  customer_id: string
  label?: string | null
  recipient: string
  cep: string
  street: string
  number: string
  complement?: string | null
  district: string
  city: string
  state: string
  phone?: string | null
  is_default: boolean
  created_at: string
}

export interface Customer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  cpf?: string | null
}

export interface OrderItem {
  id: string
  product_id: string | null
  variant_id: string | null
  product_name: string
  variant_label?: string
  quantity: number
  unit_price: number
  subtotal: number
  product_variants?: { image_url?: string | null; color_image_url?: string | null }
}

export interface OrderDelivery {
  id: string
  mode: 'pickup' | 'shipping'
  provider?: string | null
  service?: string | null
  amount: number
  eta_min_days?: number | null
  eta_max_days?: number | null
  status: string
  recipient?: string | null
  cep?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  district?: string | null
  city?: string | null
  state?: string | null
  tracking_code?: string | null
}

export interface Order {
  id: string
  customer_name: string
  sale_date: string
  payment_method: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  status: 'paid' | 'partial' | 'pending'
  channel: 'pos' | 'online' | string
  created_at: string
  sale_items: OrderItem[]
  sale_deliveries?: OrderDelivery[]
}
