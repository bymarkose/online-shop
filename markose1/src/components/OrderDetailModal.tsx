import React, { useState } from 'react';
import {
  X,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  User,
  ExternalLink,
  MessageSquare,
  MessageCircle,
  Printer
} from 'lucide-react';
import { Order, OrderStatus, InteractionType } from '../types';
import { formatMoney } from '../lib/money';
import { StatusBadge } from './StatusBadge';
import { ALLOWED_TRANSITIONS, ORDER_STATUS_META, isReasonRequired } from '../lib/stateMachine';
import { OrderService } from '../lib/orderService';
import { WaybillModal } from './WaybillModal';

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
  onOrderUpdated: () => void;
  onNavigateToOrder?: (targetOrderId: string) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  orderId,
  onClose,
  onOrderUpdated,
  onNavigateToOrder
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'transitions' | 'interactions' | 'shipping' | 'history'>('details');
  const [showWaybill, setShowWaybill] = useState(false);
  const [transitionStatus, setTransitionStatus] = useState<OrderStatus | ''>('');
  const [transitionReason, setTransitionReason] = useState('');
  const [carrierName, setCarrierName] = useState('بوسطة (Bosta)');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Interaction Form state
  const [interactionType, setInteractionType] = useState<InteractionType>('CALL_NO_ANSWER');
  const [interactionNote, setInteractionNote] = useState('');

  const order = OrderService.getOrderById(orderId);

  if (!order) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 max-w-sm w-full text-center">
          <p className="text-sm text-neutral-300">الطلب غير موجود</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-neutral-800 text-neutral-200 text-xs rounded"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  const allowedTransitions = ALLOWED_TRANSITIONS[order.status] || [];
  const statusHistory = OrderService.getStatusHistory(order.id);
  const interactions = OrderService.getInteractions(order.id);
  const shippingEvents = OrderService.getShippingEvents(order.id);

  // Handle State Machine Transition
  const handlePerformTransition = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!transitionStatus) {
      setErrorMsg('يرجى اختيار الحالة المستهدفة');
      return;
    }

    const needsReason = isReasonRequired(transitionStatus, order.status);
    if (needsReason && !transitionReason.trim()) {
      setErrorMsg('سبب التعديل إلزامي لهذه الحالة');
      return;
    }

    let shippingData = undefined;
    if (transitionStatus === 'SHIPPED') {
      if (!carrierName.trim()) {
        setErrorMsg('اسم شركة الشحن مطلوب');
        return;
      }
      shippingData = {
        carrier_name: carrierName,
        tracking_number: trackingNumber
      };
    }

    const result = OrderService.transitionOrderStatus(
      order.id,
      transitionStatus,
      transitionReason,
      shippingData,
      order.version
    );

    if (!result.success) {
      setErrorMsg(result.error || 'فشل تغيير الحالة');
    } else {
      setSuccessMsg('تم تحديث حالة الطلب بنجاح');
      setTransitionReason('');
      setTrackingNumber('');
      setTransitionStatus('');
      onOrderUpdated();
    }
  };

  // Handle Customer Interaction
  const handleLogInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionNote.trim()) {
      setErrorMsg('يرجى كتابة ملاحظة للمكالمة/التواصل');
      return;
    }

    OrderService.logInteraction(
      order.id,
      order.customer_id,
      interactionType,
      interactionNote
    );

    setInteractionNote('');
    setSuccessMsg('تم تسجيل محاولة التواصل بنجاح');
    onOrderUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Strip */}
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-amber-400">
                  {order.order_number}
                </span>
                <StatusBadge status={order.status} size="sm" />
                {order.duplicate_review_status === 'PENDING_REVIEW' && (
                  <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>فحص تكرار معلق</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2">
                <span>تاريخ الإنشاء: {new Date(order.created_at).toLocaleString('ar-EG')}</span>
                <span>·</span>
                <span className="font-mono text-[11px] text-neutral-500">
                  الإصدار: v{order.version}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWaybill(true)}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="طباعة بوليصة الشحن واستلام النقدية (COD Manifest)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>بوليصة الشحن (COD)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Duplicate Warning Banner if matched */}
        {order.duplicate_review_status === 'PENDING_REVIEW' && order.matched_order_id && (
          <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                تنبيه: هذا الطلب يتطابق بالهاتف والمنتج مع طلب آخر تم إرساله خلال 72 ساعة.
              </span>
            </div>
            {onNavigateToOrder && (
              <button
                onClick={() => onNavigateToOrder(order.matched_order_id!)}
                className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>فتح الطلب المطابق</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1 px-4 bg-neutral-950/60 border-b border-neutral-800 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'details'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            تفاصيل الطلب والبنود
          </button>
          <button
            onClick={() => setActiveTab('transitions')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'transitions'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            تغيير حالة الطلب ({allowedTransitions.length} متاح)
          </button>
          <button
            onClick={() => setActiveTab('interactions')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'interactions'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            محاولات الاتصال والتواصل ({interactions.length})
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'shipping'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            الشحن والتتبع ({shippingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            سجل الحالات والتدقيق ({statusHistory.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-md text-xs text-rose-300">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-xs text-emerald-300">
              {successMsg}
            </div>
          )}

          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Customer & Delivery Snapshot Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Snapshot */}
                <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-2.5">
                  <h3 className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 border-b border-neutral-800 pb-2">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>بيانات العميل (لقطة وقت الإنشاء)</span>
                  </h3>
                  <div className="text-xs space-y-1.5 text-neutral-300">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">الاسم:</span>
                      <span className="font-medium text-neutral-100">{order.ship_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">الهاتف الأساسي:</span>
                      <div className="flex items-center gap-1.5 font-mono tabular-nums text-neutral-100">
                        <span>{order.ship_phone}</span>
                        <a
                          href={`https://wa.me/20${order.ship_phone.replace(/\D/g, '').replace(/^0+/, '')}?text=${encodeURIComponent(`أهلاً بك أستاذ ${order.ship_name}، نتواصل معك بخصوص طلبك رقم ${order.order_number}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded transition-colors"
                          title="محادثة واتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`tel:${order.ship_phone}`}
                          className="p-1 text-sky-400 hover:text-sky-300 hover:bg-sky-950/60 rounded transition-colors"
                          title="اتصال هاتفي"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    {order.ship_alt_phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500">هاتف بديل:</span>
                        <div className="flex items-center gap-1.5 font-mono tabular-nums text-neutral-300">
                          <span>{order.ship_alt_phone}</span>
                          <a
                            href={`https://wa.me/20${order.ship_alt_phone.replace(/\D/g, '').replace(/^0+/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded transition-colors"
                            title="محادثة واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${order.ship_alt_phone}`}
                            className="p-1 text-sky-400 hover:text-sky-300 hover:bg-sky-950/60 rounded transition-colors"
                            title="اتصال هاتفي"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                    {order.customer && (
                      <div className="flex justify-between items-center pt-1 border-t border-neutral-800/60">
                        <span className="text-neutral-500">الهاتف الموحد E.164:</span>
                        <span className="font-mono text-neutral-400">{order.customer.normalized_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address Snapshot */}
                <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-2.5">
                  <h3 className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 border-b border-neutral-800 pb-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>عنوان التسليم (لقطة غير قابلة للتعديل بأثر رجعي)</span>
                  </h3>
                  <div className="text-xs space-y-1.5 text-neutral-300">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">المحافظة:</span>
                      <span className="font-medium text-neutral-100">{order.ship_governorate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">المدينة / المنطقة:</span>
                      <span className="text-neutral-100">{order.ship_city || '-'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block mb-0.5">العنوان التفصيلي:</span>
                      <p className="text-neutral-200 bg-neutral-900/60 p-2 rounded border border-neutral-800/80">
                        {order.ship_address}
                        {order.ship_address_details && ` (${order.ship_address_details})`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items Snapshot Table */}
              <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-3">
                <h3 className="text-xs font-semibold text-neutral-300 border-b border-neutral-800 pb-2">
                  بنود الطلب والأسعار (Snapshotted Items)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400">
                        <th className="py-2 px-3">المنتج</th>
                        <th className="py-2 px-3">كود SKU</th>
                        <th className="py-2 px-3">سعر الوحدة</th>
                        <th className="py-2 px-3 text-center">الكمية</th>
                        <th className="py-2 px-3 text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {order.items?.map(it => (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3 font-medium text-neutral-100">
                            {it.product_name_snapshot}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-neutral-400">
                            {it.sku_snapshot}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-neutral-200">
                            {formatMoney(it.unit_price_snapshot)}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-center text-neutral-200">
                            {it.quantity}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-left text-neutral-100">
                            {formatMoney(it.line_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pricing Summary */}
                <div className="pt-3 border-t border-neutral-800 flex justify-end">
                  <div className="w-64 space-y-1.5 text-xs text-neutral-300">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">المجموع الفرعي:</span>
                      <span className="font-mono tabular-nums">{formatMoney(order.subtotal)}</span>
                    </div>
                    {order.discount_amount !== '0.00' && (
                      <div className="flex justify-between text-emerald-400">
                        <span>الخصم:</span>
                        <span className="font-mono tabular-nums">-{formatMoney(order.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-neutral-500">مصاريف الشحن:</span>
                      <span className="font-mono tabular-nums">
                        {order.shipping_fee === '0.00' ? 'مجاني (0.00 ج.م)' : formatMoney(order.shipping_fee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-neutral-100 pt-2 border-t border-neutral-800">
                      <span>إجمالي المستحق (COD):</span>
                      <span className="font-mono tabular-nums text-amber-400">{formatMoney(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attribution & Marketing Origin */}
              <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-2">
                <h3 className="text-xs font-semibold text-neutral-300 border-b border-neutral-800 pb-2">
                  بيانات الإسناد وصفحة الهبوط (Attribution)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-neutral-300">
                  <div>
                    <span className="text-neutral-500 block text-[11px]">المصدر (UTM Source):</span>
                    <span className="font-mono text-neutral-200">{order.utm_source || 'مباشر (Direct)'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">الوسيط (UTM Medium):</span>
                    <span className="font-mono text-neutral-200">{order.utm_medium || '-'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">الحملة (Campaign):</span>
                    <span className="font-medium text-neutral-200">{order.utm_campaign || '-'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">مفتاح Idempotency:</span>
                    <span className="font-mono text-[10px] text-neutral-400 truncate block">
                      {order.idempotency_key}
                    </span>
                  </div>
                </div>
                {order.customer_notes && (
                  <div className="pt-2 border-t border-neutral-800/60">
                    <span className="text-neutral-500 block text-[11px]">ملاحظات العميل:</span>
                    <p className="text-neutral-300 bg-neutral-900/60 p-2 rounded text-xs mt-1">
                      {order.customer_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TRANSITIONS */}
          {activeTab === 'transitions' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-neutral-300">
                    آلة الحالات الصارمة (Order State Machine)
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">الحالة الحالية:</span>
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                </div>

                {allowedTransitions.length === 0 ? (
                  <div className="p-4 bg-neutral-900 border border-neutral-800 rounded text-center text-xs text-neutral-400">
                    هذه الحالة نهائية ({ORDER_STATUS_META[order.status]?.labelAr})، ولا يسمح بأي انتقالات لاحقة.
                  </div>
                ) : (
                  <form onSubmit={handlePerformTransition} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        اختر الحالة المستهدفة المسموحة:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {allowedTransitions.map(target => {
                          const meta = ORDER_STATUS_META[target];
                          const isSelected = transitionStatus === target;
                          return (
                            <button
                              type="button"
                              key={target}
                              onClick={() => setTransitionStatus(target)}
                              className={`p-2.5 rounded-lg border text-right transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                              }`}
                            >
                              <div className="text-xs font-medium">{meta?.labelAr || target}</div>
                              <div className="text-[10px] text-neutral-500 mt-0.5 truncate">
                                {target}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Conditional Carrier fields if SHIPPED */}
                    {transitionStatus === 'SHIPPED' && (
                      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-3">
                        <h4 className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-amber-400" />
                          <span>بيانات شركة الشحن (إلزامية عند الشحن)</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-neutral-400 mb-1">
                              شركة الشحن:
                            </label>
                            <select
                              value={carrierName}
                              onChange={e => setCarrierName(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200"
                            >
                              <option value="بوسطة (Bosta)">بوسطة (Bosta)</option>
                              <option value="مايلرز (Mylerz)">مايلرز (Mylerz)</option>
                              <option value="أرامكس (Aramex)">أرامكس (Aramex)</option>
                              <option value="شيبينج إكسبريس (Shipping Express)">شيبينج إكسبريس</option>
                              <option value="مندوب خاص بالمتجر">مندوب خاص بالمتجر</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] text-neutral-400 mb-1">
                              رقم البوليصة / التتبع (اختياري):
                            </label>
                            <input
                              type="text"
                              value={trackingNumber}
                              onChange={e => setTrackingNumber(e.target.value)}
                              placeholder="مثال: BOS-9912093"
                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reason input */}
                    {transitionStatus && (
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          سبب التغيير / ملاحظات الانتقال{' '}
                          {isReasonRequired(transitionStatus, order.status) && (
                            <span className="text-rose-400 text-[11px]">(إلزامي لهذه الحالة)</span>
                          )}:
                        </label>
                        <textarea
                          rows={2}
                          value={transitionReason}
                          onChange={e => setTransitionReason(e.target.value)}
                          placeholder="اكتب سبب الإلغاء أو نتيجة المحاولة أو سبب الإرجاع..."
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={!transitionStatus}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 text-xs font-bold rounded-md transition-colors cursor-pointer"
                      >
                        تنفيذ الانتقال الآمن للحالة
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIONS */}
          {activeTab === 'interactions' && (
            <div className="space-y-4">
              {/* Form to log call */}
              <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-3">
                <h3 className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span>تسجيل محاولة اتصال أو تواصل جديدة</span>
                </h3>
                <form onSubmit={handleLogInteraction} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">
                        نوع المحاولة:
                      </label>
                      <select
                        value={interactionType}
                        onChange={e => setInteractionType(e.target.value as InteractionType)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200"
                      >
                        <option value="CALL_NO_ANSWER">مكالمة هاتفية - لم يرد العميل</option>
                        <option value="CALL_BUSY">مكالمة هاتفية - الخط مشغول</option>
                        <option value="CALL_ANSWERED">مكالمة هاتفية - تم الرد والتحدث</option>
                        <option value="WHATSAPP_SENT">إرسال رسالة واتساب لتأكيد الطلب</option>
                        <option value="CUSTOMER_NOTE">ملاحظة داخلية عن العميل</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">
                        ملاحظة المكالمة / النتيجة:
                      </label>
                      <input
                        type="text"
                        value={interactionNote}
                        onChange={e => setInteractionNote(e.target.value)}
                        placeholder="مثال: رد وقال أنا في العمل وأرجو الاتصال 5 مساءً"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                      حفظ المحاولة بالسجل
                    </button>
                  </div>
                </form>
              </div>

              {/* Interactions Timeline */}
              <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-3">
                <h3 className="text-xs font-semibold text-neutral-300">
                  سجل محاولات التواصل السابقة ({interactions.length})
                </h3>
                {interactions.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-3 text-center">
                    لم يتم تسجيل محاولات اتصال سابقة لهذا الطلب بعد
                  </p>
                ) : (
                  <div className="divide-y divide-neutral-800/60">
                    {interactions.map(item => (
                      <div key={item.id} className="py-2.5 text-xs flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-neutral-200 flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px] text-amber-400">
                              {item.interaction_type}
                            </span>
                            <span>{item.note}</span>
                          </div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            بواسطة: {item.user_id}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-neutral-500 shrink-0">
                          {new Date(item.created_at).toLocaleString('ar-EG')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SHIPPING */}
          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <h3 className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span>بيانات الشحن الحالية</span>
                  </h3>
                  {order.carrier_name && (
                    <span className="px-2 py-0.5 bg-neutral-800 text-neutral-200 text-xs rounded font-medium">
                      {order.carrier_name}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-300">
                  <div>
                    <span className="text-neutral-500 block text-[11px]">شركة الشحن:</span>
                    <span className="font-medium text-neutral-100">{order.carrier_name || 'لم تسلم للشحن بعد'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">رقم البوليصة / التتبع:</span>
                    <span className="font-mono text-neutral-100">{order.tracking_number || '-'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">تاريخ الشحن:</span>
                    <span className="text-neutral-300">
                      {order.shipped_at ? new Date(order.shipped_at).toLocaleString('ar-EG') : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">تاريخ التسليم:</span>
                    <span className="text-neutral-300">
                      {order.delivered_at ? new Date(order.delivered_at).toLocaleString('ar-EG') : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Events Timeline */}
              <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-3">
                <h3 className="text-xs font-semibold text-neutral-300">
                  سجل أحداث وبوالص الشحن (Shipping Events)
                </h3>
                {shippingEvents.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-3 text-center">
                    لا توجد أحداث شحن مسجلة بعد لهذا الطلب
                  </p>
                ) : (
                  <div className="divide-y divide-neutral-800/60">
                    {shippingEvents.map(evt => (
                      <div key={evt.id} className="py-2.5 text-xs flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-neutral-200 flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-neutral-800 text-amber-400 text-[10px] rounded font-mono">
                              {evt.event_type}
                            </span>
                            <span>{evt.carrier_name}</span>
                          </div>
                          <p className="text-neutral-400 mt-0.5">{evt.note}</p>
                        </div>
                        <span className="text-[11px] font-mono text-neutral-500 shrink-0">
                          {new Date(evt.event_at).toLocaleString('ar-EG')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: HISTORY & AUDIT */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-3">
                <h3 className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 border-b border-neutral-800 pb-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>التسلسل التاريخي لحالات الطلب (Append-only Order History)</span>
                </h3>
                <div className="space-y-3 pt-1">
                  {statusHistory.map((item, idx) => (
                    <div key={item.id} className="relative flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <div className="flex-1 bg-neutral-900/60 p-2.5 rounded border border-neutral-800/80 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {item.from_status && (
                              <span className="text-neutral-400">
                                {ORDER_STATUS_META[item.from_status]?.labelAr || item.from_status} →
                              </span>
                            )}
                            <span className="font-semibold text-neutral-100">
                              {ORDER_STATUS_META[item.to_status]?.labelAr || item.to_status}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {new Date(item.created_at).toLocaleString('ar-EG')}
                          </span>
                        </div>
                        {item.reason && (
                          <p className="text-neutral-300 mt-1 text-[11px] bg-neutral-950/40 p-1.5 rounded">
                            {item.reason}
                          </p>
                        )}
                        <div className="text-[10px] text-neutral-500 mt-1">
                          القائم بالتعديل: {item.changed_by}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showWaybill && (
        <WaybillModal
          order={order}
          onClose={() => setShowWaybill(false)}
        />
      )}
    </div>
  );
};
