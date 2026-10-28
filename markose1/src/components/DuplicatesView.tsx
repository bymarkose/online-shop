import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Package,
  MapPin,
  Calendar
} from 'lucide-react';
import { DuplicateFlag, Order } from '../types';
import { OrderService } from '../lib/orderService';
import { formatMoney } from '../lib/money';
import { StatusBadge } from './StatusBadge';

interface DuplicatesViewProps {
  flags: DuplicateFlag[];
  orders: Order[];
  onOrderUpdated: () => void;
  onSelectOrder: (orderId: string) => void;
}

export const DuplicatesView: React.FC<DuplicatesViewProps> = ({
  flags,
  orders,
  onOrderUpdated,
  onSelectOrder
}) => {
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(
    flags.find(f => f.status === 'PENDING')?.id || flags[0]?.id || null
  );
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const selectedFlag = flags.find(f => f.id === selectedFlagId);
  const newOrder = selectedFlag ? orders.find(o => o.id === selectedFlag.order_id) : undefined;
  const matchedOrder = selectedFlag ? orders.find(o => o.id === selectedFlag.matched_order_id) : undefined;

  const handleResolve = (action: 'KEPT' | 'CANCELLED_AS_DUPLICATE') => {
    if (!selectedFlag) return;
    setActionError('');
    setActionSuccess('');

    if (action === 'CANCELLED_AS_DUPLICATE' && !resolutionNote.trim()) {
      setActionError('يرجى كتابة ملاحظة أو سبب لإلغاء الطلب المكرر');
      return;
    }

    const note = resolutionNote.trim() || (action === 'KEPT' ? 'تم التأكيد مع العميل وأكد رغبته في الطلبين' : '');
    const result = OrderService.resolveDuplicateFlag(selectedFlag.id, action, note);

    if (!result.success) {
      setActionError(result.error || 'فشلت معالجة التكرار');
    } else {
      setActionSuccess(
        action === 'KEPT'
          ? 'تم اعتماد الطلبين (ليس مكررًا)'
          : 'تم إلغاء الطلب الأحدث كمكرر بنجاح'
      );
      setResolutionNote('');
      onOrderUpdated();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>مركز مراجعة الطلبات المحتمل تكرارها</span>
          <span className="text-xs font-mono tabular-nums text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
            {flags.filter(f => f.status === 'PENDING').length} معلق
          </span>
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          مراجعة بشرية للطلبات ذات أرقام الهواتف والمنتجات المتطابقة خلال نافذة 72 ساعة لمنع شحن طلبات مكررة
        </p>
      </div>

      {flags.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-lg space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-semibold text-neutral-200">لا توجد طلبات مشتبه بتكرارها حاليًا</h3>
          <p className="text-xs text-neutral-400">
            النظام يعمل بكفاءة، ولم يتم الكشف عن طلبات متطابقة خلال آخر 72 ساعة
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List of Flags */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              سجلات التكرار المكتشفة ({flags.length})
            </h3>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {flags.map(f => {
                const isSelected = f.id === selectedFlagId;
                const o1 = orders.find(o => o.id === f.order_id);
                const o2 = orders.find(o => o.id === f.matched_order_id);

                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFlagId(f.id);
                      setActionError('');
                      setActionSuccess('');
                    }}
                    className={`w-full text-right p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-800 border-amber-500 shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-amber-400">
                        {o1?.order_number || 'طلب جديد'}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          f.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : f.status === 'KEPT'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {f.status === 'PENDING'
                          ? 'بانتظار المراجعة'
                          : f.status === 'KEPT'
                          ? 'ليس مكررًا (احتفاظ)'
                          : 'ألغي كمكرر'}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-200 font-medium">
                      العميل: {o1?.ship_name}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                      الهاتف: {o1?.ship_phone}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-1 flex items-center justify-between">
                      <span>مطابق مع: {o2?.order_number || '-'}</span>
                      <span>{new Date(f.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side-by-Side Comparison Workspace */}
          <div className="lg:col-span-8 space-y-4">
            {selectedFlag && newOrder && matchedOrder ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                      <span>مقارنة تفصيلية بين الطلبين (Side-by-Side Review)</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          selectedFlag.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {selectedFlag.status}
                      </span>
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      قارن الوقت، المنتجات، والعناوين قبل اتخاذ قرار الاحتفاظ بالطلبين أو إلغاء أحدهما
                    </p>
                  </div>
                </div>

                {actionError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300">
                    {actionError}
                  </div>
                )}
                {actionSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300">
                    {actionSuccess}
                  </div>
                )}

                {/* Side-by-Side Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: The Flagged New Order */}
                  <div className="p-4 bg-neutral-950/70 border-2 border-amber-500/40 rounded-lg space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div>
                        <span className="text-[11px] text-amber-400 font-semibold block">
                          الطلب الأحدث (المشتبه به)
                        </span>
                        <span className="font-mono text-sm font-bold text-neutral-100">
                          {newOrder.order_number}
                        </span>
                      </div>
                      <StatusBadge status={newOrder.status} size="sm" />
                    </div>

                    <div className="text-xs space-y-2 text-neutral-300">
                      <div>
                        <span className="text-neutral-500 block text-[11px]">تاريخ وتوقيت الطلب:</span>
                        <span className="font-mono font-medium text-neutral-200">
                          {new Date(newOrder.created_at).toLocaleString('ar-EG')}
                        </span>
                      </div>

                      <div>
                        <span className="text-neutral-500 block text-[11px]">اسم العميل وهاتفه:</span>
                        <span className="font-medium text-neutral-100">{newOrder.ship_name}</span>
                        <div className="font-mono text-neutral-300">{newOrder.ship_phone}</div>
                      </div>

                      <div>
                        <span className="text-neutral-500 block text-[11px]">العنوان والمحافظة:</span>
                        <div className="font-medium text-neutral-200">{newOrder.ship_governorate} - {newOrder.ship_city}</div>
                        <div className="text-neutral-400 text-[11px]">{newOrder.ship_address}</div>
                      </div>

                      <div>
                        <span className="text-neutral-500 block text-[11px]">المنتجات المطلوبة:</span>
                        <div className="space-y-1 mt-1">
                          {newOrder.items?.map(it => (
                            <div key={it.id} className="p-1.5 bg-neutral-900 rounded border border-neutral-800 text-[11px] flex justify-between">
                              <span className="font-medium text-neutral-200">{it.product_name_snapshot}</span>
                              <span className="font-mono text-amber-400">{it.quantity} × {formatMoney(it.unit_price_snapshot)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold text-xs">
                        <span>إجمالي الطلب:</span>
                        <span className="font-mono text-amber-400">{formatMoney(newOrder.total_amount)}</span>
                      </div>

                      {newOrder.customer_notes && (
                        <div>
                          <span className="text-neutral-500 block text-[11px]">ملاحظات:</span>
                          <p className="text-[11px] bg-neutral-900 p-1.5 rounded text-neutral-300">
                            {newOrder.customer_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Matched Previous Order */}
                  <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-lg space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div>
                        <span className="text-[11px] text-neutral-400 font-semibold block">
                          الطلب السابق المتطابق
                        </span>
                        <span className="font-mono text-sm font-bold text-neutral-100">
                          {matchedOrder.order_number}
                        </span>
                      </div>
                      <StatusBadge status={matchedOrder.status} size="sm" />
                    </div>

                    <div className="text-xs space-y-2 text-neutral-300">
                      <div>
                        <span className="text-neutral-500 block text-[11px]">تاريخ وتوقيت الطلب:</span>
                        <span className="font-mono font-medium text-neutral-200">
                          {new Date(matchedOrder.created_at).toLocaleString('ar-EG')}
                        </span>
                      </div>

                      <div>
                        <span className="text-neutral-500 block text-[11px]">اسم العميل وهاتفه:</span>
                        <span className="font-medium text-neutral-100">{matchedOrder.ship_name}</span>
                        <div className="font-mono text-neutral-300">{matchedOrder.ship_phone}</div>
                      </div>

                      <div>
                        <span className="text-neutral-500 block text-[11px]">العنوان والمحافظة:</span>
                        <div className="font-medium text-neutral-200">{matchedOrder.ship_governorate} - {matchedOrder.ship_city}</div>
                        <div className="text-neutral-400 text-[11px]">{matchedOrder.ship_address}</div>
                      </div>

                      <div>
                        <span className="text-neutral-500 block text-[11px]">المنتجات المطلوبة:</span>
                        <div className="space-y-1 mt-1">
                          {matchedOrder.items?.map(it => (
                            <div key={it.id} className="p-1.5 bg-neutral-900 rounded border border-neutral-800 text-[11px] flex justify-between">
                              <span className="font-medium text-neutral-200">{it.product_name_snapshot}</span>
                              <span className="font-mono text-amber-400">{it.quantity} × {formatMoney(it.unit_price_snapshot)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold text-xs">
                        <span>إجمالي الطلب:</span>
                        <span className="font-mono text-amber-400">{formatMoney(matchedOrder.total_amount)}</span>
                      </div>

                      {matchedOrder.customer_notes && (
                        <div>
                          <span className="text-neutral-500 block text-[11px]">ملاحظات:</span>
                          <p className="text-[11px] bg-neutral-900 p-1.5 rounded text-neutral-300">
                            {matchedOrder.customer_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resolution Decision Controls */}
                {selectedFlag.status === 'PENDING' ? (
                  <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
                    <h3 className="text-xs font-semibold text-neutral-200">
                      قرار المراجعة البشرية (Human-in-the-loop Decision):
                    </h3>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">
                        ملاحظة التحقق (تثبت بالسجل الإداري):
                      </label>
                      <input
                        type="text"
                        value={resolutionNote}
                        onChange={e => setResolutionNote(e.target.value)}
                        placeholder="مثال: تم الاتصال بالعميل وأكد أنه يريد قطعة واحدة فقط وتم إلغاء التكرار"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        onClick={() => handleResolve('KEPT')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ليس مكررًا (الاحتفاظ بالطلبين وشحنهما)</span>
                      </button>

                      <button
                        onClick={() => handleResolve('CANCELLED_AS_DUPLICATE')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>مكرر (إلغاء الطلب الثاني الأحدث)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-200">قرار المراجعة الصادر:</span>
                      <span className="text-amber-400 font-bold">
                        {selectedFlag.status === 'KEPT' ? 'ليس مكررًا (تم الاحتفاظ بالطلب)' : 'مكرر (تم إلغاء الطلب الأحدث)'}
                      </span>
                    </div>
                    {selectedFlag.resolved_at && (
                      <div className="text-[11px] text-neutral-500">
                        بتاريخ: {new Date(selectedFlag.resolved_at).toLocaleString('ar-EG')} بواسطة {selectedFlag.resolved_by}
                      </div>
                    )}
                    {selectedFlag.note && (
                      <p className="text-[11px] text-neutral-300 mt-1 whitespace-pre-wrap">
                        {selectedFlag.note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-lg">
                اختر سجلاً من القائمة لمراجعته
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
