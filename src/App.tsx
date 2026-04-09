import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BookOpen, LayoutGrid, ShoppingBag, HelpCircle, Book, Search, ArrowUpDown, ArrowRight, ChevronRight, Trash2, Info, Plus, X, Lock, LogOut, MapPin, Phone, Mail, Clock, Shield, Truck, CreditCard, MessageCircle, Star, Package, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book as BookType, CartItem, Order } from './types';

type Screen = 'home' | 'catalog' | 'cart' | 'contacts' | 'support' | 'admin';



export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [books, setBooks] = useState<BookType[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (err) {
      console.error('Failed to load books:', err);
    } finally {
      setBooksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const addToCart = (book: BookType) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === book.id);
      if (existing) return prev.map(item => item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...book, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return books.filter(b => b.title.toLowerCase().startsWith(searchQuery.toLowerCase()) || b.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, books]);

  const addBook = (book: BookType) => {
    setBooks(prev => [...prev, book]);
  };

  const [dailySales, setDailySales] = useState(0);
  const [dailyRevenue, setDailyRevenue] = useState(0);

  const handleOrder = (items: CartItem[], orderTotal: number) => {
    setDailySales(prev => prev + items.reduce((acc, i) => acc + i.quantity, 0));
    setDailyRevenue(prev => prev + orderTotal);
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-secondary-container selection:text-on-secondary-container">
      <header className="fixed top-0 z-50 w-full vellum-overlay border-b border-outline-variant/10">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentScreen('home'); setShowSearch(false); }}>
            <BookOpen className="text-primary w-6 h-6" />
            <h1 className="font-headline tracking-tighter font-bold text-lg text-primary">📚 Книжный Мир</h1>
          </div>
          <nav className="hidden md:flex gap-8">
            {[
              { key: 'catalog' as Screen, label: 'Каталог' },
              { key: 'cart' as Screen, label: 'Корзина' },
              { key: 'contacts' as Screen, label: 'Контакты' },
              { key: 'support' as Screen, label: 'Поддержка' },
            ].map(n => (
              <button key={n.key} onClick={() => { setCurrentScreen(n.key); setShowSearch(false); }}
                className={`font-label text-xs uppercase tracking-widest transition-opacity ${currentScreen === n.key ? 'text-primary font-bold' : 'text-secondary hover:opacity-80'}`}>
                {n.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-4 relative">
            <div className="relative">
              <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors" onClick={() => setShowSearch(!showSearch)}>
                <Search className="w-5 h-5 text-primary" />
              </button>
              {showSearch && (
                <div className="absolute right-0 top-12 w-80 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 p-3 z-50">
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Введите название книги..."
                    className="w-full bg-surface-container-low rounded-lg py-2 px-3 text-sm text-primary placeholder:text-outline-variant/60 font-label focus:outline-none focus:ring-2 focus:ring-primary/20" autoFocus />
                  {searchQuery && searchResults.length > 0 && (
                    <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
                      {searchResults.map(b => (
                        <button key={b.id} onClick={() => { addToCart(b); setShowSearch(false); setSearchQuery(''); setCurrentScreen('cart'); }}
                          className="w-full text-left p-2 rounded-lg hover:bg-surface-container-high flex items-center gap-3 transition-colors">
                          <img src={b.image} alt={b.title} className="w-10 h-14 object-cover rounded" referrerPolicy="no-referrer" />
                          <div>
                            <p className="font-label text-sm font-bold text-primary">{b.title}</p>
                            <p className="text-xs text-secondary">{b.author} · {b.price} ₽</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery && searchResults.length === 0 && <p className="text-sm text-secondary mt-2 text-center py-2">Ничего не найдено</p>}
                </div>
              )}
            </div>
            <button onClick={() => setCurrentScreen('cart')} className="p-2 rounded-full hover:bg-surface-container-high transition-colors relative">
              <ShoppingBag className="w-5 h-5 text-primary" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-screen-xl mx-auto">
        <AnimatePresence mode="wait">
          {currentScreen === 'home' && <HomeScreen key="home" onNavigate={setCurrentScreen} cartCount={cartCount} />}
          {currentScreen === 'catalog' && <CatalogScreen key="catalog" books={books} onAddToCart={addToCart} />}
          {currentScreen === 'cart' && <CartScreen key="cart" cart={cart} onRemove={removeFromCart} total={cartTotal} onOrder={handleOrder} books={books} onAddToCart={addToCart} />}
          {currentScreen === 'contacts' && <ContactsScreen key="contacts" />}
          {currentScreen === 'support' && <SupportScreen key="support" />}
          {currentScreen === 'admin' && <AdminScreen key="admin" onAddBook={addBook} sales={dailySales} revenue={dailyRevenue} books={books} />}
        </AnimatePresence>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-6 pt-3 vellum-overlay border-t border-outline-variant/15 shadow-[0_-8px_24px_rgba(27,28,25,0.06)] z-50">
        {[
          { key: 'catalog' as Screen, icon: LayoutGrid, label: 'Каталог' },
          { key: 'cart' as Screen, icon: ShoppingBag, label: 'Корзина' },
          { key: 'contacts' as Screen, icon: MapPin, label: 'Контакты' },
          { key: 'support' as Screen, icon: HelpCircle, label: 'Помощь' },
        ].map(n => (
          <button key={n.key} onClick={() => setCurrentScreen(n.key)}
            className={`flex flex-col items-center justify-center px-3 py-2 transition-all ${currentScreen === n.key ? 'text-primary bg-secondary-container rounded-xl' : 'text-secondary opacity-80'}`}>
            <n.icon className="w-5 h-5" />
            <span className="font-label text-[10px] font-medium uppercase tracking-widest mt-1">{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Floating Admin Button */}
      <button
        onClick={() => setCurrentScreen('admin')}
        className="fixed bottom-20 md:bottom-6 right-6 z-50 w-12 h-12 bg-primary-container rounded-full flex items-center justify-center editorial-shadow hover:scale-110 transition-transform active:scale-95"
        title="Админ-панель"
      >
        <Lock className="w-5 h-5 text-on-primary" />
      </button>
    </div>
  );
}

function HomeScreen({ onNavigate, cartCount }: { onNavigate: (s: Screen) => void; cartCount: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[70vh]">
      <section className="w-full text-center mb-12 space-y-6">
        <div className="w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center mx-auto editorial-shadow">
          <Book className="text-on-secondary-container w-10 h-10" />
        </div>
        <h2 className="font-headline font-black text-4xl md:text-5xl text-primary tracking-tighter leading-tight max-w-md mx-auto">
          Добро пожаловать в Книжный Мир 📚
        </h2>
        <p className="font-body text-secondary text-lg font-medium leading-relaxed max-w-sm mx-auto">
          Ваш лучший онлайн-магазин книг. Находите, заказывайте и читайте с удовольствием!
        </p>
      </section>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => onNavigate('catalog')} className="group relative flex flex-col justify-between items-start p-8 rounded-xl bg-surface-container-low text-left overflow-hidden transition-all active:scale-95 duration-150 editorial-shadow md:col-span-2 min-h-[140px]">
          <div className="relative z-10 flex flex-col h-full justify-between w-full">
            <div><LayoutGrid className="text-secondary w-6 h-6 mb-4" /><h3 className="font-headline font-bold text-2xl text-primary">Каталог книг</h3><p className="font-body text-sm text-on-surface-variant/70 mt-1">Исследуйте нашу коллекцию произведений</p></div>
            <div className="flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-widest text-secondary">Открыть каталог <ArrowRight className="w-4 h-4" /></div>
          </div>
        </button>
        <button onClick={() => onNavigate('cart')} className="group flex items-center justify-between p-6 rounded-xl bg-secondary-container text-left transition-all active:scale-95 duration-150 editorial-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface/50 flex items-center justify-center"><ShoppingBag className="text-on-secondary-container w-6 h-6" /></div>
            <div><h3 className="font-headline font-bold text-lg text-on-secondary-container">Корзина</h3><p className="font-body text-xs text-on-secondary-container/60">{cartCount} товаров</p></div>
          </div>
          <ChevronRight className="text-on-secondary-container opacity-40 group-hover:opacity-100 transition-opacity w-5 h-5" />
        </button>
        <button onClick={() => onNavigate('support')} className="group flex items-center justify-between p-6 rounded-xl bg-surface-container-highest text-left transition-all active:scale-95 duration-150 editorial-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface/50 flex items-center justify-center"><HelpCircle className="text-secondary w-6 h-6" /></div>
            <div><h3 className="font-headline font-bold text-lg text-primary">Поддержка</h3><p className="font-body text-xs text-on-surface-variant/70">Нужна помощь? Мы рядом!</p></div>
          </div>
          <ChevronRight className="text-primary opacity-20 group-hover:opacity-100 transition-opacity w-5 h-5" />
        </button>
      </div>
      <div className="mt-12 text-center opacity-40">
        <p className="font-headline italic text-sm text-secondary">«Книга — лучший подарок, потому что её можно открыть снова и снова.»</p>
      </div>
    </motion.div>
  );
}

function CatalogScreen({ books, onAddToCart }: { books: BookType[]; onAddToCart: (b: BookType) => void }) {
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'title' | 'pages'>('default');
  const sorted = useMemo(() => {
    const arr = [...books];
    if (sortBy === 'price-asc') arr.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') arr.sort((a, b) => b.price - a.price);
    else if (sortBy === 'title') arr.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'pages') arr.sort((a, b) => a.pages - b.pages);
    return arr;
  }, [books, sortBy]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div><span className="font-label text-secondary text-[11px] font-medium uppercase tracking-widest block mb-3">Коллекция</span>
            <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-primary leading-none">Наши книги</h2></div>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: 'default' as const, l: 'Все' },
              { v: 'price-asc' as const, l: 'Цена ↑' },
              { v: 'price-desc' as const, l: 'Цена ↓' },
              { v: 'title' as const, l: 'По названию' },
              { v: 'pages' as const, l: 'По страницам' },
            ].map(s => (
              <button key={s.v} onClick={() => setSortBy(s.v)}
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 transition-colors ${sortBy === s.v ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}>
                <ArrowUpDown className="w-3 h-3" />{s.l}
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
        {sorted.map(book => (
          <article key={book.id} className="group relative">
            <div className="aspect-[3/4] overflow-hidden rounded-lg mb-6 editorial-shadow bg-surface-container-low transition-transform duration-500 group-hover:-translate-y-2">
              <img src={book.image} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-headline text-2xl font-bold text-primary group-hover:text-secondary transition-colors">{book.title}</h3>
              <span className="font-headline text-xl font-bold text-primary whitespace-nowrap ml-2">{book.price} ₽</span>
            </div>
            <p className="font-label text-secondary text-xs font-semibold uppercase tracking-widest mb-1">{book.author}</p>
            <p className="font-label text-xs text-on-surface-variant/60 mb-3">📄 {book.pages} стр. · {book.category}</p>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6 line-clamp-2">{book.description}</p>
            <button onClick={() => onAddToCart(book)}
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold tracking-tight flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-95">
              <ShoppingBag className="w-4 h-4" />В корзину
            </button>
          </article>
        ))}
      </div>
    </motion.div>
  );
}

function CartScreen({ cart, onRemove, total, onOrder, books, onAddToCart }: { cart: CartItem[]; onRemove: (id: string) => void; total: number; onOrder: (c: CartItem[], t: number) => void; books: BookType[]; onAddToCart: (b: BookType) => void }) {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [trackNumber, setTrackNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [delivery, setDelivery] = useState<'courier' | 'pickup'>('courier');
  const [payment, setPayment] = useState<'cash' | 'card'>('card');
  const [address, setAddress] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardPin, setCardPin] = useState('');

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Пользователь с сайта",
          phone: phone,
          address: delivery === 'courier' ? address : 'Самовывоз',
          delivery: delivery,
          payment: payment,
          items: cart.map(item => ({ id: item.id, title: item.title, author: item.author, price: item.price, quantity: item.quantity, image: item.image })),
          total: total
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTrackNumber(data.trackNumber || 'WAITING');
        setOrderPlaced(true);
        onOrder(cart, total);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Server error:', errorData);
        alert(`Ошибка сервера: ${errorData.error || 'Не удалось оформить заказ'}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Не удалось связаться с сервером. Убедитесь, что сервер (node server.cjs) запущен.');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderPlaced) return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"><Star className="w-12 h-12 text-green-600" /></div>
      <h2 className="font-headline text-4xl font-bold text-primary">Заказ оформлен! 🎉</h2>
      <p className="text-secondary text-lg max-w-md">Спасибо за покупку! Наш менеджер свяжется с вами для подтверждения.</p>
      
      <div className="bg-surface-container-low px-8 py-5 rounded-2xl border border-outline-variant/20 mt-4 flex flex-col items-center">
        <span className="font-label text-xs uppercase tracking-widest text-secondary font-bold mb-2">Трек-номер для доставки</span>
        <div className="font-headline text-3xl font-black text-primary tracking-widest bg-surface-container-highest px-4 py-2 rounded-xl">
          {trackNumber}
        </div>
        <span className="text-on-surface-variant text-sm mt-3">🚚 Доставка курьером · 💵 Оплата наличными</span>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-7">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-headline text-4xl font-black tracking-tight text-primary">Ваша корзина</h2>
          <span className="font-label text-sm text-secondary tracking-wide uppercase">{cart.length} товаров</span>
        </div>
        {cart.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <ShoppingBag className="w-16 h-16 text-outline-variant mx-auto opacity-20" />
            <p className="text-secondary font-medium">Ваша корзина пуста</p>
          </div>
        ) : (
          <div className="space-y-8">
            {cart.map(item => (
              <div key={item.id} className="flex gap-6 items-start group">
                <img className="rounded-lg editorial-shadow w-24 md:w-32 aspect-[2/3] object-cover flex-shrink-0" src={item.image} alt={item.title} referrerPolicy="no-referrer" />
                <div className="flex-grow flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-headline text-xl font-bold text-primary mb-1">{item.title}</h3>
                    <p className="font-label text-sm text-secondary uppercase tracking-wider mb-1">{item.author}</p>
                    <p className="text-xs text-on-surface-variant/60 mb-2">📄 {item.pages} стр. · Кол-во: {item.quantity}</p>
                    <p className="font-headline text-lg text-primary font-bold">{item.price * item.quantity} ₽</p>
                  </div>
                  <button onClick={() => onRemove(item.id)} className="flex items-center gap-2 text-error text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity mt-3">
                    <Trash2 className="w-4 h-4" />Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-5">
        <div className="bg-surface-container-low rounded-xl p-8 sticky top-32 editorial-shadow">
          <h3 className="font-headline text-2xl font-bold text-primary mb-6">Оформить заказ</h3>
          
          {checkoutStep === 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-outline-variant/15">
                <span className="font-label text-sm font-medium text-secondary">Итого</span>
                <span className="font-headline text-2xl font-black text-primary">{total} ₽</span>
              </div>
              <button type="button" onClick={() => setCheckoutStep(1)} disabled={cart.length === 0}
                className="w-full ink-bleed-btn text-on-primary font-label font-bold uppercase tracking-[0.2em] text-sm py-4 rounded-xl active:scale-[0.98] transition-all editorial-shadow disabled:opacity-40">
                Перейти к оформлению
              </button>
            </div>
          )}

          {checkoutStep === 1 && (
            <div className="space-y-4">
              <p className="font-label text-sm font-bold text-primary">Введите телефон (только Ташкент)</p>
              <input 
                value={phone || '+998'} 
                onChange={e => {
                  let v = '+' + e.target.value.replace(/\D/g, '');
                  if (!v.startsWith('+998')) v = '+998';
                  if (v.length > 13) v = v.slice(0, 13);
                  setPhone(v);
                }} 
                placeholder="+998 90 000 00 00" 
                className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 font-label" 
                autoFocus 
              />
              <button type="button" onClick={() => setCheckoutStep(2)} disabled={phone.length < 13}
                className="w-full ink-bleed-btn text-on-primary font-label font-bold uppercase tracking-[0.2em] text-sm py-4 rounded-xl active:scale-[0.98] transition-all editorial-shadow disabled:opacity-40">
                Получить код
              </button>
            </div>
          )}

          {checkoutStep === 2 && (
            <div className="space-y-4">
              <p className="font-label text-sm font-bold text-primary">Мы отправили код подтверждения на ваш номер</p>
              <input value={code} onChange={e => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length > 4) v = v.substring(0, 4);
                setCode(v);
              }} placeholder="0000" type="text" className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 font-label text-center text-2xl tracking-[0.5em]" autoFocus />
              <button type="button" onClick={() => setCheckoutStep(3)} disabled={code.length < 4}
                className="w-full ink-bleed-btn text-on-primary font-label font-bold uppercase tracking-[0.2em] text-sm py-4 rounded-xl active:scale-[0.98] transition-all editorial-shadow">
                Подтвердить
              </button>
            </div>
          )}

          {checkoutStep === 3 && (
            <form className="space-y-5" onSubmit={handleOrderSubmit}>
              <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 space-y-4">
                <div>
                  <p className="font-label text-sm font-bold text-primary mb-2">Способ получения:</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setDelivery('courier')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${delivery === 'courier' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-secondary'}`}>Доставка</button>
                    <button type="button" onClick={() => setDelivery('pickup')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${delivery === 'pickup' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-secondary'}`}>Сами заберем</button>
                  </div>
                </div>
                {delivery === 'courier' && (
                  <div>
                    <p className="font-label text-sm font-bold text-primary mb-2">Адрес доставки:</p>
                    <input 
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                      placeholder="г. Ташкент, ул. ..." 
                      className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 font-label" 
                      required 
                    />
                  </div>
                )}
                <div>
                  <p className="font-label text-sm font-bold text-primary mb-2">Способ оплаты:</p>
                   <div className="flex gap-2">
                    <button type="button" onClick={() => setPayment('card')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${payment === 'card' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-secondary'}`}>По карте</button>
                    <button type="button" onClick={() => setPayment('cash')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${payment === 'cash' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-secondary'}`}>Наличными</button>
                  </div>
                </div>
                {payment === 'card' && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-outline-variant/10">
                    <p className="font-label text-sm font-bold text-primary">Данные карты:</p>
                    <input 
                      value={cardNumber} 
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '');
                        if (v.length > 16) v = v.substring(0, 16);
                        v = v.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
                        setCardNumber(v);
                      }} 
                      placeholder="0000 0000 0000 0000" 
                      className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 font-label tracking-widest text-center" 
                      required={payment === 'card'} 
                    />
                    <div className="flex gap-3">
                      <input 
                        value={cardExpiry} 
                        onChange={e => {
                          let v = e.target.value.replace(/\D/g, '');
                          if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
                          if (v.length > 5) v = v.substring(0, 5);
                          setCardExpiry(v);
                        }} 
                        placeholder="ММ/ГГ" 
                        className="flex-1 bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 font-label text-center tracking-widest" 
                        required={payment === 'card'} 
                      />
                      <input 
                        value={cardPin} 
                        onChange={e => {
                          let v = e.target.value.replace(/\D/g, '');
                          if (v.length > 4) v = v.substring(0, 4);
                          setCardPin(v);
                        }} 
                        placeholder="Пароль (4 цифры)" 
                        type="password"
                        className="flex-1 bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 font-label tracking-widest text-center" 
                        required={payment === 'card'} 
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-outline-variant/15 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-label text-sm font-medium text-secondary">Итого</span>
                  <span className="font-headline text-2xl font-black text-primary">{total} ₽</span>
                </div>
                <button type="submit" disabled={submitting || (delivery === 'courier' && address.length < 5) || (payment === 'card' && (cardNumber.replace(/\s/g, '').length < 16 || cardExpiry.length < 5 || cardPin.length < 4))}
                  className="w-full ink-bleed-btn text-on-primary font-label font-bold uppercase tracking-[0.2em] text-sm py-4 rounded-xl active:scale-[0.98] transition-all editorial-shadow flex items-center justify-center disabled:opacity-50">
                  {submitting ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <ShoppingBag className="w-4 h-4 inline mr-2" />}
                  {submitting ? 'Оформление...' : 'Оформить заказ'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="lg:col-span-12 mt-8">
        <h3 className="font-headline text-3xl font-black text-primary mb-6">Вам может понравиться</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {books.filter(b => !cart.some(c => c.id === b.id)).slice(0, 4).map(book => (
            <div key={book.id} className="group relative bg-surface-container-lowest p-4 rounded-2xl editorial-shadow border border-outline-variant/10">
              <div className="aspect-[3/4] overflow-hidden rounded-lg mb-4 bg-surface-container-low transition-transform duration-500 group-hover:-translate-y-1">
                <img src={book.image} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h4 className="font-headline text-lg font-bold text-primary line-clamp-1 group-hover:text-secondary transition-colors">{book.title}</h4>
              <p className="font-label text-xs text-secondary uppercase tracking-widest mb-3 line-clamp-1">{book.author}</p>
              <div className="flex justify-between items-center">
                <span className="font-headline text-lg font-black text-primary">{book.price} ₽</span>
                <button onClick={() => onAddToCart(book)}
                  className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-110 transition-transform active:scale-95 editorial-shadow">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function AdminScreen({ onAddBook, sales, revenue, books }: { onAddBook: (b: BookType) => void; sales: number; revenue: number; books: BookType[] }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [loggedIn, setLoggedIn] = useState(!!token);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [success, setSuccess] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  useEffect(() => {
    if (token) localStorage.setItem('adminToken', token);
    else localStorage.removeItem('adminToken');
  }, [token]);

  const fetchOrders = async () => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else if (res.status === 401) {
        setToken(null);
        setLoggedIn(false);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loggedIn) {
      fetchOrders();
      interval = setInterval(fetchOrders, 5000);
    }
    return () => clearInterval(interval);
  }, [loggedIn]);

  const updateOrderStatus = async (id: string, status: string) => {
    if (!token) return;
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      fetchOrders();
    } catch (e) {
      console.error('Failed to change status:', e);
    }
  };



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setLoggedIn(true);
        setLoginError('');
      } else {
        setLoginError('Неверный логин или пароль');
      }
    } catch (e) {
      setLoginError('Ошибка связи с сервером');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !pages || !price) return;
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title, author,
          pages: parseInt(pages),
          price: parseInt(price),
          image: imageUrl || '',
          category: 'Новинка'
        })
      });
      if (res.ok) {
        const data = await res.json();
        onAddBook(data.book);
        setTitle(''); setAuthor(''); setPages(''); setPrice(''); setImageUrl('');
        setSuccess(true); setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to add book:', err);
      alert('Не удалось добавить книгу. Проверьте сервер.');
    }
  };

  if (!loggedIn) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-md mx-auto mt-20">
      <div className="bg-surface-container-low rounded-2xl p-10 editorial-shadow text-center">
        <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="text-on-primary w-9 h-9" /></div>
        <h2 className="font-headline text-3xl font-bold text-primary mb-2">Админ-панель</h2>
        <p className="text-secondary text-sm mb-4">Введите логин и пароль для входа</p>
        <div className="bg-primary/10 p-3 rounded-lg mb-6 border border-primary/20">
          <p className="text-xs font-bold text-primary">Данные для входа:</p>
          <p className="text-sm font-mono text-primary mt-1">Логин: admin</p>
          <p className="text-sm font-mono text-primary">Пароль: 1234</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input value={login} onChange={e => setLogin(e.target.value)} placeholder="Логин" className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant/60 font-label" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль" type="password" className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant/60 font-label" />
          {loginError && <p className="text-error text-sm font-medium">{loginError}</p>}
          <button type="submit" className="w-full ink-bleed-btn text-on-primary font-bold py-4 rounded-xl active:scale-[0.98] transition-all">Войти</button>
        </form>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-headline text-4xl font-bold text-primary">📋 Управление магазином</h2>
        <div className="flex items-center gap-4">
          <button onClick={fetchOrders} className="flex items-center gap-2 text-primary hover:opacity-70 transition-colors font-label text-sm font-bold uppercase tracking-widest">
            <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} /> Обновить
          </button>
          <button onClick={() => { setLoggedIn(false); setToken(null); }} className="flex items-center gap-2 text-secondary hover:text-error transition-colors font-label text-sm font-bold uppercase tracking-widest">
            <LogOut className="w-4 h-4" />Выйти
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-surface-container-low rounded-2xl p-6 editorial-shadow border border-outline-variant/10">
          <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary mb-1">Продажи за сегодня</p>
          <div className="font-headline text-4xl font-black text-primary">{sales} <span className="text-xl text-on-surface-variant font-medium">шт.</span></div>
        </div>
        <div className="bg-surface-container-low rounded-2xl p-6 editorial-shadow border border-outline-variant/10">
          <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary mb-1">Прибыль</p>
          <div className="font-headline text-4xl font-black text-primary">{revenue} <span className="text-xl text-on-surface-variant font-medium">₽</span></div>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-2xl p-8 editorial-shadow">
        <h3 className="font-headline text-2xl font-bold text-primary mb-6 flex items-center gap-2"><Plus className="w-6 h-6" />Добавить новую книгу</h3>
        {success && <div className="bg-green-100 text-green-800 px-4 py-3 rounded-xl mb-4 font-label font-bold text-sm">✅ Книга успешно добавлена в каталог!</div>}
        <form onSubmit={handleAdd} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1 md:col-span-2">
              <label className="font-label text-[11px] font-bold uppercase tracking-widest text-secondary block ml-1">Название книги</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Война и мир" className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant/60 font-label" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-label text-[11px] font-bold uppercase tracking-widest text-secondary block ml-1">Автор</label>
              <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Например: Лев Толстой" className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant/60 font-label" />
            </div>
            <div className="space-y-1">
              <label className="font-label text-[11px] font-bold uppercase tracking-widest text-secondary block ml-1">Кол-во страниц</label>
              <input value={pages} onChange={e => setPages(e.target.value.replace(/\D/g, ''))} placeholder="480" type="text" className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant/60 font-label" />
            </div>
            <div className="space-y-1">
              <label className="font-label text-[11px] font-bold uppercase tracking-widest text-secondary block ml-1">Цена (₽)</label>
              <input value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="850" type="text" className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant/60 font-label" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="font-label text-[11px] font-bold uppercase tracking-widest text-secondary block ml-1">Фото книги</label>
              <div className="flex flex-col gap-3">
                <div 
                  className="relative w-full border-2 border-dashed border-outline-variant/30 rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer bg-surface-container-lowest"
                  onClick={() => document.getElementById('book-image-input')?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
                  onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-primary'); }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-primary');
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setImageUrl(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                >
                  <input 
                    id="book-image-input"
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setImageUrl(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center">
                      <Plus className="w-6 h-6 text-secondary" />
                    </div>
                    <p className="font-label text-sm font-bold text-primary">Нажмите или перетащите фото</p>
                    <p className="font-label text-xs text-on-surface-variant/60">JPG, PNG, WEBP</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-outline-variant/20"></div>
                  <span className="text-xs text-secondary font-label">или вставьте URL</span>
                  <div className="flex-1 h-px bg-outline-variant/20"></div>
                </div>
                <input value={imageUrl.startsWith('data:') ? '' : imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/photo.jpg" type="url" className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant/60 font-label text-sm" />
              </div>
              {imageUrl && (
                <div className="mt-3 flex items-end gap-3">
                  <div className="w-24 h-32 rounded-lg overflow-hidden border border-outline-variant/20 editorial-shadow">
                    <img src={imageUrl} alt="Превью" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                  <button type="button" onClick={() => setImageUrl('')} className="text-error text-xs font-bold font-label uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1">
                    <X className="w-3 h-3" />Удалить фото
                  </button>
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="w-full ink-bleed-btn text-on-primary font-bold py-4 rounded-xl active:scale-[0.98] transition-all editorial-shadow flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />Добавить книгу
          </button>
        </form>
      </div>

      <div className="bg-surface-container-low rounded-2xl p-8 editorial-shadow mt-8">
        <h3 className="font-headline text-2xl font-bold text-primary mb-6 flex items-center gap-2"><Package className="w-6 h-6" />Поступившие заказы</h3>
        {orders.length === 0 ? (
          <p className="text-secondary text-center py-6">Заказов пока нет</p>
        ) : (
          <div className="space-y-4">
            {orders.slice().reverse().map(order => (
              <div key={order.id} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/20 flex flex-col gap-3 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary font-bold bg-surface-container-highest px-2 py-0.5 rounded-full">
                        {order.source === 'telegram' ? '🤖 Telegram' : '🌐 Веб-сайт'}
                      </span>
                      <span className="font-label text-[10px] text-on-surface-variant/70 uppercase tracking-widest">{new Date(order.date).toLocaleString('ru-RU')}</span>
                      {order.status === 'new' && <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Новый</span>}
                      {order.status === 'accepted' && <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Принят</span>}
                      {order.status === 'delivered' && <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Доставлен</span>}
                      {order.status === 'rejected' && <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Отклонён</span>}
                    </div>
                    <h4 className="font-headline text-xl font-bold text-primary mr-2">{order.name || 'Покупатель'} <span className="text-secondary text-sm font-medium">({order.trackNumber})</span></h4>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="font-headline text-lg font-bold text-primary bg-surface-container-high px-3 py-1 rounded-lg">{order.total} ₽</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 mb-4">
                  <div className="space-y-2 text-sm text-on-surface-variant flex flex-col justify-start">
                    <p className="flex items-center gap-2 font-bold"><Phone className="w-4 h-4 text-secondary" /> {order.phone}</p>
                    <div className="flex gap-2">
                       <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${order.delivery === 'pickup' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                         {order.delivery === 'pickup' ? '🏪 Сами заберут' : '🚚 Доставка'}
                       </span>
                       <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${order.payment === 'card' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                         {order.payment === 'card' ? '💳 По карте' : '💵 Наличными'}
                       </span>
                    </div>
                  </div>
                  <div className="text-sm bg-surface-container-high/50 p-3 rounded-lg border border-outline-variant/10">
                    <p className="font-bold text-primary mb-2 text-xs uppercase tracking-widest">Товары ({order.items.reduce((acc, i) => acc + i.quantity, 0)} шт.):</p>
                    <ul className="space-y-1">
                      {order.items.map((item, idx) => {
                        const bookImage = item.image || books.find(b => b.id === item.id)?.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwvdVptetsTC7kybou-1fQ91hnJJHGdht_rL7rrK5ALhXWU6-n2r5_GG0fKMC6Runur-P7gqDfZ6MeuhDeizN8UCdBQZr1ZEuIxoTrdA9n8Adc0LzZB_64Y5Xa1oEYoidDOQZW_WX4D1aX6VZJdnR0fcCUXuNl7npq_c8itYlbxOUzk1Uq3-W1Jq9jKaJ8H0id3qe5YIBAA_vW1m2AbgQzbvtm-7Z_CqYIsyCihTvywGQosdo0st8aflI1k9OjwCd9g1l-TIHA1kk';
                        return (
                          <li key={idx} className="flex justify-between items-center text-on-surface-variant gap-3 bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant/5">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <img src={bookImage} alt={item.title} className="w-8 h-10 object-cover rounded shadow-sm flex-shrink-0" referrerPolicy="no-referrer" />
                              <span className="truncate font-medium text-xs">{item.title}</span>
                            </div>
                            <span className="whitespace-nowrap font-bold text-xs bg-secondary-container px-2 py-0.5 rounded text-on-secondary-container">x{item.quantity}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {order.status !== 'delivered' && order.status !== 'rejected' && (
                  <div className="flex gap-2 mt-2 pt-4 border-t border-outline-variant/10">
                    {order.status === 'new' && (
                      <>
                        <button onClick={() => updateOrderStatus(order.id, 'accepted')} className="flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-800 hover:bg-green-200 transition-colors rounded-lg font-bold text-xs uppercase tracking-widest flex-1 justify-center">
                          <CheckCircle2 className="w-4 h-4" /> Принять
                        </button>
                        <button onClick={() => updateOrderStatus(order.id, 'rejected')} className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-800 hover:bg-red-200 transition-colors rounded-lg font-bold text-xs uppercase tracking-widest flex-1 justify-center">
                          <XCircle className="w-4 h-4" /> Отклонить
                        </button>
                      </>
                    )}
                    {order.status === 'accepted' && (
                      <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="flex items-center gap-1.5 px-4 py-2 bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors rounded-lg font-bold text-xs uppercase tracking-widest w-full justify-center">
                        <Truck className="w-4 h-4" /> Отметить как доставлен
                      </button>
                    )}
                  </div>
                )}
              </div>

            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SupportScreen() {
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg.trim() })
      });

      if (res.ok) {
        setSent(true);
        setMsg('');
      } else {
        alert('Не удалось отправить сообщение. Попробуйте позже.');
      }
    } catch (err) {
      console.error('Support message error:', err);
      alert('Ошибка соединения с сервером.');
    } finally {
      setSending(false);
    }
  };

  const faqs = [
    { q: 'Как оформить доставку?', a: 'Добавьте книги в корзину, перейдите к оформлению заказа, выберите способ доставки и заполните данные.' },
    { q: 'Какие способы оплаты доступны?', a: 'Мы принимаем карты Visa, MasterCard и МИР. Оплата при получении также доступна.' },
    { q: 'Как вернуть книгу?', a: 'Возврат возможен в течение 14 дней при сохранении товарного вида. Свяжитесь с нами для оформления.' },
    { q: 'Сколько стоит доставка?', a: 'Доставка бесплатна при заказе от 2000 ₽. В остальных случаях — 300 ₽.' },
    { q: 'Как отследить заказ?', a: 'После оформления вам придёт SMS с номером для отслеживания на сайте курьерской службы.' },
  ];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-16">
      <section className="text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-6"><HelpCircle className="text-on-secondary-container w-10 h-10" /></div>
        <h2 className="font-headline text-5xl font-bold text-primary mb-4">Центр поддержки</h2>
        <p className="text-secondary text-lg">Мы всегда готовы помочь вам с любым вопросом!</p>
      </section>
      <section className="bg-surface-container-low rounded-3xl p-8 md:p-12 max-w-3xl mx-auto">
        <h3 className="font-headline text-3xl font-bold text-primary mb-8 text-center">Частые вопросы</h3>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-5 border border-transparent hover:border-secondary-container transition-colors">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex justify-between items-center w-full text-left">
                <span className="font-headline text-lg font-bold text-primary">{f.q}</span>
                {openFaq === i ? <X className="text-secondary w-5 h-5" /> : <Plus className="text-secondary w-5 h-5" />}
              </button>
              {openFaq === i && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 text-on-surface-variant text-sm leading-relaxed overflow-hidden">{f.a}</motion.p>}
            </div>
          ))}
        </div>
      </section>
      <section className="max-w-xl mx-auto bg-surface-container-low rounded-2xl p-8 editorial-shadow">
        <h3 className="font-headline text-2xl font-bold text-primary mb-4 flex items-center gap-2"><MessageCircle className="w-6 h-6" />Написать нам</h3>
        {sent ? (
          <div className="text-center py-8">
            <p className="text-green-600 font-bold text-lg">✅ Сообщение отправлено!</p>
            <p className="text-secondary text-sm mt-2">Мы ответим вам в ближайшее время.</p>
            <button onClick={() => setSent(false)} className="mt-4 text-primary font-bold text-sm underline">Отправить ещё одно</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} placeholder="Опишите вашу проблему или вопрос..."
              className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant/60 font-label transition-all resize-none" disabled={sending} />
            <button type="submit" disabled={sending || !msg.trim()} className="w-full ink-bleed-btn text-on-primary font-bold py-3 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center">
              {sending ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : null}
              {sending ? 'Отправка...' : 'Отправить'}
            </button>
          </form>
        )}
      </section>
    </motion.div>
  );
}

function ContactsScreen() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqs = [
    { q: 'Как добраться до магазина?', a: 'Мы находимся в центре Москвы, рядом со станцией метро «Библиотека им. Ленина». Вход со стороны ул. Книжная.' },
    { q: 'Есть ли парковка?', a: 'Да, бесплатная подземная парковка для клиентов доступна в здании.' },
    { q: 'Можно ли забронировать книгу?', a: 'Конечно! Позвоните нам или напишите на email, и мы забронируем книгу на 3 дня.' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-16">
      <section>
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
          <div className="z-10 flex-1">
            <span className="text-secondary font-bold tracking-widest text-xs uppercase mb-4 block">Связаться с нами</span>
            <h2 className="font-headline text-4xl md:text-6xl font-black text-primary leading-tight mb-6">Наши контакты</h2>
            <p className="text-on-surface-variant max-w-md leading-relaxed text-lg">Мы всегда рады помочь! Свяжитесь с нами любым удобным способом.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Phone, title: 'Телефон', info: '+7 (999) 123-45-67', sub: 'Ежедневно 10:00 — 22:00', bg: 'bg-secondary-container', tc: 'text-on-secondary-container' },
          { icon: Mail, title: 'Email', info: 'info@knizhniy-mir.ru', sub: 'Ответ в течение 24 часов', bg: 'bg-primary-container', tc: 'text-on-primary' },
          { icon: MapPin, title: 'Адрес', info: 'г. Москва, ул. Книжная, 10', sub: 'Вход со двора', bg: 'bg-surface-container-highest', tc: 'text-primary' },
        ].map((c, i) => (
          <div key={i} className="bg-surface-container-lowest p-8 rounded-xl flex flex-col items-center text-center group transition-all duration-300 hover:bg-surface-container-high editorial-shadow">
            <div className={`w-16 h-16 ${c.bg} rounded-full flex items-center justify-center mb-6 ${c.tc} group-hover:scale-110 transition-transform`}><c.icon className="w-8 h-8" /></div>
            <h3 className="font-headline text-xl font-bold text-primary mb-2">{c.title}</h3>
            <p className="text-secondary font-medium text-lg">{c.info}</p>
            <p className="text-on-surface-variant text-sm mt-4">{c.sub}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1 rounded-xl overflow-hidden min-h-[400px] shadow-lg bg-surface-container-highest">
          <img 
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
            alt="Карта" 
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="w-full lg:w-1/3 flex flex-col justify-center">
          <h3 className="font-headline text-3xl font-bold text-primary mb-6">Режим работы</h3>
          <div className="space-y-4">
            {[['Понедельник — Пятница', '09:00 — 21:00'], ['Суббота', '10:00 — 22:00'], ['Воскресенье', '11:00 — 19:00']].map(([d, h], i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-outline-variant/15">
                <span className="text-on-surface-variant font-medium">{d}</span>
                <span className="text-primary font-bold">{h}</span>
              </div>
            ))}
          </div>
          <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="mt-8 flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all">
            Построить маршрут <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <section className="bg-surface-container-low rounded-3xl p-8 md:p-12">
        <div className="max-w-3xl mx-auto">
          <h3 className="font-headline text-3xl font-bold text-primary mb-8 text-center">Частые вопросы</h3>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl p-5 border border-transparent hover:border-secondary-container transition-colors">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex justify-between items-center w-full text-left">
                  <span className="font-headline text-lg font-bold text-primary">{f.q}</span>
                  {openFaq === i ? <X className="text-secondary w-5 h-5" /> : <Plus className="text-secondary w-5 h-5" />}
                </button>
                {openFaq === i && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 text-on-surface-variant text-sm leading-relaxed overflow-hidden">{f.a}</motion.p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
