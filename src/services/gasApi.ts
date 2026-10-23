import { InventoryProduct, LotItem, RawInventoryRow } from '../types/inventory';

export const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbySdYaapunI_kadKQ-uBEB1otL7kfLF9mL9zv92Ib30zkx8ERDfYl1eB-tcUr3fjC8YIw/exec';

const STORAGE_KEY_GAS_URL = 'gas_api_endpoint_url';
const STORAGE_KEY_INVENTORY_CACHE = 'inventory_data_cache_v1';

export function getGasUrl(): string {
  const custom = localStorage.getItem(STORAGE_KEY_GAS_URL);
  if (custom && custom.trim().startsWith('http') && !custom.includes('AKfycbzPcNsHej2w')) {
    return custom.trim();
  }
  return import.meta.env.VITE_GAS_API_URL || DEFAULT_GAS_URL;
}

export function setGasUrl(url: string): void {
  if (!url || !url.trim()) {
    localStorage.removeItem(STORAGE_KEY_GAS_URL);
  } else {
    localStorage.setItem(STORAGE_KEY_GAS_URL, url.trim());
  }
}

// 초기 데모/오프라인 데이터 (공관/캔/페트 입고 관리 샘플)
export const INITIAL_DEMO_PRODUCTS: InventoryProduct[] = [
  {
    id: '레쓰비 마일드__160ml__스틸 (ST)',
    name: '레쓰비 마일드',
    capacity: '160ml',
    material: '스틸 (ST)',
    lots: [
      { lot: 'LOT-20261022-A1', date: '2026-10-22' },
      { lot: 'LOT-20261015-S4', date: '2026-10-15' },
      { lot: 'LOT-20260928-B2', date: '2026-09-28' },
    ],
  },
  {
    id: '칠성사이다 슬림__250ml__알루미늄 (AL)',
    name: '칠성사이다 슬림',
    capacity: '250ml',
    material: '알루미늄 (AL)',
    lots: [
      { lot: 'LOT-20261021-09', date: '2026-10-21' },
      { lot: 'LOT-20261010-02', date: '2026-10-10' },
    ],
  },
  {
    id: '포카리스웨트 캔__245ml__스틸 (ST)',
    name: '포카리스웨트 캔',
    capacity: '245ml',
    material: '스틸 (ST)',
    lots: [
      { lot: 'LOT-20261020-03', date: '2026-10-20' },
    ],
  },
  {
    id: '코카콜라 제로__355ml__알루미늄 (AL)',
    name: '코카콜라 제로',
    capacity: '355ml',
    material: '알루미늄 (AL)',
    lots: [
      { lot: 'LOT-20261019-C1', date: '2026-10-19' },
      { lot: 'LOT-20261005-C8', date: '2026-10-05' },
    ],
  },
  {
    id: '옥수수수염차 ECO__500ml__PET',
    name: '옥수수수염차 ECO',
    capacity: '500ml',
    material: 'PET',
    lots: [
      { lot: 'LOT-20261018-P1', date: '2026-10-18' },
    ],
  },
  {
    id: '핫식스 오리지널__250ml__알루미늄 (AL)',
    name: '핫식스 오리지널',
    capacity: '250ml',
    material: '알루미늄 (AL)',
    lots: [
      { lot: 'LOT-20261017-H2', date: '2026-10-17' },
      { lot: 'LOT-20260930-H1', date: '2026-09-30' },
    ],
  },
];

export function getCachedInventory(): InventoryProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVENTORY_CACHE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse cached inventory', e);
  }
  return INITIAL_DEMO_PRODUCTS;
}

export function saveCachedInventory(items: InventoryProduct[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_INVENTORY_CACHE, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save cached inventory', e);
  }
}

export function formatDateString(dateVal?: string): string {
  if (!dateVal) return new Date().toISOString().slice(0, 10);
  const str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const parsed = new Date(str.replace(/\(.*?\)/, '').trim());
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return str.slice(0, 10);
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export function normalizeLotString(rawLot?: string): string {
  if (!rawLot) return '';
  const str = String(rawLot).trim();

  // 구글 시트에서 10-4 등 입력 시 Date 객체 문자열(GMT/한국 표준시)로 자동 변환된 경우: 원래 입력 형태인 "10-4"로 복원
  if (str.includes('GMT') || str.includes('표준시')) {
    const match = str.match(/([a-z]{3})\s+(\d{1,2})\s+(\d{4})/i);
    if (match) {
      const month = MONTH_MAP[match[1].toLowerCase()];
      const day = parseInt(match[2], 10);
      if (month && !isNaN(day)) {
        return `${month}-${day}`;
      }
    }
  }

  // 만약 YYYY-MM-DD 형태로 넘어온 경우 연도 생략 형태 확인
  const isoMatch = str.match(/^\d{4}-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const m = parseInt(isoMatch[1], 10);
    const d = parseInt(isoMatch[2], 10);
    return `${m}-${d}`;
  }

  return str.toUpperCase();
}

export function groupRawRows(rows: RawInventoryRow[]): InventoryProduct[] {
  const map: Record<string, InventoryProduct> = {};

  rows.forEach((row) => {
    let rawName = (row.name || '').trim();
    let capacity = (row.capacity || '').trim();
    let material = (row.material || '').trim();
    let rawLot = (row.lot || '').trim();
    let date = formatDateString(row.date);

    let actualName = rawName;
    let actualLot = normalizeLotString(rawLot);

    // ID가 name으로 넘어오고 실제 제품명이 lot 자리에 넘어온 경우: ID 숨기고 실제 제품명으로 치환
    if (/^\d{4,}$/.test(rawName) && rawLot && !/^LOT[-_0-9]/i.test(rawLot)) {
      actualName = rawLot;
      actualLot = date || '입고완료';
    }

    if (!actualName) return;
    const key = `${actualName}__${capacity}__${material}`;

    if (!map[key]) {
      map[key] = {
        id: key,
        name: actualName,
        capacity,
        material,
        lots: [],
      };
    }

    if (actualLot && actualLot !== '') {
      map[key].lots.push({
        lot: actualLot,
        date,
      });
    }
  });

  // 각 품목별 최신 일자/로트 순으로 정렬
  return Object.values(map).map((p) => ({
    ...p,
    lots: p.lots.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0)),
  }));
}

/**
 * 구글 앱스 스크립트 웹앱 API에서 전체 재고 데이터를 가져옵니다.
 */
export async function fetchInventoryFromGas(): Promise<{
  success: boolean;
  products: InventoryProduct[];
  isDemo?: boolean;
  message?: string;
}> {
  const url = getGasUrl();
  const cached = getCachedInventory();

  if (!url || !url.startsWith('http')) {
    return {
      success: false,
      products: cached,
      isDemo: true,
      message: '연동할 GAS 웹앱 URL을 설정해주세요.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const targetUrl = url.includes('?') ? `${url}&action=getInventory` : `${url}?action=getInventory`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.info('GAS returned non-JSON response. Operating in cached/demo mode.');
      return {
        success: false,
        products: cached,
        isDemo: true,
        message: '구글 앱스 스크립트에서 Code.gs 배포가 필요합니다. (캐시 데이터 사용 중)',
      };
    }

    const rows: RawInventoryRow[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.data)
      ? parsed.data
      : [];

    if (rows.length === 0 && parsed.status === 'error') {
      throw new Error(parsed.message || '데이터 오류가 발생했습니다.');
    }

    const products = groupRawRows(rows);
    saveCachedInventory(products);

    return {
      success: true,
      products,
    };
  } catch (error: any) {
    // Normal fallback when GAS Code.gs hasn't been deployed with CORS ContentService yet
    console.info('GAS sync status: fallback to cached/demo inventory.', error?.message || error);
    return {
      success: false,
      products: cached,
      isDemo: true,
      message: '스프레드시트 연동 준비 중 (캐시/데모 모드로 동작)',
    };
  }
}

/**
 * 신규 로트를 구글 앱스 스크립트 웹앱 API로 등록합니다.
 * CORS 사전 요청(OPTIONS preflight)을 방지하기 위해 text/plain으로 전송합니다.
 */
export async function addLotToGas(params: {
  name: string;
  capacity: string;
  material: string;
  lot: string;
}): Promise<{ success: boolean; message: string; isLocalFallback?: boolean }> {
  const url = getGasUrl();
  const today = new Date().toISOString().slice(0, 10);
  const normalizedLot = params.lot.trim().toUpperCase();

  const payload = {
    action: 'addLot',
    name: params.name.trim(),
    capacity: params.capacity.trim(),
    material: params.material.trim(),
    lot: normalizedLot,
    date: today,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    let result: any = {};
    try {
      result = JSON.parse(text);
    } catch {
      // 텍스트 응답이 성공인 경우
      result = { status: 'success' };
    }

    if (result.status === 'error') {
      throw new Error(result.message || '등록 중 오류가 발생했습니다.');
    }

    return {
      success: true,
      message: '성공적으로 등록되었습니다.',
    };
  } catch (err: any) {
    console.warn('Network or GAS doPost failed, applying optimistic update locally:', err);
    // 네트워크 오류 시에도 사용자 경험을 위해 로컬 캐시에 즉시 반영
    return {
      success: true,
      isLocalFallback: true,
      message: '로컬에 등록되었습니다. (GAS 백엔드 배포 상태를 점검하세요)',
    };
  }
}
