import React, { useState, useMemo } from 'react';
import { InventoryProduct, RegistrationMode } from '../types/inventory';
import { matchQuery } from '../utils/hangul';
import { PlusCircle, Search, CheckCircle2, Calendar, Sparkles } from 'lucide-react';

interface RegisterTabProps {
  products: InventoryProduct[];
  onSubmit: (params: {
    mode: RegistrationMode;
    name: string;
    capacity: string;
    material: string;
    lot: string;
  }) => Promise<boolean>;
  isSubmitting: boolean;
  onShowToast?: (type: 'error' | 'success' | 'info', title: string, desc?: string) => void;
}

export const RegisterTab: React.FC<RegisterTabProps> = ({
  products,
  onSubmit,
  isSubmitting,
  onShowToast,
}) => {
  const [mode, setMode] = useState<RegistrationMode>('new');

  // New product fields
  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [newMaterial, setNewMaterial] = useState('스틸 (ST)');

  // Existing product fields
  const [existingSearch, setExistingSearch] = useState('');
  const [filterCapacity, setFilterCapacity] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // LOT input
  const [lotInput, setLotInput] = useState('');

  // Capacity & Material sets for dropdowns
  const { capacityOptions, materialOptions } = useMemo(() => {
    const caps = new Set<string>();
    const mats = new Set<string>();
    products.forEach((p) => {
      if (p.capacity) caps.add(p.capacity);
      if (p.material) mats.add(p.material);
    });
    return {
      capacityOptions: Array.from(caps),
      materialOptions: Array.from(mats),
    };
  }, [products]);

  // Filtered existing products list
  const filteredExistingProducts = useMemo(() => {
    return products.filter((p) => {
      const matchName = matchQuery(p.name, existingSearch);
      const matchCap = !filterCapacity || p.capacity === filterCapacity;
      const matchMat = !filterMaterial || p.material === filterMaterial;
      return matchName && matchCap && matchMat;
    });
  }, [products, existingSearch, filterCapacity, filterMaterial]);

  // Set selected product automatically if first time or selection cleared
  React.useEffect(() => {
    if (mode === 'add' && !selectedProductId && filteredExistingProducts.length > 0) {
      setSelectedProductId(filteredExistingProducts[0].id);
    }
  }, [mode, filteredExistingProducts, selectedProductId]);

  // Quick LOT number generator helper (e.g. LOT-YYYYMMDD-01)
  const generateTodayLotTemplate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setLotInput(`LOT-${yyyy}${mm}${dd}-01`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedLot = lotInput.trim().toUpperCase();
    if (!normalizedLot) {
      onShowToast?.('error', '입력 확인', '추가할 로트 번호를 입력해주세요.');
      return;
    }

    let finalName = '';
    let finalCapacity = '';
    let finalMaterial = '';

    if (mode === 'new') {
      finalName = newName.trim();
      finalCapacity = newCapacity.trim();
      finalMaterial = newMaterial.trim();

      if (!finalName || !finalCapacity) {
        onShowToast?.('error', '입력 확인', '품목명과 용량을 입력해주세요.');
        return;
      }
    } else {
      const target = products.find((p) => p.id === selectedProductId);
      if (!target) {
        onShowToast?.('error', '입력 확인', '목록에서 품목을 선택해주세요.');
        return;
      }
      finalName = target.name;
      finalCapacity = target.capacity;
      finalMaterial = target.material;
    }

    const ok = await onSubmit({
      mode,
      name: finalName,
      capacity: finalCapacity,
      material: finalMaterial,
      lot: normalizedLot,
    });

    if (ok) {
      // Reset form
      setLotInput('');
      if (mode === 'new') {
        setNewName('');
        setNewCapacity('');
      }
    }
  };

  return (
    <section className="space-y-5 w-full">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-6 w-full">
        {/* Registration Mode Segment Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`py-3.5 text-sm font-black rounded-xl transition-all ${
              mode === 'new'
                ? 'bg-white text-primary shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            신규 품목 등록
          </button>
          <button
            type="button"
            onClick={() => setMode('add')}
            className={`py-3.5 text-sm font-black rounded-xl transition-all ${
              mode === 'add'
                ? 'bg-white text-primary shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            기존 품목 새 로트
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. NEW PRODUCT FIELDS */}
          {mode === 'new' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black text-gray-800 mb-2">
                  품목명 <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: 레쓰비 마일드"
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-2xl text-base font-extrabold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8">
                  <label className="block text-sm font-black text-gray-800 mb-2">
                    용량 <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    placeholder="예: 160ml, 250ml"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-2xl text-base font-extrabold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    required
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-sm font-black text-gray-800 mb-2">
                    재질
                  </label>
                  <select
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    className="w-full px-3 py-4 bg-gray-50 border-2 border-gray-300 rounded-2xl text-sm font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="스틸 (ST)">스틸 (ST)</option>
                    <option value="알루미늄 (AL)">알루미늄 (AL)</option>
                    <option value="PET">PET</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* 2. EXISTING PRODUCT FIELDS */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black text-gray-800 mb-1.5">
                  품목 검색 (초성/띄어쓰기 지원)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={existingSearch}
                    onChange={(e) => setExistingSearch(e.target.value)}
                    placeholder="품목명 검색... (예: ㄹㅆㅂ)"
                    className="w-full pl-5 pr-10 py-3.5 bg-gray-50 border-2 border-gray-300 rounded-2xl text-base font-extrabold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">
                    용량 필터
                  </label>
                  <select
                    value={filterCapacity}
                    onChange={(e) => setFilterCapacity(e.target.value)}
                    className="w-full p-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-sm font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">모든 용량</option>
                    {capacityOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">
                    재질 필터
                  </label>
                  <select
                    value={filterMaterial}
                    onChange={(e) => setFilterMaterial(e.target.value)}
                    className="w-full p-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-sm font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">모든 재질</option>
                    {materialOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select Existing Product List */}
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">
                  등록 대상 품목 선택 ({filteredExistingProducts.length}개)
                </label>
                <div className="max-h-48 overflow-y-auto border-2 border-gray-300 rounded-2xl bg-gray-50 divide-y divide-gray-200">
                  {filteredExistingProducts.length === 0 ? (
                    <div className="p-4 text-sm text-gray-400 font-bold text-center">
                      조건에 맞는 품목이 없습니다.
                    </div>
                  ) : (
                    filteredExistingProducts.map((p) => {
                      const isSelected = selectedProductId === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedProductId(p.id)}
                          className={`p-3.5 cursor-pointer flex justify-between items-center transition-all ${
                            isSelected
                              ? 'bg-red-50 text-primary font-black border-l-4 border-primary'
                              : 'hover:bg-white text-gray-800 font-bold'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-black">{p.name}</div>
                            <div className="text-xs text-gray-500 font-bold">
                              {p.capacity} / {p.material} · 로트 {p.lots.length}건
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. LOT NUMBER INPUT (COMMON) */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-black text-gray-800">
                추가할 로트 번호 <span className="text-primary">*</span>
              </label>
              <button
                type="button"
                onClick={generateTodayLotTemplate}
                className="text-xs text-primary font-black flex items-center space-x-1 hover:underline active:opacity-70"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>오늘 날짜 형식 생성</span>
              </button>
            </div>
            <input
              type="text"
              value={lotInput}
              onChange={(e) => setLotInput(e.target.value.toUpperCase())}
              placeholder="예: LOT-20261023-01"
              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-2xl text-base font-black uppercase tracking-wide text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4.5 bg-primary hover:bg-primaryDark text-white font-black rounded-2xl shadow-lg text-lg transition-all active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>스프레드시트에 등록 중...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5" />
                <span>등록하기</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </section>
  );
};
