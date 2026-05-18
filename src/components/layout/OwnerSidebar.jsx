import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Menu as MenuIcon, 
  History, 
  Beer, 
  X,
  LogOut,
  ChevronRight,
  Users,
  Grid
} from 'lucide-react';

const OwnerSidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  const navItems = [
    { name: 'ภาพรวมระบบ', path: '/', icon: <LayoutDashboard size={20} />, roles: ['owner'] },
    { name: 'จัดการโต๊ะ', path: '/manage-tables', icon: <Grid size={20} />, roles: ['owner', 'employee', 'cashier'] },
    { name: 'โต๊ะที่กำลังใช้งาน', path: '/active-bills', icon: <UtensilsCrossed size={20} />, roles: ['owner', 'employee', 'cashier'] },
    { name: 'จัดการเมนูร้าน', path: '/manage-menus', icon: <MenuIcon size={20} />, roles: ['owner'] },
    { name: 'ประวัติออเดอร์', path: '/order-history', icon: <History size={20} />, roles: ['owner', 'employee', 'cashier'] },
    { name: 'คลังสินค้าสต็อก', path: '/stock-beverage', icon: <Beer size={20} />, roles: ['owner', 'employee', 'cashier'] },
    { name: 'ประวัติสต็อก', path: '/stock-history', icon: <History size={20} />, roles: ['owner', 'employee', 'cashier'] },
    { name: 'จัดการพนักงาน', path: '/manage-employees', icon: <Users size={20} />, roles: ['owner'] },
  ];


  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-500"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        bg-[#0f172a] text-white w-[280px] shadow-2xl flex flex-col overflow-hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Logo */}
        <div className="p-8 pb-10 border-b border-slate-800/50 flex justify-between items-center relative">
          <div className="relative z-10">
            <h1 className="text-2xl font-black tracking-tighter text-white leading-tight uppercase">SATHANEE MALA</h1>
            <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 mt-1 uppercase">Management</p>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-8 px-4 overflow-y-auto space-y-2 custom-scrollbar">
          <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Main Menu</p>
          
          {navItems.filter(item => item.roles.includes(user.role)).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if(window.innerWidth < 1024) toggleSidebar(); }}
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <div className="flex items-center gap-4">
                <span className="transition-transform duration-300 group-hover:scale-110">
                  {item.icon}
                </span>
                <span className="font-bold text-sm">{item.name}</span>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
            </NavLink>
          ))}

        </nav>

        {/* Bottom Section */}
        <div className="p-6 space-y-4 border-t border-slate-800/50">
          <NavLink
            to="/customer"
            target="_blank"
            className="flex items-center justify-center gap-3 w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-inner"
          >
            Store Front
          </NavLink>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-rose-400 transition-colors font-bold text-sm group"
          >
            <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-rose-500/10 transition-colors">
              <LogOut size={16} />
            </div>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default OwnerSidebar;
