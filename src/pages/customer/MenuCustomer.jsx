import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import {
  ShoppingBag,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  Send,
  LayoutGrid,
  Search,
  Star,
  Utensils,
  Coffee,
  CheckCircle2
} from 'lucide-react';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '/assets/img/default.jpg';

  if (imagePath.startsWith('http')) {
    const url = new URL(imagePath);
    return url.pathname;
  }

  if (imagePath.startsWith('/assets/')) return imagePath;
  if (imagePath.startsWith('assets/')) return `/${imagePath}`;

  return `/assets/img/menus/${imagePath}`;
};

const MenuCustomer = () => {
  const { get, post, loading } = useApi();
  const [menus, setMenus] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState('1');
  const [toast, setToast] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sessionToken, setSessionToken] = useState('');

  const [sessionValid, setSessionValid] = useState(true);
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {  
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');

    const initPage = async () => {
      let tableNo = '';
      let token = '';

      if (tableParam) {
        try {
          const decoded = atob(tableParam);

          if (decoded.includes('|')) {
            const parts = decoded.split('|');
            tableNo = parts[0];
            token = parts[1] || '';
          } else {
            tableNo = decoded;
            token = '';
          }

          setTableNumber(tableNo);
          setSessionToken(token);

          console.log("DECODE TABLE:", {
            raw: tableParam,
            decoded,
            tableNo,
            token
          });

          const result = await get('/validate-table-session', {
            table_number: tableNo,
            security_key: token
          });

          if (!result.valid) {
            setSessionValid(false);
            setSessionMessage(result.message || 'QR Code นี้หมดอายุแล้ว');
            return;
          }

          setSessionValid(true);

        } catch (err) {
          console.error("Decode / Validate session error:", err);
          setSessionValid(false);
          setSessionMessage('QR Code ไม่ถูกต้อง หรือหมดอายุแล้ว');
          return;
        }
      }

      try {
        const data = await get('/menus', { customer: true });
        setMenus(data);
      } catch (err) {
        console.error(err);
      }
    };

    initPage();
  }, [get]);

  const categories = useMemo(() => {
    const cats = menus
      .map(m => m.category_name)
      .filter(cat => cat && cat.trim() !== ''); // Remove empty categories
    return ['ทั้งหมด', ...new Set(cats)];
  }, [menus]);

  const filteredMenus = useMemo(() => {
    return menus.filter(menu => {
      const matchesCategory = activeCategory === 'ทั้งหมด' || menu.category_name === activeCategory;
      const matchesSearch = menu.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menus, activeCategory, searchTerm]);

  const addToCart = (menu) => {
    if (!menu.is_active) {
      setToast({ message: 'ขออภัย สินค้าชิ้นนี้หมดแล้วครับ', type: 'error' });
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === menu.id);
      if (existing) {
        return prev.map(item => item.id === menu.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, {
        id: menu.id,
        name: menu.name,
        price: menu.price,
        qty: 1,
        image: menu.image_path,
        category_name: menu.category_name
      }];
    });
    setToast({ message: `เพิ่ม ${menu.name} แล้ว`, type: 'success' });
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(0, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const getOrderType = (categoryName) => {
    const cat = String(categoryName || '').toLowerCase();

    if (
      cat.includes('เครื่องดื่ม') ||
      cat.includes('drink') ||
      cat.includes('น้ำ') ||
      cat.includes('ชา') ||
      cat.includes('กาแฟ')
    ) {
      return 'drink';
    }

    return 'food';
  };

  // const handleSubmitOrder = async () => {
  //   if (cart.length === 0) return;
  //   try {
  //     await post('/orders', {
  //       table_number: tableNumber,
  //       items: cart
  //     });
  //     setOrderSuccess(true);
  //     setCart([]);
  //     setIsCartOpen(false);
  //     setTimeout(() => setOrderSuccess(false), 5000);
  //   } catch (err) {
  //     setToast({ message: 'เกิดข้อผิดพลาดในการส่งออเดอร์', type: 'error' });
  //   }
  // };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;

    try {
      // บันทึกลง main.py / database หลัก
      await post('/orders', {
        table_number: tableNumber,
        security_key: sessionToken,
        items: cart
      });

      // ส่งออกไป pos_api.py ผ่าน nginx proxy
      const payload = {
        order_id: `ORD-${Date.now()}`,
        session_id: String(sessionToken),
        table_number: String(tableNumber),
        created_at: new Date().toISOString(),
        items: cart.map(item => ({
          menu_id: Number(item.id),
          name: String(item.name),
          type: getOrderType(item.category_name),
          quantity: Number(item.qty),
          price: Number(item.price),
          note: null
        }))
      };

      console.log("SEND /api/order payload:", payload);

      const res = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.detail || "ส่งข้อมูลออเดอร์ไป API ไม่สำเร็จ");
      }

      console.log("RESPONSE /api/order:", result);

      setOrderSuccess(true);
      setCart([]);
      setIsCartOpen(false);
      setTimeout(() => setOrderSuccess(false), 5000);

    } catch (err) {
      console.error("SEND ORDER ERROR:", err);
      setToast({
        message: `เกิดข้อผิดพลาดในการส่งออเดอร์: ${err.message}`,
        type: 'error'
      });
    }
  };

  if (!sessionValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-[32px] shadow-xl p-8 max-w-md w-full text-center border border-slate-100">
          <h1 className="text-2xl font-black text-rose-600 mb-4">
            QR Code หมดอายุ
          </h1>

          <p className="text-slate-500 font-bold leading-relaxed">
            {sessionMessage}
          </p>

          <p className="text-xs text-slate-400 mt-6">
            กรุณาติดต่อพนักงานเพื่อเปิดโต๊ะใหม่
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-32">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modern Header */}
      <header className="bg-white sticky top-0 z-40 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 tracking-tighter">SATHANEE MALA</h1>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Customer Menu</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Table</span>
              <span className="font-black text-blue-600 text-lg leading-tight">
                {tableNumber}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Utensils size={18} />
            </div>
          </div>
        </div>
      </header>

      {/* Sub Category Scroller & Search */}
      <div className="bg-white/50 backdrop-blur-md sticky top-[73px] z-30 py-4 px-4 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text" placeholder={`ค้นหาเมนูอาหารและเครื่องดื่ม...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium shadow-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat} onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${activeCategory === cat ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {menus.some(m => m.is_recommended && m.is_active) && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Star className="text-amber-400 fill-amber-400" size={24} />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">เมนูแนะนำ (Recommended)</h2>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide px-1">
            {menus.filter(m => m.is_recommended && m.is_active).map(menu => (
              <div
                key={`rec-${menu.id}`}
                onClick={() => addToCart(menu)}
                className="shrink-0 w-64 bg-white rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 cursor-pointer active:scale-95 transition-all"
              >
                <div className="h-40 relative">
                  <img
                    src={getImageUrl(menu.image_path)}
                    className="w-full h-full object-cover"
                    onError={(e) => e.target.src = '/assets/img/default.jpg'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="font-bold truncate text-lg leading-tight">{menu.name}</p>
                    <p className="text-sm font-black text-amber-300 mt-1">{Number(menu.price).toLocaleString()}.-</p>
                  </div>
                  <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                    <Plus size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Menu Grid */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-8 px-1">
          <LayoutGrid className="text-blue-600" size={24} />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">รายการอาหารทั้งหมด</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {loading && menus.length === 0 ? (
            <div className="col-span-full py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : filteredMenus.map(menu => (
            <div key={menu.id} className="group relative bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2">
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                <img
                  src={getImageUrl(menu.image_path)}
                  alt={menu.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                  onError={(e) => e.target.src = '/assets/img/default.jpg'}
                />
                {menu.is_recommended && menu.is_active && (
                  <div className="absolute top-3 left-3 px-3 py-1 bg-amber-400 text-white rounded-full flex items-center gap-1 shadow-lg z-10">
                    <Star size={10} fill="white" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Recommended</span>
                  </div>
                )}

                {!menu.is_active && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                    <div className="bg-rose-600 text-white px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl rotate-[-5deg] border-2 border-white/20">
                      สินค้าหมด
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  onClick={() => addToCart(menu)}
                  disabled={!menu.is_active}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${!menu.is_active ? 'scale-0' : 'bg-white text-blue-600 scale-0 group-hover:scale-100'}`}
                >
                  <Plus size={28} />
                </button>
              </div>

              <div className={`p-5 flex flex-col gap-3 ${!menu.is_active ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{menu.category_name}</p>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight mt-1 line-clamp-1">{menu.name}</h3>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-black text-slate-900 tracking-tighter">{Number(menu.price).toLocaleString()}.-</span>
                  <button
                    onClick={() => addToCart(menu)}
                    disabled={!menu.is_active}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform active:scale-90 ${!menu.is_active ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-blue-50 text-blue-600'}`}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMenus.length === 0 && (
          <div className="py-32 text-center animate-fade-in">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <LayoutGrid size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-400 tracking-tight uppercase">ไม่พบรายการ{activeCategory}</h3>
            <p className="text-slate-300 mt-2 font-bold">ลองค้นหาด้วยชื่ออื่น</p>
          </div>
        )}
      </main>

      {/* Floating Cart Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 p-6 transition-all duration-500 ${cartCount > 0 ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
        <button
          onClick={() => setIsCartOpen(true)}
          className="max-w-xl mx-auto w-full bg-slate-900 text-white h-[76px] rounded-[30px] flex items-center justify-between px-8 shadow-[0_20px_50px_rgba(15,23,42,0.4)] transition-all active:scale-95 group"
        >
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <ShoppingBag size={24} />
              </div>
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-[11px] font-black border-2 border-slate-900">
                {cartCount}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ยอดสั่งอาหารรวม</p>
              <p className="text-2xl font-black tracking-tighter">{cartTotal.toLocaleString()} <span className="text-sm font-bold opacity-50">฿</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
            ตรวจสอบรายการ <ChevronRight size={18} />
          </div>
        </button>
      </div>

      {/* Order Success Overlay */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
          <div className="relative bg-white rounded-[40px] p-10 text-center shadow-2xl max-w-sm w-full animate-slide-up">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={56} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">สั่งสำเร็จ!</h2>
            <p className="text-slate-500 mt-4 font-bold leading-relaxed">
              ออเดอร์ของโต๊ะที่ {tableNumber} ถูกส่งแล้ว<br />กรุณารอสักครู่ ทางร้านกำลังปรุงอาหารให้ครับ
            </p>
            <button
              onClick={() => setOrderSuccess(false)}
              className="mt-8 btn btn-primary w-full h-14"
            >
              ตกลง (OK)
            </button>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      <Modal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title="ตระกร้าสั่งอาหาร"
        footer={
          <button
            onClick={handleSubmitOrder}
            className="w-full btn btn-primary h-14 text-lg"
          >
            <Send size={20} /> ยืนยันสั่งอาหาร โต๊ะ {tableNumber}
          </button>
        }
      >
        <div className="space-y-6">
          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-4 py-4 border-b border-slate-50 last:border-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm shrink-0">
                  <img src={getImageUrl(item.image)} className="w-full h-full object-cover" onError={(e) => e.target.src = '/assets/img/default.jpg'} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-800 text-base leading-tight truncate">{item.name}</h4>
                  <p className="text-sm font-bold text-blue-600 mt-1">{item.price.toLocaleString()}.-</p>

                  <div className="flex items-center gap-3 mt-3 bg-slate-50 w-fit p-1 rounded-xl">
                    <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                      {item.qty === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                    </button>
                    <span className="w-6 text-center font-black text-slate-900 text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-blue-600">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-right pl-4">
                  <p className="font-black text-slate-900 text-lg tracking-tighter">{(item.price * item.qty).toLocaleString()}.-</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest">ยอดรวมทั้งหมด</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter">{cartTotal.toLocaleString()}<span className="text-xl opacity-30 ml-1">฿</span></span>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl flex gap-3 text-blue-800 text-xs font-bold leading-relaxed border border-blue-100">
              <Star size={18} fill="currentColor" className="shrink-0" />
              <p>ยืนยันออเดอร์เพื่อส่งรายการไปยังระบบหลังบ้าน โดยยอดเงินจะเรียกเก็บเมื่อเช็คบิลที่โต๊ะครับ</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MenuCustomer;
