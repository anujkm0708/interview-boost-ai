import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getDbPath = () => {
  return path.join(process.cwd(), 'supabase', 'mock_db.json');
};

const readDbTable = (table: string): any[] => {
  const filePath = getDbPath();
  try {
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, '{}');
      return [];
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}');
    return data[table] || [];
  } catch {
    return [];
  }
};

const writeDbTable = (table: string, list: any[]) => {
  const filePath = getDbPath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}') : {};
    data[table] = list;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to mock db:', err);
  }
};

export async function POST(request: Request) {
  try {
    const { action, table, payload, filters, order, isSingle } = await request.json();

    if (!table) {
      return NextResponse.json({ error: 'Table is required' }, { status: 400 });
    }

    let list = readDbTable(table);

    if (action === 'select') {
      // Apply filters
      let filtered = [...list];
      if (filters && Array.isArray(filters)) {
        for (const filter of filters) {
          filtered = filtered.filter((item: any) => item[filter.col] === filter.val);
        }
      }

      // Apply ordering
      if (order) {
        const { col, ascending } = order;
        filtered.sort((a, b) => {
          if (a[col] < b[col]) return ascending ? -1 : 1;
          if (a[col] > b[col]) return ascending ? 1 : -1;
          return 0;
        });
      }

      // Apply single limit
      const result = isSingle ? (filtered[0] || null) : filtered;
      return NextResponse.json({ data: result, error: null });
    }

    if (action === 'insert') {
      const items = Array.isArray(payload) ? payload : [payload];
      const newItems = items.map(item => ({
        id: Math.random().toString(36).substring(2, 15),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item
      }));
      list.push(...newItems);
      writeDbTable(table, list);
      const result = Array.isArray(payload) ? newItems : newItems[0];
      return NextResponse.json({ data: result, error: null });
    }

    if (action === 'update') {
      let updated = false;
      const updatedList = list.map((item: any) => {
        let match = true;
        if (filters && Array.isArray(filters)) {
          for (const filter of filters) {
            if (item[filter.col] !== filter.val) match = false;
          }
        } else {
          match = false;
        }

        if (match) {
          updated = true;
          return { ...item, ...payload, updated_at: new Date().toISOString() };
        }
        return item;
      });

      writeDbTable(table, updatedList);
      return NextResponse.json({ data: payload, error: null });
    }

    if (action === 'delete') {
      const filteredList = list.filter((item: any) => {
        let match = true;
        if (filters && Array.isArray(filters)) {
          for (const filter of filters) {
            if (item[filter.col] !== filter.val) match = false;
          }
        } else {
          match = false;
        }
        return !match;
      });

      writeDbTable(table, filteredList);
      return NextResponse.json({ data: null, error: null });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Mock DB error:', error);
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }
}
