import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  MapPin,
  ShoppingBag,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  MessageCircle,
  Edit2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Percent,
  X,
  Filter
} from 'lucide-react';
import { Customer, Order } from '../types';
import { formatMoney } from '../lib/money';
import { OrderService } from '../lib/orderService';
import { EGYPT_GOVERNORATES } from '../lib/governorates';

interface CustomersViewProps {
  customers: Customer[];
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders,
  onSelectOrder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [governorateFilter, setGovernorateFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REPEAT' | 'BLACKLISTED' | 'RELIABLE'>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Blacklist modal state
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('رفض استلام متكرر عند وصول مندوب الشحن');
  const [customReason, setCustomReason] = useState('');

  // Edit Customer modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAltPhone, setEditAltPhone] = useState('');
  const [editGov, setEditGov] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Governorate filter
      if (governorateFilter !== 'ALL' && c.governorate !== governorateFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'REPEAT' && (c.total_orders_count || 0) <= 1) {
        return false;
      }
      if (statusFilter === 'BLACKLISTED' && !c.is_blacklisted) {
        return false;
      }
      if (statusFilter === 'RELIABLE' && (c.is_blacklisted || (c.returned_orders_count || 0) > 0)) {
        return false;
      }

      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          c.full_name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.normalized_phone.includes(q) ||
          c.governorate.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [customers, governorateFilter, statusFilter, searchQuery]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || filteredCustomers[0] || customers[0];
  const customerOrders = selectedCustomer
    ? orders.filter(o => o.customer_id === selectedCustomer.id)
    : [];

  // Metrics computation for selected customer
  const deliveredCount = selectedCustomer?.successful_orders_count || 0;
  const returnedCount = selectedCustomer?.returned_orders_count || 0;
  const closedCount = deliveredCount + returnedCount;
  const deliverySuccessRate = closedCount > 0 ? Math.round((deliveredCount / closedCount) * 100) : null;

  // Global KPIs
  const repeatBuyersCount = customers.filter(c => (c.total_orders_count || 0) > 1).length;
  const blacklistedCount = customers.filter(c => c.is_blacklisted).length;
  const totalDelivered = orders.filter(o => o.status === 'DELIVERED').length;
  const totalReturned = orders.filter(o => o.status === 'RETURNED').length;
  const overallDeliveryRate = (totalDelivered + totalReturned) > 0
    ? Math.round((totalDelivered / (totalDelivered + totalReturned)) * 100)
    : 0;

  const handleOpenEditModal = (c: Customer) => {
    setEditName(c.full_name);
    setEditPhone(c.phone);
    setEditAltPhone(c.alternate_phone || '');
    setEditGov(c.governorate);
    setEditCity(c.city || '');
    setEditAddress(c.address || '');
    setShowEditModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    OrderService.updateCustomer(selectedCustomer.id, {
      full_name: editName.trim(),
      phone: editPhone.trim(),
      alternate_phone: editAltPhone.trim() || undefined,
      governorate: editGov.trim(),
      city: editCity.trim(),
      address: editAddress.trim()
    });
    setShowEditModal(false);
  };

  const handleConfirmBlacklist = () => {
    if (!selectedCustomer) return;
    const finalReason = blacklistReason === 'أخرى' ? customReason.trim() : blacklistReason;
    OrderService.toggleCustomerBlacklist(selectedCustomer.id, finalReason);
    setShowBlacklistModal(false);
    setCustomReason('');
  };

  const handleRemoveBlacklist = () => {
    if (!selectedCustomer) return;
    if (confirm('هل أنت متأكد من رغبتك في رفع الحظر عن هذا العميل واستعادة حالته الطبيعية؟')) {
      OrderService.toggleCustomerBlacklist(selectedCustomer.id);
    }
  };

  const getWhatsAppLink = (phone: string, name: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '2' + clean;
    else if (!clean.startsWith('20')) clean = '20' + clean;
    const text = encodeURIComponent(`السلام عليكم أ/ ${name}، بخصوص طلباتك من متجر ماركوس...`);
    return `https://wa.me/${clean}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="pb-2 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>سجل العملاء وإدارة العلاقات (Customer 360 & CRM)</span>
            <span className="text-xs font-mono tabular-nums text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
              {customers.length} عميل
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            تحليل قيمة دورة حياة العميل (LTV)، نسب استلام الشحنات، وحماية المتجر من الأرقام المحظورة
          </p>
        </div>

        {/* Top KPI Cards */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
            <span className="text-neutral-400">عملاء متكررون:</span>
            <span className="font-bold font-mono text-emerald-400">{repeatBuyersCount}</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
            <span className="text-neutral-400">محظورون:</span>
            <span className="font-bold font-mono text-rose-400">{blacklistedCount}</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
            <span className="text-neutral-400">معدل التسليم العام:</span>
            <span className="font-bold font-mono text-amber-400">{overallDeliveryRate}%</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="ابحث باسم العميل، رقم الهاتف (010...)، العنوان، أو المحافظة..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-md pr-9 pl-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-md border border-neutral-800">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              statusFilter === 'ALL' ? 'bg-neutral-800 text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setStatusFilter('REPEAT')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              statusFilter === 'REPEAT' ? 'bg-neutral-800 text-emerald-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            متكرر
          </button>
          <button
            onClick={() => setStatusFilter('RELIABLE')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              statusFilter === 'RELIABLE' ? 'bg-neutral-800 text-blue-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            موثوق
          </button>
          <button
            onClick={() => setStatusFilter('BLACKLISTED')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              statusFilter === 'BLACKLISTED' ? 'bg-neutral-800 text-rose-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            محظور ({blacklistedCount})
          </button>
        </div>

        {/* Governorate Filter */}
        <div className="sm:w-48">
          <select
            value={governorateFilter}
            onChange={e => setGovernorateFilter(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
          >
            <option value="ALL">جميع المحافظات</option>
            {EGYPT_GOVERNORATES.map(gov => (
              <option key={gov.id} value={gov.nameAr}>
                {gov.nameAr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Customer List & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Cards Column */}
        <div className="lg:col-span-5 space-y-2 max-h-[75vh] overflow-y-auto pr-1">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-lg">
              لا يوجد عملاء يطابقون خيارات البحث والتصفية
            </div>
          ) : (
            filteredCustomers.map(c => {
              const isSelected = selectedCustomer?.id === c.id;
              const isRepeat = (c.total_orders_count || 0) > 1;
              const isBlacklisted = c.is_blacklisted;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`w-full text-right p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800/90 border-amber-500 shadow-sm'
                      : isBlacklisted
                      ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-700'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-neutral-100 flex items-center gap-1.5">
                      <span>{c.full_name}</span>
                      {isBlacklisted && (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isBlacklisted ? (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                          محظور
                        </span>
                      ) : isRepeat ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          عميل متكرر ({c.total_orders_count})
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                    <span className="text-neutral-200">{c.phone}</span>
                    <span className="text-neutral-500">{c.normalized_phone}</span>
                  </div>

                  <div className="text-[11px] text-neutral-400 mt-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-neutral-500" />
                      <span>{c.governorate} {c.city ? `· ${c.city}` : ''}</span>
                    </span>
                    <span className="font-mono tabular-nums text-amber-400 font-bold">
                      {formatMoney(c.total_spent || '0')}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Customer Detail Column (Customer 360) */}
        <div className="lg:col-span-7">
          {selectedCustomer ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-5">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                    <span>{selectedCustomer.full_name}</span>
                    {selectedCustomer.is_blacklisted ? (
                      <span className="text-xs font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded">
                        قائمة الحظر (Blacklisted)
                      </span>
                    ) : (selectedCustomer.total_orders_count || 0) > 1 ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                        عميل موثوق ودائم
                      </span>
                    ) : null}
                  </h2>
                  <div className="text-xs text-neutral-400 mt-1 font-mono flex items-center gap-2">
                    <span>المعرف: {selectedCustomer.id}</span>
                    <span>·</span>
                    <span>تاريخ التسجيل: {new Date(selectedCustomer.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>

                {/* Quick Contact & Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={getWhatsAppLink(selectedCustomer.phone, selectedCustomer.full_name)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>

                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-neutral-800 text-neutral-200 border border-neutral-700 hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>اتصال</span>
                  </a>

                  <button
                    onClick={() => handleOpenEditModal(selectedCustomer)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-neutral-800 text-neutral-200 border border-neutral-700 hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                    <span>تعديل</span>
                  </button>

                  {selectedCustomer.is_blacklisted ? (
                    <button
                      onClick={handleRemoveBlacklist}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>رفع الحظر</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowBlacklistModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>حظر العميل</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Blacklist Warning Notice */}
              {selectedCustomer.is_blacklisted && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-300">تحذير أمني: هذا الرقم محظور من استلام طلبات الدفع عند الاستلام</span>
                    <span className="text-neutral-400 mt-0.5 block">
                      السبب المسجل: {selectedCustomer.blacklist_reason || 'غير محدد'}
                    </span>
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-lg text-center">
                  <span className="text-[11px] text-neutral-500 block">إجمالي الإنفاق (LTV)</span>
                  <span className="text-base font-bold font-mono tabular-nums text-amber-400 mt-1 block">
                    {formatMoney(selectedCustomer.total_spent || '0')}
                  </span>
                </div>

                <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-lg text-center">
                  <span className="text-[11px] text-neutral-500 block">إجمالي الطلبات</span>
                  <span className="text-base font-bold font-mono text-neutral-200 mt-1 block">
                    {selectedCustomer.total_orders_count || 0}
                  </span>
                </div>

                <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-lg text-center">
                  <span className="text-[11px] text-neutral-500 block">الطلبات المستلمة</span>
                  <span className="text-base font-bold font-mono text-emerald-400 mt-1 block">
                    {deliveredCount}
                  </span>
                </div>

                <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-lg text-center">
                  <span className="text-[11px] text-neutral-500 block">معدل نجاح التسليم</span>
                  <span
                    className={`text-base font-bold font-mono mt-1 block ${
                      deliverySuccessRate === null
                        ? 'text-neutral-400'
                        : deliverySuccessRate >= 80
                        ? 'text-emerald-400'
                        : deliverySuccessRate >= 50
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {deliverySuccessRate !== null ? `${deliverySuccessRate}%` : 'قيد المعالجة'}
                  </span>
                </div>
              </div>

              {/* Contact & Permanent Address Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-300 bg-neutral-950/60 p-4 rounded-lg border border-neutral-800">
                <div>
                  <span className="text-neutral-500 block text-[11px]">الهاتف الأساسي:</span>
                  <span className="font-mono text-neutral-100 font-semibold">{selectedCustomer.phone}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">الهاتف الموحد E.164:</span>
                  <span className="font-mono text-neutral-100">{selectedCustomer.normalized_phone}</span>
                </div>
                {selectedCustomer.alternate_phone && (
                  <div>
                    <span className="text-neutral-500 block text-[11px]">هاتف إضافي / بديل:</span>
                    <span className="font-mono text-neutral-100">{selectedCustomer.alternate_phone}</span>
                  </div>
                )}
                <div>
                  <span className="text-neutral-500 block text-[11px]">المحافظة والمدينة:</span>
                  <span className="text-neutral-100">{selectedCustomer.governorate} {selectedCustomer.city ? `- ${selectedCustomer.city}` : ''}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-neutral-500 block text-[11px]">العنوان الدائم المسجل:</span>
                  <p className="text-neutral-200 mt-0.5">{selectedCustomer.address}</p>
                </div>
              </div>

              {/* Orders History by this Customer */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <span>سجل طلبات العميل ({customerOrders.length})</span>
                  </span>
                  <span className="text-[11px] text-neutral-500 font-normal">
                    انقر على أي طلب لفتح تفاصيله وتعديل حالته
                  </span>
                </h3>

                {customerOrders.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-6 text-center border border-neutral-800 rounded-lg bg-neutral-950/40">
                    لا توجد طلبات مسجلة لهذا العميل حتى الآن
                  </p>
                ) : (
                  <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
                    {customerOrders.map(ord => (
                      <div
                        key={ord.id}
                        onClick={() => onSelectOrder(ord.id)}
                        className="p-3 bg-neutral-950/40 hover:bg-neutral-800/40 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400">
                              {ord.order_number}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-300 font-medium">
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            {new Date(ord.created_at).toLocaleDateString('ar-EG')} · {ord.ship_governorate} {ord.ship_city ? `- ${ord.ship_city}` : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono tabular-nums font-bold text-neutral-100">
                            {formatMoney(ord.total_amount)}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-neutral-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-lg">
              اختر عميلًا من القائمة لاستعراض التفاصيل الكاملة
            </div>
          )}
        </div>
      </div>

      {/* Blacklist Confirmation Modal */}
      {showBlacklistModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-rose-800/70 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>حظر العميل: {selectedCustomer.full_name}</span>
              </h3>
              <button
                onClick={() => setShowBlacklistModal(false)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              سيتم وضع رقم هاتف العميل ({selectedCustomer.phone}) في القائمة السوداء، مع إدراج تنبيه أحمر في حال وصول أي طلبات مستقبلية من نفس الرقم.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                سبب الحظر (مطلوب للتوثيق الإداري):
              </label>
              <select
                value={blacklistReason}
                onChange={e => setBlacklistReason(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200"
              >
                <option value="رفض استلام متكرر عند وصول مندوب الشحن">رفض استلام متكرر عند وصول مندوب الشحن</option>
                <option value="رقم غير صحيح أو وهمي / لا يرد بشكل دائم">رقم غير صحيح أو وهمي / لا يرد بشكل دائم</option>
                <option value="إلغاء الطلب بعد خروجه مع شركة الشحن">إلغاء الطلب بعد خروجه مع شركة الشحن</option>
                <option value="طلب كيدي / سبام">طلب كيدي / سبام</option>
                <option value="أخرى">سبب آخر (تحديد يدوي)</option>
              </select>

              {blacklistReason === 'أخرى' && (
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="اكتب سبب الحظر بالتفصيل..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 mt-2"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowBlacklistModal(false)}
                className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded text-xs hover:bg-neutral-700 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmBlacklist}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs cursor-pointer"
              >
                تأكيد إدراج العميل في القائمة السوداء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>تعديل بيانات العميل</span>
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">الاسم الكامل:</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">الهاتف الأساسي:</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">هاتف بديل (اختياري):</label>
                  <input
                    type="text"
                    value={editAltPhone}
                    onChange={e => setEditAltPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">المحافظة:</label>
                  <select
                    value={editGov}
                    onChange={e => setEditGov(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100"
                  >
                    {EGYPT_GOVERNORATES.map(gov => (
                      <option key={gov.id} value={gov.nameAr}>
                        {gov.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-neutral-400 mb-1">المركز / الحي / المدينة:</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={e => setEditCity(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-neutral-400 mb-1">العنوان بالتفصيل:</label>
                  <textarea
                    rows={2}
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded text-xs hover:bg-neutral-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded text-xs cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
