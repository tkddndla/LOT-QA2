import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

// Ensure data directory exists
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'inventory.json');

export interface LotItem {
  lot: string;
  date: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  capacity: string;
  material: string;
  lots: LotItem[];
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_INVENTORY: InventoryProduct[] = [
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

function readInventory(): InventoryProduct[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_INVENTORY, null, 2), 'utf-8');
      return DEFAULT_INVENTORY;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading inventory DB:', err);
    return DEFAULT_INVENTORY;
  }
}

function writeInventory(data: InventoryProduct[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing inventory DB:', err);
  }
}

// REST API Routes
app.get('/api/inventory', (req: Request, res: Response) => {
  const items = readInventory();
  res.json({ status: 'success', data: items });
});

app.post('/api/inventory/lot', (req: Request, res: Response) => {
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // keep as is
      }
    }

    const name = String(body.name || '').trim();
    const capacity = String(body.capacity || '').trim();
    const material = String(body.material || '').trim();
    const lot = String(body.lot || '').trim().toUpperCase();
    const date = body.date || new Date().toISOString().slice(0, 10);

    if (!name || !lot) {
      return res.status(400).json({ status: 'error', message: '품목명과 로트 번호는 필수입니다.' });
    }

    const items = readInventory();
    const key = `${name}__${capacity}__${material}`;
    const existingIdx = items.findIndex((p) => p.id === key);

    if (existingIdx >= 0) {
      // Add lot to existing product
      items[existingIdx].lots.unshift({ lot, date });
      items[existingIdx].updatedAt = new Date().toISOString();
    } else {
      // Create new product with this lot
      items.unshift({
        id: key,
        name,
        capacity,
        material,
        lots: [{ lot, date }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    writeInventory(items);
    res.json({
      status: 'success',
      message: '성공적으로 등록되었습니다.',
      data: { name, capacity, material, lot, date },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error?.message || '서버 오류' });
  }
});

app.delete('/api/inventory/lot', (req: Request, res: Response) => {
  try {
    const { productId, lot } = req.body;
    if (!productId || !lot) {
      return res.status(400).json({ status: 'error', message: '파라미터가 누락되었습니다.' });
    }

    const items = readInventory();
    const target = items.find((p) => p.id === productId);
    if (!target) {
      return res.status(404).json({ status: 'error', message: '품목을 찾을 수 없습니다.' });
    }

    target.lots = target.lots.filter((l) => l.lot !== lot);
    writeInventory(items);
    res.json({ status: 'success', message: '로트가 삭제되었습니다.' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message || '삭제 오류' });
  }
});

app.post('/api/inventory/reset-demo', (req: Request, res: Response) => {
  writeInventory(DEFAULT_INVENTORY);
  res.json({ status: 'success', data: DEFAULT_INVENTORY });
});

// CSV Export
app.get('/api/inventory/export-csv', (req: Request, res: Response) => {
  const items = readInventory();
  let csv = '\uFEFF품목명,용량,재질,로트번호,입고일자\n';

  items.forEach((p) => {
    p.lots.forEach((l) => {
      const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
      csv += `${escape(p.name)},${escape(p.capacity)},${escape(p.material)},${escape(l.lot)},${escape(l.date)}\n`;
    });
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=gonggwan_inventory.csv');
  res.send(csv);
});

// Setup Vite middleware in dev or static serving in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Inventory Web App Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
