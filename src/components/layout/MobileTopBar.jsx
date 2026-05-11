import { Menu, ShoppingBag } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const MobileTopBar = ({ toggleSidebar }) => {
  const location = useLocation();
  
  // Mapping paths to titles
  const titles = {
    '/': 'ภาพรวมระบบ',
    '/active-bills': 'โต๊ะที่ใช้งาน',
    '/manage-menus': 'จัดการเมนู',
    '/order-history': 'ประวัติออเดอร์',
    '/stock-beverage': 'คลังสินค้า',
    '/add-menu': 'เพิ่มเมนูใหม่',
  };

  const currentTitle = titles[location.pathname] || 'SATHANI MALA';

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-[70px] bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-all active:scale-95"
        >
          <Menu size={22} />
        </button>
        <div className="flex flex-col">
          <span className="font-black text-sm tracking-tight text-slate-900">{currentTitle}</span>
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none mt-0.5">Mala Management</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
          <ShoppingBag size={18} />
        </div>
      </div>
    </header>
  );
};

export default MobileTopBar;
