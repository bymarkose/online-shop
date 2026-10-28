import {
  Order,
  OrderItem,
  Customer,
  Product,
  LandingPage,
  Campaign,
  OrderStatus,
  OrderStatusHistory,
  CustomerInteraction,
  FollowUpTask,
  ShippingEvent,
  DuplicateFlag,
  AuditLog,
  Settings,
  ApiCredential
} from '../types';
import { normalizeEgyptianPhone } from './phone';
import { calculateLineTotal, calculateOrderTotals, toCents, fromCents } from './money';
import { canTransition, isReasonRequired } from './stateMachine';
import {
  INITIAL_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_LANDING_PAGES,
  INITIAL_CAMPAIGNS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_ORDER_ITEMS,
  INITIAL_STATUS_HISTORY,
  INITIAL_DUPLICATE_FLAGS,
  INITIAL_FOLLOW_UPS,
  INITIAL_SHIPPING_EVENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_API_CREDENTIALS
} from './mockData';

const STORAGE_KEYS = {
  SETTINGS: 'markose_settings_v1',
  PRODUCTS: 'markose_products_v1',
  LANDING_PAGES: 'markose_landing_pages_v1',
  CAMPAIGNS: 'markose_campaigns_v1',
  CUSTOMERS: 'markose_customers_v1',
  ORDERS: 'markose_orders_v1',
  ORDER_ITEMS: 'markose_order_items_v1',
  STATUS_HISTORY: 'markose_status_history_v1',
  DUPLICATE_FLAGS: 'markose_duplicate_flags_v1',
  FOLLOW_UPS: 'markose_follow_ups_v1',
  SHIPPING_EVENTS: 'markose_shipping_events_v1',
  AUDIT_LOGS: 'markose_audit_logs_v1',
  API_CREDENTIALS: 'markose_api_credentials_v1',
  IDEMPOTENCY: 'markose_idempotency_v1',
  ORDER_COUNTER: 'markose_order_counter_2026'
};

type OrderChangeListener = () => void;
const listeners = new Set<OrderChangeListener>();
let notifyPending = false;

function notifyListeners(): void {
  if (notifyPending) return;
  notifyPending = true;
  queueMicrotask(() => {
    notifyPending = false;
    for (const fn of listeners) {
      try {
        fn();
      } catch (e) {
        console.error('Error in OrderService listener:', e);
      }
    }
  });
}

function getStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.error('Storage read error for key:', key, e);
    return fallback;
  }
}

function setStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notifyListeners();
  } catch (e) {
    console.error('Storage write error for key:', key, e);
  }
}

export interface PublicOrderPayload {
  source: {
    landing_page_id: string; // public_id
    campaign_id?: string;    // public_id
  };
  customer: {
    full_name: string;
    phone: string;
    alternate_phone?: string;
    governorate: string;
    city: string;
    address: string;
    address_details?: string;
  };
  items: {
    product_id: string;
    quantity: number;
  }[];
  attribution?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    ad_click_id?: string;
  };
  customer_notes?: string;
  website?: string; // Honeypot field - must be empty!
  captcha_token?: string;
}

export interface PublicOrderResponse {
  success: boolean;
  data?: {
    order_number: string;
    status: OrderStatus;
    total_amount: string;
    currency: string;
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any[];
    request_id?: string;
  };
  idempotentReplay?: boolean;
}

export class OrderService {
  // Get all settings
  static getSettings(): Settings {
    return getStorage<Settings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  static updateSettings(newSettings: Partial<Settings>): Settings {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    setStorage(STORAGE_KEYS.SETTINGS, updated);
    this.logAudit('SETTINGS_UPDATED', 'settings', 'global', current, updated);
    return updated;
  }

  // Get Products
  static getProducts(): Product[] {
    return getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  static saveProduct(product: Partial<Product> & { name: string; current_price: string; sku: string }): Product {
    const products = this.getProducts();
    if (product.id) {
      const idx = products.findIndex(p => p.id === product.id);
      if (idx !== -1) {
        const updated = { ...products[idx], ...product };
        products[idx] = updated;
        setStorage(STORAGE_KEYS.PRODUCTS, products);
        this.logAudit('PRODUCT_UPDATED', 'product', product.id, {}, updated);
        return updated;
      }
    }
    const newProduct: Product = {
      id: 'prod-' + Date.now(),
      name: product.name,
      sku: product.sku.toUpperCase(),
      description: product.description || '',
      current_price: product.current_price,
      currency: 'EGP',
      is_active: product.is_active ?? true,
      image_url: product.image_url || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=500&q=80',
      created_at: new Date().toISOString()
    };
    products.unshift(newProduct);
    setStorage(STORAGE_KEYS.PRODUCTS, products);
    this.logAudit('PRODUCT_CREATED', 'product', newProduct.id, {}, newProduct);
    return newProduct;
  }

  // Get Landing Pages
  static getLandingPages(): LandingPage[] {
    return getStorage<LandingPage[]>(STORAGE_KEYS.LANDING_PAGES, INITIAL_LANDING_PAGES);
  }

  // Get Campaigns
  static getCampaigns(): Campaign[] {
    return getStorage<Campaign[]>(STORAGE_KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
  }

  // Get Customers
  static getCustomers(): Customer[] {
    const customers = getStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const orders = this.getOrders();
    // Compute aggregate customer metrics
    return customers.map(c => {
      const customerOrders = orders.filter(o => o.customer_id === c.id);
      const totalSpentCents = customerOrders.reduce((sum, o) => sum + toCents(o.total_amount), 0);
      const successfulOrders = customerOrders.filter(o => o.status === 'DELIVERED').length;
      const returnedOrders = customerOrders.filter(o => o.status === 'RETURNED').length;
      return {
        ...c,
        total_orders_count: customerOrders.length,
        successful_orders_count: successfulOrders,
        returned_orders_count: returnedOrders,
        total_spent: fromCents(totalSpentCents)
      };
    });
  }

  static toggleCustomerBlacklist(customerId: string, reason?: string): Customer | null {
    const customers = getStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const idx = customers.findIndex(c => c.id === customerId);
    if (idx === -1) return null;

    const current = customers[idx];
    const willBeBlacklisted = !current.is_blacklisted;
    const updated: Customer = {
      ...current,
      is_blacklisted: willBeBlacklisted,
      blacklist_reason: willBeBlacklisted ? (reason || 'إدراج يدوي بواسطة الإدارة لمنع الطلبات الوهمية') : undefined,
      updated_at: new Date().toISOString()
    };
    customers[idx] = updated;
    setStorage(STORAGE_KEYS.CUSTOMERS, customers);

    this.logAudit(
      willBeBlacklisted ? 'CUSTOMER_BLACKLISTED' : 'CUSTOMER_WHITELISTED',
      'customer',
      customerId,
      { is_blacklisted: current.is_blacklisted, blacklist_reason: current.blacklist_reason },
      { is_blacklisted: updated.is_blacklisted, blacklist_reason: updated.blacklist_reason }
    );

    notifyListeners();
    return updated;
  }

  static updateCustomer(customerId: string, updates: Partial<Customer>): Customer | null {
    const customers = getStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const idx = customers.findIndex(c => c.id === customerId);
    if (idx === -1) return null;

    const current = customers[idx];
    const updated: Customer = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString()
    };
    customers[idx] = updated;
    setStorage(STORAGE_KEYS.CUSTOMERS, customers);

    this.logAudit('CUSTOMER_UPDATED', 'customer', customerId, current, updated);
    notifyListeners();
    return updated;
  }

  static saveLandingPage(landingPage: Partial<LandingPage> & { name: string; slug: string; public_id: string }): LandingPage {
    const pages = this.getLandingPages();
    if (landingPage.id) {
      const idx = pages.findIndex(p => p.id === landingPage.id);
      if (idx !== -1) {
        const updated = { ...pages[idx], ...landingPage };
        pages[idx] = updated;
        setStorage(STORAGE_KEYS.LANDING_PAGES, pages);
        this.logAudit('LANDING_PAGE_UPDATED', 'landing_page', landingPage.id, {}, updated);
        notifyListeners();
        return updated;
      }
    }
    const newPage: LandingPage = {
      id: 'lp-' + Date.now(),
      name: landingPage.name,
      slug: landingPage.slug.toLowerCase().trim(),
      public_id: landingPage.public_id || 'lp_pub_' + Math.random().toString(36).substring(2, 9),
      allowed_origins: landingPage.allowed_origins || ['*'],
      default_shipping_fee: landingPage.default_shipping_fee || '50.00',
      captcha_required: landingPage.captcha_required ?? false,
      is_active: landingPage.is_active ?? true,
      products: landingPage.products || [],
      created_at: new Date().toISOString()
    };
    pages.unshift(newPage);
    setStorage(STORAGE_KEYS.LANDING_PAGES, pages);
    this.logAudit('LANDING_PAGE_CREATED', 'landing_page', newPage.id, {}, newPage);
    notifyListeners();
    return newPage;
  }

  static saveCampaign(campaign: Partial<Campaign> & { name: string; landing_page_id: string; public_id: string }): Campaign {
    const campaigns = this.getCampaigns();
    if (campaign.id) {
      const idx = campaigns.findIndex(c => c.id === campaign.id);
      if (idx !== -1) {
        const updated = { ...campaigns[idx], ...campaign };
        campaigns[idx] = updated;
        setStorage(STORAGE_KEYS.CAMPAIGNS, campaigns);
        this.logAudit('CAMPAIGN_UPDATED', 'campaign', campaign.id, {}, updated);
        notifyListeners();
        return updated;
      }
    }
    const newCampaign: Campaign = {
      id: 'cmp-' + Date.now(),
      landing_page_id: campaign.landing_page_id,
      public_id: campaign.public_id || 'cmp_pub_' + Math.random().toString(36).substring(2, 8),
      name: campaign.name,
      utm_source: campaign.utm_source,
      utm_medium: campaign.utm_medium,
      utm_campaign: campaign.utm_campaign,
      utm_content: campaign.utm_content,
      utm_term: campaign.utm_term,
      is_active: campaign.is_active ?? true,
      created_at: new Date().toISOString()
    };
    campaigns.unshift(newCampaign);
    setStorage(STORAGE_KEYS.CAMPAIGNS, campaigns);
    this.logAudit('CAMPAIGN_CREATED', 'campaign', newCampaign.id, {}, newCampaign);
    notifyListeners();
    return newCampaign;
  }


  // Get Orders with relations
  static getOrders(): Order[] {
    const orders = getStorage<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const items = getStorage<OrderItem[]>(STORAGE_KEYS.ORDER_ITEMS, INITIAL_ORDER_ITEMS);
    const customers = getStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const landingPages = this.getLandingPages();
    const campaigns = this.getCampaigns();

    return orders.map(ord => ({
      ...ord,
      customer: customers.find(c => c.id === ord.customer_id),
      items: items.filter(it => it.order_id === ord.id),
      landing_page: landingPages.find(lp => lp.id === ord.landing_page_id),
      campaign: campaigns.find(cmp => cmp.id === ord.campaign_id)
    }));
  }

  static getOrderById(id: string): Order | undefined {
    return this.getOrders().find(o => o.id === id);
  }

  // Get Order Items for a specific order
  static getOrderItems(orderId: string): OrderItem[] {
    const items = getStorage<OrderItem[]>(STORAGE_KEYS.ORDER_ITEMS, INITIAL_ORDER_ITEMS);
    return items.filter(it => it.order_id === orderId);
  }

  // Get Order Status History
  static getStatusHistory(orderId?: string): OrderStatusHistory[] {
    const history = getStorage<OrderStatusHistory[]>(STORAGE_KEYS.STATUS_HISTORY, INITIAL_STATUS_HISTORY);
    if (!orderId) return history;
    return history.filter(h => h.order_id === orderId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Get Follow-up Tasks
  static getFollowUps(): FollowUpTask[] {
    return getStorage<FollowUpTask[]>(STORAGE_KEYS.FOLLOW_UPS, INITIAL_FOLLOW_UPS);
  }

  // Get Duplicate Flags
  static getDuplicateFlags(): DuplicateFlag[] {
    return getStorage<DuplicateFlag[]>(STORAGE_KEYS.DUPLICATE_FLAGS, INITIAL_DUPLICATE_FLAGS);
  }

  // Get Shipping Events
  static getShippingEvents(orderId?: string): ShippingEvent[] {
    const events = getStorage<ShippingEvent[]>(STORAGE_KEYS.SHIPPING_EVENTS, INITIAL_SHIPPING_EVENTS);
    if (!orderId) return events;
    return events.filter(e => e.order_id === orderId).sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime());
  }

  // Get Customer Interactions
  static getInteractions(orderId?: string): CustomerInteraction[] {
    const list = getStorage<CustomerInteraction[]>('markose_interactions_v1', []);
    if (!orderId) return list;
    return list.filter(i => i.order_id === orderId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Get Audit Logs
  static getAuditLogs(): AuditLog[] {
    return getStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Log an Audit Entry (Append-only)
  static logAudit(action: string, entity_type: string, entity_id: string, old_values: any, new_values: any): void {
    const logs = getStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const newEntry: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      user_id: 'owner-admin',
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      request_id: 'req-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    };
    logs.unshift(newEntry);
    setStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Public Order Submission Handler (implements Section 3, Section 7, Section 8.3)
  static createPublicOrder(
    payload: PublicOrderPayload,
    idempotencyKey: string
  ): PublicOrderResponse {
    const requestId = 'req_' + Math.random().toString(36).substring(2, 10);

    // 1. Validate Idempotency Key presence & format
    if (!idempotencyKey || idempotencyKey.length < 10) {
      return {
        success: false,
        error: {
          code: 'IDEMPOTENCY_KEY_REQUIRED',
          message: 'مفتاح عدم التكرار Idempotency-Key مطلوب في الترويسات',
          request_id: requestId
        }
      };
    }

    // Check Idempotency Store
    const idempotencyRecords = getStorage<Record<string, { hash: string; response: any }>>(
      STORAGE_KEYS.IDEMPOTENCY,
      {}
    );

    // Hash representation
    const requestHash = JSON.stringify({
      landing_page: payload.source?.landing_page_id,
      phone: payload.customer?.phone,
      items: payload.items?.map(it => ({ id: it.product_id, q: it.quantity })).sort((a, b) => a.id.localeCompare(b.id))
    });

    if (idempotencyRecords[idempotencyKey]) {
      const record = idempotencyRecords[idempotencyKey];
      if (record.hash === requestHash) {
        // Idempotent Replay! Return original response with Idempotent-Replay header flag
        return {
          ...record.response,
          idempotentReplay: true
        };
      } else {
        // Reused key with different payload => 409 Conflict
        return {
          success: false,
          error: {
            code: 'IDEMPOTENCY_KEY_REUSED',
            message: 'تم استخدام نفس مفتاح Idempotency-Key ببيانات مختلفة',
            request_id: requestId
          }
        };
      }
    }

    // 2. Honeypot check: website field must be empty
    if (payload.website && payload.website.trim().length > 0) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'تم رفض الطلب بواسطة نظام الحماية التلقائي',
          request_id: requestId
        }
      };
    }

    // 3. Resolve Landing Page
    const landingPages = this.getLandingPages();
    const landingPage = landingPages.find(
      lp => lp.public_id === payload.source.landing_page_id && lp.is_active
    );

    if (!landingPage) {
      return {
        success: false,
        error: {
          code: 'LANDING_PAGE_NOT_FOUND',
          message: 'صفحة الهبوط غير موجودة أو معطلة',
          request_id: requestId
        }
      };
    }

    // 4. Validate CAPTCHA if required
    if (landingPage.captcha_required && !payload.captcha_token) {
      return {
        success: false,
        error: {
          code: 'CAPTCHA_FAILED',
          message: 'التحقق من كابتشا مطلوب لإتمام الطلب من هذه الصفحة',
          request_id: requestId
        }
      };
    }

    // 5. Customer Data Validation & Phone Normalization
    if (!payload.customer?.full_name || payload.customer.full_name.trim().length < 2) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'الاسم بالكامل مطلوب ويجب ألا يقل عن حرفين',
          details: [{ field: 'customer.full_name', message: 'الاسم غير صالح' }],
          request_id: requestId
        }
      };
    }

    const phoneResult = normalizeEgyptianPhone(payload.customer.phone);
    if (!phoneResult.isValid) {
      return {
        success: false,
        error: {
          code: 'INVALID_PHONE',
          message: phoneResult.error || 'رقم الهاتف غير صالح',
          details: [{ field: 'customer.phone', code: 'INVALID_PHONE', message: phoneResult.error }],
          request_id: requestId
        }
      };
    }

    if (!payload.customer.governorate) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'يرجى اختيار المحافظة',
          details: [{ field: 'customer.governorate', message: 'المحافظة مطلوبة' }],
          request_id: requestId
        }
      };
    }

    if (!payload.customer.address || payload.customer.address.trim().length < 5) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'العنوان التفصيلي مطلوب للتوصيل',
          details: [{ field: 'customer.address', message: 'العنوان قصير جدًا' }],
          request_id: requestId
        }
      };
    }

    // 6. Validate Items & Server-side Pricing
    if (!payload.items || payload.items.length === 0) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'يجب اختيار منتج واحد على الأقل',
          request_id: requestId
        }
      };
    }

    const allProducts = this.getProducts();
    const resolvedItems: {
      product: Product;
      quantity: number;
      unitPrice: string;
      lineTotal: string;
    }[] = [];

    // Merge duplicate product items
    const mergedMap = new Map<string, number>();
    for (const it of payload.items) {
      const current = mergedMap.get(it.product_id) || 0;
      mergedMap.set(it.product_id, current + Math.max(1, it.quantity));
    }

    for (const [prodId, qty] of mergedMap.entries()) {
      const product = allProducts.find(p => p.id === prodId && p.is_active);
      if (!product) {
        return {
          success: false,
          error: {
            code: 'PRODUCT_NOT_AVAILABLE',
            message: `أحد المنتجات المختارة غير متوفر أو معطل`,
            request_id: requestId
          }
        };
      }

      // Check if product is associated with landing page
      const pageProduct = landingPage.products.find(p => p.product_id === product.id);
      const unitPrice = pageProduct?.price_override || product.current_price;
      const maxQty = pageProduct?.max_quantity || 10;
      const finalQty = Math.min(qty, maxQty);
      const lineTotal = calculateLineTotal(unitPrice, finalQty, '0');

      resolvedItems.push({
        product,
        quantity: finalQty,
        unitPrice,
        lineTotal
      });
    }

    // Calculate totals (shipping from landing page)
    const shippingFee = landingPage.default_shipping_fee;
    const totals = calculateOrderTotals(
      resolvedItems.map(it => ({ unit_price: it.unitPrice, quantity: it.quantity })),
      '0',
      shippingFee
    );

    // 7. Resolve Campaign (Optional Attribution)
    let matchedCampaign: Campaign | undefined;
    if (payload.source.campaign_id) {
      matchedCampaign = this.getCampaigns().find(
        c => c.public_id === payload.source.campaign_id && c.is_active
      );
    }

    // 8. Find or Create Customer by normalized_phone
    const customers = getStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    let customer = customers.find(c => c.normalized_phone === phoneResult.e164);
    if (!customer) {
      customer = {
        id: 'cust-' + Date.now(),
        full_name: payload.customer.full_name.trim(),
        phone: phoneResult.localPhone,
        normalized_phone: phoneResult.e164,
        governorate: payload.customer.governorate,
        city: payload.customer.city || '',
        address: payload.customer.address.trim(),
        alternate_phone: payload.customer.alternate_phone || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_orders_count: 0,
        total_spent: '0.00'
      };
      customers.push(customer);
    } else {
      // Update customer address info
      customer.governorate = payload.customer.governorate;
      if (payload.customer.city) customer.city = payload.customer.city;
      customer.address = payload.customer.address.trim();
      customer.updated_at = new Date().toISOString();
    }
    setStorage(STORAGE_KEYS.CUSTOMERS, customers);

    // 9. Allocate Order Number sequentially: ORD-2026-XXXXXX
    const currentCounter = getStorage<number>(STORAGE_KEYS.ORDER_COUNTER, 21);
    const nextCounter = currentCounter + 1;
    setStorage(STORAGE_KEYS.ORDER_COUNTER, nextCounter);
    const orderNumber = `ORD-2026-${nextCounter.toString().padStart(6, '0')}`;
    const newOrderId = 'ord-' + Date.now();

    // 10. Duplicate Detection (Level 2 Human Review Trigger)
    // Rule: Same normalized phone + shares at least 1 product + created within 72h window + status not CANCELLED or RETURNED
    const existingOrders = this.getOrders();
    const settings = this.getSettings();
    const windowMs = settings.duplicate_window_hours * 60 * 60 * 1000;
    const now = Date.now();

    let duplicateReviewStatus: Order['duplicate_review_status'] = 'NONE';
    let matchedOrderId: string | undefined;

    const incomingProductIds = resolvedItems.map(it => it.product.id);

    const potentialDuplicate = existingOrders.find(o => {
      if (o.ship_phone !== phoneResult.localPhone && o.customer?.normalized_phone !== phoneResult.e164) {
        return false;
      }
      if (o.status === 'CANCELLED' || o.status === 'RETURNED') {
        return false;
      }
      const orderAge = now - new Date(o.created_at).getTime();
      if (orderAge > windowMs) {
        return false;
      }
      // Check shared products
      const orderItems = this.getOrderItems(o.id);
      const hasSharedProduct = orderItems.some(it => incomingProductIds.includes(it.product_id));
      return hasSharedProduct;
    });

    if (potentialDuplicate) {
      duplicateReviewStatus = 'PENDING_REVIEW';
      matchedOrderId = potentialDuplicate.id;

      // Add duplicate flag record
      const duplicateFlags = getStorage<DuplicateFlag[]>(STORAGE_KEYS.DUPLICATE_FLAGS, INITIAL_DUPLICATE_FLAGS);
      duplicateFlags.unshift({
        id: 'dup-' + Date.now(),
        order_id: newOrderId,
        matched_order_id: potentialDuplicate.id,
        status: 'PENDING',
        note: `تطابق في رقم الهاتف (+${phoneResult.e164}) ومنتجات مشتركة خلال ${settings.duplicate_window_hours} ساعة مع الطلب ${potentialDuplicate.order_number}`,
        created_at: new Date().toISOString()
      });
      setStorage(STORAGE_KEYS.DUPLICATE_FLAGS, duplicateFlags);

      // Auto schedule follow up task
      const followUps = getStorage<FollowUpTask[]>(STORAGE_KEYS.FOLLOW_UPS, INITIAL_FOLLOW_UPS);
      followUps.unshift({
        id: 'tsk-' + Date.now(),
        order_id: newOrderId,
        order_number: orderNumber,
        customer_name: customer.full_name,
        customer_phone: customer.phone,
        task_type: 'مراجعة طلب محتمل تكراره',
        due_at: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
        status: 'OPEN',
        note: `التحقق مع العميل من الطلب ${orderNumber} والطلب السابق ${potentialDuplicate.order_number}`,
        created_at: new Date().toISOString()
      });
      setStorage(STORAGE_KEYS.FOLLOW_UPS, followUps);
    }

    // 11. Create Order with Immutable Snapshots
    const newOrder: Order = {
      id: newOrderId,
      order_number: orderNumber,
      customer_id: customer.id,
      landing_page_id: landingPage.id,
      campaign_id: matchedCampaign?.id,
      status: 'NEW',
      subtotal: totals.subtotal,
      discount_amount: totals.discount_amount,
      shipping_fee: totals.shipping_fee,
      total_amount: totals.total_amount,
      currency: settings.default_currency,
      
      // Address snapshot
      ship_name: customer.full_name,
      ship_phone: phoneResult.localPhone,
      ship_alt_phone: payload.customer.alternate_phone || '',
      ship_governorate: payload.customer.governorate,
      ship_city: payload.customer.city || '',
      ship_address: payload.customer.address.trim(),
      ship_address_details: payload.customer.address_details || '',

      // Attribution
      utm_source: payload.attribution?.utm_source || matchedCampaign?.utm_source,
      utm_medium: payload.attribution?.utm_medium || matchedCampaign?.utm_medium,
      utm_campaign: payload.attribution?.utm_campaign || matchedCampaign?.utm_campaign,
      utm_content: payload.attribution?.utm_content || matchedCampaign?.utm_content,
      utm_term: payload.attribution?.utm_term || matchedCampaign?.utm_term,
      ad_click_id: payload.attribution?.ad_click_id,
      customer_notes: payload.customer_notes || '',

      idempotency_key: idempotencyKey,
      duplicate_review_status: duplicateReviewStatus,
      matched_order_id: matchedOrderId,
      version: 1,
      is_test: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save Order
    const orders = getStorage<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    orders.unshift(newOrder);
    setStorage(STORAGE_KEYS.ORDERS, orders);

    // Save Order Items with snapshots
    const itemsList = getStorage<OrderItem[]>(STORAGE_KEYS.ORDER_ITEMS, INITIAL_ORDER_ITEMS);
    for (const it of resolvedItems) {
      itemsList.push({
        id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        order_id: newOrderId,
        product_id: it.product.id,
        product_name_snapshot: it.product.name,
        sku_snapshot: it.product.sku,
        unit_price_snapshot: it.unitPrice,
        quantity: it.quantity,
        line_discount: '0.00',
        line_total: it.lineTotal
      });
    }
    setStorage(STORAGE_KEYS.ORDER_ITEMS, itemsList);

    // Initial Status History Log
    const historyList = getStorage<OrderStatusHistory[]>(STORAGE_KEYS.STATUS_HISTORY, INITIAL_STATUS_HISTORY);
    historyList.unshift({
      id: 'hist-' + Date.now(),
      order_id: newOrderId,
      from_status: undefined,
      to_status: 'NEW',
      reason: `تم إنشاء الطلب بنجاح عبر صفحة الهبوط: ${landingPage.name}`,
      changed_by: 'Public Checkout API',
      created_at: new Date().toISOString()
    });
    setStorage(STORAGE_KEYS.STATUS_HISTORY, historyList);

    // Audit Log
    this.logAudit('ORDER_CREATED', 'order', newOrderId, null, {
      order_number: orderNumber,
      customer: customer.full_name,
      total_amount: totals.total_amount,
      phone: phoneResult.e164
    });

    // 12. Save Idempotency Record
    const responsePayload: PublicOrderResponse = {
      success: true,
      data: {
        order_number: orderNumber,
        status: 'NEW',
        total_amount: totals.total_amount,
        currency: settings.default_currency,
        message: 'تم استلام طلبك بنجاح، وسنتواصل معك قريبًا لتأكيد الشحن'
      }
    };

    idempotencyRecords[idempotencyKey] = {
      hash: requestHash,
      response: responsePayload
    };
    setStorage(STORAGE_KEYS.IDEMPOTENCY, idempotencyRecords);

    return responsePayload;
  }

  // State Machine Transition Handler
  static transitionOrderStatus(
    orderId: string,
    targetStatus: OrderStatus,
    reason?: string,
    shippingDetails?: { carrier_name: string; tracking_number?: string },
    expectedVersion?: number
  ): { success: boolean; error?: string; order?: Order } {
    const orders = getStorage<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      return { success: false, error: 'الطلب غير موجود' };
    }

    const order = orders[orderIndex];

    // Optimistic Concurrency Check
    if (expectedVersion !== undefined && order.version !== expectedVersion) {
      return {
        success: false,
        error: 'STATE_CONFLICT: لقد تم تحديث بيانات هذا الطلب من قبل شخص آخر، يرجى إعادة تحميل الصفحة'
      };
    }

    // State Machine Check
    if (!canTransition(order.status, targetStatus)) {
      return {
        success: false,
        error: `INVALID_TRANSITION: لا يمكن الانتقال من حالة ${order.status} إلى ${targetStatus}`
      };
    }

    // Reason validation
    if (isReasonRequired(targetStatus, order.status) && (!reason || reason.trim().length === 0)) {
      return {
        success: false,
        error: 'سبب التعديل إلزامي لهذه الحالة'
      };
    }

    // Shipping info validation
    if (targetStatus === 'SHIPPED') {
      if (!shippingDetails?.carrier_name || shippingDetails.carrier_name.trim().length === 0) {
        return {
          success: false,
          error: 'اسم شركة الشحن مطلوب عند تغيير حالة الطلب إلى (تم الشحن)'
        };
      }
    }

    const oldStatus = order.status;
    const nowIso = new Date().toISOString();

    // Set first-arrival timestamps
    const updatedOrder: Order = {
      ...order,
      status: targetStatus,
      version: order.version + 1,
      updated_at: nowIso
    };

    if (targetStatus === 'CONFIRMED' && !order.confirmed_at) {
      updatedOrder.confirmed_at = nowIso;
    } else if (targetStatus === 'SHIPPED') {
      if (!order.shipped_at) updatedOrder.shipped_at = nowIso;
      if (shippingDetails) {
        updatedOrder.carrier_name = shippingDetails.carrier_name;
        updatedOrder.tracking_number = shippingDetails.tracking_number || '';
      }
    } else if (targetStatus === 'DELIVERED' && !order.delivered_at) {
      updatedOrder.delivered_at = nowIso;
    } else if (targetStatus === 'CANCELLED' && !order.cancelled_at) {
      updatedOrder.cancelled_at = nowIso;
    } else if (targetStatus === 'RETURNED' && !order.returned_at) {
      updatedOrder.returned_at = nowIso;
    }

    orders[orderIndex] = updatedOrder;
    setStorage(STORAGE_KEYS.ORDERS, orders);

    // Log to Status History
    const historyList = getStorage<OrderStatusHistory[]>(STORAGE_KEYS.STATUS_HISTORY, INITIAL_STATUS_HISTORY);
    historyList.unshift({
      id: 'hist-' + Date.now(),
      order_id: order.id,
      from_status: oldStatus,
      to_status: targetStatus,
      reason: reason || 'تحديث حالة الطلب عبر لوحة التحكم',
      changed_by: 'مالك المتجر (Admin)',
      created_at: nowIso
    });
    setStorage(STORAGE_KEYS.STATUS_HISTORY, historyList);

    // Follow-up task automation
    const settings = this.getSettings();
    const followUps = getStorage<FollowUpTask[]>(STORAGE_KEYS.FOLLOW_UPS, INITIAL_FOLLOW_UPS);

    if (targetStatus === 'CONTACT_ATTEMPTED') {
      // Schedule follow up in 4 hours
      followUps.unshift({
        id: 'tsk-' + Date.now(),
        order_id: order.id,
        order_number: order.order_number,
        customer_name: order.ship_name,
        customer_phone: order.ship_phone,
        task_type: 'إعادة محاولة اتصال بالعميل',
        due_at: new Date(Date.now() + settings.follow_up_attempt_delay_hours * 60 * 60 * 1000).toISOString(),
        status: 'OPEN',
        note: `محاولة اتصال مسجلة: ${reason || 'لم يرد العميل'}`,
        created_at: nowIso
      });
      setStorage(STORAGE_KEYS.FOLLOW_UPS, followUps);
    } else if (targetStatus === 'UNREACHABLE') {
      // Schedule follow up in 24 hours
      followUps.unshift({
        id: 'tsk-' + Date.now(),
        order_id: order.id,
        order_number: order.order_number,
        customer_name: order.ship_name,
        customer_phone: order.ship_phone,
        task_type: 'متابعة طلب متعذر الوصول (واتساب)',
        due_at: new Date(Date.now() + settings.follow_up_unreachable_delay_hours * 60 * 60 * 1000).toISOString(),
        status: 'OPEN',
        note: `تعذر الوصول بعد المحاولات القصوى: ${reason || ''}`,
        created_at: nowIso
      });
      setStorage(STORAGE_KEYS.FOLLOW_UPS, followUps);
    } else if (['CONFIRMED', 'CANCELLED', 'DELIVERED', 'RETURNED'].includes(targetStatus)) {
      // Auto close open tasks for this order
      let updatedAny = false;
      const updatedFollowUps = followUps.map(t => {
        if (t.order_id === order.id && t.status === 'OPEN') {
          updatedAny = true;
          return {
            ...t,
            status: 'COMPLETED' as const,
            completed_at: nowIso,
            note: `${t.note || ''} (أغلقت تلقائيًا لتحول الطلب إلى ${targetStatus})`
          };
        }
        return t;
      });
      if (updatedAny) {
        setStorage(STORAGE_KEYS.FOLLOW_UPS, updatedFollowUps);
      }
    }

    // Shipping Event
    if (targetStatus === 'SHIPPED' && shippingDetails) {
      const shippingEvents = getStorage<ShippingEvent[]>(STORAGE_KEYS.SHIPPING_EVENTS, INITIAL_SHIPPING_EVENTS);
      shippingEvents.unshift({
        id: 'shp-' + Date.now(),
        order_id: order.id,
        carrier_name: shippingDetails.carrier_name,
        tracking_number: shippingDetails.tracking_number,
        event_type: 'DISPATCHED',
        note: `تم الشحن مع شركة ${shippingDetails.carrier_name} - بوليصة ${shippingDetails.tracking_number || 'بدون رقم'}`,
        event_at: nowIso,
        created_by: 'مالك المتجر (Admin)'
      });
      setStorage(STORAGE_KEYS.SHIPPING_EVENTS, shippingEvents);
    }

    // Audit Log
    this.logAudit('ORDER_STATUS_CHANGE', 'order', order.id, { status: oldStatus }, { status: targetStatus, reason });

    return { success: true, order: updatedOrder };
  }

  // Log customer call or message interaction
  static logInteraction(
    orderId: string,
    customerId: string,
    type: CustomerInteraction['interaction_type'],
    note: string,
    outcome?: string
  ): CustomerInteraction {
    const interactions = getStorage<CustomerInteraction[]>('markose_interactions_v1', []);
    const newInteraction: CustomerInteraction = {
      id: 'int-' + Date.now(),
      customer_id: customerId,
      order_id: orderId,
      user_id: 'owner-admin',
      interaction_type: type,
      outcome: outcome || '',
      note: note || '',
      created_at: new Date().toISOString()
    };
    interactions.unshift(newInteraction);
    setStorage('markose_interactions_v1', interactions);

    this.logAudit('INTERACTION_LOGGED', 'customer_interaction', newInteraction.id, null, newInteraction);
    return newInteraction;
  }

  // Duplicate Flag Resolution
  static resolveDuplicateFlag(
    flagId: string,
    resolution: 'KEPT' | 'CANCELLED_AS_DUPLICATE',
    note: string
  ): { success: boolean; error?: string } {
    const flags = getStorage<DuplicateFlag[]>(STORAGE_KEYS.DUPLICATE_FLAGS, INITIAL_DUPLICATE_FLAGS);
    const flagIndex = flags.findIndex(f => f.id === flagId);
    if (flagIndex === -1) return { success: false, error: 'سجل التكرار غير موجود' };

    const flag = flags[flagIndex];
    const nowIso = new Date().toISOString();

    flag.status = resolution;
    flag.resolved_by = 'مالك المتجر (Admin)';
    flag.resolved_at = nowIso;
    flag.note = (flag.note ? flag.note + '\n' : '') + `قرار المراجعة: ${resolution === 'KEPT' ? 'ليس مكررًا (احتفاظ)' : 'مكرر (إلغاء الطلب)'} - ${note}`;
    setStorage(STORAGE_KEYS.DUPLICATE_FLAGS, flags);

    // Update the order's duplicate_review_status
    const orders = getStorage<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const orderIndex = orders.findIndex(o => o.id === flag.order_id);
    if (orderIndex !== -1) {
      orders[orderIndex].duplicate_review_status = resolution;
      setStorage(STORAGE_KEYS.ORDERS, orders);

      if (resolution === 'CANCELLED_AS_DUPLICATE') {
        // Cancel the order via State Machine
        this.transitionOrderStatus(
          flag.order_id,
          'CANCELLED',
          `إلغاء كطلب مكرر بعد المراجعة البشرية: ${note}`
        );
      }
    }

    this.logAudit('DUPLICATE_FLAG_RESOLVED', 'duplicate_flag', flagId, null, { resolution, note });
    return { success: true };
  }

  // Follow-up task completion
  static completeFollowUpTask(taskId: string, note?: string): void {
    const followUps = getStorage<FollowUpTask[]>(STORAGE_KEYS.FOLLOW_UPS, INITIAL_FOLLOW_UPS);
    const idx = followUps.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      followUps[idx].status = 'COMPLETED';
      followUps[idx].completed_at = new Date().toISOString();
      if (note) followUps[idx].note = (followUps[idx].note ? followUps[idx].note + ' - ' : '') + note;
      setStorage(STORAGE_KEYS.FOLLOW_UPS, followUps);
      this.logAudit('FOLLOW_UP_COMPLETED', 'follow_up_task', taskId, null, followUps[idx]);
    }
  }

  // Safe CSV Exporter with Formula Injection Escaping and UTF-8 BOM
  static exportOrdersCSV(orders: Order[]): string {
    const headers = [
      'رقم الطلب',
      'تاريخ الإنشاء',
      'حالة الطلب',
      'اسم العميل',
      'الهاتف',
      'المحافظة',
      'المدينة',
      'العنوان',
      'الإجمالي الفرعي',
      'الخصم',
      'الشحن',
      'الإجمالي النهائي',
      'العملة',
      'شركة الشحن',
      'رقم التتبع',
      'مصدر الحملة (UTM Source)',
      'اسم الحملة (UTM Campaign)',
      'حالة فحص التكرار'
    ];

    const sanitize = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).trim();
      // Escape Formula Injection: prepending single quote if starts with =, +, -, @, \t, \r
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = orders.map(o => [
      sanitize(o.order_number),
      sanitize(new Date(o.created_at).toLocaleString('ar-EG')),
      sanitize(o.status),
      sanitize(o.ship_name),
      sanitize(o.ship_phone),
      sanitize(o.ship_governorate),
      sanitize(o.ship_city),
      sanitize(o.ship_address),
      sanitize(o.subtotal),
      sanitize(o.discount_amount),
      sanitize(o.shipping_fee),
      sanitize(o.total_amount),
      sanitize(o.currency),
      sanitize(o.carrier_name || '-'),
      sanitize(o.tracking_number || '-'),
      sanitize(o.utm_source || '-'),
      sanitize(o.utm_campaign || '-'),
      sanitize(o.duplicate_review_status)
    ]);

    // Prepend UTF-8 BOM \uFEFF for Excel compatibility
    return '\uFEFF' + [headers.map(sanitize).join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  // Batch order status transition
  static batchTransitionOrders(
    orderIds: string[],
    targetStatus: OrderStatus,
    options?: {
      reason?: string;
      carrier_name?: string;
      tracking_number?: string;
    }
  ): { successCount: number; errors: { id: string; error: string }[] } {
    let successCount = 0;
    const errors: { id: string; error: string }[] = [];

    for (const id of orderIds) {
      const res = this.transitionOrderStatus(
        id,
        targetStatus,
        options?.reason || (targetStatus === 'CONFIRMED' ? 'تأكيد جماعي للطلبات المحددة' : undefined),
        options?.carrier_name ? { carrier_name: options.carrier_name, tracking_number: options.tracking_number } : undefined
      );
      if (res.success) {
        successCount++;
      } else {
        errors.push({ id, error: res.error || 'فشل التحديث' });
      }
    }

    return { successCount, errors };
  }

  // API Credentials Management (Section 11)
  static getApiCredentials(): ApiCredential[] {
    return getStorage<ApiCredential[]>(STORAGE_KEYS.API_CREDENTIALS, INITIAL_API_CREDENTIALS);
  }

  static createApiCredential(
    landingPageId: string,
    label: string,
    scopes: string[] = ['orders:create']
  ): { credential: ApiCredential; rawSecret: string } {
    const creds = this.getApiCredentials();
    const randBytes = typeof window !== 'undefined' && window.crypto
      ? Array.from(window.crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, '0')).join('')
      : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    
    const rawSecret = 'mk_live_' + randBytes;
    const secretHash = 'sha256_' + rawSecret.substring(8, 24);
    const pubKey = 'mk_pub_' + Math.random().toString(36).substring(2, 10);

    const newCred: ApiCredential = {
      id: 'cred-' + Date.now().toString(36),
      landing_page_id: landingPageId,
      public_key_id: pubKey,
      secret_hash: secretHash,
      label: label.trim(),
      scopes,
      is_active: true,
      created_at: new Date().toISOString()
    };

    creds.unshift(newCred);
    setStorage(STORAGE_KEYS.API_CREDENTIALS, creds);
    this.logAudit('API_CREDENTIAL_CREATED', 'api_credential', newCred.id, null, {
      landing_page_id: landingPageId,
      label,
      scopes
    });

    return { credential: newCred, rawSecret };
  }

  static revokeApiCredential(id: string): void {
    const creds = this.getApiCredentials();
    const target = creds.find(c => c.id === id);
    if (target) {
      target.is_active = false;
      setStorage(STORAGE_KEYS.API_CREDENTIALS, creds);
      this.logAudit('API_CREDENTIAL_REVOKED', 'api_credential', id, null, { label: target.label });
    }
  }

  // Reset to initial seed state
  static resetToSeedData(): void {
    localStorage.clear();
    setStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    setStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setStorage(STORAGE_KEYS.LANDING_PAGES, INITIAL_LANDING_PAGES);
    setStorage(STORAGE_KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
    setStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    setStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    setStorage(STORAGE_KEYS.ORDER_ITEMS, INITIAL_ORDER_ITEMS);
    setStorage(STORAGE_KEYS.STATUS_HISTORY, INITIAL_STATUS_HISTORY);
    setStorage(STORAGE_KEYS.DUPLICATE_FLAGS, INITIAL_DUPLICATE_FLAGS);
    setStorage(STORAGE_KEYS.FOLLOW_UPS, INITIAL_FOLLOW_UPS);
    setStorage(STORAGE_KEYS.SHIPPING_EVENTS, INITIAL_SHIPPING_EVENTS);
    setStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    setStorage(STORAGE_KEYS.API_CREDENTIALS, INITIAL_API_CREDENTIALS);
    setStorage(STORAGE_KEYS.ORDER_COUNTER, 21);
    setStorage(STORAGE_KEYS.IDEMPOTENCY, {});
  }

  // Subscribe to changes
  static subscribe(listener: OrderChangeListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
}
