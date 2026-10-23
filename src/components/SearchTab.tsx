import React, { useState, useMemo } from 'react';
import { InventoryProduct } from '../types/inventory';
import { matchQuery } from '../utils/hangul';
import { Search, X, PackageX, Calendar, Hash, Layers } from 'lucide-react';

interface SearchTabProps {
  products: InventoryProduct[];
  onSelectProduct: (product: InventoryProduct) => void;
  onGoToRegister: () => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({
  products,
  onSelectProduct,
  onGoToRegister,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('all');

  // Only products that have at least one lot record (as in original GAS logic)
  const activeProducts = useMemo(() => {
    return products.filter((item) => item.lots.length > 0);
  }, [products]);

  // Filtered by search query (Korean chosung supported) and material
  const filteredProducts = useMemo(() => {
    return activeProducts.filter((item) => {
      // Material filter
      if (selectedMaterialFilter !== 'all') {
        if (!item.material.includes(selectedMaterialFilter)) {
          return false;
        }
      }

      // Query filter
      if (!searchQuery.trim()) return true;

      const fullString = `${item.name} ${item.capacity} ${item.material} ${item.lots
        .map((l) => l.lot)
        .join(' ')}`;

      return matchQuery(fullString, searchQuery);
    });
  }, [activeProducts, searchQuery, selectedMaterialFilter]);

  // Material counts for filter tabs
  const materialStats = useMemo(() => {
    return {
      all: activeProducts.length,
      steel: activeProducts.filter((p) => p.material.includes('스틸')).length,
      alu: activeProducts.filter((p) => p.material.includes('알루미늄')).length,
      pet: activeProducts.filter((p) => p.material.includes('PET')).length,
    };
  }, [activeProducts]);

  return (
    <section className="space-y-4 w-full">
      {/* Search Bar Card */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 space-y-4">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="품목명, 용량, 재질, 로트 검색 (초성 지원)"
            className="w-full pl-5 pr-12 py-4 bg-gray-50 border-2 border-gray-300 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base font-extrabold text-gray-900 placeholder:text-gray-400 transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-700 bg-gray-200/60 transition-colors"
              aria-label="검색어 지우기"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          )}
        </div>

        {/* Quick Filter Badges */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-black">
          <button
            type="button"
            onClick={() => setSelectedMaterialFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              selectedMaterialFilter === 'all'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체 ({materialStats.all})
          </button>
          <button
            type="button"
            onClick={() => setSelectedMaterialFilter('스틸')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              selectedMaterialFilter === '스틸'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            스틸 ST ({materialStats.steel})
          </button>
          <button
            type="button"
            onClick={() => setSelectedMaterialFilter('알루미늄')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              selectedMaterialFilter === '알루미늄'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            알루미늄 AL ({materialStats.alu})
          </button>
          <button
            type="button"
            onClick={() => setSelectedMaterialFilter('PET')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              selectedMaterialFilter === 'PET'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            PET ({materialStats.pet})
          </button>
        </div>

        {/* Counter and Guide */}
        <div className="flex justify-between items-center text-sm text-gray-600 px-1 font-extrabold border-t border-gray-100 pt-3">
          <span className="text-gray-900 text-sm font-black flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-gray-500" />
            <span>검색 결과 ({filteredProducts.length}건)</span>
          </span>
          <span className="text-primary font-black text-xs flex items-center space-x-1">
            <span>💡 카드를 누르면 상세 로트 추가</span>
          </span>
        </div>
      </div>

      {/* Result Cards List */}
      <div className="space-y-3.5 pb-10 w-full">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white rounded-3xl border-2 border-dashed border-gray-200 space-y-3">
            <PackageX className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-base font-extrabold text-gray-500">
              {searchQuery ? '일치하는 입고 품목이 없습니다.' : '등록된 입고 품목이 없습니다.'}
            </p>
            <p className="text-xs text-gray-400">
              새로운 품목을 등록하거나 로트 번호를 추가해 보세요.
            </p>
            <button
              type="button"
              onClick={onGoToRegister}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-primary text-white text-xs font-black rounded-xl hover:bg-primaryDark transition-all"
            >
              <span>신규 품목/로트 등록하기</span>
            </button>
          </div>
        ) : (
          filteredProducts.map((item) => {
            const latest = item.lots.length > 0 ? item.lots[0] : null;

            return (
              <div
                key={item.id}
                onClick={() => onSelectProduct(item)}
                className="bg-white p-5 rounded-3xl shadow-sm border-2 border-gray-200 space-y-3 cursor-pointer hover:border-primary hover:shadow-md transition-all w-full active:scale-[0.99] group"
              >
                {/* Top Badges: 용량 따로, 재질 따로 분리 & 재질별 고유 색상 */}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-2">
                    {/* 용량 배지 */}
                    {item.capacity && (
                      <span className="font-extrabold bg-gray-100 text-gray-700 px-3 py-1 rounded-xl text-xs border border-gray-200">
                        {item.capacity}
                      </span>
                    )}
                    {/* 재질 배지 (스틸/알루미늄/PET별 개별 색상) */}
                    <span
                      className={`font-extrabold px-3 py-1 rounded-xl text-xs border ${
                        item.material.includes('스틸') || item.material.includes('ST')
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : item.material.includes('알루미늄') || item.material.includes('AL')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.material.includes('PET') || item.material.includes('페트')
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.material}
                    </span>
                  </div>
                  <span className="text-gray-500 font-extrabold text-xs bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-xl">
                    이력: {item.lots.length}건
                  </span>
                </div>

                {/* Product Name */}
                <div className="text-lg font-black text-gray-900 group-hover:text-primary transition-colors">
                  {item.name}
                </div>

                {/* Latest LOT & Date */}
                <div className="text-xs text-gray-700 flex justify-between items-center pt-3 border-t border-gray-100 font-extrabold">
                  <span className="flex items-center space-x-1">
                    <Hash className="w-3.5 h-3.5 text-gray-400" />
                    <span>최신 로트:</span>
                    <strong className="text-gray-900 text-sm font-black ml-1">
                      {latest ? latest.lot : '미입고'}
                    </strong>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>입고일:</span>
                    <strong className="text-gray-900 text-sm font-black ml-1">
                      {latest ? latest.date : '-'}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
