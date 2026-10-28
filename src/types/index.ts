export type OrderStatus =
  | 'NEW'
  | 'CONTACT_PENDING'
  | 'CONTACT_ATTEMPTED'
  | 'UNREACHABLE'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED';

export type DuplicateReviewStatus = 'NONE' | 'PENDING_REVIEW' | 'KEPT' | 'CANCELLED_AS_DUPLICATE';

export type FollowUpStatus = 'OPEN' | 'COMPLETED' | 'CANCELLED';

export type InteractionType =
  | 'CALL_ANSWERED'
  | 'CALL_NO_ANSWER'
  | 'CALL_BUSY'
  | 'WHATSAPP_SENT'
  | 'CUSTOMER_NOTE';

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  normalized_phone: string;
  governorate: string;
  city: string;
  address: string;
  alternate_phone?: string;
  created_at: string;
  updated_at: string;
  total_orders_count?: number;
  total_spent?: string;
  successful_orders_count?: number;
  returned_orders_count?: number;
  is_blacklisted?: boolean;
  blacklist_reason?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  current_price: string;
  currency: string;
  is_active: boolean;
  image_url?: string;
  created_at: string;
}

export interface LandingPageProduct {
  product_id: string;
  price_override?: string;
  is_default: boolean;
  max_quantity: number;
  sort_order: number;
}

export interface LandingPage {
  id: string;
  name: string;
  slug: string;
  public_id: string;
  allowed_origins: string[];
  default_shipping_fee: string;
  captcha_required: boolean;
  is_active: boolean;
  products: LandingPageProduct[];
  created_at: string;
}

export interface Campaign {
  id: string;
  landing_page_id: string;
  public_id: string;
  name: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  is_active: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_snapshot: string;
  quantity: number;
  line_discount: string;
  line_total: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  landing_page_id: string;
  campaign_id?: string;
  status: OrderStatus;
  subtotal: string;
  discount_amount: string;
  shipping_fee: string;
  total_amount: string;
  currency: string;
  
  // Delivery address snapshot
  ship_name: string;
  ship_phone: string;
  ship_alt_phone?: string;
  ship_governorate: string;
  ship_city: string;
  ship_address: string;
  ship_address_details?: string;
  
  // Attribution & Notes
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ad_click_id?: string;
  customer_notes?: string;
  
  // Idempotency & Duplicate Review
  idempotency_key: string;
  duplicate_review_status: DuplicateReviewStatus;
  matched_order_id?: string;
  
  // Concurrency & flags
  version: number;
  is_test: boolean;
  
  // Timestamps (Africa/Cairo presented, stored ISO UTC)
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  returned_at?: string;
  
  // Shipping details
  carrier_name?: string;
  tracking_number?: string;

  // Populated relations in UI
  customer?: Customer;
  items?: OrderItem[];
  landing_page?: LandingPage;
  campaign?: Campaign;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status?: OrderStatus;
  to_status: OrderStatus;
  reason?: string;
  changed_by: string;
  created_at: string;
}

export interface CustomerInteraction {
  id: string;
  customer_id: string;
  order_id: string;
  user_id: string;
  interaction_type: InteractionType;
  outcome?: string;
  note?: string;
  created_at: string;
}

export interface FollowUpTask {
  id: string;
  order_id: string;
  order_number?: string;
  customer_name?: string;
  customer_phone?: string;
  assigned_to?: string;
  task_type: string;
  due_at: string;
  status: FollowUpStatus;
  note?: string;
  completed_at?: string;
  created_at: string;
}

export interface ShippingEvent {
  id: string;
  order_id: string;
  carrier_name: string;
  tracking_number?: string;
  event_type: 'DISPATCHED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED' | 'FAILED_ATTEMPT';
  note?: string;
  event_at: string;
  created_by: string;
}

export interface DuplicateFlag {
  id: string;
  order_id: string;
  matched_order_id: string;
  status: 'PENDING' | 'KEPT' | 'CANCELLED_AS_DUPLICATE';
  resolved_by?: string;
  resolved_at?: string;
  note?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  request_id: string;
  created_at: string;
}

export interface Settings {
  default_currency: string;
  duplicate_window_hours: number;
  max_contact_attempts: number;
  follow_up_attempt_delay_hours: number;
  follow_up_unreachable_delay_hours: number;
  return_window_days: number;
  default_shipping_fee: string;
  store_name: string;
  contact_phone: string;
  zone_shipping_fees?: Record<string, string>;
}

export interface ApiCredential {
  id: string;
  landing_page_id: string;
  public_key_id: string;
  secret_hash: string;
  label: string;
  scopes: string[];
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

export interface UserSession {
  user_id: string;
  email: string;
  display_name: string;
  token: string;
  is_authenticated: boolean;
  expires_at: string;
}

