import React, { useState } from 'react';
import { InventoryProduct } from '../types/inventory';
import { X, Plus, Hash, Calendar, History, Sparkles } from 'lucide-react';

interface DetailModalProps {
  product: InventoryProduct | null;
  onClose: () => void;
  onAddLot: (product: InventoryProduct, lot: string) => Promise<boolean>;
  isAdding: boolean;
  onShowToast?: (type: 'error' | 'success' | 'info', title: string, desc?: string) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  product,
  onClose,
  onAddLot,
  isAdding,
  onShowToast,
}) => {
  const [newLotInput, setNewLotInput] = useState('');

  if (!product) return null;

  const handleQuickAdd = async () => {
    const normalized = newLotInput.trim().toUpperCase();
    if (!normalized) {
      onShowToast?.('error', '입력 확인', '추가할 로트 번호를 입력해주세요.');
      return;
    }

    const success = await onAddLot(product, normalized);
    if (success) {
      setNewLotInput('');
    }
  };

  const generateTodayLotTemplate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setNewLotInput(`LOT-${yyyy}${mm}${dd}-01`);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <div className="font-black text-gray-900 text-lg leading-tight">
              {product.name}
            </div>
            <div className="text-xs font-bold text-gray-500 mt-0.5">
              {product.capacity} · {product.material} (총 {product.lots.length}회 입고)
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 font-black flex items-center justify-center text-sm hover:bg-gray-200 transition-colors"
            aria-label="모달 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lot History List */}
        <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 max-h-60">
          <div className="text-xs font-black text-gray-500 flex items-center space-x-1 mb-2 px-1">
            <History className="w-3.5 h-3.5" />
            <span>누적 입고 이력</span>
          </div>

          {product.lots.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-8 font-bold bg-gray-50 rounded-2xl">
              입고 이력이 없습니다.
            </div>
          ) : (
            product.lots.map((l, idx) => (
              <div
                key={`${l.lot}-${idx}`}
                className="bg-gray-50 p-3.5 rounded-2xl text-xs sm:text-sm flex justify-between items-center font-extrabold border border-gray-200/60"
              >
                <div className="flex items-center space-x-1.5">
                  <Hash className="w-4 h-4 text-primary" />
                  <span>LOT:</span>
                  <strong className="text-gray-900 text-sm font-black ml-0.5">
                    {l.lot}
                  </strong>
                  {idx === 0 && (
                    <span className="text-[10px] bg-red-100 text-primary font-black px-1.5 py-0.5 rounded ml-1">
                      최신
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-gray-500 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{l.date}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Add Lot in Modal */}
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black text-gray-800">새 로트 추가</span>
            <button
              type="button"
              onClick={generateTodayLotTemplate}
              className="text-[11px] text-primary font-black flex items-center space-x-1 hover:underline"
            >
              <Sparkles className="w-3 h-3" />
              <span>오늘 날짜 형식</span>
            </button>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newLotInput}
              onChange={(e) => setNewLotInput(e.target.value.toUpperCase())}
              placeholder="추가할 로트번호 (예: LOT-20261023-02)"
              className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-2xl text-xs sm:text-sm font-black uppercase placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleQuickAdd();
                }
              }}
            />
            <button
              type="button"
              disabled={isAdding}
              onClick={handleQuickAdd}
              className="px-5 py-3 bg-primary hover:bg-primaryDark text-white font-black rounded-2xl text-xs sm:text-sm shadow transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-1 whitespace-nowrap"
            >
              {isAdding ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>추가</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold rounded-2xl text-sm transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
};
