import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Cloud,
  CloudOff,
  Copy,
  Edit3,
  LogOut,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { WhatsAppIcon } from './components/icons/WhatsAppIcon';
import { PinGate } from './components/PinGate';
import { Modal } from './components/ui/Modal';
import { ClientCardSkeleton, SellerCardSkeleton } from './components/ui/Skeleton';
import { ThemeToggle } from './components/ui/ThemeToggle';
import {
  FILTER_CATEGORIES,
  FLAVOR_THEMES,
  formatBRL,
  ICON_GROUPS,
  isMultiIcon,
  parseBRLInput,
  PRODUCT_CATEGORIES,
  suggestIconAndTheme,
} from './constants/catalog';
import type { IconGroup } from './constants/catalog';
import { useProductsSync } from './hooks/useProductsSync';
import { useTheme } from './hooks/useTheme';
import type {
  FilterCategory,
  FlavorThemeKey,
  Product,
  ProductCategory,
  ToastState,
  WhatsAppModalState,
} from './types';

const PIN_STORAGE_KEY = 'gelados_balcao_unlocked_v1';
const SELLER_PATH = '/balcao';
const STORE_NAME =
  (import.meta.env.VITE_STORE_NAME as string | undefined) || 'Dulka Chup-Chup';
const OWNER_NAME = 'Dona Dulcineia';
const WHATSAPP_PHONE =
  (import.meta.env.VITE_WHATSAPP_PHONE as string | undefined)?.replace(/\D/g, '') || '';
const SELLER_PIN = (import.meta.env.VITE_SELLER_PIN as string | undefined) || '1234';

interface ProductFormState {
  name: string;
  category: ProductCategory;
  price: string;
  stock: string;
  emoji: string;
  theme: FlavorThemeKey;
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  category: 'Chupa-chupa',
  price: '3,00',
  stock: '10',
  emoji: '🍓',
  theme: 'rose',
};

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const isDemoMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return import.meta.env.DEV || params.get('demo') === '1';
  }, []);

  const [isUnlocked, setIsUnlocked] = useState(() => {
    try {
      return localStorage.getItem(PIN_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const viewMode: 'seller' | 'client' = pathname.startsWith(SELLER_PATH)
    ? 'seller'
    : 'client';

  const {
    products,
    setProducts,
    isLoading,
    syncStatus,
    queueStockDelta,
    setExactStockRemote,
    upsertProductRemote,
    deleteProductRemote,
    restoreSnapshotRemote,
  } = useProductsSync();

  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('Todos');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editingStockProduct, setEditingStockProduct] = useState<Product | null>(null);
  const [customStockInput, setCustomStockInput] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_FORM);
  const [activeIconGroup, setActiveIconGroup] = useState<IconGroup['id']>('combos');
  const [hasManualIcon, setHasManualIcon] = useState(false);
  const [hasManualTheme, setHasManualTheme] = useState(false);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [whatsappModal, setWhatsappModal] = useState<WhatsAppModalState>({
    open: false,
    title: '',
    message: '',
  });
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const navigateTo = (path: string) => {
    if (window.location.pathname === path) return;
    window.history.pushState({}, '', path + window.location.search);
    setPathname(path);
  };

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }
  };

  const pulseProductCounter = (id: string) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedId(id);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedId(null);
    }, 350);
  };

  const showUndoToast = (message: string, previousProducts: Product[]) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, previousProducts });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 6500);
  };

  const handleUndo = () => {
    if (!toast?.previousProducts) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    triggerHaptic();
    const previous = toast.previousProducts;
    setProducts(previous);
    void restoreSnapshotRemote(previous);
    setToast(null);
  };

  const updateStock = (id: string, delta: number) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;

    const newStock = Math.max(0, target.stock + delta);
    const actualDelta = newStock - target.stock;
    if (actualDelta === 0) return;

    triggerHaptic();
    pulseProductCounter(id);
    const snapshot = [...products];

    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stock: newStock } : item))
    );
    queueStockDelta(id, actualDelta);

    const actionText =
      actualDelta < 0
        ? `Baixa salva: ${actualDelta} ${target.name}`
        : `Reposição salva: +${actualDelta} ${target.name}`;

    showUndoToast(actionText, snapshot);
  };

  const openExactStockModal = (product: Product) => {
    triggerHaptic();
    setEditingStockProduct(product);
    setCustomStockInput(String(product.stock));
  };

  const saveExactStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockProduct) return;

    const parsed = Number.parseInt(customStockInput, 10);
    const finalStock = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
    const snapshot = [...products];

    setProducts((prev) =>
      prev.map((item) =>
        item.id === editingStockProduct.id ? { ...item, stock: finalStock } : item
      )
    );
    pulseProductCounter(editingStockProduct.id);
    void setExactStockRemote(editingStockProduct.id, finalStock);

    showUndoToast(
      `Estoque ajustado: ${editingStockProduct.name} agora tem ${finalStock}`,
      snapshot
    );
    setEditingStockProduct(null);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_FORM);
    setActiveIconGroup('combos');
    setHasManualIcon(false);
    setHasManualTheme(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price.toFixed(2).replace('.', ','),
      stock: String(product.stock),
      emoji: product.emoji,
      theme: product.theme,
    });
    setActiveIconGroup(isMultiIcon(product.emoji) ? 'combos' : 'fruits');
    setHasManualIcon(true);
    setHasManualTheme(true);
    setIsFormModalOpen(true);
  };

  const handleLogout = () => {
    triggerHaptic();
    try {
      localStorage.removeItem(PIN_STORAGE_KEY);
    } catch {
      // Ignora erro de armazenamento privado
    }
    setIsUnlocked(false);
  };

  const handleFlavorNameChange = (name: string) => {
    setProductForm((prev) => {
      const next = { ...prev, name };
      if (!editingProduct && (!hasManualIcon || !hasManualTheme)) {
        const suggestion = suggestIconAndTheme(name);
        if (suggestion) {
          if (!hasManualIcon) next.emoji = suggestion.emoji;
          if (!hasManualTheme) next.theme = suggestion.theme;
        }
      }
      return next;
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    const parsedPrice = parseBRLInput(productForm.price);
    const parsedStock = Math.max(0, Number.parseInt(productForm.stock, 10) || 0);
    const finalEmoji = productForm.emoji.trim() || '🍦';
    const snapshot = [...products];

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: productForm.name.trim(),
        category: productForm.category,
        price: parsedPrice,
        stock: parsedStock,
        emoji: finalEmoji,
        theme: productForm.theme,
      };
      setProducts((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      void upsertProductRemote(updated);
      showUndoToast(`Sabor atualizado: ${updated.name}`, snapshot);
    } else {
      const created: Product = {
        id: String(Date.now()),
        name: productForm.name.trim(),
        category: productForm.category,
        price: parsedPrice,
        stock: parsedStock,
        emoji: finalEmoji,
        theme: productForm.theme,
        sortOrder: 0,
      };
      setProducts((prev) => [created, ...prev]);
      void upsertProductRemote(created);
      showUndoToast(`Novo sabor adicionado: ${created.name}`, snapshot);
    }

    setIsFormModalOpen(false);
    setEditingProduct(null);
  };

  const confirmDeleteProduct = () => {
    if (!productToDelete) return;
    const target = productToDelete;
    const snapshot = [...products];

    setProducts((prev) => prev.filter((p) => p.id !== target.id));
    void deleteProductRemote(target.id);
    setProductToDelete(null);
    showUndoToast(`Item removido: ${target.name}`, snapshot);
  };

  const openSellerShareWhatsApp = () => {
    triggerHaptic();
    const available = products.filter((p) => p.stock > 0);
    const grouped: Partial<Record<ProductCategory, Product[]>> = {};

    available.forEach((item) => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category]?.push(item);
    });

    const publicUrl = `${window.location.origin}/`;

    let msg = `🍦 *${STORE_NAME.toUpperCase()} — DISPONÍVEIS HOJE* ❄️\n`;
    msg += `_Atualizado agora! Veja ao vivo em:_ ${publicUrl}\n\n`;

    if (available.length === 0) {
      msg += `No momento estamos sem estoque. Em breve teremos novidades!`;
    } else {
      (Object.entries(grouped) as [ProductCategory, Product[]][]).forEach(
        ([cat, items]) => {
          msg += `*${cat.toUpperCase()}*\n`;
          items.forEach((item) => {
            msg += `${item.emoji} ${item.name} — *${formatBRL(item.price)}* _(restam ${item.stock} un.)_\n`;
          });
          msg += `\n`;
        }
      );
      msg += `💬 Me diga quais sabores e quantidades você quer!`;
    }

    setCopiedFeedback(false);
    setWhatsappModal({
      open: true,
      title: 'Lista Pronta para Enviar no WhatsApp',
      message: msg,
    });
  };

  const updateCart = (product: Product, delta: number) => {
    const currentQty = cart[product.id] || 0;
    const nextQty = Math.min(product.stock, Math.max(0, currentQty + delta));

    setCart((prev) => {
      const updated = { ...prev };
      if (nextQty <= 0) {
        delete updated[product.id];
      } else {
        updated[product.id] = nextQty;
      }
      return updated;
    });
  };

  // Quantidades sempre limitadas ao estoque atual em tempo real
  const cartItemsList = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const product = products.find((p) => p.id === id);
        if (!product || product.stock <= 0) return null;
        const clampedQty = Math.min(qty, product.stock);
        return clampedQty > 0 ? { ...product, qty: clampedQty } : null;
      })
      .filter((item): item is Product & { qty: number } => item !== null);
  }, [cart, products]);

  const totalCartCount = cartItemsList.reduce((acc, item) => acc + item.qty, 0);
  const totalCartPrice = cartItemsList.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  const openClientOrderWhatsApp = () => {
    if (cartItemsList.length === 0) return;

    let msg = `Olá! Gostaria de fazer um pedido de *${STORE_NAME}*:\n\n`;
    cartItemsList.forEach((item) => {
      msg += `• *${item.qty}x* ${item.name} (${formatBRL(item.price * item.qty)})\n`;
    });
    msg += `\n💰 *Total estimado:* ${formatBRL(totalCartPrice)}\n`;
    msg += `Pode separar para mim, por favor? 😊`;

    setCopiedFeedback(false);
    setIsCartOpen(false);
    setWhatsappModal({
      open: true,
      title: 'Seu Pedido Pronto para o WhatsApp',
      message: msg,
      targetPhone: WHATSAPP_PHONE,
    });
  };

  const copyMessageToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(whatsappModal.message);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 3000);
    } catch {
      setCopiedFeedback(false);
    }
  };

  const openWhatsAppApp = () => {
    const encoded = encodeURIComponent(whatsappModal.message);
    const phone = whatsappModal.targetPhone || '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredProducts = products.filter(
    (p) => selectedCategory === 'Todos' || p.category === selectedCategory
  );

  const clientSortedProducts = [...filteredProducts].sort((a, b) => {
    if (a.stock === 0 && b.stock > 0) return 1;
    if (a.stock > 0 && b.stock === 0) return -1;
    return 0;
  });

  const totalUnitsInStock = products.reduce((sum, p) => sum + p.stock, 0);

  if (viewMode === 'seller' && !isUnlocked) {
    return (
      <PinGate
        expectedPin={SELLER_PIN}
        theme={theme}
        onToggleTheme={toggleTheme}
        onUnlock={() => {
          try {
            localStorage.setItem(PIN_STORAGE_KEY, 'true');
          } catch {
            // Ignora erro de armazenamento privado
          }
          setIsUnlocked(true);
        }}
        onBackToCatalog={() => navigateTo('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-28 transition-colors duration-200">
      {/* Barra de simulação exibida apenas em DEV ou com ?demo=1 */}
      {isDemoMode && (
        <div className="bg-slate-900 dark:bg-slate-950 dark:border-b dark:border-slate-800 text-white px-3 py-2.5 sticky top-0 z-40 shadow-md">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Alternar rota (modo teste):</span>
            </div>

            <div className="flex bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigateTo(SELLER_PATH)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  viewMode === 'seller'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Store className="w-4 h-4" />
                Balcão (/balcao)
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  viewMode === 'client'
                    ? 'bg-[#4BBBC2] text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                Cliente (/)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VISÃO 1: MODO VENDEDORA (/balcao)
         ===================================================================== */}
      {viewMode === 'seller' && (
        <main key="seller-view" className="max-w-4xl mx-auto px-4 pt-5 animate-fade-in">
          <header className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border-2 border-slate-200 dark:border-slate-800 mb-5 transition-colors duration-200">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src="/dulka-logo.svg"
                  alt="Logo Dulka Chup-Chup"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shrink-0 shadow-xs"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {STORE_NAME}
                    </h1>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                        syncStatus === 'synced'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : syncStatus === 'syncing'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                            : syncStatus === 'error'
                              ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {syncStatus === 'local' ? (
                        <CloudOff className="w-3.5 h-3.5" />
                      ) : (
                        <Cloud className="w-3.5 h-3.5" />
                      )}
                      {syncStatus === 'synced'
                        ? 'Salvo na nuvem'
                        : syncStatus === 'syncing'
                          ? 'Salvando...'
                          : syncStatus === 'error'
                            ? 'Sem conexão (salvo local)'
                            : 'Salvo neste aparelho'}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
                    Freezer da {OWNER_NAME} • Hoje:{' '}
                    <strong className="text-slate-900 dark:text-white underline decoration-[#4BBBC2] decoration-2">
                      {totalUnitsInStock} unidades
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sair do balcão e pedir código novamente"
                  className="min-h-[44px] inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/60 hover:border-red-200 dark:hover:border-red-800 hover:text-red-700 dark:hover:text-red-300 text-slate-700 dark:text-slate-200 font-bold text-sm sm:text-base transition-all active:scale-95 touch-manipulation"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={openCreateModal}
                className="flex-1 min-h-[56px] flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white active:scale-95 text-white dark:text-slate-950 font-bold text-lg px-5 py-4 rounded-2xl shadow-sm transition-all touch-manipulation"
              >
                <Plus className="w-6 h-6" />
                Novo Sabor
              </button>

              <button
                type="button"
                onClick={openSellerShareWhatsApp}
                className="flex-1 min-h-[56px] flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1FB858] active:scale-95 text-white font-extrabold text-lg px-6 py-4 rounded-2xl shadow-md transition-all touch-manipulation"
              >
                <WhatsAppIcon className="w-6 h-6 shrink-0" />
                Mandar no WhatsApp
              </button>
            </div>

            <nav
              aria-label="Categorias"
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-5 border-t border-slate-200 dark:border-slate-800"
            >
              {FILTER_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`min-h-[56px] py-3 px-3 rounded-2xl text-lg font-extrabold transition-all border-2 active:scale-95 touch-manipulation ${
                      isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </nav>
          </header>

          <section
            aria-busy={isLoading}
            aria-label={isLoading ? 'Carregando estoque' : 'Lista de sabores no freezer'}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {isLoading
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <SellerCardSkeleton key={`seller-skeleton-${idx}`} />
                ))
              : filteredProducts.map((product, index) => {
              const flavorTheme = FLAVOR_THEMES[product.theme] || FLAVOR_THEMES.sky;
              const isOut = product.stock === 0;
              const isLow = product.stock > 0 && product.stock <= 5;
              const isHighlighted = highlightedId === product.id;

              return (
                <article
                  key={product.id}
                  style={{ animationDelay: `${Math.min(index * 35, 210)}ms` }}
                  className={`animate-card-in rounded-3xl p-5 border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                    isOut
                      ? 'bg-slate-200/80 dark:bg-slate-900/70 border-slate-300 dark:border-slate-800'
                      : `${flavorTheme.bg} ${flavorTheme.border}`
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner leading-none transition-transform duration-200 ${
                          isMultiIcon(product.emoji)
                            ? 'text-2xl tracking-tighter'
                            : 'text-4xl'
                        } ${
                          isOut
                            ? 'bg-slate-300 dark:bg-slate-800 grayscale'
                            : flavorTheme.iconBg
                        }`}
                      >
                        {product.emoji}
                      </div>
                      <div>
                        <span
                          className={`inline-block text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg mb-1 ${
                            isOut ? 'bg-slate-500 text-white' : flavorTheme.badge
                          }`}
                        >
                          {product.category}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                          {product.name}
                        </h2>
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                          {formatBRL(product.price)} cada
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        title="Editar sabor ou preço"
                        aria-label={`Editar ${product.name}`}
                        className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-xl transition-all active:scale-95 touch-manipulation"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductToDelete(product)}
                        title="Remover sabor"
                        aria-label={`Remover ${product.name}`}
                        className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-xl transition-all active:scale-95 touch-manipulation"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 bg-white dark:bg-slate-900/95 rounded-2xl p-3 border-2 border-slate-200/90 dark:border-slate-700/80 shadow-inner flex items-center justify-between gap-2 transition-colors">
                    <button
                      type="button"
                      onClick={() => updateStock(product.id, -1)}
                      disabled={isOut}
                      aria-label={`Diminuir 1 de ${product.name}`}
                      className={`w-20 h-20 sm:w-24 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-black text-2xl transition-all select-none touch-manipulation ${
                        isOut
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-md'
                      }`}
                    >
                      <Minus className="w-7 h-7 stroke-[3]" />
                      <span className="text-sm font-extrabold -mt-1">1</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openExactStockModal(product)}
                      title="Toque para digitar a quantidade exata"
                      className={`flex-1 py-2 px-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-all duration-200 flex flex-col items-center justify-center group touch-manipulation ${
                        isHighlighted
                          ? 'ring-4 ring-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 scale-105'
                          : ''
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        Tem no freezer
                        <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                      </span>
                      <span
                        className={`text-5xl sm:text-6xl font-black tracking-tight my-0.5 transition-colors ${
                          isOut
                            ? 'text-red-600 dark:text-red-400'
                            : isLow
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {product.stock}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 underline">
                        {isOut ? 'ACABOU! (Toque p/ repor)' : 'Toque para digitar'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateStock(product.id, 1)}
                      aria-label={`Adicionar 1 de ${product.name}`}
                      className="w-20 h-20 sm:w-24 sm:h-20 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex flex-col items-center justify-center font-black text-2xl shadow-md transition-all select-none touch-manipulation"
                    >
                      <Plus className="w-7 h-7 stroke-[3]" />
                      <span className="text-sm font-extrabold -mt-1">1</span>
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => updateStock(product.id, -5)}
                      disabled={isOut}
                      className={`min-h-[56px] py-3 px-4 rounded-xl font-extrabold text-base border-2 transition-all touch-manipulation ${
                        isOut
                          ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/50 active:scale-95 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/70 shadow-xs'
                      }`}
                    >
                      Vendeu 5 (-5)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStock(product.id, -10)}
                      disabled={isOut}
                      className={`min-h-[56px] py-3 px-4 rounded-xl font-extrabold text-base border-2 transition-all touch-manipulation ${
                        isOut
                          ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/50 active:scale-95 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/70 shadow-xs'
                      }`}
                    >
                      Vendeu 10 (-10)
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </main>
      )}

      {/* =====================================================================
          VISÃO 2: MODO CLIENTE (/)
         ===================================================================== */}
      {viewMode === 'client' && (
        <main key="client-view" className="max-w-4xl mx-auto px-4 pt-5 animate-fade-in">
          <header className="relative bg-gradient-to-br from-[#4BBBC2] via-[#3CAAB2] to-[#2F8F98] dark:from-[#2C7F87] dark:via-[#22666E] dark:to-[#194E55] text-white rounded-3xl p-5 sm:p-6 shadow-md mb-6 transition-colors duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src="/dulka-logo.svg"
                  alt="Logo Dulka Chup-Chup"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shrink-0 shadow-lg ring-4 ring-white/30"
                />
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    Estoque atualizado em tempo real
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                    {STORE_NAME}
                  </h1>
                  <p className="text-white/90 text-sm sm:text-base mt-1">
                    Gelados da {OWNER_NAME} — escolha seus sabores e monte o pedido pelo WhatsApp!
                  </p>
                </div>
              </div>

              <ThemeToggle
                theme={theme}
                onToggle={toggleTheme}
                variant="glass"
                className="shrink-0"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pt-5 pb-1 no-scrollbar">
              {FILTER_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all active:scale-95 touch-manipulation ${
                      active
                        ? 'bg-white text-[#2A7C84] shadow'
                        : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </header>

          <section
            aria-busy={isLoading}
            aria-label={isLoading ? 'Carregando catálogo' : 'Sabores disponíveis'}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <ClientCardSkeleton key={`client-skeleton-${idx}`} />
                ))
              : clientSortedProducts.map((product, index) => {
              const flavorTheme = FLAVOR_THEMES[product.theme] || FLAVOR_THEMES.sky;
              const isOut = product.stock === 0;
              const isLastUnits = product.stock > 0 && product.stock <= 5;
              const qtyInCart = Math.min(cart[product.id] || 0, product.stock);

              return (
                <article
                  key={product.id}
                  style={{ animationDelay: `${Math.min(index * 35, 245)}ms` }}
                  className={`animate-card-in rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                    isOut
                      ? 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-65'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 leading-none ${
                          isMultiIcon(product.emoji)
                            ? 'text-xl tracking-tighter'
                            : 'text-3xl'
                        } ${
                          isOut
                            ? 'bg-slate-200 dark:bg-slate-800 grayscale'
                            : flavorTheme.iconBg
                        }`}
                      >
                        {product.emoji}
                      </div>

                      {isOut ? (
                        <span className="bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-400 text-xs font-extrabold uppercase px-3 py-1.5 rounded-full">
                          Acabou
                        </span>
                      ) : isLastUnits ? (
                        <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Restam {product.stock} un.!
                        </span>
                      ) : (
                        <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-xs font-bold px-3 py-1.5 rounded-full">
                          Restam {product.stock} un.
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {product.category}
                      </p>
                      <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {product.name}
                      </h2>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                        {formatBRL(product.price)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {isOut ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500 font-bold text-sm cursor-not-allowed"
                      >
                        Indisponível no momento
                      </button>
                    ) : qtyInCart === 0 ? (
                      <button
                        type="button"
                        onClick={() => updateCart(product, 1)}
                        className="w-full py-3 px-4 rounded-xl bg-[#3CAAB2] hover:bg-[#31939A] active:scale-95 text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-xs touch-manipulation"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Pedir
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl p-1.5">
                        <button
                          type="button"
                          onClick={() => updateCart(product, -1)}
                          aria-label={`Remover 1 ${product.name} do pedido`}
                          className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 text-[#2A7C84] dark:text-[#66D1D8] font-black flex items-center justify-center shadow-xs hover:bg-sky-100 dark:hover:bg-slate-700 active:scale-95 transition-all touch-manipulation"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="font-extrabold text-slate-900 dark:text-white text-base">
                          {qtyInCart} no pedido
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCart(product, 1)}
                          disabled={qtyInCart >= product.stock}
                          aria-label={`Adicionar 1 ${product.name} ao pedido`}
                          className={`w-10 h-10 rounded-lg font-black flex items-center justify-center shadow-xs transition-all active:scale-95 touch-manipulation ${
                            qtyInCart >= product.stock
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                              : 'bg-[#3CAAB2] text-white hover:bg-[#31939A]'
                          }`}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          {totalCartCount > 0 && (
            <div className="fixed bottom-4 left-4 right-4 z-30 max-w-2xl mx-auto animate-bounce-in">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-[#25D366] hover:bg-[#1FB858] text-white p-4 rounded-2xl shadow-xl flex items-center justify-between transition-all active:scale-98 touch-manipulation"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-white text-emerald-700 font-black w-9 h-9 rounded-xl flex items-center justify-center text-base">
                    {totalCartCount}
                  </span>
                  <div className="text-left">
                    <p className="font-extrabold text-base leading-tight">
                      Ver meu pedido
                    </p>
                    <p className="text-xs text-white/90">
                      Toque para enviar no WhatsApp
                    </p>
                  </div>
                </div>
                <span className="text-xl font-black">
                  {formatBRL(totalCartPrice)}
                </span>
              </button>
            </div>
          )}
        </main>
      )}

      {/* TOAST DESFAZER */}
      {toast && viewMode === 'seller' && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-xl mx-auto animate-bounce-in">
          <div className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-2xl shadow-2xl border-2 border-slate-700 dark:border-slate-600 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Check className="w-6 h-6 text-emerald-400 shrink-0" />
              <p className="text-base sm:text-lg font-bold leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={handleUndo}
              className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-base px-4 py-3 rounded-xl flex items-center gap-1.5 shrink-0 shadow transition-all touch-manipulation"
            >
              <RotateCcw className="w-5 h-5" />
              Desfazer
            </button>
          </div>
        </div>
      )}

      {/* MODAL: QUANTIDADE EXATA */}
      <Modal
        open={Boolean(editingStockProduct)}
        onClose={() => setEditingStockProduct(null)}
        maxWidthClass="max-w-md"
      >
        {editingStockProduct && (
          <form
            onSubmit={saveExactStock}
            className="bg-white dark:bg-slate-900 rounded-3xl w-full p-6 shadow-2xl border-2 border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Alterar Quantidade
              </h3>
              <button
                type="button"
                onClick={() => setEditingStockProduct(null)}
                aria-label="Fechar modal"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
              Quantos{' '}
              <strong className="text-slate-900 dark:text-white">
                {editingStockProduct.emoji} {editingStockProduct.name}
              </strong>{' '}
              têm agora no freezer?
            </p>

            <input
              type="number"
              inputMode="numeric"
              min="0"
              autoFocus
              value={customStockInput}
              onChange={(e) => setCustomStockInput(e.target.value)}
              className="w-full text-center text-5xl font-black py-5 rounded-2xl border-4 border-slate-300 dark:border-slate-700 focus:border-emerald-600 focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors"
            />

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditingStockProduct(null)}
                className="min-h-[56px] py-4 rounded-2xl font-bold text-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all touch-manipulation"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[56px] py-4 rounded-2xl font-extrabold text-lg bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-md transition-all touch-manipulation"
              >
                Confirmar
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: CRIAR / EDITAR SABOR */}
      <Modal
        open={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        variant="sheet"
        maxWidthClass="max-w-lg"
      >
        <form
          onSubmit={handleSaveProduct}
          className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-h-[92dvh] flex flex-col shadow-2xl border-t-2 sm:border-2 border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Cabeçalho fixo */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {editingProduct ? 'Editar Sabor' : 'Cadastrar Novo Sabor'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              aria-label="Fechar modal"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0 transition-colors touch-manipulation"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Corpo rolável */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4">
            <div className="min-w-0">
              <label className="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Nome do Sabor
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Morango com Ninho, Floresta Negra..."
                value={productForm.name}
                onChange={(e) => handleFlavorNameChange(e.target.value)}
                className="w-full text-base sm:text-lg p-3.5 sm:p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-slate-900 dark:focus:border-[#4BBBC2] focus:outline-none transition-colors"
              />
              {!editingProduct && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  O ícone e a cor são sugeridos conforme o nome, mas você pode trocar abaixo.
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Tipo (Categoria)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setProductForm({ ...productForm, category: cat })}
                    className={`py-3 px-1.5 sm:px-2 rounded-xl font-bold text-xs sm:text-base border-2 text-center truncate transition-all active:scale-95 touch-manipulation ${
                      productForm.category === cat
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Preço (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: e.target.value })
                  }
                  className="w-full text-lg sm:text-xl font-bold p-3.5 sm:p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-[#4BBBC2] focus:outline-none transition-colors"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Quantidade
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  required
                  value={productForm.stock}
                  onChange={(e) =>
                    setProductForm({ ...productForm, stock: e.target.value })
                  }
                  className="w-full text-lg sm:text-xl font-bold p-3.5 sm:p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-[#4BBBC2] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                  Ícone do Sabor
                </label>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Prévia:
                  </span>
                  <span
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 leading-none transition-all ${
                      isMultiIcon(productForm.emoji)
                        ? 'text-lg tracking-tighter'
                        : 'text-2xl'
                    } ${FLAVOR_THEMES[productForm.theme].iconBg}`}
                  >
                    {productForm.emoji || '🍦'}
                  </span>
                </div>
              </div>

              {/* Abas de categorias de ícones */}
              <div className="flex flex-wrap gap-1.5 pb-2">
                {ICON_GROUPS.map((group) => (
                  <button
                    type="button"
                    key={group.id}
                    onClick={() => setActiveIconGroup(group.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all active:scale-95 touch-manipulation ${
                      activeIconGroup === group.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {group.label}
                  </button>
                ))}
              </div>

              {/* Opções do grupo selecionado */}
              <div
                className={
                  activeIconGroup === 'combos'
                    ? 'grid grid-cols-2 gap-2 mt-1'
                    : 'grid grid-cols-5 sm:grid-cols-7 gap-2 mt-1'
                }
              >
                {ICON_GROUPS.find((g) => g.id === activeIconGroup)?.items.map(
                  (opt) => (
                    <button
                      type="button"
                      key={opt.emoji}
                      title={opt.label}
                      onClick={() => {
                        setHasManualIcon(true);
                        setProductForm({ ...productForm, emoji: opt.emoji });
                      }}
                      className={`min-w-0 h-12 px-2 rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation ${
                        productForm.emoji === opt.emoji
                          ? 'border-slate-900 dark:border-white bg-slate-200 dark:bg-slate-700'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`shrink-0 leading-none ${
                          isMultiIcon(opt.emoji)
                            ? 'text-base sm:text-lg tracking-tighter'
                            : 'text-2xl'
                        }`}
                      >
                        {opt.emoji}
                      </span>
                      {activeIconGroup === 'combos' && (
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                          {opt.label}
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>

              {/* Entrada livre para qualquer emoji ou combinação personalizada */}
              <div className="mt-3">
                <input
                  type="text"
                  maxLength={8}
                  placeholder="Ou digite 1 ou 2 emojis do teclado (ex: 🍓🥛)"
                  value={productForm.emoji}
                  onChange={(e) => {
                    setHasManualIcon(true);
                    setProductForm({ ...productForm, emoji: e.target.value });
                  }}
                  className="w-full text-sm sm:text-base p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:border-slate-900 dark:focus:border-[#4BBBC2] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Cor do Cartão
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  Object.entries(FLAVOR_THEMES) as [
                    FlavorThemeKey,
                    (typeof FLAVOR_THEMES)[FlavorThemeKey],
                  ][]
                ).map(([key, val]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => {
                      setHasManualTheme(true);
                      setProductForm({ ...productForm, theme: key });
                    }}
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 text-slate-900 dark:text-slate-100 transition-all active:scale-95 touch-manipulation ${val.bg} ${
                      productForm.theme === key
                        ? 'border-slate-950 dark:border-white ring-2 ring-slate-900/20 dark:ring-white/30'
                        : val.border
                    }`}
                  >
                    {val.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rodapé fixo */}
          <div className="shrink-0 grid grid-cols-2 gap-3 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="min-h-[52px] py-3.5 px-3 rounded-2xl font-bold text-base sm:text-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all touch-manipulation"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[52px] py-3.5 px-3 rounded-2xl font-extrabold text-base sm:text-lg bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-md transition-all touch-manipulation"
            >
              {editingProduct ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        open={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        maxWidthClass="max-w-md"
      >
        {productToDelete && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full p-6 shadow-2xl border-2 border-slate-200 dark:border-slate-800">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Apagar este sabor?
            </h3>
            <p className="text-lg text-slate-700 dark:text-slate-300 mt-2">
              Tem certeza que deseja remover{' '}
              <strong className="text-slate-900 dark:text-white">
                {productToDelete.emoji} {productToDelete.name}
              </strong>{' '}
              da lista?
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="min-h-[56px] py-4 rounded-2xl font-bold text-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all touch-manipulation"
              >
                Não, voltar
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                className="min-h-[56px] py-4 rounded-2xl font-extrabold text-lg bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all touch-manipulation"
              >
                Sim, apagar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: CARRINHO DO CLIENTE */}
      <Modal
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        variant="sheet"
        maxWidthClass="max-w-lg"
      >
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full p-6 shadow-2xl max-h-[85dvh] flex flex-col border-t-2 sm:border-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#3CAAB2]" />
              Seu Pedido ({totalCartCount} itens)
            </h3>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              aria-label="Fechar carrinho"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 overflow-y-auto overscroll-contain space-y-3 flex-1 min-h-0">
            {cartItemsList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{item.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {item.qty}x {formatBRL(item.price)} ={' '}
                      <strong className="text-slate-900 dark:text-white">
                        {formatBRL(item.qty * item.price)}
                      </strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateCart(item, -1)}
                    className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white flex items-center justify-center font-bold active:scale-95 transition-all touch-manipulation"
                  >
                    -
                  </button>
                  <span className="font-extrabold w-5 text-center text-slate-900 dark:text-white">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCart(item, 1)}
                    disabled={item.qty >= item.stock}
                    className="w-9 h-9 rounded-lg bg-[#3CAAB2] text-white flex items-center justify-center font-bold disabled:bg-slate-300 dark:disabled:bg-slate-700 active:scale-95 transition-all touch-manipulation"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-lg font-extrabold mb-4">
              <span className="text-slate-800 dark:text-slate-200">Total estimado:</span>
              <span className="text-2xl text-emerald-700 dark:text-emerald-400">
                {formatBRL(totalCartPrice)}
              </span>
            </div>
            <button
              type="button"
              onClick={openClientOrderWhatsApp}
              className="w-full py-4 rounded-2xl bg-[#25D366] hover:bg-[#1FB858] active:scale-95 text-white font-extrabold text-lg flex items-center justify-center gap-2.5 shadow-lg transition-all touch-manipulation"
            >
              <WhatsAppIcon className="w-6 h-6 shrink-0" />
              Enviar Pedido no WhatsApp
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: PREVIEW WHATSAPP */}
      <Modal
        open={whatsappModal.open}
        onClose={() => setWhatsappModal({ ...whatsappModal, open: false })}
        maxWidthClass="max-w-lg"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full p-6 shadow-2xl border-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {whatsappModal.title}
            </h3>
            <button
              type="button"
              onClick={() =>
                setWhatsappModal({ ...whatsappModal, open: false })
              }
              aria-label="Fechar janela"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 max-h-72 overflow-y-auto whitespace-pre-wrap text-sm sm:text-base text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            {whatsappModal.message}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            <button
              type="button"
              onClick={() => void copyMessageToClipboard()}
              className="min-h-[56px] py-4 px-4 rounded-2xl font-bold text-base bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white flex items-center justify-center gap-2 active:scale-95 transition-all touch-manipulation"
            >
              {copiedFeedback ? (
                <>
                  <Check className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  Texto Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copiar Texto
                </>
              )}
            </button>

            <button
              type="button"
              onClick={openWhatsAppApp}
              className="min-h-[56px] py-4 px-4 rounded-2xl font-extrabold text-base bg-[#25D366] hover:bg-[#1FB858] active:scale-95 text-white flex items-center justify-center gap-2 shadow-md transition-all touch-manipulation"
            >
              <WhatsAppIcon className="w-5 h-5 shrink-0" />
              Abrir WhatsApp
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
