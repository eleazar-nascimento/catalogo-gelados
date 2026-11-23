import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_PRODUCTS } from '../constants/catalog';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Product } from '../types';

const STORAGE_KEY = 'gelados_estoque_v1';

interface DbProductRow {
  id: string;
  name: string;
  category: Product['category'];
  price: number | string;
  stock: number;
  emoji: string;
  theme: Product['theme'];
  sort_order?: number;
}

const mapRowToProduct = (row: DbProductRow): Product => ({
  id: row.id,
  name: row.name,
  category: row.category,
  price: Number(row.price),
  stock: row.stock,
  emoji: row.emoji,
  theme: row.theme,
  sortOrder: row.sort_order ?? 0,
});

const readLocalProducts = (): Product[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Product[]) : INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
  }
};

export function useProductsSync() {
  const [products, setProducts] = useState<Product[]>(readLocalProducts);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>(
    isSupabaseConfigured ? 'syncing' : 'local'
  );

  // Acumula deltas pendentes por produto para debounce de 450ms
  const pendingDeltasRef = useRef<Record<string, number>>({});
  const debounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Cache local contínuo
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }
  }, [products]);

  // Carga inicial + Realtime do Supabase
  useEffect(() => {
    if (!supabase) {
      const timer = setTimeout(() => setIsLoading(false), 280);
      return () => clearTimeout(timer);
    }

    let active = true;
    const client = supabase;
    const debounceTimers = debounceTimersRef.current;

    const loadInitial = async () => {
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (!active) return;

      if (error) {
        console.error('Erro ao carregar produtos:', error);
        setSyncStatus('error');
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setProducts((data as DbProductRow[]).map(mapRowToProduct));
      } else {
        // Semeia sabores iniciais na primeira execução
        const seedRows = INITIAL_PRODUCTS.map((p, idx) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          stock: p.stock,
          emoji: p.emoji,
          theme: p.theme,
          sort_order: idx + 1,
        }));
        await client.from('products').upsert(seedRows);
      }

      setSyncStatus('synced');
      setIsLoading(false);
    };

    void loadInitial();

    const channel = client
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (!active) return;

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const incoming = mapRowToProduct(payload.new as DbProductRow);
            setProducts((prev) => {
              const exists = prev.some((item) => item.id === incoming.id);
              if (!exists) return [incoming, ...prev];
              return prev.map((item) => (item.id === incoming.id ? incoming : item));
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id?: string }).id;
            if (deletedId) {
              setProducts((prev) => prev.filter((item) => item.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      void client.removeChannel(channel);
      Object.values(debounceTimers).forEach(clearTimeout);
    };
  }, []);

  const flushDelta = useCallback(async (id: string) => {
    if (!supabase) return;
    const delta = pendingDeltasRef.current[id] ?? 0;
    delete pendingDeltasRef.current[id];
    delete debounceTimersRef.current[id];

    if (delta === 0) return;

    setSyncStatus('syncing');
    const { error } = await supabase.rpc('adjust_product_stock', {
      p_id: id,
      p_delta: delta,
    });

    if (error) {
      console.error('Erro ao ajustar estoque:', error);
      setSyncStatus('error');
      return;
    }
    setSyncStatus('synced');
  }, []);

  const queueStockDelta = useCallback(
    (id: string, delta: number) => {
      if (!supabase || delta === 0) return;
      pendingDeltasRef.current[id] = (pendingDeltasRef.current[id] ?? 0) + delta;

      if (debounceTimersRef.current[id]) {
        clearTimeout(debounceTimersRef.current[id]);
      }

      setSyncStatus('syncing');
      debounceTimersRef.current[id] = setTimeout(() => {
        void flushDelta(id);
      }, 450);
    },
    [flushDelta]
  );

  const setExactStockRemote = useCallback(async (id: string, stock: number) => {
    if (!supabase) return;
    if (debounceTimersRef.current[id]) {
      clearTimeout(debounceTimersRef.current[id]);
      delete debounceTimersRef.current[id];
      delete pendingDeltasRef.current[id];
    }

    setSyncStatus('syncing');
    const { error } = await supabase.from('products').update({ stock }).eq('id', id);
    setSyncStatus(error ? 'error' : 'synced');
  }, []);

  const upsertProductRemote = useCallback(async (product: Product) => {
    if (!supabase) return;
    setSyncStatus('syncing');
    const { error } = await supabase.from('products').upsert({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      emoji: product.emoji,
      theme: product.theme,
      sort_order: product.sortOrder ?? 0,
    });
    setSyncStatus(error ? 'error' : 'synced');
  }, []);

  const deleteProductRemote = useCallback(async (id: string) => {
    if (!supabase) return;
    setSyncStatus('syncing');
    const { error } = await supabase.from('products').delete().eq('id', id);
    setSyncStatus(error ? 'error' : 'synced');
  }, []);

  const restoreSnapshotRemote = useCallback(async (snapshot: Product[]) => {
    if (!supabase) return;
    setSyncStatus('syncing');
    const rows = snapshot.map((p, idx) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      emoji: p.emoji,
      theme: p.theme,
      sort_order: p.sortOrder ?? idx + 1,
    }));
    const { error } = await supabase.from('products').upsert(rows);
    setSyncStatus(error ? 'error' : 'synced');
  }, []);

  return {
    products,
    setProducts,
    isLoading,
    syncStatus,
    queueStockDelta,
    setExactStockRemote,
    upsertProductRemote,
    deleteProductRemote,
    restoreSnapshotRemote,
  };
}
