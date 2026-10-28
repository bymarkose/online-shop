import {
  Customer,
  Product,
  LandingPage,
  Campaign,
  Order,
  OrderItem,
  OrderStatusHistory,
  CustomerInteraction,
  FollowUpTask,
  ShippingEvent,
  DuplicateFlag,
  AuditLog,
  Settings,
  ApiCredential
} from '../types';

export const INITIAL_SETTINGS: Settings = {
  store_name: 'ماركوس - للتجارة الإلكترونية والمنتجات الجلدية',
  contact_phone: '01012345678',
  default_currency: 'EGP',
  duplicate_window_hours: 72,
  max_contact_attempts: 3,
  follow_up_attempt_delay_hours: 4,
  follow_up_unreachable_delay_hours: 24,
  return_window_days: 14,
  default_shipping_fee: '50.00',
  zone_shipping_fees: {
    'cairo_giza': '45.00',
    'alex_delta': '55.00',
    'canal': '60.00',
    'upper_egypt': '75.00',
    'frontier_redsea': '95.00'
  }
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'حذاء كلاسيك جلد طبيعي إيطالي أسود',
    sku: 'SHOE-OXF-BLK',
    description: 'حذاء رسمي مصنوع يدويًا من أنقى أنواع الجلد الطبيعي مع نعل مرن مريح طوال اليوم',
    current_price: '1450.00',
    currency: 'EGP',
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=500&q=80',
    created_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'prod-002',
    name: 'حقيبة يد وكتف رجالية جلد طبيعي هافان',
    sku: 'BAG-CRB-BRN',
    description: 'حقيبة متعددة الجيوب مزودة بمكان مخصص للتابلت والهاتف، خياطة متينة ومقاومة للماء',
    current_price: '1890.00',
    currency: 'EGP',
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=500&q=80',
    created_at: '2026-09-05T09:30:00Z'
  },
  {
    id: 'prod-003',
    name: 'قميص أكسفورد كتان فاخر كاجوال كحلي',
    sku: 'SHT-OXF-NVY',
    description: 'خامة كتان أكسفورد ناعمة ومناسبة لكافة المناسبات الرسمية والكاجوال بتطريز أنيق',
    current_price: '650.00',
    currency: 'EGP',
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=500&q=80',
    created_at: '2026-09-10T11:00:00Z'
  },
  {
    id: 'prod-004',
    name: 'حزام جلد طبيعي دبل فيس أسود وبني',
    sku: 'BLT-REV-DBL',
    description: 'توكة قابلة للدوران للاستخدام على الوجهين الأسود والبني، جلد بقري أصلي 100%',
    current_price: '380.00',
    currency: 'EGP',
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=500&q=80',
    created_at: '2026-09-12T14:15:00Z'
  },
  {
    id: 'prod-005',
    name: 'ساعة كرونوغراف ستانلس ستيل مقاومة للماء',
    sku: 'WTC-CHR-SLV',
    description: 'ماكينة يابانية دقيقة مع زجاج ياقوتي مضاد للخدش وسوار معدني من الصلب غير القابل للصدأ',
    current_price: '2100.00',
    currency: 'EGP',
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=500&q=80',
    created_at: '2026-09-15T16:00:00Z'
  },
  {
    id: 'prod-006',
    name: 'محفظة كروت ونقود جلد طبيعي نحيفة',
    sku: 'WLT-SLM-TAN',
    description: 'تصميم فائق النحافة مع تقنية حماية RFID ضد سرقة البيانات والبطاقات الائتمانية',
    current_price: '290.00',
    currency: 'EGP',
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=500&q=80',
    created_at: '2026-09-20T10:00:00Z'
  }
];

export const INITIAL_LANDING_PAGES: LandingPage[] = [
  {
    id: 'lp-001',
    name: 'صفحة عروض الأحذية الرسمية الكلاسيكية',
    slug: 'classic-shoes-offer',
    public_id: 'lp_sho_7Hk2mQ',
    allowed_origins: ['https://shop.markose.eg', 'https://markose.eg', 'http://localhost:3000'],
    default_shipping_fee: '45.00',
    captcha_required: false,
    is_active: true,
    products: [
      { product_id: 'prod-001', is_default: true, max_quantity: 5, sort_order: 1 },
      { product_id: 'prod-004', is_default: false, max_quantity: 3, sort_order: 2 }
    ],
    created_at: '2026-09-25T10:00:00Z'
  },
  {
    id: 'lp-002',
    name: 'صفحة الشنط والجلود الطبيعية VIP',
    slug: 'luxury-leather-bags',
    public_id: 'lp_bag_3Rx9wP',
    allowed_origins: ['https://shop.markose.eg', 'https://markose.eg', 'http://localhost:3000'],
    default_shipping_fee: '50.00',
    captcha_required: false,
    is_active: true,
    products: [
      { product_id: 'prod-002', is_default: true, max_quantity: 4, sort_order: 1 },
      { product_id: 'prod-006', is_default: false, max_quantity: 5, sort_order: 2 }
    ],
    created_at: '2026-09-28T12:00:00Z'
  },
  {
    id: 'lp-003',
    name: 'صفحة باقة الأناقة الرجالية المتكاملة',
    slug: 'vip-gentleman-bundle',
    public_id: 'lp_vip_9Yt4aL',
    allowed_origins: ['https://shop.markose.eg', 'https://markose.eg', 'http://localhost:3000'],
    default_shipping_fee: '0.00', // Free shipping on bundle
    captcha_required: true,
    is_active: true,
    products: [
      { product_id: 'prod-001', is_default: true, max_quantity: 2, sort_order: 1 },
      { product_id: 'prod-003', is_default: true, max_quantity: 2, sort_order: 2 },
      { product_id: 'prod-005', is_default: false, max_quantity: 1, sort_order: 3 }
    ],
    created_at: '2026-10-01T15:30:00Z'
  }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp-001',
    landing_page_id: 'lp-001',
    public_id: 'cmp_fb_wtr_01',
    name: 'حملة فيسبوك - خصومات الشتاء الكلاسيكية',
    utm_source: 'facebook',
    utm_medium: 'cpc',
    utm_campaign: 'winter_oxford_shoes',
    utm_content: 'video_unboxing_dark',
    utm_term: 'leather_shoes_egypt',
    is_active: true,
    created_at: '2026-10-05T08:00:00Z'
  },
  {
    id: 'cmp-002',
    landing_page_id: 'lp-002',
    public_id: 'cmp_tt_fsh_02',
    name: 'حملة تيك توك ريلز - تريند الشنط الإيطالية',
    utm_source: 'tiktok',
    utm_medium: 'video',
    utm_campaign: 'bag_trend_oct',
    utm_content: 'ugc_styling_demo',
    is_active: true,
    created_at: '2026-10-08T09:00:00Z'
  },
  {
    id: 'cmp-003',
    landing_page_id: 'lp-003',
    public_id: 'cmp_ig_str_03',
    name: 'حملة انستغرام ستوري - باقة الـ VIP',
    utm_source: 'instagram',
    utm_medium: 'story',
    utm_campaign: 'vip_bundle_men',
    utm_content: 'carousel_3slides',
    is_active: true,
    created_at: '2026-10-12T11:00:00Z'
  },
  {
    id: 'cmp-004',
    landing_page_id: 'lp-001',
    public_id: 'cmp_gg_src_04',
    name: 'حملة بحث جوجل - أحذية جلد طبيعي مصراوي',
    utm_source: 'google',
    utm_medium: 'search',
    utm_campaign: 'search_intent_shoes',
    utm_term: 'احذية جلد طبيعي رجالي مصر',
    is_active: true,
    created_at: '2026-10-15T14:00:00Z'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    full_name: 'طارق عبد المنعم الشافعي',
    phone: '01099887766',
    normalized_phone: '+201099887766',
    governorate: 'الدقهلية',
    city: 'المنصورة',
    address: 'شارع المشاية السفلية، بجوار جزيرة الورد، برج الأندلس، الدور 4',
    alternate_phone: '01155443322',
    created_at: '2026-10-26T14:20:00Z',
    updated_at: '2026-10-27T08:00:00Z',
    total_orders_count: 2,
    total_spent: '2995.00'
  },
  {
    id: 'cust-002',
    full_name: 'محمود سامي العدوي',
    phone: '01200112233',
    normalized_phone: '+201200112233',
    governorate: 'القاهرة',
    city: 'مدينة نصر',
    address: 'شارع الطيران، أمام فندق سونستا، عمارة 42 شقة 6',
    alternate_phone: '',
    created_at: '2026-09-12T10:00:00Z',
    updated_at: '2026-10-25T16:00:00Z',
    total_orders_count: 3,
    total_spent: '5870.00'
  },
  {
    id: 'cust-003',
    full_name: 'إسلام عصام عبد الحليم',
    phone: '01023456789',
    normalized_phone: '+201023456789',
    governorate: 'الجيزة',
    city: 'الدقي',
    address: 'شارع مصدق، تقاطع شارع محيي الدين أبو العز، برج الصفا',
    created_at: '2026-10-27T10:15:00Z',
    updated_at: '2026-10-27T10:15:00Z',
    total_orders_count: 1,
    total_spent: '1940.00'
  },
  {
    id: 'cust-004',
    full_name: 'يوسف شريف النجار',
    phone: '01123456780',
    normalized_phone: '+201123456780',
    governorate: 'الإسكندرية',
    city: 'سموحة',
    address: 'شارع فوزي معاذ، أمام نادي سموحة، عمارة الأطباء',
    created_at: '2026-10-24T12:00:00Z',
    updated_at: '2026-10-27T09:00:00Z',
    total_orders_count: 1,
    total_spent: '2150.00'
  },
  {
    id: 'cust-005',
    full_name: 'كريم ممدوح الصاوي',
    phone: '01512349876',
    normalized_phone: '+201512349876',
    governorate: 'الغربية',
    city: 'طنطا',
    address: 'شارع الجيش، أمام المحافظة القديمة، برج السلام',
    created_at: '2026-10-25T11:30:00Z',
    updated_at: '2026-10-26T18:00:00Z',
    total_orders_count: 1,
    total_spent: '705.00'
  },
  {
    id: 'cust-006',
    full_name: 'أحمد وائل المرشدي',
    phone: '01066778899',
    normalized_phone: '+201066778899',
    governorate: 'الشرقية',
    city: 'الزقازيق',
    address: 'منطقة القومية، شارع السلام، بجوار مجمع المحاكم',
    created_at: '2026-10-23T15:00:00Z',
    updated_at: '2026-10-25T14:00:00Z',
    total_orders_count: 1,
    total_spent: '1495.00'
  }
];

export const INITIAL_ORDERS: Order[] = [
  // 1. Order under Duplicate Flag Review (Recent duplicate submission by same customer)
  {
    id: 'ord-001',
    order_number: 'ORD-2026-000021',
    customer_id: 'cust-001',
    landing_page_id: 'lp-001',
    campaign_id: 'cmp-001',
    status: 'NEW',
    subtotal: '1450.00',
    discount_amount: '0.00',
    shipping_fee: '55.00',
    total_amount: '1505.00',
    currency: 'EGP',
    ship_name: 'طارق عبد المنعم الشافعي',
    ship_phone: '01099887766',
    ship_alt_phone: '01155443322',
    ship_governorate: 'الدقهلية',
    ship_city: 'المنصورة',
    ship_address: 'شارع المشاية السفلية، بجوار جزيرة الورد، برج الأندلس، الدور 4',
    customer_notes: 'أرجو التأكيد قبل المجيء بساعتين للتواجد بالمنزل',
    utm_source: 'facebook',
    utm_medium: 'cpc',
    utm_campaign: 'winter_oxford_shoes',
    idempotency_key: 'idem-20261027-tariq-2',
    duplicate_review_status: 'PENDING_REVIEW',
    matched_order_id: 'ord-002',
    version: 1,
    is_test: false,
    created_at: '2026-10-27T14:10:00Z',
    updated_at: '2026-10-27T14:10:00Z'
  },
  // 2. The earlier matching order placed 18 hours ago
  {
    id: 'ord-002',
    order_number: 'ORD-2026-000019',
    customer_id: 'cust-001',
    landing_page_id: 'lp-001',
    campaign_id: 'cmp-001',
    status: 'CONTACT_PENDING',
    subtotal: '1450.00',
    discount_amount: '0.00',
    shipping_fee: '55.00',
    total_amount: '1505.00',
    currency: 'EGP',
    ship_name: 'طارق عبد المنعم',
    ship_phone: '01099887766',
    ship_alt_phone: '01155443322',
    ship_governorate: 'الدقهلية',
    ship_city: 'المنصورة',
    ship_address: 'شارع المشاية السفلية، بجوار جزيرة الورد، برج الأندلس، الدور 4',
    customer_notes: 'الطلب الأول تم إرساله من الموقع',
    utm_source: 'facebook',
    utm_medium: 'cpc',
    utm_campaign: 'winter_oxford_shoes',
    idempotency_key: 'idem-20261026-tariq-1',
    duplicate_review_status: 'PENDING_REVIEW',
    matched_order_id: 'ord-001',
    version: 2,
    is_test: false,
    created_at: '2026-10-26T20:30:00Z',
    updated_at: '2026-10-27T08:00:00Z'
  },
  // 3. Loyal repeat customer order (CONFIRMED)
  {
    id: 'ord-003',
    order_number: 'ORD-2026-000018',
    customer_id: 'cust-002',
    landing_page_id: 'lp-003',
    campaign_id: 'cmp-003',
    status: 'CONFIRMED',
    subtotal: '2100.00',
    discount_amount: '100.00', // Owner applied loyal discount
    shipping_fee: '0.00',
    total_amount: '2000.00',
    currency: 'EGP',
    ship_name: 'محمود سامي العدوي',
    ship_phone: '01200112233',
    ship_governorate: 'القاهرة',
    ship_city: 'مدينة نصر',
    ship_address: 'شارع الطيران، أمام فندق سونستا، عمارة 42 شقة 6',
    customer_notes: 'عميل مميز سابق، تأكيد سريع للطلب',
    utm_source: 'instagram',
    utm_medium: 'story',
    utm_campaign: 'vip_bundle_men',
    idempotency_key: 'idem-20261026-mahmoud-3',
    duplicate_review_status: 'NONE',
    version: 3,
    is_test: false,
    created_at: '2026-10-26T16:00:00Z',
    updated_at: '2026-10-26T17:30:00Z',
    confirmed_at: '2026-10-26T17:30:00Z'
  },
  // 4. Order in SHIPPED status with Bosta Tracking
  {
    id: 'ord-004',
    order_number: 'ORD-2026-000015',
    customer_id: 'cust-004',
    landing_page_id: 'lp-002',
    campaign_id: 'cmp-002',
    status: 'SHIPPED',
    subtotal: '2100.00',
    discount_amount: '0.00',
    shipping_fee: '50.00',
    total_amount: '2150.00',
    currency: 'EGP',
    ship_name: 'يوسف شريف النجار',
    ship_phone: '01123456780',
    ship_governorate: 'الإسكندرية',
    ship_city: 'سموحة',
    ship_address: 'شارع فوزي معاذ، أمام نادي سموحة، عمارة الأطباء',
    carrier_name: 'بوسطة (Bosta)',
    tracking_number: 'BOS-84920193-EG',
    utm_source: 'tiktok',
    utm_medium: 'video',
    utm_campaign: 'bag_trend_oct',
    idempotency_key: 'idem-20261024-youssef',
    duplicate_review_status: 'NONE',
    version: 4,
    is_test: false,
    created_at: '2026-10-24T12:00:00Z',
    updated_at: '2026-10-25T11:00:00Z',
    confirmed_at: '2026-10-24T14:00:00Z',
    shipped_at: '2026-10-25T11:00:00Z'
  },
  // 5. Order in DELIVERED status
  {
    id: 'ord-005',
    order_number: 'ORD-2026-000012',
    customer_id: 'cust-002',
    landing_page_id: 'lp-001',
    campaign_id: 'cmp-001',
    status: 'DELIVERED',
    subtotal: '1830.00',
    discount_amount: '0.00',
    shipping_fee: '45.00',
    total_amount: '1875.00',
    currency: 'EGP',
    ship_name: 'محمود سامي العدوي',
    ship_phone: '01200112233',
    ship_governorate: 'القاهرة',
    ship_city: 'مدينة نصر',
    ship_address: 'شارع الطيران، أمام فندق سونستا، عمارة 42 شقة 6',
    carrier_name: 'مايلرز (Mylerz)',
    tracking_number: 'MYZ-77120941',
    utm_source: 'facebook',
    utm_medium: 'cpc',
    idempotency_key: 'idem-20261020-mahmoud-2',
    duplicate_review_status: 'NONE',
    version: 5,
    is_test: false,
    created_at: '2026-10-20T09:00:00Z',
    updated_at: '2026-10-23T15:00:00Z',
    confirmed_at: '2026-10-20T10:30:00Z',
    shipped_at: '2026-10-21T12:00:00Z',
    delivered_at: '2026-10-23T15:00:00Z'
  },
  // 6. Order in CONTACT_ATTEMPTED status (Call attempted, customer busy)
  {
    id: 'ord-006',
    order_number: 'ORD-2026-000020',
    customer_id: 'cust-003',
    landing_page_id: 'lp-002',
    campaign_id: 'cmp-002',
    status: 'CONTACT_ATTEMPTED',
    subtotal: '1890.00',
    discount_amount: '0.00',
    shipping_fee: '50.00',
    total_amount: '1940.00',
    currency: 'EGP',
    ship_name: 'إسلام عصام عبد الحليم',
    ship_phone: '01023456789',
    ship_governorate: 'الجيزة',
    ship_city: 'الدقي',
    ship_address: 'شارع مصدق، تقاطع شارع محيي الدين أبو العز، برج الصفا',
    utm_source: 'tiktok',
    utm_medium: 'video',
    utm_campaign: 'bag_trend_oct',
    idempotency_key: 'idem-20261027-eslam-1',
    duplicate_review_status: 'NONE',
    version: 2,
    is_test: false,
    created_at: '2026-10-27T10:15:00Z',
    updated_at: '2026-10-27T11:00:00Z'
  },
  // 7. Order in RETURNED status
  {
    id: 'ord-007',
    order_number: 'ORD-2026-000008',
    customer_id: 'cust-006',
    landing_page_id: 'lp-001',
    campaign_id: 'cmp-004',
    status: 'RETURNED',
    subtotal: '1450.00',
    discount_amount: '0.00',
    shipping_fee: '55.00',
    total_amount: '1505.00',
    currency: 'EGP',
    ship_name: 'أحمد وائل المرشدي',
    ship_phone: '01066778899',
    ship_governorate: 'الشرقية',
    ship_city: 'الزقازيق',
    ship_address: 'منطقة القومية، شارع السلام، بجوار مجمع المحاكم',
    carrier_name: 'أرامكس (Aramex)',
    tracking_number: 'ARX-66512399-EG',
    utm_source: 'google',
    utm_medium: 'search',
    idempotency_key: 'idem-20261015-ahmed-1',
    duplicate_review_status: 'NONE',
    version: 5,
    is_test: false,
    created_at: '2026-10-15T14:00:00Z',
    updated_at: '2026-10-22T16:00:00Z',
    confirmed_at: '2026-10-15T16:00:00Z',
    shipped_at: '2026-10-16T12:00:00Z',
    returned_at: '2026-10-22T16:00:00Z'
  },
  // 8. Order in CANCELLED status (Customer changed mind)
  {
    id: 'ord-008',
    order_number: 'ORD-2026-000014',
    customer_id: 'cust-005',
    landing_page_id: 'lp-003',
    campaign_id: 'cmp-003',
    status: 'CANCELLED',
    subtotal: '650.00',
    discount_amount: '0.00',
    shipping_fee: '55.00',
    total_amount: '705.00',
    currency: 'EGP',
    ship_name: 'كريم ممدوح الصاوي',
    ship_phone: '01512349876',
    ship_governorate: 'الغربية',
    ship_city: 'طنطا',
    ship_address: 'شارع الجيش، أمام المحافظة القديمة، برج السلام',
    utm_source: 'instagram',
    utm_medium: 'story',
    idempotency_key: 'idem-20261022-kareem-1',
    duplicate_review_status: 'NONE',
    version: 3,
    is_test: false,
    created_at: '2026-10-22T11:30:00Z',
    updated_at: '2026-10-22T15:00:00Z',
    cancelled_at: '2026-10-22T15:00:00Z'
  }
];

export const INITIAL_ORDER_ITEMS: OrderItem[] = [
  // For ord-001
  {
    id: 'item-001',
    order_id: 'ord-001',
    product_id: 'prod-001',
    product_name_snapshot: 'حذاء كلاسيك جلد طبيعي إيطالي أسود',
    sku_snapshot: 'SHOE-OXF-BLK',
    unit_price_snapshot: '1450.00',
    quantity: 1,
    line_discount: '0.00',
    line_total: '1450.00'
  },
  // For ord-002
  {
    id: 'item-002',
    order_id: 'ord-002',
    product_id: 'prod-001',
    product_name_snapshot: 'حذاء كلاسيك جلد طبيعي إيطالي أسود',
    sku_snapshot: 'SHOE-OXF-BLK',
    unit_price_snapshot: '1450.00',
    quantity: 1,
    line_discount: '0.00',
    line_total: '1450.00'
  },
  // For ord-003
  {
    id: 'item-003',
    order_id: 'ord-003',
    product_id: 'prod-005',
    product_name_snapshot: 'ساعة كرونوغراف ستانلس ستيل مقاومة للماء',
    sku_snapshot: 'WTC-CHR-SLV',
    unit_price_snapshot: '2100.00',
    quantity: 1,
    line_discount: '0.00',
    line_total: '2100.00'
  },
  // For ord-004
  {
    id: 'item-004',
    order_id: 'ord-004',
    product_id: 'prod-005',
    product_name_snapshot: 'ساعة كرونوغراف ستانلس ستيل مقاومة للماء',
    sku_snapshot: 'WTC-CHR-SLV',
    unit_price_snapshot: '2100.00',
    quantity: 1,
    line_discount: '0.00',
    line_total: '2100.00'
  },
  // For ord-005
  {
    id: 'item-005',
    order_id: 'ord-005',
    product_id: 'prod-001',
    product_name_snapshot: 'حذاء كلاسيك جلد طبيعي إيطالي أسود',
    sku_snapshot: 'SHOE-OXF-BLK',
    unit_price_snapshot: '1450.00',
    quantity: 1,
    line_discount: '0.00',
    line_total: '1450.00'
  },
  {
    id: 'item-006',
    order_id: 'ord-005',
    product_id: 'prod-004',
    product_name_snapshot: 'حزام جلد طبيعي دبل فيس أسود وبني',
    sku_snapshot: 'BLT-REV-DBL',
    unit_price_snapshot: '380.00',
    quantity: 1,
    line_discount: '0.00',
    line_total: '380.00'
  },
  // For ord-006
  {
    id: 'item-007',
    order_id: 'ord-006',
    product_id: 'prod-002',
    product_name_snapshot: 'حقيبة يد وكتف رجالية جلد طبيعي هافان',
    sku_snapshot: 'BAG-CRB-BRN',
    unit_price_snapshot: '1890.00',
    quantity: 1,
    line_discount: '0.00',
    line_total: '1890.00'
  },
  // For ord-007
  {
    id: 'item-008',
    order_id: 'ord-007',
    product_id: 'prod-001',
    product_name_snapshot: 'حذاء كلاسيك جلد طبيعي إيطالي أسود',
    sku_snapshot: 'SHOE-OXF-BLK',
    unit_price_snapshot: '1450.00',
    quantity: 1,
    line_discount: '0.00',
    line_total: '1450.00'
  },
  // For ord-008
  {
    id: 'item-009',
    order_id: 'ord-008',
    product_id: 'prod-003',
    product_name_snapshot: 'قميص أكسفورد كتان فاخر كاجوال كحلي',
    sku_snapshot: 'SHT-OXF-NVY',
    unit_price_snapshot: '650.00',
    quantity: 1,
    line_discount: '0.00',
    line_total: '650.00'
  }
];

export const INITIAL_STATUS_HISTORY: OrderStatusHistory[] = [
  {
    id: 'hist-001',
    order_id: 'ord-001',
    from_status: undefined,
    to_status: 'NEW',
    reason: 'تم استقبال الطلب تلقائيًا عبر صفحة الهبوط',
    changed_by: 'Public Checkout API',
    created_at: '2026-10-27T14:10:00Z'
  },
  {
    id: 'hist-002',
    order_id: 'ord-002',
    from_status: 'NEW',
    to_status: 'CONTACT_PENDING',
    reason: 'تم تعيين الطلب لخدمة العملاء للتأكيد',
    changed_by: 'النظام الآلي',
    created_at: '2026-10-27T08:00:00Z'
  },
  {
    id: 'hist-003',
    order_id: 'ord-003',
    from_status: 'CONTACT_PENDING',
    to_status: 'CONFIRMED',
    reason: 'تم الاتصال بالعميل وأكد استلام الطلب وتفاصيل العنوان بمدينة نصر',
    changed_by: 'مالك المتجر (Admin)',
    created_at: '2026-10-26T17:30:00Z'
  },
  {
    id: 'hist-004',
    order_id: 'ord-004',
    from_status: 'PREPARING',
    to_status: 'SHIPPED',
    reason: 'تم تسليم الشحنة لمندوب شركة بوسطة رقم البوليصة BOS-84920193-EG',
    changed_by: 'مالك المتجر (Admin)',
    created_at: '2026-10-25T11:00:00Z'
  },
  {
    id: 'hist-005',
    order_id: 'ord-005',
    from_status: 'SHIPPED',
    to_status: 'DELIVERED',
    reason: 'تم تسليم الشحنة للعميل بنجاح وتحصيل المبلغ كاش',
    changed_by: 'تحديث شركة الشحن مايلرز',
    created_at: '2026-10-23T15:00:00Z'
  },
  {
    id: 'hist-006',
    order_id: 'ord-006',
    from_status: 'NEW',
    to_status: 'CONTACT_ATTEMPTED',
    reason: 'تم الاتصال ولم يرد العميل (الخط مشغول)، وجدول موعد متابعة بعد 4 ساعات',
    changed_by: 'خدمة العملاء',
    created_at: '2026-10-27T11:00:00Z'
  },
  {
    id: 'hist-007',
    order_id: 'ord-007',
    from_status: 'SHIPPED',
    to_status: 'RETURNED',
    reason: 'العميل رفض الاستلام بسبب السفر المفاجئ لخارج المحافظة',
    changed_by: 'أرامكس مصر',
    created_at: '2026-10-22T16:00:00Z'
  },
  {
    id: 'hist-008',
    order_id: 'ord-008',
    from_status: 'CONTACT_PENDING',
    to_status: 'CANCELLED',
    reason: 'العميل أبلغنا بإلغاء الطلب لرغبته في مقاس مختلف غير متوفر حاليًا',
    changed_by: 'مالك المتجر (Admin)',
    created_at: '2026-10-22T15:00:00Z'
  }
];

export const INITIAL_DUPLICATE_FLAGS: DuplicateFlag[] = [
  {
    id: 'dup-001',
    order_id: 'ord-001',
    matched_order_id: 'ord-002',
    status: 'PENDING',
    note: 'طلب متطابق بالهاتف الموحد (+201099887766) ويحتوي على نفس المنتج (حذاء كلاسيك) تم إرساله بعد 18 ساعة فقط',
    created_at: '2026-10-27T14:10:00Z'
  }
];

export const INITIAL_FOLLOW_UPS: FollowUpTask[] = [
  {
    id: 'tsk-001',
    order_id: 'ord-006',
    order_number: 'ORD-2026-000020',
    customer_name: 'إسلام عصام عبد الحليم',
    customer_phone: '01023456789',
    task_type: 'إعادة محاولة اتصال (المحاولة الثانية)',
    due_at: '2026-10-27T15:00:00Z',
    status: 'OPEN',
    note: 'العميل لم يرد في المحاولة الأولى 11:00 ص، محاولة مجدولة تلقائيًا',
    created_at: '2026-10-27T11:00:00Z'
  },
  {
    id: 'tsk-002',
    order_id: 'ord-002',
    order_number: 'ORD-2026-000019',
    customer_name: 'طارق عبد المنعم',
    customer_phone: '01099887766',
    task_type: 'مراجعة طلب مكرر مع العميل',
    due_at: '2026-10-27T16:00:00Z',
    status: 'OPEN',
    note: 'التواصل لحسم هل يرغب في زوجين أم طلب واحد فقط',
    created_at: '2026-10-27T14:15:00Z'
  }
];

export const INITIAL_SHIPPING_EVENTS: ShippingEvent[] = [
  {
    id: 'shp-001',
    order_id: 'ord-004',
    carrier_name: 'بوسطة (Bosta)',
    tracking_number: 'BOS-84920193-EG',
    event_type: 'DISPATCHED',
    note: 'تم استلام الشحنة من مقر المخزن الرئيسي بالقاهرة وجار التوجيه لمكتب الإسكندرية',
    event_at: '2026-10-25T11:00:00Z',
    created_by: 'Admin'
  },
  {
    id: 'shp-002',
    order_id: 'ord-004',
    carrier_name: 'بوسطة (Bosta)',
    tracking_number: 'BOS-84920193-EG',
    event_type: 'OUT_FOR_DELIVERY',
    note: 'الشحنة مع المندوب وفي طريقها للعميل بمنطقة سموحة',
    event_at: '2026-10-27T09:30:00Z',
    created_by: 'Bosta Webhook'
  },
  {
    id: 'shp-003',
    order_id: 'ord-005',
    carrier_name: 'مايلرز (Mylerz)',
    tracking_number: 'MYZ-77120941',
    event_type: 'DELIVERED',
    note: 'تم تسليم الشحنة واستلام مبلغ 1,875 ج.م نقدًا',
    event_at: '2026-10-23T15:00:00Z',
    created_by: 'Mylerz Webhook'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    user_id: 'owner-admin',
    action: 'ORDER_STATUS_CHANGE',
    entity_type: 'order',
    entity_id: 'ord-003',
    old_values: { status: 'CONTACT_PENDING', total_amount: '2100.00' },
    new_values: { status: 'CONFIRMED', total_amount: '2000.00', discount_amount: '100.00' },
    request_id: 'req-aud-9901',
    created_at: '2026-10-26T17:30:00Z'
  },
  {
    id: 'aud-002',
    user_id: 'system',
    action: 'DUPLICATE_FLAGGED',
    entity_type: 'duplicate_flag',
    entity_id: 'dup-001',
    new_values: { order_id: 'ord-001', matched_order_id: 'ord-002', status: 'PENDING' },
    request_id: 'req-aud-9902',
    created_at: '2026-10-27T14:10:00Z'
  },
  {
    id: 'aud-003',
    user_id: 'owner-admin',
    action: 'ORDER_CANCELLED',
    entity_type: 'order',
    entity_id: 'ord-008',
    old_values: { status: 'CONTACT_PENDING' },
    new_values: { status: 'CANCELLED', reason: 'العميل أبلغنا بإلغاء الطلب لرغبته في مقاس مختلف' },
    request_id: 'req-aud-9903',
    created_at: '2026-10-22T15:00:00Z'
  }
];

export const INITIAL_API_CREDENTIALS: ApiCredential[] = [
  {
    id: 'cred-001',
    landing_page_id: 'lp-001',
    public_key_id: 'mk_pub_live_7Hk2mQ88',
    secret_hash: 'sha256_mock_hash_shoes_landing',
    label: 'سيرفر صفحة الأحذية الرسمية (Next.js Node)',
    scopes: ['orders:create', 'orders:read_status'],
    is_active: true,
    last_used_at: '2026-10-28T09:15:00Z',
    created_at: '2026-10-01T10:00:00Z'
  },
  {
    id: 'cred-002',
    landing_page_id: 'lp-002',
    public_key_id: 'mk_pub_live_9Xx5kP12',
    secret_hash: 'sha256_mock_hash_bags_landing',
    label: 'سيرفر صفحة حقائب الجلد (WordPress Webhook)',
    scopes: ['orders:create'],
    is_active: true,
    last_used_at: '2026-10-27T18:40:00Z',
    created_at: '2026-10-05T12:00:00Z'
  }
];
