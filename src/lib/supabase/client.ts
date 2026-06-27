import { createBrowserClient } from '@supabase/ssr';

const isMockMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase_url');

// Utility to manage mock cookies in browser
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return undefined;
  return document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop();
};

const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};path=/;expires=${date.toUTCString()}`;
};

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT`;
};

// Create server-backed database builder that calls our mock-db endpoint
const createMockBuilder = (table: string) => {
  const builder = {
    _action: 'select',
    _payload: null as any,
    _filters: [] as any[],
    _order: null as any,
    _isSingle: false,

    select(fields?: string) {
      this._action = 'select';
      return this;
    },

    insert(payload: any) {
      this._action = 'insert';
      this._payload = payload;
      return this;
    },

    update(payload: any) {
      this._action = 'update';
      this._payload = payload;
      return this;
    },

    delete() {
      this._action = 'delete';
      return this;
    },

    eq(col: string, val: any) {
      this._filters.push({ col, val });
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
      return this;
    },

    // Awaitable promise resolution calling /api/mock-db
    async then(onfulfilled: any) {
      try {
        const response = await fetch('/api/mock-db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: this._action,
            table,
            payload: this._payload,
            filters: this._filters,
            order: this._order,
            isSingle: this._isSingle,
          }),
        });

        if (!response.ok) {
          throw new Error('Mock DB request failed');
        }

        const result = await response.json();
        return onfulfilled(result);
      } catch (err: any) {
        console.error('Mock DB client error:', err);
        return onfulfilled({ data: null, error: err });
      }
    }
  };
  return builder;
};

// Mock Supabase Client Object
const mockSupabaseClient = {
  auth: {
    getUser: () => {
      const email = getCookie('mock-session');
      if (email) {
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
      }
      return Promise.resolve({ data: { user: null }, error: null });
    },
    getSession: () => {
      const email = getCookie('mock-session');
      if (email) {
        return Promise.resolve({
          data: {
            session: {
              user: {
                id: 'mock-user-id',
                email,
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
      setCookie('mock-session', email);
      // Initialize mock profile
      const mockProfile = {
        id: 'mock-user-id',
        email,
        full_name: options?.data?.full_name || 'Anuj Kumar',
        subscription_tier: 'free',
      };
      
      // Save profile asynchronously via mock builder
      createMockBuilder('profiles').insert(mockProfile).then(() => {});

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
      setCookie('mock-session', email);
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
    signInWithOAuth: () => {
      setCookie('mock-session', 'demo-user@example.com');
      return Promise.resolve({
        data: {
          user: {
            id: 'mock-user-id',
            email: 'demo-user@example.com',
            user_metadata: { full_name: 'Demo User' },
          }
        },
        error: null
      });
    },
    signOut: () => {
      deleteCookie('mock-session');
      return Promise.resolve({ error: null });
    },
  },
  from: (table: string) => {
    return createMockBuilder(table);
  }
} as any;

export function createClient() {
  if (isMockMode) {
    return mockSupabaseClient;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
