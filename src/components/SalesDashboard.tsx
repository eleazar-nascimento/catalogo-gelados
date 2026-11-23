import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  PackageCheck,
  Trophy,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatBRL, isMultiIcon, PRODUCT_CATEGORIES } from '../constants/catalog';
import type { ProductCategory, SaleRecord } from '../types';

interface SalesDashboardProps {
  sales: SaleRecord[];
}

const getMonthKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatMonthLabel = (year: number, monthIndex: number): string => {
  const label = new Date(year, monthIndex, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export function SalesDashboard({ sales }: SalesDashboardProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const currentMonthKey = getMonthKey(now);
  const selectedMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const isCurrentMonth = selectedMonthKey === currentMonthKey;

  const goPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const monthlySales = useMemo(() => {
    return sales.filter((sale) => {
      const d = new Date(sale.soldAt);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [sales, selectedYear, selectedMonth]);

  const todayUnits = useMemo(() => {
    const todayStr = new Date().toDateString();
    return sales
      .filter((s) => new Date(s.soldAt).toDateString() === todayStr)
      .reduce((acc, s) => acc + s.quantity, 0);
  }, [sales]);

  const stats = useMemo(() => {
    let totalUnits = 0;
    let totalRevenue = 0;

    const byFlavor = new Map<
      string,
      {
        productId: string;
        name: string;
        emoji: string;
        category: ProductCategory;
        units: number;
        revenue: number;
      }
    >();

    const byCategory: Record<ProductCategory, { units: number; revenue: number }> = {
      'Chupa-chupa': { units: 0, revenue: 0 },
      Picolé: { units: 0, revenue: 0 },
      Sorvete: { units: 0, revenue: 0 },
    };

    for (const sale of monthlySales) {
      const revenue = sale.quantity * sale.unitPrice;
      totalUnits += sale.quantity;
      totalRevenue += revenue;

      const catEntry = byCategory[sale.category];
      if (catEntry) {
        catEntry.units += sale.quantity;
        catEntry.revenue += revenue;
      }

      const key = `${sale.productId}::${sale.productName}`;
      const existing = byFlavor.get(key);
      if (existing) {
        existing.units += sale.quantity;
        existing.revenue += revenue;
      } else {
        byFlavor.set(key, {
          productId: sale.productId,
          name: sale.productName,
          emoji: sale.emoji,
          category: sale.category,
          units: sale.quantity,
          revenue,
        });
      }
    }

    const ranking = Array.from(byFlavor.values()).sort((a, b) => b.units - a.units);
    const topFlavor = ranking[0] ?? null;

    return { totalUnits, totalRevenue, ranking, topFlavor, byCategory };
  }, [monthlySales]);

  const maxFlavorUnits = stats.topFlavor?.units || 1;

  return (
    <section className="space-y-5 animate-fade-in">
      {/* Navegador de Mês */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrevMonth}
          aria-label="Mês anterior"
          className="min-h-[48px] min-w-[48px] rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center active:scale-95 transition-all touch-manipulation"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Resumo de Vendas
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatMonthLabel(selectedYear, selectedMonth)}
          </h2>
        </div>

        <button
          type="button"
          onClick={goNextMonth}
          disabled={isCurrentMonth}
          aria-label="Próximo mês"
          className={`min-h-[48px] min-w-[48px] rounded-2xl flex items-center justify-center transition-all touch-manipulation ${
            isCurrentMonth
              ? 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 active:scale-95'
          }`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-800 shadow-sm animate-card-in">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Vendidos no mês
            </span>
            <span className="w-10 h-10 rounded-xl bg-[#4BBBC2]/15 text-[#2A7C84] dark:text-[#66D1D8] flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </span>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white mt-2">
            {stats.totalUnits}
            <span className="text-base font-bold text-slate-500 dark:text-slate-400 ml-1.5">
              un.
            </span>
          </p>
          {isCurrentMonth && (
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1.5">
              Hoje: {todayUnits} {todayUnits === 1 ? 'unidade' : 'unidades'}
            </p>
          )}
        </div>

        <div
          style={{ animationDelay: '50ms' }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-800 shadow-sm animate-card-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Total estimado
            </span>
            <span className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400 mt-2">
            {formatBRL(stats.totalRevenue)}
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
            {monthlySales.length}{' '}
            {monthlySales.length === 1 ? 'baixa registrada' : 'baixas registradas'}
          </p>
        </div>

        <div
          style={{ animationDelay: '100ms' }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 rounded-3xl p-5 border-2 border-amber-300 dark:border-amber-800/70 shadow-sm animate-card-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-amber-900 dark:text-amber-300">
              Mais vendido 🏆
            </span>
            <span className="w-10 h-10 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </span>
          </div>
          {stats.topFlavor ? (
            <div className="mt-2 flex items-center gap-3">
              <span
                className={`shrink-0 leading-none ${
                  isMultiIcon(stats.topFlavor.emoji)
                    ? 'text-2xl tracking-tighter'
                    : 'text-3xl'
                }`}
              >
                {stats.topFlavor.emoji}
              </span>
              <div className="min-w-0">
                <p className="font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                  {stats.topFlavor.name}
                </p>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mt-0.5">
                  {stats.topFlavor.units} un. ({formatBRL(stats.topFlavor.revenue)})
                </p>
              </div>
            </div>
          ) : (
            <p className="text-base font-bold text-amber-900/70 dark:text-amber-200/70 mt-3">
              Sem vendas ainda
            </p>
          )}
        </div>
      </div>

      {/* Estado vazio */}
      {stats.totalUnits === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
          <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Nenhuma venda registrada neste mês
          </h3>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Sempre que você der baixa no estoque (botões <strong>-1</strong>,{' '}
            <strong>-5</strong> ou <strong>-10</strong>), as vendas aparecem
            automaticamente aqui!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Ranking de sabores */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Ranking de Sabores Mais Vendidos
            </h3>

            <div className="space-y-3.5">
              {stats.ranking.map((item, idx) => {
                const pct = Math.max(8, Math.round((item.units / maxFlavorUnits) * 100));
                return (
                  <div key={`${item.productId}-${item.name}`} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm sm:text-base">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-950'
                              : idx === 1
                                ? 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white'
                                : idx === 2
                                  ? 'bg-orange-300 dark:bg-orange-800 text-slate-950 dark:text-orange-100'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {idx + 1}º
                        </span>
                        <span className="shrink-0 text-lg leading-none">
                          {item.emoji}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-black text-slate-900 dark:text-white">
                          {item.units} un.
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1.5">
                          ({formatBRL(item.revenue)})
                        </span>
                      </div>
                    </div>

                    <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0
                            ? 'bg-gradient-to-r from-[#4BBBC2] to-[#F27B96]'
                            : 'bg-[#4BBBC2]'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Por Categoria + Últimas baixas */}
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">
                Por Categoria
              </h3>
              <div className="space-y-3">
                {PRODUCT_CATEGORIES.map((cat) => {
                  const data = stats.byCategory[cat];
                  const pct =
                    stats.totalUnits > 0
                      ? Math.round((data.units / stats.totalUnits) * 100)
                      : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-sm font-bold mb-1">
                        <span className="text-slate-700 dark:text-slate-200">{cat}</span>
                        <span className="text-slate-900 dark:text-white">
                          {data.units} un. ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full rounded-full bg-[#F27B96] transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                Últimas Baixas
              </h3>
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {monthlySales.slice(0, 12).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between gap-2 text-sm py-2 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0">{sale.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {sale.quantity}x {sale.productName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(sale.soldAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                      {formatBRL(sale.quantity * sale.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
