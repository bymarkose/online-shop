import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { OrderDetailModal } from './components/OrderDetailModal';
import { DuplicatesView } from './components/DuplicatesView';
import { FollowUpsView } from './components/FollowUpsView';
import { CustomersView } from './components/CustomersView';
import { CatalogView } from './components/CatalogView';
import { SimulatorView } from './components/SimulatorView';
import { ApiDocsView } from './components/ApiDocsView';
import { AuditLogsView } from './components/AuditLogsView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { OrderService } from './lib/orderService';
import {
  Order,
  Customer,
  Product,
  LandingPage,
  Campaign,
  FollowUpTask,
  DuplicateFlag,
  AuditLog,
  Settings,
  UserSession
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Owner Session State (Section 10)
  const [session, setSession] = useState<UserSession>(() => {
    try {
      const stored = localStorage.getItem('markose_owner_session');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      user_id: 'usr-owner-001',
      email: 'owner@markose.eg',
      display_name: 'مالك المتجر (Admin)',
      token: 'sess_live_' + Math.random().toString(36).substring(2, 10),
      is_authenticated: true,
      expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString()
    };
  });

  const handleLogin = (email: string, pass: string): boolean => {
    if (pass === 'Markose2026!Secure' || pass.length >= 6) {
      const newSession: UserSession = {
        user_id: 'usr-owner-001',
        email: email.toLowerCase().trim(),
        display_name: 'مالك المتجر (Admin)',
        token: 'sess_live_' + Math.random().toString(36).substring(2, 12),
        is_authenticated: true,
        expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString()
      };
      setSession(newSession);
      localStorage.setItem('markose_owner_session', JSON.stringify(newSession));
      OrderService.logAudit('OWNER_LOGIN', 'session', newSession.token, null, { email });
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    const unauthenticatedSession: UserSession = {
      ...session,
      is_authenticated: false,
      token: ''
    };
    setSession(unauthenticatedSession);
    localStorage.setItem('markose_owner_session', JSON.stringify(unauthenticatedSession));
    OrderService.logAudit('OWNER_LOGOUT', 'session', session.token, null, { email: session.email });
  };

  // Loaded Entities from OrderService
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpTask[]>([]);
  const [duplicateFlags, setDuplicateFlags] = useState<DuplicateFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<Settings>(OrderService.getSettings());

  const reloadData = useCallback(() => {
    setOrders(OrderService.getOrders());
    setCustomers(OrderService.getCustomers());
    setProducts(OrderService.getProducts());
    setLandingPages(OrderService.getLandingPages());
    setCampaigns(OrderService.getCampaigns());
    setFollowUps(OrderService.getFollowUps());
    setDuplicateFlags(OrderService.getDuplicateFlags());
    setAuditLogs(OrderService.getAuditLogs());
    setSettings(OrderService.getSettings());
  }, []);

  useEffect(() => {
    reloadData();
    const unsubscribe = OrderService.subscribe(() => {
      reloadData();
    });
    return unsubscribe;
  }, [reloadData, refreshTrigger]);

  const handleResetData = () => {
    if (window.confirm('هل تريد بالتأكيد إعادة تعيين جميع البيانات التجريبية لحالتها الأولية؟')) {
      OrderService.resetToSeedData();
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleDataChanged = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const pendingDuplicatesCount = duplicateFlags.filter(f => f.status === 'PENDING').length;
  const openFollowUpsCount = followUps.filter(f => f.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingDuplicatesCount={pendingDuplicatesCount}
        openFollowUpsCount={openFollowUpsCount}
        onResetData={handleResetData}
        session={session}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            orders={orders}
            onSelectOrder={id => setSelectedOrderId(id)}
            onNavigateToTab={tab => setActiveTab(tab)}
            pendingDuplicatesCount={pendingDuplicatesCount}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            onSelectOrder={id => setSelectedOrderId(id)}
            onOpenSimulator={() => setActiveTab('simulator')}
            onOrderUpdated={handleDataChanged}
          />
        )}

        {activeTab === 'duplicates' && (
          <DuplicatesView
            flags={duplicateFlags}
            orders={orders}
            onOrderUpdated={handleDataChanged}
            onSelectOrder={id => setSelectedOrderId(id)}
          />
        )}

        {activeTab === 'follow-ups' && (
          <FollowUpsView
            tasks={followUps}
            onTaskUpdated={handleDataChanged}
            onSelectOrder={id => setSelectedOrderId(id)}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView
            customers={customers}
            orders={orders}
            onSelectOrder={id => setSelectedOrderId(id)}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogView
            products={products}
            landingPages={landingPages}
            campaigns={campaigns}
            onDataChanged={handleDataChanged}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorView
            landingPages={landingPages}
            campaigns={campaigns}
            products={products}
            onOrderCreated={handleDataChanged}
            onNavigateToOrder={id => setSelectedOrderId(id)}
          />
        )}

        {activeTab === 'api-docs' && (
          <ApiDocsView />
        )}

        {activeTab === 'audit' && (
          <AuditLogsView logs={auditLogs} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSettingsUpdated={handleDataChanged}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Order Detail Drawer / Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onOrderUpdated={handleDataChanged}
          onNavigateToOrder={targetId => setSelectedOrderId(targetId)}
        />
      )}

      {/* Owner Session / Auth Modal */}
      {showAuthModal && (
        <AuthModal
          session={session}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-900 bg-neutral-950 py-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>نظام ماركوس لإدارة الطلبات Markose OMS · إصدار المعمارية 1.0</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-400">
            <span>التوقيت: إفريقيا/القاهرة (UTC+2)</span>
            <span>·</span>
            <span>العملة: الجنيه المصري (EGP)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
