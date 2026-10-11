export interface AdminMe {
  id: string;
  email: string;
  role: string;
  mfa_enabled: boolean;
  last_login_at: string | null;
}

export interface NotificationOut {
  channel: string;
  status: string;
  attempted_at: string;
  error_message: string | null;
}

export type OrderStatus = "new" | "contacted" | "confirmed_by_vendor" | "declined" | "completed" | "spam";
export type EnquiryStatus = "new" | "contacted" | "responded" | "closed" | "spam";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed_by_vendor: "Confirmed by vendor",
  declined: "Declined",
  completed: "Completed",
  spam: "Spam",
};

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  responded: "Responded",
  closed: "Closed",
  spam: "Spam",
};

export const RECEIVING_LABELS: Record<string, string> = {
  delhivery: "Delhivery courier",
  vendor_pickup: "Collect from maker",
  friend_handover: "Friend / known person",
};

export interface AdminOrderRequest {
  id: string;
  public_reference: string;
  customer_whatsapp_number: string;
  delivery_pincode: string;
  receiving_method: string;
  status: OrderStatus;
  product_only_subtotal_paise: number;
  customer_message: string | null;
  privacy_notice_version: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  retention_review_at: string;
  items: {
    product_id: string | null;
    variant_id: string | null;
    product_name_snapshot: string;
    variant_label_snapshot: string;
    unit_price_paise_snapshot: number;
    quantity: number;
    line_total_paise: number;
  }[];
  notifications: NotificationOut[];
}

export interface AdminEnquiry {
  id: string;
  public_reference: string;
  customer_name: string | null;
  phone_number: string;
  product_id: string | null;
  product_name_snapshot: string | null;
  quantity_interest: string | null;
  preferred_contact_time: string | null;
  message: string | null;
  privacy_notice_version: string;
  status: EnquiryStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  retention_review_at: string;
  notifications: NotificationOut[];
}

export interface Page<T> {
  items: T[];
  total: number;
}

export interface DashboardStats {
  new_orders: number;
  new_enquiries: number;
  orders_last_30_days: number;
  enquiries_last_30_days: number;
  due_for_retention_review: number;
  failed_notifications_7_days: number;
  media_used_mb: number;
  media_quota_mb: number;
  email_configured: boolean;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visible: boolean;
  display_order: number;
}

export interface AdminVariant {
  id?: string;
  label: string;
  price_paise: number;
  visible: boolean;
}

export interface AdminImage {
  id?: string;
  image_url: string;
  alt_text: string;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  category_id: string | null;
  ingredients_text: string | null;
  allergen_text: string | null;
  storage_text: string | null;
  shelf_life_text: string | null;
  preparation_text: string | null;
  price_note: string | null;
  visible: boolean;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  variants: AdminVariant[];
  images: AdminImage[];
}

export interface AdminVideo {
  id: string;
  title: string;
  youtube_url: string;
  youtube_id: string;
  thumbnail_url: string | null;
  description: string;
  related_product_id: string | null;
  visible: boolean;
  featured: boolean;
  display_order: number;
}

export interface AdminBanner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  visible: boolean;
  display_order: number;
}

export interface AdminGallery {
  id: string;
  image_url: string;
  alt_text: string;
  caption: string;
  section: string;
  visible: boolean;
  display_order: number;
}

export interface ContentField {
  key: string;
  label: string;
  group: string;
  kind: "text" | "textarea" | "bool" | "image";
  public: boolean;
  help: string;
  has_image: boolean;
  title: string;
  body: string;
  image_url: string | null;
  updated_at: string | null;
}

export interface UploadOut {
  url: string;
  path: string;
  width: number;
  height: number;
  size_kb: number;
}

export interface AuditEvent {
  id: string;
  actor_admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  timestamp: string;
  metadata_text: string | null;
}
