import React from 'react';
import { ShieldCheck, RefreshCw, Send, AlertTriangle, Clock, UserCheck } from 'lucide-react';
import { UserSession } from '../types';

export type TabType =
  | 'dashboard'
  | 'orders'
  | 'duplicates'
  | 'follow-ups'
  | 'customers'
  | 'catalog'
  | 'simulator'
  | 'api-docs'
  | 'audit'
  | 'settings';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingDuplicatesCount: number;
  openFollowUpsCount: number;
  onResetData: () => void;
  session: UserSession;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingDuplicatesCount,
  openFollowUpsCount,
  onResetData,
  session,
  onOpenAuth
}) => {
  const navItems: { id: TabType; label: string; badge?: number }[] = [
    { id: 'dashboard', label: 'لوحة المؤشرات' },
    { id: 'orders', label: 'الطلبات' },
    {
      id: 'duplicates',
      label: 'مراجعة التكرار',
      badge: pendingDuplicatesCount > 0 ? pendingDuplicatesCount : undefined
    },
    {
      id: 'follow-ups',
      label: 'المتابعات',
      badge: openFollowUpsCount > 0 ? openFollowUpsCount : undefined
    },
    { id: 'customers', label: 'العملاء' },
    { id: 'catalog', label: 'المنتجات والصفحات' },
    { id: 'simulator', label: 'محاكي الطلب (API)' },
    { id: 'api-docs', label: 'وثائق الـ API' },
    { id: 'audit', label: 'سجل التدقيق' },
    { id: 'settings', label: 'الإعدادات' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-right cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-base font-bold text-neutral-100 tracking-tight whitespace-nowrap">
                  ماركوس <span className="text-amber-400 font-mono text-sm font-semibold">Markose OMS</span>
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 overflow-x-auto py-1">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-neutral-800 text-amber-400 border border-neutral-700 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="bg-rose-500 text-white font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="جلسة المالك والحماية (Section 10)"
            >
              <span className={`w-2 h-2 rounded-full ${session.is_authenticated ? 'bg-emerald-500' : 'bg-neutral-600'}`} />
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{session.display_name}</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-sm font-sans cursor-pointer"
              title="محاكاة تجربة العميل وإرسال طلب من صفحة هبوط"
            >
              <Send className="w-3.5 h-3.5" />
              <span>محاكاة طلب جديد</span>
            </button>

            <button
              onClick={onResetData}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="إعادة تعيين البيانات الافتراضية"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إعادة ضبط</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto pb-2 pt-1 border-t border-neutral-900 scrollbar-none">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 flex items-center gap-1 ${
                  isActive
                    ? 'bg-neutral-800 text-amber-400 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
