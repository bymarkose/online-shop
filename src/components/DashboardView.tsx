import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Package,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Clock,
  ArrowUpRight,
  MapPin,
  Calendar,
  Layers,
  ChevronLeft
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatMoney, toCents, fromCents } from '../lib/money';
import { ORDER_STATUS_META } from '../lib/stateMachine';

interface DashboardViewProps {
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
  onNavigateToTab: (tab: any) => void;
  pendingDuplicatesCount: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  onSelectOrder,
  onNavigateToTab,
  pendingDuplicatesCount
}) => {
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [compareWithPrevious, setCompareWithPrevious] = useState<boolean>(true);

  // Filter orders by date in Africa/Cairo
  const filteredOrders = useMemo(() => {
    if (dateFilter === 'all') return orders;
    const now = Date.now();
    const days = dateFilter === 'today' ? 1 : dateFilter === '7days' ? 7 : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return orders.filter(o => new Date(o.created_at).getTime() >= cutoff);
  }, [orders, dateFilter]);

  // Previous matching period for Section 12 comparison
  const previousPeriodOrders = useMemo(() => {
    if (dateFilter === 'all' || !compareWithPrevious) return [];
    const now = Date.now();
    const days = dateFilter === 'today' ? 1 : dateFilter === '7days' ? 7 : 30;
    const currentCutoff = now - days * 24 * 60 * 60 * 1000;
    const previousCutoff = now - (2 * days) * 24 * 60 * 60 * 1000;
    return orders.filter(o => {
      const time = new Date(o.created_at).getTime();
      return time >= previousCutoff && time < currentCutoff;
    });
  }, [orders, dateFilter, compareWithPrevious]);

  // Aggregate Metrics (Section 12 of spec)
  const metrics = useMemo(() => {
    const totalCount = filteredOrders.length;
    let grossCents = 0;
    let deliveredCents = 0;
    let returnedCents = 0;
    let confirmedCount = 0;

    const statusCounts: Record<OrderStatus, number> = {
      NEW: 0,
      CONTACT_PENDING: 0,
      CONTACT_ATTEMPTED: 0,
      UNREACHABLE: 0,
      CONFIRMED: 0,
      PREPARING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      RETURNED: 0,
      CANCELLED: 0
    };

    for (const ord of filteredOrders) {
      const cents = toCents(ord.total_amount);
      grossCents += cents;
      statusCounts[ord.status] = (statusCounts[ord.status] || 0) + 1;

      if (['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'].includes(ord.status)) {
        confirmedCount++;
      }
      if (ord.status === 'DELIVERED') {
        deliveredCents += cents;
      }
      if (ord.status === 'RETURNED') {
        returnedCents += cents;
      }
    }

    const netOperationalCents = deliveredCents - returnedCents;
    const confirmationRate = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;
    const aovCents = totalCount > 0 ? Math.round(grossCents / totalCount) : 0;

    // Previous window metrics for delta
    let prevGrossCents = 0;
    let prevDeliveredCents = 0;
    let prevReturnedCents = 0;
    let prevConfirmedCount = 0;
    for (const pOrd of previousPeriodOrders) {
      const c = toCents(pOrd.total_amount);
      prevGrossCents += c;
      if (['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'].includes(pOrd.status)) prevConfirmedCount++;
      if (pOrd.status === 'DELIVERED') prevDeliveredCents += c;
      if (pOrd.status === 'RETURNED') prevReturnedCents += c;
    }
    const prevNetOperationalCents = prevDeliveredCents - prevReturnedCents;
    const prevConfirmationRate = previousPeriodOrders.length > 0 ? Math.round((prevConfirmedCount / previousPeriodOrders.length) * 100) : 0;

    const calcGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalCount,
      grossAmount: fromCents(grossCents),
      deliveredAmount: fromCents(deliveredCents),
      netOperationalAmount: fromCents(netOperationalCents),
      confirmationRate,
      aov: fromCents(aovCents),
      statusCounts,
      // Growth percentages
      countGrowth: calcGrowth(totalCount, previousPeriodOrders.length),
      grossGrowth: calcGrowth(grossCents, prevGrossCents),
      netGrowth: calcGrowth(netOperationalCents, prevNetOperationalCents),
      rateDiff: confirmationRate - prevConfirmationRate,
      hasComparison: dateFilter !== 'all' && compareWithPrevious
    };
  }, [filteredOrders, previousPeriodOrders, dateFilter, compareWithPrevious]);

  // Performance by Governorate
  const governorateStats = useMemo(() => {
    const map = new Map<string, { count: number; totalCents: number }>();
    for (const ord of filteredOrders) {
      const gov = ord.ship_governorate || 'غير محدد';
      const curr = map.get(gov) || { count: 0, totalCents: 0 };
      curr.count += 1;
      curr.totalCents += toCents(ord.total_amount);
      map.set(gov, curr);
    }
    return Array.from(map.entries())
      .map(([name, stat]) => ({
        name,
        count: stat.count,
        total: fromCents(stat.totalCents)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredOrders]);

  // Campaign Attribution Stats
  const campaignStats = useMemo(() => {
    const map = new Map<string, { source: string; name: string; count: number; totalCents: number }>();
    for (const ord of filteredOrders) {
      const source = ord.utm_source || 'مباشر (Direct)';
      const campaignName = ord.utm_campaign || ord.campaign?.name || 'بدون حملة';
      const key = `${source}-${campaignName}`;
      const curr = map.get(key) || { source, name: campaignName, count: 0, totalCents: 0 };
      curr.count += 1;
      curr.totalCents += toCents(ord.total_amount);
      map.set(key, curr);
    }
    return Array.from(map.values())
      .map(item => ({
        source: item.source,
        name: item.name,
        count: item.count,
        total: fromCents(item.totalCents)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      {/* Top Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <span>لوحة المؤشرات التشغيلية</span>
            <span className="text-xs text-neutral-500 font-normal">
              بتوقيت القاهرة (Africa/Cairo)
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            متابعة دقيقة لمبيعات الدفع عند الاستلام (COD)، نسب التأكيد، وحالات دورة حياة الشحنات
          </p>
        </div>

        {/* Date Filter & Comparison Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {dateFilter !== 'all' && (
            <button
              onClick={() => setCompareWithPrevious(!compareWithPrevious)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer flex items-center gap-1.5 ${
                compareWithPrevious
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
              title="مقارنة النتائج بالفترة السابقة المساوية"
            >
              <span>مقارنة بالفترة السابقة</span>
              <span className={`w-2 h-2 rounded-full ${compareWithPrevious ? 'bg-amber-400' : 'bg-neutral-600'}`} />
            </button>
          )}

          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg shrink-0">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setDateFilter('7days')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                dateFilter === '7days'
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setDateFilter('30days')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                dateFilter === '30days'
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              آخر 30 يوم
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              كافة الفترات
            </button>
          </div>
        </div>
      </div>

      {/* Pending Duplicate Alert Banner if Any */}
      {pendingDuplicatesCount > 0 && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-300">
                يوجد {pendingDuplicatesCount} طلبات مشتبه بتكرارها تحتاج لمراجعة بشرية
              </h3>
              <p className="text-xs text-amber-200/80">
                تم الكشف عن طلبات متطابقة في الهاتف والمنتج خلال نافذة الـ 72 ساعة لمنع شحن طلبات مضاعفة عن طريق الخطأ
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('duplicates')}
            className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-neutral-950 hover:bg-amber-400 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            مراجعة التكرارات الآن
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Order Volume */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">حجم الطلبات</span>
            <Package className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tabular-nums text-neutral-100">
              {metrics.totalCount}
            </div>
            {metrics.hasComparison && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  metrics.countGrowth >= 0
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {metrics.countGrowth >= 0 ? '+' : ''}{metrics.countGrowth}%
              </span>
            )}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            طلب منشأ في الفترة
          </div>
        </div>

        {/* Card 2: Gross Order Value */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">إجمالي المبيعات</span>
            <TrendingUp className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold font-mono tabular-nums text-neutral-100">
              {formatMoney(metrics.grossAmount)}
            </div>
            {metrics.hasComparison && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  metrics.grossGrowth >= 0
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {metrics.grossGrowth >= 0 ? '+' : ''}{metrics.grossGrowth}%
              </span>
            )}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            قيمة الطلبات الإجمالية
          </div>
        </div>

        {/* Card 3: Confirmation Rate */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">معدل التأكيد</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
              {metrics.confirmationRate}%
            </div>
            {metrics.hasComparison && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  metrics.rateDiff >= 0
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {metrics.rateDiff >= 0 ? '+' : ''}{metrics.rateDiff}%
              </span>
            )}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            نسبة وصول الطلب لمؤكد فأعلى
          </div>
        </div>

        {/* Card 4: Net Operational Sales */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">الصافي المحصل (COD)</span>
            <Truck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold font-mono tabular-nums text-teal-400">
              {formatMoney(metrics.netOperationalAmount)}
            </div>
            {metrics.hasComparison && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  metrics.netGrowth >= 0
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {metrics.netGrowth >= 0 ? '+' : ''}{metrics.netGrowth}%
              </span>
            )}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            المسلم مطروحًا منه المرتجع
          </div>
        </div>

        {/* Card 5: AOV */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">متوسط السلة (AOV)</span>
            <Layers className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-100">
            {formatMoney(metrics.aov)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            متوسط قيمة الطلب الواحد
          </div>
        </div>

        {/* Card 6: Pending Duplicate Review */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">تكرارات معلقة</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${pendingDuplicatesCount > 0 ? 'text-amber-400' : 'text-neutral-100'}`}>
            {pendingDuplicatesCount}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            بانتظار قرار المالك
          </div>
        </div>
      </div>

      {/* Order Status Pipeline Breakdown */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-200">
            توزيع الحالات التشغيلية (Order State Pipeline)
          </h2>
          <button
            onClick={() => onNavigateToTab('orders')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <span>عرض جدول الطلبات</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map(status => {
            const count = metrics.statusCounts[status] || 0;
            const meta = ORDER_STATUS_META[status];
            return (
              <div
                key={status}
                className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-md flex flex-col justify-between"
              >
                <div className="text-[11px] text-neutral-400 font-medium truncate mb-1">
                  {meta.labelAr}
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-neutral-100">
                  {count}
                </div>
                <div className="w-full bg-neutral-800 h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${meta.textColor.replace('text-', 'bg-')}`}
                    style={{
                      width: `${metrics.totalCount > 0 ? Math.min(100, (count / metrics.totalCount) * 100) : 0}%`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Analytics Strip: Top Governorates & Top Marketing Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Governorates */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>أعلى المحافظات طلبًا في مصر</span>
            </h2>
            <span className="text-xs text-neutral-500">حسب إجمالي الطلبات</span>
          </div>

          <div className="divide-y divide-neutral-800/60">
            {governorateStats.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-500">
                لا توجد طلبات في الفترة المختارة
              </div>
            ) : (
              governorateStats.map((item, idx) => (
                <div key={item.name} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-center text-xs text-neutral-500 font-mono">
                      0{idx + 1}
                    </span>
                    <span className="text-xs font-medium text-neutral-200">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-mono tabular-nums text-neutral-300">
                      {item.count} طلب
                    </span>
                    <span className="font-mono tabular-nums text-neutral-400 font-semibold">
                      {formatMoney(item.total)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Campaigns & Sources */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
              <span>أداء الحملات الإعلانية ومصادر الإسناد (UTM)</span>
            </h2>
            <span className="text-xs text-neutral-500">المبيعات بحسب المصدر</span>
          </div>

          <div className="divide-y divide-neutral-800/60">
            {campaignStats.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-500">
                لا توجد بيانات حملات مسجلة
              </div>
            ) : (
              campaignStats.map((item, idx) => (
                <div key={`${item.source}-${item.name}`} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-neutral-200 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 text-[10px] rounded font-mono">
                        {item.source}
                      </span>
                      <span>{item.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-mono tabular-nums text-neutral-300">
                      {item.count} طلب
                    </span>
                    <span className="font-mono tabular-nums text-amber-400 font-semibold">
                      {formatMoney(item.total)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Latest Orders Strip */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-200">
            أحدث العمليات الواردة
          </h2>
          <button
            onClick={() => onNavigateToTab('orders')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <span>جميع الطلبات ({orders.length})</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
                <th className="py-2 px-3 font-medium">رقم الطلب</th>
                <th className="py-2 px-3 font-medium">العميل</th>
                <th className="py-2 px-3 font-medium">المحافظة</th>
                <th className="py-2 px-3 font-medium">المبلغ</th>
                <th className="py-2 px-3 font-medium">الحالة</th>
                <th className="py-2 px-3 font-medium text-left">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {orders.slice(0, 5).map(o => (
                <tr
                  key={o.id}
                  onClick={() => onSelectOrder(o.id)}
                  className="hover:bg-neutral-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono font-semibold text-amber-400">
                    {o.order_number}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-200">
                    {o.ship_name}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-400">
                    {o.ship_governorate}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-neutral-200">
                    {formatMoney(o.total_amount)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] font-medium text-neutral-300">
                      {ORDER_STATUS_META[o.status]?.labelAr || o.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-left font-mono text-[11px] text-neutral-500">
                    {new Date(o.created_at).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
