import React, { useState, useMemo, useEffect } from 'react';
import {
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Code,
  Info,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';
import { LandingPage, Campaign, Product } from '../types';
import { normalizeEgyptianPhone } from '../lib/phone';
import { formatMoney, calculateOrderTotals } from '../lib/money';
import { EGYPT_GOVERNORATES } from '../lib/governorates';
import { OrderService, PublicOrderPayload, PublicOrderResponse } from '../lib/orderService';

interface SimulatorViewProps {
  landingPages: LandingPage[];
  campaigns: Campaign[];
  products: Product[];
  onOrderCreated: () => void;
  onNavigateToOrder: (orderId: string) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  landingPages,
  campaigns,
  products,
  onOrderCreated,
  onNavigateToOrder
}) => {
  const activeLandingPages = landingPages.filter(lp => lp.is_active);
  const [selectedPageId, setSelectedPageId] = useState<string>(
    activeLandingPages[0]?.public_id || ''
  );
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  // Form Fields
  const [fullName, setFullName] = useState('أحمد فؤاد الشناوي');
  const [phone, setPhone] = useState('01012345678');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [city, setCity] = useState('التجمع الخامس');
  const [address, setAddress] = useState('شارع التسعين الجنوبي، بجوار مجمع البنوك، فيلا 12');
  const [customerNotes, setCustomerNotes] = useState('يرجى الاتصال قبل موعد التسليم بساعة');

  // Items State (defaulting to first product)
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);

  // Security & Bot simulation test options
  const [simulateHoneypotBot, setSimulateHoneypotBot] = useState<boolean>(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    'idem-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now().toString(36)
  );
  const [reuseSameKey, setReuseSameKey] = useState<boolean>(false);

  // Live Response & Execution State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<PublicOrderResponse | null>(null);
  const [responseCode, setResponseCode] = useState<number | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);

  // Real-time Phone Normalization Preview
  const phoneAnalysis = useMemo(() => {
    return normalizeEgyptianPhone(phone);
  }, [phone]);

  // Selected Landing Page details
  const selectedPage = useMemo(() => {
    return activeLandingPages.find(lp => lp.public_id === selectedPageId) || activeLandingPages[0];
  }, [activeLandingPages, selectedPageId]);

  // Available products for this page
  const pageProducts = useMemo(() => {
    if (!selectedPage) return products;
    const allowedIds = selectedPage.products.map(p => p.product_id);
    return products.filter(p => allowedIds.includes(p.id) && p.is_active);
  }, [selectedPage, products]);

  // Pricing calculation preview
  const pricingPreview = useMemo(() => {
    const prod = products.find(p => p.id === selectedProductId);
    const unitPrice = prod?.current_price || '0.00';
    const shipping = selectedPage?.default_shipping_fee || '50.00';
    return calculateOrderTotals(
      [{ unit_price: unitPrice, quantity }],
      '0.00',
      shipping
    );
  }, [selectedProductId, quantity, selectedPage, products]);

  // Reset or regenerate idempotency key
  const regenerateKey = () => {
    setIdempotencyKey('idem-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now().toString(36));
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const start = performance.now();

    // Prepare payload matching Section 8.3
    const payload: PublicOrderPayload = {
      source: {
        landing_page_id: selectedPage?.public_id || '',
        campaign_id: selectedCampaignId || undefined
      },
      customer: {
        full_name: fullName,
        phone,
        alternate_phone: alternatePhone || undefined,
        governorate,
        city,
        address
      },
      items: [
        {
          product_id: selectedProductId,
          quantity
        }
      ],
      customer_notes: customerNotes || undefined,
      website: simulateHoneypotBot ? 'https://spam-bot-trap.com' : undefined,
      captcha_token: selectedPage?.captcha_required ? 'demo-captcha-verified-token' : undefined
    };

    setTimeout(() => {
      const resp = OrderService.createPublicOrder(payload, idempotencyKey);
      const end = performance.now();
      setResponseTimeMs(Math.round(end - start));
      setApiResponse(resp);

      if (resp.success) {
        setResponseCode(resp.idempotentReplay ? 200 : 201);
        onOrderCreated();
        if (!reuseSameKey) {
          regenerateKey();
        }
      } else {
        if (resp.error?.code === 'IDEMPOTENCY_KEY_REUSED') setResponseCode(409);
        else if (resp.error?.code === 'VALIDATION_ERROR' || resp.error?.code === 'INVALID_PHONE') setResponseCode(422);
        else if (resp.error?.code === 'FORBIDDEN') setResponseCode(403);
        else if (resp.error?.code === 'LANDING_PAGE_NOT_FOUND') setResponseCode(404);
        else setResponseCode(400);
      }
      setIsSubmitting(false);
    }, 120);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
          <Send className="w-5 h-5 text-amber-400" />
          <span>محاكي صفحة الهبوط واستقبال الطلب (Public Order API Sandbox)</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          بيئة فحص تفاعلية لاختبار تدفق استقبال الطلب من صفحة الهبوط الخارجية (POST /api/v1/public/orders)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Checkout Experience */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>نموذج طلب صفحة الهبوط (Client Checkout Simulation)</span>
            </h2>
            <span className="text-[11px] text-neutral-400">
              الدفع عند الاستلام (COD)
            </span>
          </div>

          <form onSubmit={handleSimulateSubmit} className="space-y-4">
            {/* Landing Page & Campaign Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  صفحة الهبوط المصدر (Landing Page):
                </label>
                <select
                  value={selectedPageId}
                  onChange={e => setSelectedPageId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200"
                >
                  {activeLandingPages.map(lp => (
                    <option key={lp.id} value={lp.public_id}>
                      {lp.name} ({lp.public_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  الحملة الإعلانية (UTM Source/Campaign):
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={e => setSelectedCampaignId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200"
                >
                  <option value="">بدون حملة (طلب مباشر Organic / Direct)</option>
                  {campaigns.filter(c => c.is_active).map(c => (
                    <option key={c.id} value={c.public_id}>
                      {c.name} ({c.utm_source})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  الاسم بالكامل (أحمد محمد):
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  رقم الموبايل المصري (يدعم ٠١٠... أو +2010...):
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                />
                {/* Live Normalization Feedback */}
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  {phoneAnalysis.isValid ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{phoneAnalysis.e164} ({phoneAnalysis.carrier})</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 text-[10px]">
                      {phoneAnalysis.error}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Governorate & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">المحافظة:</label>
                <select
                  value={governorate}
                  onChange={e => setGovernorate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200"
                >
                  {EGYPT_GOVERNORATES.map(gov => (
                    <option key={gov.id} value={gov.nameAr}>
                      {gov.nameAr} ({gov.zone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">المدينة / المركز:</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                العنوان بالتفصيل (اسم الشارع، رقم العمارة، الشقة):
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100"
              />
            </div>

            {/* Product selection and quantity */}
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-3">
              <span className="text-xs font-semibold text-neutral-300 block">
                المنتج والكمية المطلوبة
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-neutral-400 mb-1">اختر المنتج:</label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200"
                  >
                    {pageProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ({formatMoney(p.current_price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">الكمية:</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                  />
                </div>
              </div>

              {/* Price Calculation Summary Strip */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono text-neutral-300">
                <span>
                  المجموع الفرعي: {formatMoney(pricingPreview.subtotal)} + الشحن ({formatMoney(pricingPreview.shipping_fee)})
                </span>
                <span className="font-bold text-amber-400 text-sm">
                  المستحق: {formatMoney(pricingPreview.total_amount)}
                </span>
              </div>
            </div>

            {/* Test Security Switches */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2 text-xs">
              <span className="font-semibold text-neutral-300 block text-[11px]">
                أدوات اختبار الأمان ومنع التكرار (Testing Invariants):
              </span>

              {/* Honeypot test */}
              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                <input
                  type="checkbox"
                  checked={simulateHoneypotBot}
                  onChange={e => setSimulateHoneypotBot(e.target.checked)}
                  className="rounded bg-neutral-900 border-neutral-800 text-amber-500 focus:ring-0"
                />
                <span>محاكاة روبوت يملأ الحقل الفخ (Honeypot website field)</span>
              </label>

              {/* Reuse key test */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                  <input
                    type="checkbox"
                    checked={reuseSameKey}
                    onChange={e => setReuseSameKey(e.target.checked)}
                    className="rounded bg-neutral-900 border-neutral-800 text-amber-500 focus:ring-0"
                  />
                  <span>تثبيت مفتاح Idempotency-Key لاختبار الإعادة الآمنة أو التعارض</span>
                </label>
                <button
                  type="button"
                  onClick={regenerateKey}
                  className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>توليد مفتاح جديد</span>
                </button>
              </div>

              <div className="text-[10px] font-mono text-neutral-500 truncate bg-neutral-900/60 p-1.5 rounded">
                Header Idempotency-Key: {idempotencyKey}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>إرسال الطلب الآن (POST /public/orders)</span>
            </button>
          </form>
        </div>

        {/* Right Column: Live API Wire Inspector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-amber-400" />
                <span>فاحص استجابة الـ API في الوقت الفعلي</span>
              </h2>
              {responseCode !== null && (
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    responseCode >= 200 && responseCode < 300
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : responseCode === 409
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  HTTP {responseCode}
                  {responseTimeMs !== null && ` · ${responseTimeMs}ms`}
                </span>
              )}
            </div>

            {/* Explanation box */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-md text-[11px] text-neutral-400 space-y-1">
              <div className="font-semibold text-neutral-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>قواعد التحقق والأمان المفروضة:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-neutral-400 text-[10px]">
                <li>الأسعار تُحسب خادميًا وتتجاهل أي أسعار مرسلة من العميل.</li>
                <li>تكرار إرسال نفس الطلب بنفس المفتاح يعيد الاستجابة الأصلية (Idempotent-Replay).</li>
                <li>إرسال طلب جديد بنفس الهاتف والمنتج خلال 72 ساعة ينشئ تنبيه تكرار معلق للمراجعة البشرية.</li>
              </ul>
            </div>

            {/* Response JSON Display */}
            <div>
              <span className="text-[11px] text-neutral-400 font-mono block mb-1">
                استجابة الخادم (Server Response Payload):
              </span>
              <pre className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg text-xs font-mono text-neutral-300 overflow-x-auto max-h-80 select-all">
                {apiResponse ? (
                  JSON.stringify(apiResponse, null, 2)
                ) : (
                  <span className="text-neutral-600">
                    // اضغط "إرسال الطلب الآن" لرؤية استجابة الـ API المباشرة...
                  </span>
                )}
              </pre>
            </div>

            {/* Success Action Link if Order Created */}
            {apiResponse?.success && apiResponse.data?.order_number && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between gap-2">
                <div className="text-xs text-emerald-300">
                  <div className="font-bold">تم حفظ الطلب بنجاح في قاعدة البيانات!</div>
                  <div className="font-mono text-[11px] text-emerald-400">
                    رقم الطلب: {apiResponse.data.order_number}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
