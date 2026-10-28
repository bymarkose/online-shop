import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  RotateCcw,
  Truck,
  Download,
  Shield,
  Clock,
  DollarSign,
  PhoneCall,
  AlertCircle
} from 'lucide-react';
import { Settings } from '../types';
import { OrderService } from '../lib/orderService';
import { formatMoney } from '../lib/money';

interface SettingsViewProps {
  settings: Settings;
  onSettingsUpdated: () => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsUpdated,
  onResetData
}) => {
  const [formData, setFormData] = useState<Settings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    OrderService.updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onSettingsUpdated();
  };

  const handleExportBackup = () => {
    const fullBackup = {
      timestamp: new Date().toISOString(),
      settings: OrderService.getSettings(),
      orders: OrderService.getOrders(),
      customers: OrderService.getCustomers(),
      products: OrderService.getProducts(),
      landing_pages: OrderService.getLandingPages(),
      campaigns: OrderService.getCampaigns(),
      follow_ups: OrderService.getFollowUps(),
      duplicate_flags: OrderService.getDuplicateFlags(),
      audit_logs: OrderService.getAuditLogs()
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markose_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleZoneRateChange = (zoneKey: string, rate: string) => {
    setFormData(prev => ({
      ...prev,
      zone_shipping_fees: {
        ...(prev.zone_shipping_fees || {}),
        [zoneKey]: rate
      }
    }));
  };

  const zones = [
    { key: 'cairo_giza', label: 'القاهرة والجيزة (العاصمة والمدن المجاورة)', defaultVal: '45.00' },
    { key: 'alex_delta', label: 'الإسكندرية ومحافظات الدلتا (البحيرة، الغربية، الدقهلية...)', defaultVal: '55.00' },
    { key: 'canal', label: 'مدن القناة (الإسماعيلية، السويس، بورسعيد)', defaultVal: '60.00' },
    { key: 'upper_egypt', label: 'محافظات الصعيد (بني سويف، المنيا، أسيوط، سوهاج، قنا، الأقصر، أسوان)', defaultVal: '75.00' },
    { key: 'frontier_redsea', label: 'المناطق الحدودية والبحر الأحمر (مطروح، الوادي الجديد، الغردقة، شرم الشيخ)', defaultVal: '95.00' }
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-2 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-400" />
            <span>إعدادات النظام وسياسات التشغيل (Markose Settings)</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            تعديل معايير كشف التكرار، تسعير شحن المحافظات المصرية، فترات المتابعة التلقائية، ونسخ البيانات
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportBackup}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>تصدير نسخة احتياطية (JSON Backup)</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>تم حفظ الإعدادات وتحديث قواعد النظام بنجاح وتوثيق ذلك في سجل التدقيق الأمني.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Store Info */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-200 border-b border-neutral-800 pb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>معلومات المتجر والعملة وسياسة الإرجاع</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">اسم المتجر / العلامة التجارية:</label>
              <input
                type="text"
                value={formData.store_name}
                onChange={e => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">رقم هاتف الدعم / خدمة العملاء:</label>
              <input
                type="text"
                value={formData.contact_phone || ''}
                onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="01012345678"
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">العملة الافتراضية للطلبات والحسابات:</label>
              <input
                type="text"
                disabled
                value={`${formData.default_currency} (الجنيه المصري EGP - دقة سنتات)`}
                className="w-full bg-neutral-950/60 border border-neutral-800/60 rounded px-3 py-1.5 text-xs text-neutral-400 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                نافذة قبول المرتجعات بعد التسليم (أيام):
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={formData.return_window_days}
                onChange={e =>
                  setFormData({ ...formData, return_window_days: Number(e.target.value) || 14 })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        </div>

        {/* Egyptian Shipping Zones Rates */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
          <div className="border-b border-neutral-800 pb-2">
            <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>تسعير الشحن للمناطق والمحافظات المصرية (Egyptian COD Shipping Zones)</span>
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              تُطبق هذه الأسعار تلقائيًا عند إنشاء الطلبات ما لم تحدد صفحة الهبوط سعرًا مخصصًا
            </p>
          </div>

          <div className="space-y-3">
            {zones.map(z => {
              const currentVal = formData.zone_shipping_fees?.[z.key] || z.defaultVal;
              return (
                <div
                  key={z.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-neutral-950 border border-neutral-800 rounded-md"
                >
                  <span className="text-xs text-neutral-300 font-medium">{z.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentVal}
                      onChange={e => handleZoneRateChange(z.key, e.target.value)}
                      className="w-24 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 font-mono text-center focus:outline-none focus:border-amber-500/50"
                    />
                    <span className="text-xs text-neutral-400">ج.م</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Duplicate Detection Invariants */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-200 border-b border-neutral-800 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>قواعد كشف التكرار (Duplicate Detection Rules)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                نافذة كشف التكرار بالساعات (افتراضيًا 72 ساعة):
              </label>
              <input
                type="number"
                min={1}
                max={336}
                value={formData.duplicate_window_hours}
                onChange={e =>
                  setFormData({ ...formData, duplicate_window_hours: Number(e.target.value) || 72 })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                أي طلب جديد بنفس رقم الهاتف الموحد ونفس المنتج خلال هذه المدة يُرفع للمراجعة البشرية.
              </span>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                الحد الأقصى لمحاولات الاتصال قبل تعذر الوصول (UNREACHABLE):
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.max_contact_attempts}
                onChange={e =>
                  setFormData({ ...formData, max_contact_attempts: Number(e.target.value) || 3 })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                افتراضيًا 3 محاولات اتصال غير ناجحة قبل إتاحة نقل الطلب لحالة تعذر الوصول.
              </span>
            </div>
          </div>
        </div>

        {/* Automation Delays */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-200 border-b border-neutral-800 pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>جدولة مهام المتابعة التلقائية (Follow-up Automation)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                مهلة إعادة الاتصال بعد المحاولة الفاشلة (ساعات):
              </label>
              <input
                type="number"
                min={1}
                max={48}
                value={formData.follow_up_attempt_delay_hours}
                onChange={e =>
                  setFormData({
                    ...formData,
                    follow_up_attempt_delay_hours: Number(e.target.value) || 4
                  })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                تُنشأ مهمة متابعة تلقائيًا بعد تسجيل CONTACT_ATTEMPTED (افتراضي 4 ساعات).
              </span>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                مهلة المتابعة بعد تعذر الوصول (ساعات):
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={formData.follow_up_unreachable_delay_hours}
                onChange={e =>
                  setFormData({
                    ...formData,
                    follow_up_unreachable_delay_hours: Number(e.target.value) || 24
                  })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                تُنشأ مهمة متابعة تلقائيًا بعد الانتقال إلى UNREACHABLE (افتراضي 24 ساعة).
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onResetData}
            className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs rounded flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط البيانات التجريبية الافتراضية</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer shadow transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات وتحديث السياسات</span>
          </button>
        </div>
      </form>
    </div>
  );
};
