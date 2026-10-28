import React, { useState } from 'react';
import { Package, Globe, Tag, Plus, Check, Copy, ExternalLink, Key, Shield, AlertCircle, X, Trash2 } from 'lucide-react';
import { Product, LandingPage, Campaign, ApiCredential } from '../types';
import { formatMoney } from '../lib/money';
import { OrderService } from '../lib/orderService';

interface CatalogViewProps {
  products: Product[];
  landingPages: LandingPage[];
  campaigns: Campaign[];
  onDataChanged: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  landingPages,
  campaigns,
  onDataChanged
}) => {
  const [subTab, setSubTab] = useState<'products' | 'landing-pages' | 'campaigns' | 'api-credentials'>('products');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // API Credentials state
  const [credentials, setCredentials] = useState<ApiCredential[]>(() => OrderService.getApiCredentials());
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyLandingPageId, setNewKeyLandingPageId] = useState('');
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);

  // New Product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

  // New Landing Page form state
  const [showAddLp, setShowAddLp] = useState(false);
  const [newLpName, setNewLpName] = useState('');
  const [newLpSlug, setNewLpSlug] = useState('');
  const [newLpShipping, setNewLpShipping] = useState('50.00');
  const [newLpOrigins, setNewLpOrigins] = useState('*');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // New Campaign form state
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [newCmpName, setNewCmpName] = useState('');
  const [newCmpLpId, setNewCmpLpId] = useState('');
  const [newCmpSource, setNewCmpSource] = useState('facebook');
  const [newCmpMedium, setNewCmpMedium] = useState('cpc');
  const [newCmpCampaign, setNewCmpCampaign] = useState('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateLandingPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLpName.trim() || !newLpSlug.trim()) return;

    OrderService.saveLandingPage({
      name: newLpName.trim(),
      slug: newLpSlug.trim().toLowerCase(),
      public_id: 'lp_pub_' + Math.random().toString(36).substring(2, 9),
      default_shipping_fee: newLpShipping.trim() || '50.00',
      allowed_origins: newLpOrigins.split(',').map(s => s.trim()).filter(Boolean),
      captcha_required: false,
      is_active: true,
      products: selectedProductIds.map((pId, idx) => ({
        product_id: pId,
        is_default: idx === 0,
        max_quantity: 10,
        sort_order: idx + 1
      }))
    });

    setNewLpName('');
    setNewLpSlug('');
    setNewLpShipping('50.00');
    setNewLpOrigins('*');
    setSelectedProductIds([]);
    setShowAddLp(false);
    onDataChanged();
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCmpName.trim() || !newCmpLpId) return;

    OrderService.saveCampaign({
      name: newCmpName.trim(),
      landing_page_id: newCmpLpId,
      public_id: 'cmp_pub_' + Math.random().toString(36).substring(2, 8),
      utm_source: newCmpSource.trim(),
      utm_medium: newCmpMedium.trim(),
      utm_campaign: newCmpCampaign.trim(),
      is_active: true
    });

    setNewCmpName('');
    setNewCmpCampaign('');
    setShowAddCampaign(false);
    onDataChanged();
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdSku.trim() || !newProdPrice.trim()) return;

    OrderService.saveProduct({
      name: newProdName.trim(),
      sku: newProdSku.trim().toUpperCase(),
      current_price: newProdPrice.trim(),
      description: newProdDesc.trim(),
      is_active: true
    });

    setNewProdName('');
    setNewProdSku('');
    setNewProdPrice('');
    setNewProdDesc('');
    setShowAddProduct(false);
    onDataChanged();
  };

  const toggleProductActive = (prod: Product) => {
    OrderService.saveProduct({
      ...prod,
      is_active: !prod.is_active
    });
    onDataChanged();
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyLabel.trim() || !newKeyLandingPageId) return;
    const res = OrderService.createApiCredential(
      newKeyLandingPageId,
      newKeyLabel.trim(),
      ['orders:create', 'orders:read_status']
    );
    setNewlyCreatedSecret(res.rawSecret);
    setCredentials(OrderService.getApiCredentials());
    setNewKeyLabel('');
    setShowAddKey(false);
    onDataChanged();
  };

  const handleRevokeKey = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في إبطال هذا المفتاح؟ لن تتمكن أي خوادم أو صفحات هبوط من استخدامه بعد الآن.')) {
      OrderService.revokeApiCredential(id);
      setCredentials(OrderService.getApiCredentials());
      onDataChanged();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span>كتالوج المنتجات وصفحات الهبوط والحملات</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            إدارة تسعير المنتجات، المعرفات العامة (Public IDs) للربط مع صفحات الهبوط، ومفاتيح الـ API
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg flex-wrap">
          <button
            onClick={() => setSubTab('products')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              subTab === 'products'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            المنتجات ({products.length})
          </button>
          <button
            onClick={() => setSubTab('landing-pages')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              subTab === 'landing-pages'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            صفحات الهبوط ({landingPages.length})
          </button>
          <button
            onClick={() => setSubTab('campaigns')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              subTab === 'campaigns'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            الحملات الإعلانية ({campaigns.length})
          </button>
          <button
            onClick={() => setSubTab('api-credentials')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
              subTab === 'api-credentials'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Key className="w-3 h-3" />
            <span>مفاتيح الـ API ({credentials.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: PRODUCTS */}
      {subTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-neutral-200">
              قائمة المنتجات المتاحة للتسعير والشحن
            </h2>
            <button
              onClick={() => setShowAddProduct(!showAddProduct)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة منتج جديد</span>
            </button>
          </div>

          {/* Add Product Modal/Form */}
          {showAddProduct && (
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
              <h3 className="text-xs font-semibold text-neutral-200">
                تسجيل منتج جديد بالكتالوج
              </h3>
              <form onSubmit={handleCreateProduct} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">اسم المنتج:</label>
                    <input
                      type="text"
                      required
                      value={newProdName}
                      onChange={e => setNewProdName(e.target.value)}
                      placeholder="مثال: حذاء كلاسيك أسود فاخر"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">كود SKU فريد:</label>
                    <input
                      type="text"
                      required
                      value={newProdSku}
                      onChange={e => setNewProdSku(e.target.value)}
                      placeholder="مثال: SHOE-OXF-BLK"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">السعر الحالي (ج.م):</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newProdPrice}
                      onChange={e => setNewProdPrice(e.target.value)}
                      placeholder="1450.00"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">وصف المنتج:</label>
                  <textarea
                    rows={2}
                    value={newProdDesc}
                    onChange={e => setNewProdDesc(e.target.value)}
                    placeholder="وصف الخامة والمميزات والمواصفات..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-neutral-100"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 text-neutral-950 font-bold rounded text-xs"
                  >
                    حفظ المنتج
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400">
                  <th className="py-2.5 px-3">المنتج</th>
                  <th className="py-2.5 px-3">كود SKU</th>
                  <th className="py-2.5 px-3">السعر الحالي</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3 text-center">تفعيل / تعطيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-neutral-800/40">
                    <td className="py-2.5 px-3 font-medium text-neutral-100">
                      <div>{p.name}</div>
                      {p.description && (
                        <div className="text-[10px] text-neutral-500 truncate max-w-xs">{p.description}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-300">
                      {p.sku}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-amber-400">
                      {formatMoney(p.current_price)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          p.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {p.is_active ? 'فعال ومتاح' : 'معطل'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => toggleProductActive(p)}
                        className="px-2.5 py-1 text-[11px] rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 cursor-pointer"
                      >
                        {p.is_active ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LANDING PAGES */}
      {subTab === 'landing-pages' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-neutral-200">
              صفحات الهبوط المربوطة بالخادم (Landing Pages & Public IDs)
            </h2>
            <button
              onClick={() => setShowAddLp(!showAddLp)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md transition-colors cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صفحة هبوط جديدة</span>
            </button>
          </div>

          {/* Add Landing Page Form */}
          {showAddLp && (
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
              <h3 className="text-xs font-semibold text-neutral-200">
                تسجيل صفحة هبوط جديدة وتوليد Public ID
              </h3>
              <form onSubmit={handleCreateLandingPage} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">اسم الصفحة:</label>
                    <input
                      type="text"
                      required
                      value={newLpName}
                      onChange={e => setNewLpName(e.target.value)}
                      placeholder="مثال: عرض الحذاء الكلاسيك الأسود"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">المسار (Slug):</label>
                    <input
                      type="text"
                      required
                      value={newLpSlug}
                      onChange={e => setNewLpSlug(e.target.value)}
                      placeholder="classic-black-oxford"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">الشحن الافتراضي (ج.م):</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newLpShipping}
                      onChange={e => setNewLpShipping(e.target.value)}
                      placeholder="50.00"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">النطاقات المصرح بها (Origins):</label>
                    <input
                      type="text"
                      value={newLpOrigins}
                      onChange={e => setNewLpOrigins(e.target.value)}
                      placeholder="*, https://store.eg"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                </div>

                {/* Product selection */}
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1.5">
                    المنتجات المسموح بطلبها من هذه الصفحة:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-neutral-900 border border-neutral-800 rounded">
                    {products.map(p => {
                      const isChecked = selectedProductIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer p-1 rounded hover:bg-neutral-800"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedProductIds(prev =>
                                isChecked ? prev.filter(id => id !== p.id) : [...prev, p.id]
                              );
                            }}
                            className="rounded border-neutral-700 bg-neutral-950 text-amber-500"
                          />
                          <span className="truncate">{p.name} ({p.sku})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setShowAddLp(false)}
                    className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded text-xs"
                  >
                    إنشاء صفحة الهبوط
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {landingPages.map(lp => (
              <div
                key={lp.id}
                className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      slug: {lp.slug}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        lp.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {lp.is_active ? 'فعالة' : 'معطلة'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-neutral-100">{lp.name}</h3>

                  <div className="mt-3 space-y-1.5 text-xs text-neutral-300">
                    <div className="flex items-center justify-between bg-neutral-950 p-2 rounded border border-neutral-800">
                      <div>
                        <span className="text-[10px] text-neutral-500 block">المعرف العام (Public ID):</span>
                        <span className="font-mono text-amber-400 font-semibold">{lp.public_id}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(lp.public_id, lp.id)}
                        className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 cursor-pointer"
                        title="نسخ المعرف"
                      >
                        {copiedId === lp.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex justify-between pt-1">
                      <span className="text-neutral-500">الشحن الافتراضي:</span>
                      <span className="font-mono tabular-nums text-neutral-200">
                        {lp.default_shipping_fee === '0.00' ? 'مجاني' : formatMoney(lp.default_shipping_fee)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-500">التحقق من كابتشا:</span>
                      <span className="text-neutral-300">{lp.captcha_required ? 'مطلوب' : 'غير مفعل'}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-500">المنتجات المرتبطة:</span>
                      <span className="font-mono text-neutral-300">{lp.products.length} منتجات</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-500">
                  النطاقات المصرح بها: {lp.allowed_origins.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CAMPAIGNS */}
      {subTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-neutral-200">
              الحملات الإعلانية ومعرفات الإسناد (Campaign Public IDs & UTM)
            </h2>
            <button
              onClick={() => {
                setShowAddCampaign(!showAddCampaign);
                if (landingPages.length > 0 && !newCmpLpId) {
                  setNewCmpLpId(landingPages[0].id);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md transition-colors cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حملة إعلانية جديدة</span>
            </button>
          </div>

          {/* Add Campaign Form */}
          {showAddCampaign && (
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
              <h3 className="text-xs font-semibold text-neutral-200">
                تسجيل حملة إعلانية جديدة وتوليد Public Campaign ID
              </h3>
              <form onSubmit={handleCreateCampaign} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">اسم الحملة الداخلي:</label>
                    <input
                      type="text"
                      required
                      value={newCmpName}
                      onChange={e => setNewCmpName(e.target.value)}
                      placeholder="مثال: إعلانات تيك توك كلاسيك"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">صفحة الهبوط المستهدفة:</label>
                    <select
                      value={newCmpLpId}
                      onChange={e => setNewCmpLpId(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100"
                    >
                      {landingPages.map(lp => (
                        <option key={lp.id} value={lp.id}>
                          {lp.name} ({lp.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">المصدر (utm_source):</label>
                    <input
                      type="text"
                      value={newCmpSource}
                      onChange={e => setNewCmpSource(e.target.value)}
                      placeholder="tiktok / facebook / snapchat"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">الوسيط (utm_medium):</label>
                    <input
                      type="text"
                      value={newCmpMedium}
                      onChange={e => setNewCmpMedium(e.target.value)}
                      placeholder="cpc / video_views"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-neutral-400 mb-1">اسم الحملة الإعلانية (utm_campaign):</label>
                    <input
                      type="text"
                      value={newCmpCampaign}
                      onChange={e => setNewCmpCampaign(e.target.value)}
                      placeholder="oxford_black_nov2026"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setShowAddCampaign(false)}
                    className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded text-xs"
                  >
                    حفظ الحملة
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400">
                  <th className="py-2.5 px-3">اسم الحملة</th>
                  <th className="py-2.5 px-3">المعرف العام (Public ID)</th>
                  <th className="py-2.5 px-3">المصدر (utm_source)</th>
                  <th className="py-2.5 px-3">الوسيط (utm_medium)</th>
                  <th className="py-2.5 px-3">اسم الحملة (utm_campaign)</th>
                  <th className="py-2.5 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-neutral-800/40">
                    <td className="py-2.5 px-3 font-medium text-neutral-100">
                      {c.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-amber-400 font-semibold">
                      {c.public_id}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-300">
                      {c.utm_source || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-300">
                      {c.utm_medium || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-300">
                      {c.utm_campaign || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-400">
                        {c.is_active ? 'نشطة' : 'معطلة'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: API CREDENTIALS */}
      {subTab === 'api-credentials' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>مفاتيح الربط البرمجي (Server API Keys & Authentication)</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                تُستخدم للمصادقة عبر ترويسة <code className="font-mono text-amber-300">X-API-Key: mk_live_...</code> لإنشاء الطلبات من خوادم الواجهة الخلفية أو Webhooks
              </p>
            </div>

            <button
              onClick={() => {
                setShowAddKey(true);
                if (landingPages.length > 0 && !newKeyLandingPageId) {
                  setNewKeyLandingPageId(landingPages[0].id);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer self-start sm:self-auto shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>توليد مفتاح API جديد</span>
            </button>
          </div>

          {/* Newly Generated Secret Banner */}
          {newlyCreatedSecret && (
            <div className="p-4 bg-amber-950/40 border-2 border-amber-500 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>تنبيه أمني هام: انسخ المفتاح السري الآن!</span>
                </div>
                <button
                  onClick={() => setNewlyCreatedSecret(null)}
                  className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                هذه هي المرة الوحيدة التي سيظهر فيها هذا المفتاح الخام بصيغة مقروءة. لن يتم حفظه في قاعدة البيانات بهذا الشكل وإنما كقيمة تجزئة مشفرة (Hash).
              </p>
              <div className="flex items-center justify-between gap-2 bg-neutral-950 p-2.5 rounded border border-amber-500/50 mt-1">
                <code className="font-mono text-xs text-amber-400 select-all font-bold tracking-wider break-all">
                  {newlyCreatedSecret}
                </code>
                <button
                  onClick={() => handleCopy(newlyCreatedSecret, 'new-secret')}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedId === 'new-secret' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ المفتاح</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Create Key Modal */}
          {showAddKey && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2 text-neutral-100 font-bold text-sm">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>إنشاء مفتاح برمجى (API Key)</span>
                  </div>
                  <button
                    onClick={() => setShowAddKey(false)}
                    className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleGenerateKey} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      تسمية المفتاح / الغرض:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: سيرفر ووردبريس أو بوت تلجرام أو ClickFunnels"
                      value={newKeyLabel}
                      onChange={e => setNewKeyLabel(e.target.value)}
                      required
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      صفحة الهبوط المرتبطة:
                    </label>
                    <select
                      value={newKeyLandingPageId}
                      onChange={e => setNewKeyLandingPageId(e.target.value)}
                      required
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                    >
                      {landingPages.map(lp => (
                        <option key={lp.id} value={lp.id}>
                          {lp.name} ({lp.public_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      نطاق الصلاحيات (Scopes):
                    </label>
                    <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 space-y-1 text-neutral-400 text-[11px]">
                      <div className="flex items-center gap-1.5 text-neutral-200 font-mono">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>orders:create (إنشاء طلبات الشراء)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-200 font-mono">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>orders:read_status (الاستعلام عن حالة الطلب)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddKey(false)}
                      className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold cursor-pointer"
                    >
                      توليد المفتاح الآن
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Credentials Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400">
                  <th className="py-2.5 px-3">التسمية والسيرفر</th>
                  <th className="py-2.5 px-3">صفحة الهبوط المرتبطة</th>
                  <th className="py-2.5 px-3">المعرف العام (Public Key ID)</th>
                  <th className="py-2.5 px-3">تجزئة السر (Secret Hash)</th>
                  <th className="py-2.5 px-3">الصلاحيات</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3">آخر استخدام</th>
                  <th className="py-2.5 px-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {credentials.map(c => {
                  const lp = landingPages.find(l => l.id === c.landing_page_id);
                  return (
                    <tr key={c.id} className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-3 font-medium text-neutral-100">
                        {c.label}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-300">
                        {lp ? lp.name : c.landing_page_id}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-amber-400 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span>{c.public_key_id}</span>
                          <button
                            onClick={() => handleCopy(c.public_key_id, c.id)}
                            className="text-neutral-500 hover:text-neutral-300 cursor-pointer"
                            title="نسخ المعرف العام"
                          >
                            {copiedId === c.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-500 text-[11px]">
                        {c.secret_hash}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-1 flex-wrap">
                          {c.scopes.map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-[10px] font-mono text-neutral-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            c.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {c.is_active ? 'نشط ومصرح' : 'ملغي ومبطل'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-400">
                        {c.last_used_at ? new Date(c.last_used_at).toLocaleDateString('ar-EG') : 'لم يستخدم بعد'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {c.is_active ? (
                          <button
                            onClick={() => handleRevokeKey(c.id)}
                            className="px-2 py-1 text-[11px] text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/40 rounded transition-colors cursor-pointer"
                            title="إبطال المفتاح فورًا"
                          >
                            إبطال
                          </button>
                        ) : (
                          <span className="text-[10px] text-neutral-600">تم الإبطال</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
