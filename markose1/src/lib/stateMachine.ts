import { OrderStatus } from '../types';

/**
 * Markose Order State Machine (Section 5)
 * Strict Transition Rules:
 * NEW -> CONTACT_PENDING, CONTACT_ATTEMPTED, CONFIRMED, CANCELLED
 * CONTACT_PENDING -> CONTACT_ATTEMPTED, CONFIRMED, CANCELLED
 * CONTACT_ATTEMPTED -> CONTACT_PENDING, CONFIRMED, UNREACHABLE, CANCELLED
 * UNREACHABLE -> CONTACT_PENDING, CONFIRMED, CANCELLED
 * CONFIRMED -> PREPARING, CANCELLED
 * PREPARING -> SHIPPED, CANCELLED
 * SHIPPED -> DELIVERED, RETURNED
 * DELIVERED -> RETURNED (within return window)
 * CANCELLED -> CONTACT_PENDING (Re-open with mandatory reason)
 * RETURNED -> none (terminal)
 */

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['CONTACT_PENDING', 'CONTACT_ATTEMPTED', 'CONFIRMED', 'CANCELLED'],
  CONTACT_PENDING: ['CONTACT_ATTEMPTED', 'CONFIRMED', 'CANCELLED'],
  CONTACT_ATTEMPTED: ['CONTACT_PENDING', 'CONFIRMED', 'UNREACHABLE', 'CANCELLED'],
  UNREACHABLE: ['CONTACT_PENDING', 'CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: ['CONTACT_PENDING'],
  RETURNED: []
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function isReasonRequired(to: OrderStatus, from?: OrderStatus): boolean {
  if (to === 'CANCELLED') return true;
  if (to === 'UNREACHABLE') return true;
  if (to === 'RETURNED') return true;
  if (from === 'CANCELLED' && to === 'CONTACT_PENDING') return true; // Reopen requires reason
  return false;
}

export function isShippingDetailsRequired(to: OrderStatus): boolean {
  return to === 'SHIPPED';
}

export interface StatusMeta {
  labelAr: string;
  labelEn: string;
  color: string;
  bgLight: string;
  borderLight: string;
  textColor: string;
  descriptionAr: string;
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  NEW: {
    labelAr: 'طلب جديد',
    labelEn: 'New',
    color: 'sky',
    bgLight: 'bg-sky-50 dark:bg-sky-950/40',
    borderLight: 'border-sky-200 dark:border-sky-800',
    textColor: 'text-sky-700 dark:text-sky-300',
    descriptionAr: 'تم استلام الطلب من صفحة الهبوط وبانتظار بدء المعالجة'
  },
  CONTACT_PENDING: {
    labelAr: 'في انتظار الاتصال',
    labelEn: 'Contact Pending',
    color: 'amber',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    borderLight: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-700 dark:text-amber-300',
    descriptionAr: 'بانتظار تواصل فريق خدمة العملاء مع العميل لتأكيد تفاصيل العنوان'
  },
  CONTACT_ATTEMPTED: {
    labelAr: 'تمت محاولة الاتصال',
    labelEn: 'Contact Attempted',
    color: 'indigo',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderLight: 'border-indigo-200 dark:border-indigo-800',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    descriptionAr: 'تم الاتصال بالعميل ولم يرد، مجدول لإعادة الاتصال'
  },
  UNREACHABLE: {
    labelAr: 'تعذر الوصول',
    labelEn: 'Unreachable',
    color: 'orange',
    bgLight: 'bg-orange-50 dark:bg-orange-950/40',
    borderLight: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-700 dark:text-orange-300',
    descriptionAr: 'تعذر الوصول بعد المحاولات القصوى، بانتظار قرار أو واتساب'
  },
  CONFIRMED: {
    labelAr: 'مؤكد',
    labelEn: 'Confirmed',
    color: 'emerald',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderLight: 'border-emerald-200 dark:border-emerald-800',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    descriptionAr: 'تم تأكيد الطلب والعنوان مع العميل وجاهز للتجهيز'
  },
  PREPARING: {
    labelAr: 'قيد التجهيز',
    labelEn: 'Preparing',
    color: 'purple',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    borderLight: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-700 dark:text-purple-300',
    descriptionAr: 'الطلب في المخزن قيد التغليف وإعداد بوليصة الشحن'
  },
  SHIPPED: {
    labelAr: 'تم الشحن',
    labelEn: 'Shipped',
    color: 'blue',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    borderLight: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-700 dark:text-blue-300',
    descriptionAr: 'تم تسليم الشحنة لشركة الشحن ومعها رقم التتبع'
  },
  DELIVERED: {
    labelAr: 'تم التسليم',
    labelEn: 'Delivered',
    color: 'teal',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40',
    borderLight: 'border-teal-200 dark:border-teal-800',
    textColor: 'text-teal-700 dark:text-teal-300',
    descriptionAr: 'استلم العميل الشحنة وسدد المبلغ لمندوب الشحن (COD)'
  },
  RETURNED: {
    labelAr: 'مرتجع',
    labelEn: 'Returned',
    color: 'rose',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40',
    borderLight: 'border-rose-200 dark:border-rose-800',
    textColor: 'text-rose-700 dark:text-rose-300',
    descriptionAr: 'عادت الشحنة للمخزن لرفض الاستلام أو عدم التواجد (حالة نهائية)'
  },
  CANCELLED: {
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
    color: 'neutral',
    bgLight: 'bg-neutral-100 dark:bg-neutral-800',
    borderLight: 'border-neutral-300 dark:border-neutral-700',
    textColor: 'text-neutral-700 dark:text-neutral-300',
    descriptionAr: 'تم إلغاء الطلب مع توثيق السبب، يمكن إعادة فتحه بسبب إلزامي'
  }
};
