import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, SaleRecord } from '../types';

const SALES_STORAGE_KEY = 'dulka_vendas_v1';

interface DbSaleRow {
  id: string;
  product_id: string;
  product_name: string;
  category: SaleRecord['category'];
  emoji: string;
  quantity: number;
  unit_price: number | string;
  sold_at: string;
}

const mapRowToSale = (row: DbSaleRow): SaleRecord => ({
  id: row.id,
  productId: row.product_id,
  productName: row.product_name,
  category: row.category,
  emoji: row.emoji,
  quantity: row.quantity,
  unitPrice: Number(row.unit_price),
  soldAt: row.sold_at,
});

const readLocalSales = (): SaleRecord[] => {
  try {
    const saved = localStorage.getItem(SALES_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as SaleRecord[]) : [];
  } catch {
    return [];
  }
};

export function useSalesSync() {
  const [sales, setSales] = useState<SaleRecord[]>(readLocalSales);

  useEffect(() => {
    try {
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
    } catch (err) {
      console.error('Erro ao salvar vendas no localStorage:', err);
    }
  }, [sales]);

  // Carrega vendas dos últimos 6 meses do Supabase (consulta leve e barata)
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const client = supabase;

    const loadRecentSales = async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await client
        .from('sales')
        .select('*')
        .gte('sold_at', sixMonthsAgo.toISOString())
        .order('sold_at', { ascending: false })
        .limit(1000);

      if (!active) return;

      if (error) {
        console.error('Erro ao carregar vendas:', error);
        return;
      }

      if (data) {
        setSales((data as DbSaleRow[]).map(mapRowToSale));
      }
    };

    void loadRecentSales();

    return () => {
      active = false;
    };
  }, []);

  const recordSale = useCallback((product: Product, quantity: number): string => {
    const sale: SaleRecord = {
      id: `sale_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      productId: product.id,
      productName: product.name,
      category: product.category,
      emoji: product.emoji,
      quantity,
      unitPrice: product.price,
      soldAt: new Date().toISOString(),
    };

    setSales((prev) => [sale, ...prev]);

    if (supabase) {
      void supabase.from('sales').insert({
        id: sale.id,
        product_id: sale.productId,
        product_name: sale.productName,
        category: sale.category,
        emoji: sale.emoji,
        quantity: sale.quantity,
        unit_price: sale.unitPrice,
        sold_at: sale.soldAt,
      });
    }

    return sale.id;
  }, []);

  const removeSale = useCallback((saleId: string) => {
    setSales((prev) => prev.filter((item) => item.id !== saleId));

    if (supabase) {
      void supabase.from('sales').delete().eq('id', saleId);
    }
  }, []);

  return {
    sales,
    recordSale,
    removeSale,
  };
}
