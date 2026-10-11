// Shapes returned by the public API (/api/catalogue). No customer data is ever included.

export interface ContentBlock {
  title: string;
  body: string;
  image_url: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Variant {
  id: string;
  label: string;
  price_paise: number;
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  category_slug: string | null;
  category_name: string | null;
  ingredients_text: string | null;
  allergen_text: string | null;
  storage_text: string | null;
  shelf_life_text: string | null;
  preparation_text: string | null;
  price_note: string | null;
  featured: boolean;
  variants: Variant[];
  images: ProductImage[];
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  youtube_id: string;
  youtube_url: string;
  thumbnail_url: string | null;
  description: string;
  related_product_slug: string | null;
  featured: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
}

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  caption: string;
  section: string;
}

export interface Catalogue {
  generated_at: string;
  content: Record<string, ContentBlock>;
  categories: Category[];
  products: Product[];
  videos: Video[];
  banners: Banner[];
  gallery: GalleryImage[];
}

export type ReceivingMethod = "delhivery" | "vendor_pickup" | "friend_handover";

export interface OrderRequestResult {
  reference: string;
  product_only_subtotal_paise: number;
  items: {
    product_name: string;
    variant_label: string;
    unit_price_paise: number;
    quantity: number;
    line_total_paise: number;
  }[];
  message: string;
}
