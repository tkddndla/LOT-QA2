export interface LotItem {
  lot: string;
  date: string;
}

export interface InventoryProduct {
  id: string; // generated unique key e.g. `${name}__${capacity}__${material}`
  name: string;
  capacity: string;
  material: string;
  lots: LotItem[];
}

export interface RawInventoryRow {
  name: string;
  capacity: string;
  material: string;
  lot?: string;
  date?: string;
}

export type RegistrationMode = 'new' | 'add';

export type SyncStatusState = 'syncing' | 'connected' | 'error' | 'offline';

export interface SyncStatus {
  state: SyncStatusState;
  message: string;
  lastUpdated?: Date;
}
