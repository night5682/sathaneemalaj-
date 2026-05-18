import { User, Bell, Settings } from 'lucide-react';

const roleLabels = {
  owner: 'เจ้าของร้าน',
  cashier: 'แคชเชียร์',
  employee: 'พนักงานทั่วไป'
};

const OwnerNavbar = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const displayName = user.nickname || user.owner_name || 'Admin Owner';

  return (
    <nav className="hidden lg:flex fixed top-0 right-0 left-[280px] h-[70px] bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 px-8 items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Status: Active</span>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
        </button>
        
        <div className="h-8 w-[1px] bg-slate-200" />
        
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900 leading-none">{displayName}</p>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
              {roleLabels[user.role] || user.role || 'พนักงาน'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
            <User size={20} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default OwnerNavbar;
