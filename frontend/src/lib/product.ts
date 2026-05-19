import type { Product, ProductVariant, VariantImage } from '@/types/catalog'

export function effectivePrice(product: Product, variant?: ProductVariant | null) {
  if (variant?.price_override != null) return Number(variant.price_override)
  return Number(product.sale_price || 0)
}

export function totalStock(product: Product) {
  return (product.product_variants || []).reduce((s, v) => s + Number(v.stock || 0), 0)
}

export function primaryImage(product: Product, variant?: ProductVariant | null): string | null {
  // 1) variant_images is_primary, 2) variant.image_url, 3) variant.color_image_url
  // 4) qualquer variant_image, 5) qualquer outra variante com imagem.
  if (variant) {
    const primary = variant.variant_images?.find((i) => i.is_primary) || variant.variant_images?.[0]
    if (primary?.image_url) return primary.image_url
    if (variant.image_url) return variant.image_url
    if (variant.color_image_url) return variant.color_image_url
  }
  for (const v of product.product_variants || []) {
    const p = v.variant_images?.find((i) => i.is_primary) || v.variant_images?.[0]
    if (p?.image_url) return p.image_url
    if (v.image_url) return v.image_url
    if (v.color_image_url) return v.color_image_url
  }
  return null
}

export function galleryImages(product: Product, variant?: ProductVariant | null): VariantImage[] {
  if (variant?.variant_images?.length) {
    return [...variant.variant_images].sort((a, b) => a.display_order - b.display_order)
  }
  // sem variant: pega da primeira variante que tiver imagens
  const v = (product.product_variants || []).find((v) => v.variant_images?.length)
  return v?.variant_images ? [...v.variant_images].sort((a, b) => a.display_order - b.display_order) : []
}

export interface ColorOption {
  color: string
  color_hex: string | null
  variants: ProductVariant[]   // todas as variantes dessa cor (uma por tamanho)
  image_url: string | null
}

export function colorOptions(product: Product): ColorOption[] {
  const map = new Map<string, ColorOption>()
  for (const v of product.product_variants || []) {
    if (!v.color) continue
    const key = v.color
    if (!map.has(key)) {
      map.set(key, {
        color: v.color,
        color_hex: v.color_hex || null,
        variants: [],
        image_url: v.color_image_url || v.image_url || null,
      })
    }
    const entry = map.get(key)!
    entry.variants.push(v)
    if (!entry.image_url && (v.color_image_url || v.image_url)) {
      entry.image_url = v.color_image_url || v.image_url || null
    }
  }
  return [...map.values()]
}

export function sizeOptions(product: Product, color?: string | null): { size: string; variant: ProductVariant }[] {
  const list: { size: string; variant: ProductVariant }[] = []
  const seen = new Set<string>()
  for (const v of product.product_variants || []) {
    if (color && v.color !== color) continue
    if (!v.size) continue
    if (seen.has(v.size)) continue
    seen.add(v.size)
    list.push({ size: v.size, variant: v })
  }
  return list
}

export function findVariant(product: Product, color?: string | null, size?: string | null): ProductVariant | null {
  return (product.product_variants || []).find((v) =>
    (color == null || v.color === color) && (size == null || v.size === size),
  ) || null
}
