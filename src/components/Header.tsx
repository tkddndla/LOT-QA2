import React from 'react';
import { SyncStatusState } from '../types/inventory';
import { RefreshCw, Search, PlusCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'search' | 'register';
  setActiveTab: (tab: 'search' | 'register') => void;
  syncState: SyncStatusState;
  syncMessage: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  syncState,
  syncMessage,
  onRefresh,
  isRefreshing,
}) => {
  const getDotClass = () => {
    switch (syncState) {
      case 'connected':
        return 'bg-green-400';
      case 'syncing':
        return 'bg-amber-300 animate-pulse';
      case 'offline':
        return 'bg-amber-400';
      case 'error':
      default:
        return 'bg-red-300';
    }
  };

  return (
    <header className="bg-primary text-white shadow-lg w-full sticky top-0 z-40">
      <div className="w-full px-5 py-4 max-w-xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center space-x-2">
            <span className="text-2xl sm:text-3xl">📦</span>
            <span>공관 입고 관리 시스템</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sync badge with ALWAYS-VISIBLE text label */}
          <div
            className="flex items-center space-x-2 text-xs sm:text-sm bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-inner"
          >
            <span className={`w-3 h-3 rounded-full ${getDotClass()}`} />
            <span className="font-extrabold text-white text-xs sm:text-sm">{syncMessage}</span>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all active:scale-95 disabled:opacity-50"
            title="새로고침 (동기화)"
            aria-label="데이터 새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Large Tab Navigation */}
      <div className="border-t border-red-700/60 bg-red-900/30 w-full p-2.5">
        <div className="max-w-xl mx-auto flex gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3.5 text-center transition-all text-base flex items-center justify-center space-x-2 rounded-2xl ${
              activeTab === 'search'
                ? 'font-black text-white bg-white/30 shadow-md border border-white/30'
                : 'font-bold text-red-100 hover:bg-white/10'
            }`}
          >
            <Search className="w-5 h-5" />
            <span>입고 조회</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3.5 text-center transition-all text-base flex items-center justify-center space-x-2 rounded-2xl ${
              activeTab === 'register'
                ? 'font-black text-white bg-white/30 shadow-md border border-white/30'
                : 'font-bold text-red-100 hover:bg-white/10'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span>품목/로트 등록</span>
          </button>
        </div>
      </div>
    </header>
  );
};
