import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

const isMockMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase_url');

// File-based database helper for API routes in mock mode
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

const createMockBuilder = (table: string, userId: string) => {
  const builder = {
    _filters: [] as any[],
    _order: null as any,
    _isSingle: false,
    _data: null as any,

    select(fields?: string) {
      const list = readDbTable(table);
      this._data = list.filter((item: any) => !userId || item.user_id === userId);
      return this;
    },

    insert(payload: any) {
      const list = readDbTable(table);
      const items = Array.isArray(payload) ? payload : [payload];
      const newItems = items.map(item => ({
        id: Math.random().toString(36).substring(2, 15),
        user_id: userId || 'mock-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item
      }));
      list.push(...newItems);
      writeDbTable(table, list);
      this._data = Array.isArray(payload) ? newItems : newItems[0];
      return Promise.resolve({ data: this._data, error: null });
    },

    update(payload: any) {
      const list = readDbTable(table);
      let updated = false;
      const updatedList = list.map((item: any) => {
        let match = true;
        for (const filter of this._filters) {
          if (item[filter.col] !== filter.val) match = false;
        }
        if (match) {
          updated = true;
          return { ...item, ...payload, updated_at: new Date().toISOString() };
        }
        return item;
      });
      writeDbTable(table, updatedList);
      this._data = payload;
      return Promise.resolve({ data: this._data, error: null });
    },

    delete() {
      const list = readDbTable(table);
      const filteredList = list.filter((item: any) => {
        let match = true;
        for (const filter of this._filters) {
          if (item[filter.col] !== filter.val) match = false;
        }
        return !match;
      });
      writeDbTable(table, filteredList);
      return Promise.resolve({ data: null, error: null });
    },

    eq(col: string, val: any) {
      this._filters.push({ col, val });
      if (Array.isArray(this._data)) {
        this._data = this._data.filter((item: any) => item[col] === val);
      }
      return this;
    },

    single() {
      this._isSingle = true;
      return this;
    },

    order(col: string, options?: any) {
      this._order = { col, ascending: options?.ascending !== false };
      return this;
    },

    limit(num: number) {
      if (Array.isArray(this._data)) {
        this._data = this._data.slice(0, num);
      }
      return this;
    },

    // Awaitable promise resolution
    then(onfulfilled: any) {
      let result = this._data;
      if (Array.isArray(result)) {
        if (this._order) {
          const { col, ascending } = this._order;
          result.sort((a, b) => {
            if (a[col] < b[col]) return ascending ? -1 : 1;
            if (a[col] > b[col]) return ascending ? 1 : -1;
            return 0;
          });
        }
        if (this._isSingle) {
          result = result[0] || null;
        }
      }
      return Promise.resolve({ data: result, error: null }).then(onfulfilled);
    }
  };
  return builder;
};

export async function createClient() {
  const cookieStore = await cookies();

  if (isMockMode) {
    const mockSession = cookieStore.get('mock-session')?.value;
    const userId = mockSession ? 'mock-user-id' : '';

    return {
      auth: {
        getUser: () => {
          if (mockSession) {
            return Promise.resolve({
              data: {
                user: {
                  id: 'mock-user-id',
                  email: mockSession,
                  user_metadata: { full_name: 'Anuj Kumar' },
                }
              },
              error: null
            });
          }
          return Promise.resolve({ data: { user: null }, error: null });
        },
        getSession: () => {
          if (mockSession) {
            return Promise.resolve({
              data: {
                session: {
                  user: {
                    id: 'mock-user-id',
                    email: mockSession,
                    user_metadata: { full_name: 'Anuj Kumar' },
                  }
                }
              },
              error: null
            });
          }
          return Promise.resolve({ data: { session: null }, error: null });
        },
        signUp: ({ email, password, options }: any) => {
          cookieStore.set('mock-session', email, { path: '/' });
          return Promise.resolve({
            data: {
              user: {
                id: 'mock-user-id',
                email,
                user_metadata: { full_name: options?.data?.full_name || 'Anuj Kumar' },
              }
            },
            error: null
          });
        },
        signInWithPassword: ({ email }: any) => {
          cookieStore.set('mock-session', email, { path: '/' });
          return Promise.resolve({
            data: {
              user: {
                id: 'mock-user-id',
                email,
                user_metadata: { full_name: 'Anuj Kumar' },
              }
            },
            error: null
          });
        },
        signOut: () => {
          cookieStore.set('mock-session', '', { path: '/', maxAge: 0 });
          return Promise.resolve({ error: null });
        },
      },
      from: (table: string) => {
        return createMockBuilder(table, userId);
      }
    } as any;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}
