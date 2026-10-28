import React, { useState } from 'react';
import {
  FileCode,
  Download,
  Copy,
  Check,
  Code2,
  Terminal,
  ShieldCheck,
  Server,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [selectedSnippetLang, setSelectedSnippetLang] = useState<'curl' | 'js' | 'php'>('curl');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const curlSnippet = `curl -X POST https://your-domain.com/api/v1/public/orders \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -d '{
    "source": {
      "landing_page_id": "lp_sho_7Hk2mQ",
      "campaign_id": "cmp_fb_wtr_01"
    },
    "customer": {
      "full_name": "أحمد محمود سالم",
      "phone": "01012345678",
      "governorate": "الدقهلية",
      "city": "المنصورة",
      "address": "شارع المشاية السفلية، برج الأندلس"
    },
    "items": [
      { "product_id": "prod-001", "quantity": 1 }
    ],
    "attribution": {
      "utm_source": "facebook",
      "utm_medium": "cpc",
      "utm_campaign": "winter_oxford_shoes"
    },
    "customer_notes": "الاتصال قبل المجيء بساعة"
  }'`;

  const jsSnippet = `const idempotencyKey = crypto.randomUUID();

const response = await fetch('/api/v1/public/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey
  },
  body: JSON.stringify({
    source: {
      landing_page_id: 'lp_sho_7Hk2mQ',
      campaign_id: 'cmp_fb_wtr_01'
    },
    customer: {
      full_name: 'أحمد محمود سالم',
      phone: '01012345678',
      governorate: 'الدقهلية',
      city: 'المنصورة',
      address: 'شارع المشاية السفلية، برج الأندلس'
    },
    items: [
      { product_id: 'prod-001', quantity: 1 }
    ],
    customer_notes: 'الاتصال قبل المجيء بساعة'
  })
});

const result = await response.json();
if (response.ok) {
  console.log('Order created successfully:', result.data.order_number);
  // Show thank you page with result.data.total_amount
} else {
  console.error('Validation error:', result.error);
}`;

  const phpSnippet = `<?php
// WordPress / PHP Integration
$idempotencyKey = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex(random_bytes(16)), 4));

$payload = [
    'source' => [
        'landing_page_id' => 'lp_sho_7Hk2mQ',
        'campaign_id' => 'cmp_fb_wtr_01'
    ],
    'customer' => [
        'full_name' => 'أحمد محمود سالم',
        'phone' => '01012345678',
        'governorate' => 'الدقهلية',
        'city' => 'المنصورة',
        'address' => 'شارع المشاية السفلية'
    ],
    'items' => [
        ['product_id' => 'prod-001', 'quantity' => 1]
    ]
];

$ch = curl_init('https://your-domain.com/api/v1/public/orders');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Idempotency-Key: ' . $idempotencyKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);
if ($httpCode === 201) {
    echo "تم إنشاء الطلب رقم: " . $data['data']['order_number'];
}
?>`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-amber-400" />
            <span>بوابة مطوري صفحة الهبوط ووثائق الـ API (OpenAPI 3.1)</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            العقد البرمجي الكامل لتكامل صفحات الهبوط الخارجية (WordPress, React, Lead Forms, Shopify) مع نظام ماركوس
          </p>
        </div>

        <a
          href="/docs/openapi.yaml"
          download="openapi.yaml"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>تحميل ملف openapi.yaml</span>
        </a>
      </div>

      {/* Integration Principles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>1. إلزامية ترويسة Idempotency-Key</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            يجب توليد UUID فريد في المتصفح عند فتح النموذج، وإرساله مع الطلب لمنع خصم أو إنشاء طلبات مكررة عند ضغط العميل الزر عدة مرات.
          </p>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <Server className="w-4 h-4" />
            <span>2. التسعير الخادمي الآمن (Server-side)</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            الخادم لا يقبل أي أسعار أو مبالغ مرسلة من العميل. تُسترجع الأسعار من جدول المنتجات المربوطة بالصفحة لمنع التلاعب البرمجي بالأسعار.
          </p>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>3. فحص التكرار (72 ساعة)</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            الطلبات التي تشترك في نفس الموبايل الموحد ونفس المنتج خلال 72 ساعة تُعلم تلقائيًا في لوحة الإدارة للمراجعة وتأكيد الكمية مع العميل.
          </p>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-neutral-200">
              نموذج استدعاء الـ API (POST /api/v1/public/orders)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-neutral-900 border border-neutral-800 rounded">
              <button
                onClick={() => setSelectedSnippetLang('curl')}
                className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${
                  selectedSnippetLang === 'curl' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setSelectedSnippetLang('js')}
                className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${
                  selectedSnippetLang === 'js' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400'
                }`}
              >
                JavaScript
              </button>
              <button
                onClick={() => setSelectedSnippetLang('php')}
                className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${
                  selectedSnippetLang === 'php' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400'
                }`}
              >
                PHP / WP
              </button>
            </div>

            <button
              onClick={() => {
                const text =
                  selectedSnippetLang === 'curl'
                    ? curlSnippet
                    : selectedSnippetLang === 'js'
                    ? jsSnippet
                    : phpSnippet;
                handleCopy(text, selectedSnippetLang);
              }}
              className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 cursor-pointer"
              title="نسخ الكود"
            >
              {copiedSnippet === selectedSnippetLang ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <pre className="p-4 text-xs font-mono text-neutral-300 bg-neutral-950 overflow-x-auto select-all leading-relaxed">
          {selectedSnippetLang === 'curl' && curlSnippet}
          {selectedSnippetLang === 'js' && jsSnippet}
          {selectedSnippetLang === 'php' && phpSnippet}
        </pre>
      </div>

      {/* Endpoints Reference Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-200">
          جدول نقاط النهاية في الخادم (REST API Endpoints)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
                <th className="py-2 px-3">الطريقة</th>
                <th className="py-2 px-3">المسار (Endpoint)</th>
                <th className="py-2 px-3">الصلاحية</th>
                <th className="py-2 px-3">الغرض والوصف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
              <tr>
                <td className="py-2.5 px-3">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    POST
                  </span>
                </td>
                <td className="py-2.5 px-3 text-neutral-100 font-bold">/api/v1/public/orders</td>
                <td className="py-2.5 px-3 text-neutral-400 font-sans">عام (Idempotency-Key)</td>
                <td className="py-2.5 px-3 text-neutral-300 font-sans">
                  إنشاء طلب جديد من صفحة الهبوط وتوحيد الهاتف المصري وحساب الإجمالي
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold">
                    GET
                  </span>
                </td>
                <td className="py-2.5 px-3 text-neutral-100">/api/v1/orders</td>
                <td className="py-2.5 px-3 text-neutral-400 font-sans">إدارة (Session)</td>
                <td className="py-2.5 px-3 text-neutral-300 font-sans">
                  استعراض الطلبات مع البحث والترقيم وفلاتر الحالات والمحافظات
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold">
                    GET
                  </span>
                </td>
                <td className="py-2.5 px-3 text-neutral-100">/api/v1/orders/export</td>
                <td className="py-2.5 px-3 text-neutral-400 font-sans">إدارة (Session)</td>
                <td className="py-2.5 px-3 text-neutral-300 font-sans">
                  تصدير CSV آمن يدعم العربية ومشفر بـ UTF-8 BOM ومحمي من Formula Injection
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                    PATCH
                  </span>
                </td>
                <td className="py-2.5 px-3 text-neutral-100">/api/v1/orders/:id/status</td>
                <td className="py-2.5 px-3 text-neutral-400 font-sans">إدارة (Session)</td>
                <td className="py-2.5 px-3 text-neutral-300 font-sans">
                  تغيير حالة الطلب وفق آلة الحالات مع التحقق من الأسباب الإلزامية وشركة الشحن
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                    PATCH
                  </span>
                </td>
                <td className="py-2.5 px-3 text-neutral-100">/api/v1/duplicate-flags/:id</td>
                <td className="py-2.5 px-3 text-neutral-400 font-sans">إدارة (Session)</td>
                <td className="py-2.5 px-3 text-neutral-300 font-sans">
                  حسم مراجعة التكرار: ليس مكررًا (KEPT) أو إلغاء الأحدث كمكرر (CANCELLED_AS_DUPLICATE)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold">
                    GET
                  </span>
                </td>
                <td className="py-2.5 px-3 text-neutral-100">/api/v1/health</td>
                <td className="py-2.5 px-3 text-neutral-400 font-sans">عام</td>
                <td className="py-2.5 px-3 text-neutral-300 font-sans">
                  فحص جاهزية الخادم وحالته دون كشف أسرار داخلية
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
