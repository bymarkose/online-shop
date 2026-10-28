import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  RotateCw,
  Eye,
  MapPin,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Printer,
  Phone,
  MessageCircle,
  Check
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatMoney } from '../lib/money';
import { StatusBadge } from './StatusBadge';
import { EGYPT_GOVERNORATES } from '../lib/governorates';
import { OrderService } from '../lib/orderService';
import { ORDER_STATUS_META } from '../lib/stateMachine';
import { WaybillModal } from './WaybillModal';

interface OrdersViewProps {
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
  onOpenSimulator: () => void;
  onOrderUpdated?: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onSelectOrder,
  onOpenSimulator,
  onOrderUpdated
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('ALL');
  const [filterDuplicatesOnly, setFilterDuplicatesOnly] = useState(false);
  const [waybillOrder, setWaybillOrder] = useState<Order | null>(null);
  const [waybillOrders, setWaybillOrders] = useState<Order[] | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Quick status tabs
  const statusTabs = [
    { id: 'ALL', label: 'كافة الحالات', count: orders.length },
    { id: 'NEW', label: 'جديد', count: orders.filter(o => o.status === 'NEW').length },
    { id: 'CONTACT_PENDING', label: 'بانتظار الاتصال', count: orders.filter(o => o.status === 'CONTACT_PENDING').length },
    { id: 'CONFIRMED', label: 'مؤكد', count: orders.filter(o => o.status === 'CONFIRMED').length },
    { id: 'SHIPPED', label: 'تم الشحن', count: orders.filter(o => o.status === 'SHIPPED').length },
    { id: 'DELIVERED', label: 'مسلم', count: orders.filter(o => o.status === 'DELIVERED').length },
    { id: 'RETURNED', label: 'مرتجع', count: orders.filter(o => o.status === 'RETURNED').length },
    { id: 'CANCELLED', label: 'ملغي', count: orders.filter(o => o.status === 'CANCELLED').length }
  ];

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      // 1. Status Filter
      if (selectedStatus !== 'ALL' && ord.status !== selectedStatus) {
        return false;
      }

      // 2. Governorate Filter
      if (selectedGovernorate !== 'ALL' && ord.ship_governorate !== selectedGovernorate) {
        return false;
      }

      // 3. Duplicates only
      if (filterDuplicatesOnly && ord.duplicate_review_status !== 'PENDING_REVIEW') {
        return false;
      }

      // 4. Search Query (order_number, name, phone, address)
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const numMatch = ord.order_number.toLowerCase().includes(query);
        const nameMatch = ord.ship_name.toLowerCase().includes(query);
        const phoneMatch = ord.ship_phone.includes(query) || (ord.customer?.normalized_phone || '').includes(query);
        const addressMatch = (ord.ship_address || '').toLowerCase().includes(query) || (ord.ship_city || '').toLowerCase().includes(query);
        if (!numMatch && !nameMatch && !phoneMatch && !addressMatch) {
          return false;
        }
      }

      return true;
    });
  }, [orders, selectedStatus, selectedGovernorate, filterDuplicatesOnly, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // CSV Export Action
  const handleExportCSV = () => {
    const csvContent = OrderService.exportOrdersCSV(filteredOrders);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Markose_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Batch Selection Helpers
  const isAllPageSelected = paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id));
  const isSomePageSelected = paginatedOrders.some(o => selectedOrderIds.includes(o.id)) && !isAllPageSelected;

  const handleToggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIds = new Set(paginatedOrders.map(o => o.id));
      setSelectedOrderIds(prev => prev.filter(id => !pageIds.has(id)));
    } else {
      const newIds = new Set([...selectedOrderIds, ...paginatedOrders.map(o => o.id)]);
      setSelectedOrderIds(Array.from(newIds));
    }
  };

  const handleToggleSelectOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Batch Confirm Action
  const handleBatchConfirm = () => {
    if (selectedOrderIds.length === 0) return;
    const eligibleOrders = orders.filter(
      o => selectedOrderIds.includes(o.id) && ['NEW', 'CONTACT_PENDING', 'CONTACT_ATTEMPTED', 'UNREACHABLE'].includes(o.status)
    );
    if (eligibleOrders.length === 0) {
      return;
    }
    OrderService.batchTransitionOrders(
      eligibleOrders.map(o => o.id),
      'CONFIRMED',
      { reason: 'تأكيد جماعي للطلبات المحددة' }
    );
    setSelectedOrderIds([]);
    onOrderUpdated?.();
  };

  // Batch Prepare Action
  const handleBatchPrepare = () => {
    if (selectedOrderIds.length === 0) return;
    const eligibleOrders = orders.filter(
      o => selectedOrderIds.includes(o.id) && o.status === 'CONFIRMED'
    );
    if (eligibleOrders.length === 0) return;
    OrderService.batchTransitionOrders(
      eligibleOrders.map(o => o.id),
      'PREPARING',
      { reason: 'تجهيز جماعي للطلبات المؤكدة' }
    );
    setSelectedOrderIds([]);
    onOrderUpdated?.();
  };

  // Quick Confirm for individual row
  const handleQuickConfirm = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    OrderService.transitionOrderStatus(
      order.id,
      'CONFIRMED',
      'تأكيد سريع عبر جدول الطلبات',
      undefined,
      order.version
    );
    onOrderUpdated?.();
  };

  // Helper for WhatsApp link
  const getWhatsAppLink = (phone: string, customerName: string, orderNumber: string) => {
    const cleanDigits = phone.replace(/\D/g, '');
    const intlDigits = cleanDigits.startsWith('20') ? cleanDigits : '20' + cleanDigits.replace(/^0+/, '');
    const message = encodeURIComponent(`السلام عليكم أستاذ ${customerName}، معكم متجر ماركوس بخصوص طلبكم رقم ${orderNumber}`);
    return `https://wa.me/${intlDigits}?text=${message}`;
  };

  // Batch Print Action
  const handleBatchPrintWaybills = () => {
    if (selectedOrderIds.length === 0) return;
    const selected = orders.filter(o => selectedOrderIds.includes(o.id));
    setWaybillOrders(selected);
  };

  // Batch Export CSV
  const handleBatchExportCSV = () => {
    if (selectedOrderIds.length === 0) return;
    const selected = orders.filter(o => selectedOrderIds.includes(o.id));
    const csvContent = OrderService.exportOrdersCSV(selected);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Markose_Selected_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <span>سجل وإدارة الطلبات</span>
            <span className="text-xs font-mono tabular-nums text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              {filteredOrders.length} طلب
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            عرض الطلبات مع فحص التكرارات، التتبع الجغرافي، وإدارة دورة الحياة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors cursor-pointer"
            title="تصدير بصيغة CSV آمنة مع دعم كامل للغة العربية في Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="ابحث برقم الطلب (ORD-...)، اسم العميل، رقم الهاتف، أو العنوان..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md pr-9 pl-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Governorate Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={selectedGovernorate}
              onChange={e => {
                setSelectedGovernorate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              <option value="ALL">كافة المحافظات المصرية</option>
              {EGYPT_GOVERNORATES.map(gov => (
                <option key={gov.id} value={gov.nameAr}>
                  {gov.nameAr} ({gov.zone})
                </option>
              ))}
            </select>
          </div>

          {/* Duplicates Toggle */}
          <button
            onClick={() => {
              setFilterDuplicatesOnly(!filterDuplicatesOnly);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filterDuplicatesOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>طلبات التكرار المعلقة فقط</span>
          </button>
        </div>

        {/* Status Horizontal Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pt-1 border-t border-neutral-800/80 scrollbar-none">
          {statusTabs.map(tab => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedStatus(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-neutral-800 text-amber-400 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono tabular-nums opacity-60">
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Data Grid */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 select-none">
                <th className="py-2.5 px-3 w-8 text-center select-none">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    ref={el => {
                      if (el) el.indeterminate = isSomePageSelected;
                    }}
                    onChange={handleToggleSelectAllPage}
                    className="rounded bg-neutral-950 border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
                    title="تحديد كل الطلبات في هذه الصفحة"
                  />
                </th>
                <th className="py-2.5 px-3 font-medium">رقم الطلب</th>
                <th className="py-2.5 px-3 font-medium">التاريخ</th>
                <th className="py-2.5 px-3 font-medium">العميل</th>
                <th className="py-2.5 px-3 font-medium">الهاتف</th>
                <th className="py-2.5 px-3 font-medium">المحافظة / المدينة</th>
                <th className="py-2.5 px-3 font-medium">الإجمالي</th>
                <th className="py-2.5 px-3 font-medium">الحالة</th>
                <th className="py-2.5 px-3 font-medium">ملاحظات والتكرار</th>
                <th className="py-2.5 px-3 font-medium">الشحن</th>
                <th className="py-2.5 px-3 font-medium text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-neutral-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="text-sm font-medium">لا توجد طلبات تطابق معايير البحث</p>
                      <p className="text-xs text-neutral-500">
                        جرب تغيير حالة الطلب أو مسح حقل البحث أو محاكاة طلب جديد
                      </p>
                      <button
                        onClick={onOpenSimulator}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer"
                      >
                        إرسال طلب تجريبي جديد
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map(o => {
                  const isDuplicatePending = o.duplicate_review_status === 'PENDING_REVIEW';
                  const isRepeatCustomer = (o.customer?.total_orders_count || 1) > 1;
                  const isSelected = selectedOrderIds.includes(o.id);

                  return (
                    <tr
                      key={o.id}
                      onClick={() => onSelectOrder(o.id)}
                      className={`hover:bg-neutral-800/40 cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-500/10' : isDuplicatePending ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => handleToggleSelectOrder(o.id, e as any)}
                          className="rounded bg-neutral-950 border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
                        />
                      </td>

                      {/* Order Number */}
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                        {o.order_number}
                      </td>

                      {/* Created At */}
                      <td className="py-2.5 px-3 text-neutral-400 whitespace-nowrap font-mono text-[11px]">
                        <div>
                          {new Date(o.created_at).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {new Date(o.created_at).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-2.5 px-3 text-neutral-200">
                        <div className="font-medium whitespace-nowrap">{o.ship_name}</div>
                        {isRepeatCustomer && (
                          <span className="text-[10px] text-emerald-400 font-normal">
                            عميل متكرر ({o.customer?.total_orders_count} طلبات)
                          </span>
                        )}
                      </td>

                      {/* Phone with WhatsApp and Call quick actions */}
                      <td className="py-2.5 px-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono tabular-nums text-neutral-200">{o.ship_phone}</span>
                          <a
                            href={getWhatsAppLink(o.ship_phone, o.ship_name, o.order_number)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 rounded transition-colors"
                            title="محادثة واتساب سريعة مع العميل"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${o.ship_phone}`}
                            className="p-1 text-sky-400 hover:text-sky-300 hover:bg-sky-950/50 rounded transition-colors"
                            title="اتصال هاتفي مباشر"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Governorate & City */}
                      <td className="py-2.5 px-3 text-neutral-300 whitespace-nowrap">
                        <div className="font-medium">{o.ship_governorate}</div>
                        <div className="text-[10px] text-neutral-500 truncate max-w-[120px]">
                          {o.ship_city || o.ship_address}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-neutral-100 whitespace-nowrap">
                        {formatMoney(o.total_amount)}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        <StatusBadge status={o.status} size="sm" />
                      </td>

                      {/* Duplicate Flag Alert */}
                      <td className="py-2.5 px-3">
                        {isDuplicatePending ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>مشتبه بتكراره</span>
                          </span>
                        ) : o.duplicate_review_status === 'KEPT' ? (
                          <span className="text-[10px] text-neutral-400">مؤكد ليس مكررًا</span>
                        ) : o.duplicate_review_status === 'CANCELLED_AS_DUPLICATE' ? (
                          <span className="text-[10px] text-rose-400">ألغي كمكرر</span>
                        ) : (
                          <span className="text-[11px] text-neutral-500">-</span>
                        )}
                      </td>

                      {/* Shipping Info */}
                      <td className="py-2.5 px-3 text-neutral-400 whitespace-nowrap">
                        {o.carrier_name ? (
                          <div>
                            <div className="text-[11px] text-neutral-300">{o.carrier_name}</div>
                            {o.tracking_number && (
                              <div className="text-[10px] font-mono text-neutral-500">
                                {o.tracking_number}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-500 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {(o.status === 'NEW' || o.status === 'CONTACT_PENDING' || o.status === 'CONTACT_ATTEMPTED') && (
                            <button
                              onClick={e => handleQuickConfirm(o, e)}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="تأكيد الطلب فورًا"
                            >
                              <Check className="w-3 h-3" />
                              <span>تأكيد</span>
                            </button>
                          )}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setWaybillOrder(o);
                            }}
                            className="p-1 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                            title="طباعة بوليصة الشحن (COD)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onSelectOrder(o.id);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-amber-400 hover:text-amber-300 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>عرض</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-neutral-950/60 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span>عرض</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-xs text-neutral-200"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>طلب في الصفحة · إجمالي {filteredOrders.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono tabular-nums">
              صفحة {currentPage} من {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 bg-neutral-900 border border-neutral-800 rounded hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-neutral-900 border border-neutral-800 rounded hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Batch Actions Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="sticky bottom-4 z-30 bg-neutral-900/95 backdrop-blur border border-amber-500/40 shadow-2xl rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-100 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-md border border-amber-500/30">
              تم تحديد {selectedOrderIds.length} طلب
            </span>
            <span className="text-neutral-400 text-[11px] hidden sm:inline">
              يمكنك تطبيق إجراءات جماعية على الطلبات المحددة دفعة واحدة
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBatchConfirm}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow"
              title="تأكيد كافة الطلبات الجديدة أو قيد الاتصال المحددة"
            >
              <span>تأكيد الطلبات المؤهلة</span>
            </button>

            <button
              onClick={handleBatchPrepare}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow"
              title="نقل الطلبات المؤكدة المحددة إلى مرحلة التجهيز والتغليف"
            >
              <span>تحويل للتجهيز (Preparing)</span>
            </button>

            <button
              onClick={handleBatchPrintWaybills}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="طباعة بوالص الشحن لكافة الطلبات المحددة"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة البوالص ({selectedOrderIds.length})</span>
            </button>

            <button
              onClick={handleBatchExportCSV}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-700"
              title="تصدير بيانات الطلبات المحددة فقط كملف Excel CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير المحدد (CSV)</span>
            </button>

            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-2.5 py-1.5 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer text-xs"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {(waybillOrder || waybillOrders) && (
        <WaybillModal
          order={waybillOrder || undefined}
          orders={waybillOrders || undefined}
          onClose={() => {
            setWaybillOrder(null);
            setWaybillOrders(null);
          }}
        />
      )}
    </div>
  );
};
