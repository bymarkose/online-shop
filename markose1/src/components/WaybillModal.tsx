import React from 'react';
import { X, Printer, Package, Truck, Phone, MapPin, AlertCircle, ShieldCheck } from 'lucide-react';
import { Order } from '../types';
import { formatMoney } from '../lib/money';

interface WaybillModalProps {
  order?: Order;
  orders?: Order[];
  onClose: () => void;
}

export const WaybillModal: React.FC<WaybillModalProps> = ({ order, orders, onClose }) => {
  const orderList = orders && orders.length > 0 ? orders : order ? [order] : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white text-neutral-900 rounded-xl max-w-3xl w-full my-auto shadow-2xl overflow-hidden flex flex-col border border-neutral-300 print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* Modal Top Bar - Hidden during print */}
        <div className="p-3 bg-neutral-900 text-neutral-100 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Printer className="w-4 h-4 text-amber-400" />
            <span>
              {orderList.length > 1
                ? `طباعة بوالص الشحن المجمعة (${orderList.length} شحنة)`
                : 'معاينة وطباعة بوليصة الشحن والدفع عند الاستلام (COD Manifest)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الكل ({orderList.length})</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-100 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Waybill Sheets */}
        <div className="p-6 space-y-8 bg-white text-neutral-900 text-xs font-sans print:p-0 print:space-y-0">
          {orderList.map((ord, oIdx) => (
            <div
              key={ord.id}
              className={`space-y-5 ${
                oIdx < orderList.length - 1
                  ? 'border-b-2 border-dashed border-neutral-300 pb-8 print:break-after-page print:border-none print:pb-0'
                  : ''
              }`}
            >
              {/* Waybill Header */}
              <div className="flex justify-between items-start border-b border-neutral-200 pb-4">
                <div>
                  <div className="text-xl font-black tracking-tight text-neutral-950 flex items-center gap-2">
                    <span>ماركوس</span>
                    <span className="text-sm font-mono font-bold text-neutral-600">Markose Express</span>
                  </div>
                  <div className="text-[11px] text-neutral-600 mt-1">
                    بوليصة شحن وتوصيل نقدية · خدمة الدفع عند الاستلام (COD)
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="text-left font-mono">
                  <div className="text-sm font-black text-neutral-950 bg-neutral-100 px-3 py-1.5 rounded border border-neutral-300 inline-block">
                    {ord.order_number}
                  </div>
                  {/* Simulated 1D Barcode */}
                  <div className="mt-2 flex flex-col items-end">
                    <div className="h-8 flex items-center gap-[2px]">
                      {[3, 1, 2, 1, 4, 1, 2, 3, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2].map((w, i) => (
                        <div
                          key={i}
                          className="h-full bg-neutral-950"
                          style={{ width: `${w * 1.5}px` }}
                        />
                      ))}
                    </div>
                    <div className="text-[9px] text-neutral-500 tracking-widest mt-0.5">
                      *{ord.order_number}*
                    </div>
                  </div>
                </div>
              </div>

              {/* Critical COD Collection Box */}
              <div className="p-3.5 bg-amber-50 border-2 border-amber-500 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>المبلغ المطلوب تحصيله من العميل نقدًا (Cash on Delivery):</span>
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    تنبيه للمندوب: يُرجى استلام المبلغ كاملًا قبل تسليم الشحنة للعميل
                  </div>
                </div>
                <div className="text-2xl font-black font-mono tabular-nums text-neutral-950 bg-white px-4 py-1.5 rounded border border-amber-300 shadow-sm">
                  {formatMoney(ord.total_amount)}
                </div>
              </div>

              {/* Delivery & Shipping Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Recipient Box */}
                <div className="p-3.5 bg-neutral-50 border border-neutral-300 rounded-lg space-y-2">
                  <div className="font-bold text-xs text-neutral-900 flex items-center gap-1.5 border-b border-neutral-200 pb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-700" />
                    <span>بيانات المستلم وعنوان التسليم:</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-neutral-800">
                    <div className="font-bold text-sm text-neutral-950">{ord.ship_name}</div>
                    <div className="flex items-center gap-2 font-mono">
                      <Phone className="w-3 h-3 text-neutral-500" />
                      <span className="font-bold">{ord.ship_phone}</span>
                      {ord.ship_alt_phone && (
                        <span className="text-neutral-500">/ {ord.ship_alt_phone}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold">المحافظة: </span>
                      <span>{ord.ship_governorate}</span>
                      {ord.ship_city && <span> - {ord.ship_city}</span>}
                    </div>
                    <div className="pt-1 text-neutral-700 leading-relaxed">
                      <span className="font-bold text-neutral-900">العنوان بالتفصيل: </span>
                      {ord.ship_address}
                      {ord.ship_address_details && ` (${ord.ship_address_details})`}
                    </div>
                  </div>
                </div>

                {/* Carrier & Sender Box */}
                <div className="p-3.5 bg-neutral-50 border border-neutral-300 rounded-lg space-y-2">
                  <div className="font-bold text-xs text-neutral-900 flex items-center gap-1.5 border-b border-neutral-200 pb-1.5">
                    <Truck className="w-3.5 h-3.5 text-neutral-700" />
                    <span>بيانات الشحن والتوجيه:</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-neutral-800">
                    <div>
                      <span className="text-neutral-500">شركة الشحن: </span>
                      <span className="font-bold text-neutral-950">{ord.carrier_name || 'بوسطة (Bosta)'}</span>
                    </div>
                    {ord.tracking_number && (
                      <div>
                        <span className="text-neutral-500">رقم البوليصة: </span>
                        <span className="font-mono font-bold text-neutral-900">{ord.tracking_number}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-neutral-500">الراسل: </span>
                      <span className="font-bold">متجر ماركوس للمنتجات الفاخرة</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">هاتف خدمة العملاء: </span>
                      <span className="font-mono">01012345678</span>
                    </div>
                    {ord.customer_notes && (
                      <div className="mt-2 pt-1 border-t border-neutral-200 text-neutral-800">
                        <span className="font-bold">ملاحظات التوصيل: </span>
                        <span className="text-[10px]">{ord.customer_notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Package Contents Table */}
              <div className="border border-neutral-300 rounded-lg overflow-hidden">
                <div className="bg-neutral-100 px-3 py-1.5 font-bold text-xs text-neutral-800 border-b border-neutral-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-neutral-700" />
                  <span>محتويات الطرد (Package Manifest):</span>
                </div>
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 text-[11px]">
                      <th className="py-1.5 px-3">م</th>
                      <th className="py-1.5 px-3">اسم الصنف والمواصفات</th>
                      <th className="py-1.5 px-3 font-mono">الكود SKU</th>
                      <th className="py-1.5 px-3 text-center">الكمية</th>
                      <th className="py-1.5 px-3 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-[11px]">
                    {ord.items?.map((it, idx) => (
                      <tr key={it.id}>
                        <td className="py-1.5 px-3 text-neutral-500 font-mono">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-medium text-neutral-950">{it.product_name_snapshot}</td>
                        <td className="py-1.5 px-3 font-mono text-neutral-600">{it.sku_snapshot}</td>
                        <td className="py-1.5 px-3 text-center font-bold font-mono">{it.quantity}</td>
                        <td className="py-1.5 px-3 text-left font-mono font-medium">{formatMoney(it.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer & Signatures */}
              <div className="pt-4 border-t border-neutral-300 grid grid-cols-2 text-[11px] text-neutral-700">
                <div>
                  <div className="text-[10px] text-neutral-500">توقيع المستلم بالاستلام ودفع المبلغ:</div>
                  <div className="h-10 mt-1 border-b border-dashed border-neutral-400" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-neutral-500">اسم وتوقيع مندوب شركة الشحن:</div>
                  <div className="h-10 mt-1 border-b border-dashed border-neutral-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
