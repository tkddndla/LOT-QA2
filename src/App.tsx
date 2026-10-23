/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { InventoryProduct, RegistrationMode, SyncStatusState } from './types/inventory';
import {
  fetchInventoryFromGas,
  addLotToGas,
  getCachedInventory,
  saveCachedInventory,
} from './services/gasApi';
import { Header } from './components/Header';
import { SearchTab } from './components/SearchTab';
import { RegisterTab } from './components/RegisterTab';
import { DetailModal } from './components/DetailModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [products, setProducts] = useState<InventoryProduct[]>(() => getCachedInventory());
  const [activeTab, setActiveTab] = useState<'search' | 'register'>('search');
  const [syncState, setSyncState] = useState<SyncStatusState>('syncing');
  const [syncMessage, setSyncMessage] = useState('동기화 중');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load data from Google Apps Script
  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    setSyncState('syncing');
    setSyncMessage('동기화 중');

    const result = await fetchInventoryFromGas();

    if (result.success) {
      setProducts(result.products);
      setSyncState('connected');
      setSyncMessage('연동 완료');
      if (isManualRefresh) {
        addToast('success', '동기화 완료', '구글 시트의 최신 데이터를 가져왔습니다.');
      }
    } else {
      // Use cached/demo products
      setProducts(result.products);
      setSyncState(result.isDemo ? 'offline' : 'error');
      setSyncMessage(result.isDemo ? '캐시/데모 모드' : '통신 오류');
      if (isManualRefresh) {
        addToast(
          'info',
          '오프라인/캐시 모드',
          result.message || '스프레드시트 응답이 없어 캐시 데이터를 표시합니다.'
        );
      }
    }

    if (isManualRefresh) setIsRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit from Register Tab
  const handleRegisterSubmit = async (params: {
    mode: RegistrationMode;
    name: string;
    capacity: string;
    material: string;
    lot: string;
  }): Promise<boolean> => {
    setIsSubmitting(true);
    const today = new Date().toISOString().slice(0, 10);
    const prodId = `${params.name}__${params.capacity}__${params.material}`;

    // 1. Optimistic local state update
    setProducts((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === prodId);
      let updated: InventoryProduct[];

      if (existingIdx >= 0) {
        updated = [...prev];
        const target = { ...updated[existingIdx] };
        target.lots = [{ lot: params.lot, date: today }, ...target.lots];
        updated[existingIdx] = target;
      } else {
        const newProduct: InventoryProduct = {
          id: prodId,
          name: params.name,
          capacity: params.capacity,
          material: params.material,
          lots: [{ lot: params.lot, date: today }],
        };
        updated = [newProduct, ...prev];
      }

      saveCachedInventory(updated);
      return updated;
    });

    // 2. Dispatch to GAS Web App API
    const result = await addLotToGas({
      name: params.name,
      capacity: params.capacity,
      material: params.material,
      lot: params.lot,
    });

    setIsSubmitting(false);

    if (result.success) {
      addToast(
        'success',
        '로트 등록 완료',
        `${params.name} (${params.capacity}) - LOT: ${params.lot}`
      );
      // Switch back to search tab to view the registered lot
      setActiveTab('search');
      return true;
    } else {
      addToast('error', '등록 실패', result.message);
      return false;
    }
  };

  // Add lot directly from DetailModal
  const handleAddLotFromModal = async (
    product: InventoryProduct,
    lot: string
  ): Promise<boolean> => {
    setIsSubmitting(true);
    const today = new Date().toISOString().slice(0, 10);

    // 1. Optimistic update
    const updatedProduct = {
      ...product,
      lots: [{ lot, date: today }, ...product.lots],
    };

    setSelectedProduct(updatedProduct);

    setProducts((prev) => {
      const next = prev.map((p) => (p.id === product.id ? updatedProduct : p));
      saveCachedInventory(next);
      return next;
    });

    // 2. Dispatch to GAS Web App API
    const result = await addLotToGas({
      name: product.name,
      capacity: product.capacity,
      material: product.material,
      lot,
    });

    setIsSubmitting(false);

    if (result.success) {
      addToast('success', '새 로트 추가 완료', `LOT: ${lot}`);
      return true;
    } else {
      addToast('error', '로트 추가 실패', result.message);
      return false;
    }
  };

  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen flex flex-col font-sans w-full m-0 p-0 antialiased selection:bg-red-200">
      {/* Header with large tabs and sync badge */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        syncState={syncState}
        syncMessage={syncMessage}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area (Mobile-optimized max-w-xl) */}
      <main className="flex-1 w-full p-4 space-y-5 max-w-xl mx-auto">
        {activeTab === 'search' ? (
          <SearchTab
            products={products}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onGoToRegister={() => setActiveTab('register')}
          />
        ) : (
          <RegisterTab
            products={products}
            onSubmit={handleRegisterSubmit}
            isSubmitting={isSubmitting}
            onShowToast={addToast}
          />
        )}
      </main>

      {/* Lot History Detail & Quick Add Modal */}
      <DetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddLot={handleAddLotFromModal}
        isAdding={isSubmitting}
        onShowToast={addToast}
      />

      {/* Settings & Deployment Guide Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => loadData(true)}
      />

      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <footer className="py-6 text-center text-xs sm:text-sm text-gray-500 font-bold space-y-1">
        <div>공관 입고 관리 시스템 • Cloudflare Pages &amp; Google Apps Script</div>
        <div className="text-[11px] text-gray-400">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hover:text-primary transition-colors underline"
          >
            연동 설정 및 Code.gs 코드 보기
          </button>
        </div>
      </footer>
    </div>
  );
}
