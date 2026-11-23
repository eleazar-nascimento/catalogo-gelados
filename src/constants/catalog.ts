import type { FilterCategory, FlavorThemeKey, Product, ProductCategory } from '../types';

export const FLAVOR_THEMES: Record<
  FlavorThemeKey,
  {
    bg: string;
    border: string;
    badge: string;
    accentText: string;
    iconBg: string;
    label: string;
  }
> = {
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/35',
    border: 'border-rose-300 dark:border-rose-800/70',
    badge: 'bg-rose-600 text-white',
    accentText: 'text-rose-900 dark:text-rose-200',
    iconBg: 'bg-rose-200/80 dark:bg-rose-900/60',
    label: 'Morango / Vermelho',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950/35',
    border: 'border-sky-300 dark:border-sky-800/70',
    badge: 'bg-sky-600 text-white',
    accentText: 'text-sky-950 dark:text-sky-200',
    iconBg: 'bg-sky-200/80 dark:bg-sky-900/60',
    label: 'Coco / Azul Claro',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/35',
    border: 'border-amber-300 dark:border-amber-800/70',
    badge: 'bg-amber-600 text-white',
    accentText: 'text-amber-950 dark:text-amber-200',
    iconBg: 'bg-amber-200/80 dark:bg-amber-900/60',
    label: 'Maracujá / Laranja',
  },
  stone: {
    bg: 'bg-stone-100 dark:bg-stone-900/70',
    border: 'border-stone-300 dark:border-stone-700',
    badge: 'bg-stone-700 text-white',
    accentText: 'text-stone-900 dark:text-stone-200',
    iconBg: 'bg-stone-200 dark:bg-stone-800',
    label: 'Chocolate / Marrom',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/35',
    border: 'border-emerald-300 dark:border-emerald-800/70',
    badge: 'bg-emerald-600 text-white',
    accentText: 'text-emerald-950 dark:text-emerald-200',
    iconBg: 'bg-emerald-200/80 dark:bg-emerald-900/60',
    label: 'Limão / Verde',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/35',
    border: 'border-purple-300 dark:border-purple-800/70',
    badge: 'bg-purple-600 text-white',
    accentText: 'text-purple-950 dark:text-purple-200',
    iconBg: 'bg-purple-200/80 dark:bg-purple-900/60',
    label: 'Uva / Açaí / Roxo',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-950/35',
    border: 'border-pink-300 dark:border-pink-800/70',
    badge: 'bg-pink-600 text-white',
    accentText: 'text-pink-950 dark:text-pink-200',
    iconBg: 'bg-pink-200/80 dark:bg-pink-900/60',
    label: 'Napolitano / Rosa',
  },
};

export const FILTER_CATEGORIES: FilterCategory[] = [
  'Todos',
  'Chupa-chupa',
  'Picolé',
  'Sorvete',
];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Chupa-chupa',
  'Picolé',
  'Sorvete',
];

export interface IconOption {
  emoji: string;
  label: string;
}

export interface IconGroup {
  id: 'combos' | 'fruits' | 'sweets' | 'frozen';
  label: string;
  items: IconOption[];
}

export const ICON_GROUPS: IconGroup[] = [
  {
    id: 'combos',
    label: 'Combinações / Gourmet',
    items: [
      { emoji: '🍓🥛', label: 'Morango c/ Ninho' },
      { emoji: '🥛🍫', label: 'Ninho c/ Nutella' },
      { emoji: '🍒🍫', label: 'Floresta Negra' },
      { emoji: '🥥🍫', label: 'Prestígio' },
      { emoji: '🍓🍫', label: 'Sensação' },
      { emoji: '🍪🥛', label: 'Cookies / Oreo' },
      { emoji: '🍌🍫', label: 'Banana c/ Choc.' },
      { emoji: '🍋🥛', label: 'Mousse Limão' },
      { emoji: '🥭🥛', label: 'Mousse Maracujá' },
      { emoji: '🌿🍫', label: 'Menta c/ Choc.' },
    ],
  },
  {
    id: 'fruits',
    label: 'Frutas',
    items: [
      { emoji: '🍓', label: 'Morango' },
      { emoji: '🍊', label: 'Laranja' },
      { emoji: '🥥', label: 'Coco' },
      { emoji: '🍋', label: 'Limão' },
      { emoji: '🥭', label: 'Maracujá / Manga' },
      { emoji: '🍇', label: 'Uva' },
      { emoji: '🫐', label: 'Açaí / Mirtilo' },
      { emoji: '🍍', label: 'Abacaxi' },
      { emoji: '🍉', label: 'Melancia' },
      { emoji: '🍌', label: 'Banana' },
      { emoji: '🍒', label: 'Cereja' },
      { emoji: '🥝', label: 'Kiwi' },
      { emoji: '🍑', label: 'Pêssego' },
      { emoji: '🍏', label: 'Maçã Verde' },
    ],
  },
  {
    id: 'sweets',
    label: 'Doces & Cremosos',
    items: [
      { emoji: '🍫', label: 'Chocolate' },
      { emoji: '🥛', label: 'Leite Ninho' },
      { emoji: '🥜', label: 'Paçoca / Amendoim' },
      { emoji: '🍪', label: 'Biscoito / Cookies' },
      { emoji: '🍯', label: 'Doce de Leite' },
      { emoji: '☕', label: 'Café' },
      { emoji: '🍰', label: 'Torta / Bolo' },
      { emoji: '🌿', label: 'Menta / Pistache' },
      { emoji: '🍬', label: 'Chiclete / Doce' },
    ],
  },
  {
    id: 'frozen',
    label: 'Gelados',
    items: [
      { emoji: '🍦', label: 'Picolé / Casquinha' },
      { emoji: '🍨', label: 'Sorvete' },
      { emoji: '🍧', label: 'Raspadinha / Pote' },
      { emoji: '🧊', label: 'Gelado' },
    ],
  },
];

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function suggestIconAndTheme(
  flavorName: string
): { emoji: string; theme: FlavorThemeKey } | null {
  const text = normalizeText(flavorName);
  if (text.trim().length < 3) return null;

  // Combinações específicas primeiro
  if (text.includes('floresta negra')) return { emoji: '🍒🍫', theme: 'stone' };
  if (text.includes('prestigio') || (text.includes('coco') && text.includes('choc')))
    return { emoji: '🥥🍫', theme: 'stone' };
  if (text.includes('sensacao') || (text.includes('morango') && text.includes('choc')))
    return { emoji: '🍓🍫', theme: 'rose' };
  if (text.includes('morango') && (text.includes('ninho') || text.includes('leite')))
    return { emoji: '🍓🥛', theme: 'rose' };
  if (
    (text.includes('ninho') || text.includes('leite')) &&
    (text.includes('nutella') || text.includes('avela') || text.includes('choc'))
  )
    return { emoji: '🥛🍫', theme: 'stone' };
  if (text.includes('cookie') || text.includes('oreo') || text.includes('negresco'))
    return { emoji: '🍪🥛', theme: 'stone' };
  if (text.includes('menta') && text.includes('choc'))
    return { emoji: '🌿🍫', theme: 'emerald' };
  if (text.includes('banana') && (text.includes('choc') || text.includes('nutella')))
    return { emoji: '🍌🍫', theme: 'amber' };
  if (text.includes('mousse') && text.includes('limao'))
    return { emoji: '🍋🥛', theme: 'emerald' };
  if (text.includes('mousse') && text.includes('maracuja'))
    return { emoji: '🥭🥛', theme: 'amber' };

  // Sabores individuais
  if (text.includes('morango') || text.includes('framboesa'))
    return { emoji: '🍓', theme: 'rose' };
  if (text.includes('laranja') || text.includes('tangerina') || text.includes('mexerica'))
    return { emoji: '🍊', theme: 'amber' };
  if (text.includes('coco')) return { emoji: '🥥', theme: 'sky' };
  if (text.includes('limao')) return { emoji: '🍋', theme: 'emerald' };
  if (text.includes('maracuja') || text.includes('manga'))
    return { emoji: '🥭', theme: 'amber' };
  if (text.includes('uva')) return { emoji: '🍇', theme: 'purple' };
  if (text.includes('acai') || text.includes('mirtilo'))
    return { emoji: '🫐', theme: 'purple' };
  if (text.includes('abacaxi')) return { emoji: '🍍', theme: 'amber' };
  if (text.includes('melancia')) return { emoji: '🍉', theme: 'rose' };
  if (text.includes('banana')) return { emoji: '🍌', theme: 'amber' };
  if (text.includes('cereja')) return { emoji: '🍒', theme: 'rose' };
  if (text.includes('kiwi')) return { emoji: '🥝', theme: 'emerald' };
  if (text.includes('pessego')) return { emoji: '🍑', theme: 'amber' };
  if (text.includes('maca')) return { emoji: '🍏', theme: 'emerald' };
  if (text.includes('pacoca') || text.includes('amendoim'))
    return { emoji: '🥜', theme: 'amber' };
  if (text.includes('doce de leite') || text.includes('caramelo') || text.includes('pudim'))
    return { emoji: '🍯', theme: 'amber' };
  if (text.includes('cafe') || text.includes('capuccino') || text.includes('cappuccino'))
    return { emoji: '☕', theme: 'stone' };
  if (text.includes('menta') || text.includes('pistache'))
    return { emoji: '🌿', theme: 'emerald' };
  if (text.includes('napolitano') || text.includes('tutti') || text.includes('chiclete'))
    return { emoji: '🍨', theme: 'pink' };
  if (text.includes('flocos')) return { emoji: '🍧', theme: 'sky' };
  if (
    text.includes('chocolate') ||
    text.includes('nutella') ||
    text.includes('brigadeiro') ||
    text.includes('cacau')
  )
    return { emoji: '🍫', theme: 'stone' };
  if (text.includes('ninho') || text.includes('leite') || text.includes('creme'))
    return { emoji: '🥛', theme: 'sky' };

  return null;
}

export const isMultiIcon = (emoji: string): boolean => {
  const trimmed = emoji.trim();
  if (!trimmed) return false;
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('pt-BR', { granularity: 'grapheme' });
    let count = 0;
    for (const _ of segmenter.segment(trimmed)) {
      void _;
      count += 1;
      if (count > 1) return true;
    }
    return false;
  }
  return Array.from(trimmed).length > 2;
};

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Chupa-chupa de Morango', category: 'Chupa-chupa', price: 3.0, stock: 24, emoji: '🍓', theme: 'rose', sortOrder: 1 },
  { id: '2', name: 'Chupa-chupa de Coco Cremoso', category: 'Chupa-chupa', price: 3.0, stock: 18, emoji: '🥥', theme: 'sky', sortOrder: 2 },
  { id: '3', name: 'Chupa-chupa de Maracujá', category: 'Chupa-chupa', price: 3.0, stock: 4, emoji: '🥭', theme: 'amber', sortOrder: 3 },
  { id: '4', name: 'Chupa-chupa Ninho c/ Nutella', category: 'Chupa-chupa', price: 5.0, stock: 15, emoji: '🥛🍫', theme: 'stone', sortOrder: 4 },
  { id: '5', name: 'Picolé de Limão', category: 'Picolé', price: 4.0, stock: 12, emoji: '🍋', theme: 'emerald', sortOrder: 5 },
  { id: '6', name: 'Picolé de Uva', category: 'Picolé', price: 4.0, stock: 9, emoji: '🍇', theme: 'purple', sortOrder: 6 },
  { id: '7', name: 'Picolé de Chocolate ao Leite', category: 'Picolé', price: 5.5, stock: 0, emoji: '🍫', theme: 'stone', sortOrder: 7 },
  { id: '8', name: 'Pote Sorvete Napolitano 2L', category: 'Sorvete', price: 22.0, stock: 5, emoji: '🍨', theme: 'pink', sortOrder: 8 },
  { id: '9', name: 'Pote Sorvete Flocos 2L', category: 'Sorvete', price: 24.0, stock: 3, emoji: '🍧', theme: 'sky', sortOrder: 9 },
];

export const formatBRL = (value: number): string =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const parseBRLInput = (raw: string): number => {
  const normalized = raw.trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};
