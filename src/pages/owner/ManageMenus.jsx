import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Toast from '../../components/ui/Toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  CheckCircle2, 
  XCircle,
  Search,
  Filter
} from 'lucide-react';

const ManageMenus = () => {
  const navigate = useNavigate();
  const { get, del, post, loading } = useApi();
  const [menus, setMenus] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const fetchMenus = async () => {
    try {
      const data = await get('/menus.php');
      setMenus(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [get]);

  const handleToggleStatus = async (id, type) => {
    try {
      await post('/toggle_status.php', { id, type });
      setToast({ message: 'อัปเดตสถานะสำเร็จ', type: 'success' });
      fetchMenus();
    } catch (err) {
      setToast({ message: 'เกิดข้อผิดพลาด', type: 'error' });
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`ยืนยันการลบเมนู "${name}"?`)) {
      try {
        await del(`/menus.php?id=${id}`);
        setToast({ message: 'ลบเมนูเรียบร้อยแล้ว', type: 'success' });
        fetchMenus();
      } catch (err) {
        setToast({ message: 'เกิดข้อผิดพลาดในการลบ', type: 'error' });
      }
    }
  };

  const filteredMenus = menus.filter(menu => 
    menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    menu.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-slide-up space-y-8">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">จัดการเมนู</h1>
          <p className="text-slate-500 mt-2 font-medium">เพิ่ม แก้ไข และจัดการสถานะเมนูอาหารทั้งหมด</p>
        </div>
        <Link 
          to="/add-menu"
          className="btn btn-primary h-12 px-8 text-lg shadow-xl shadow-blue-600/20"
        >
          <Plus size={24} /> เพิ่มเมนูใหม่
        </Link>
      </header>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อเมนู หรือ หมวดหมู่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium shadow-sm"
          />
        </div>
        <button className="btn btn-outline h-14 px-6 gap-2 bg-white">
          <Filter size={20} /> หมวดหมู่
        </button>
      </div>

      {loading && menus.length === 0 ? (
        <div className="h-64 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="card p-0 overflow-hidden border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs">รูป</th>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs">รายละเอียดเมนู</th>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs text-center">ราคา</th>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs text-center">สถานะ</th>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-transparent">
                {filteredMenus.map((menu) => (
                  <tr key={menu.id} className="table-row group">
                    <td className="px-6 py-4">
                      <div className="w-20 h-20 rounded-[20px] overflow-hidden bg-slate-100 border-2 border-white shadow-md">
                        <img 
                          src={`/assets/img/menus/${menu.image_path}`} 
                          alt={menu.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-115 duration-700"
                          onError={(e) => e.target.src = '/assets/img/default.jpg'}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-black text-slate-900 text-xl leading-tight tracking-tight">{menu.name}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                              {menu.category_name}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleToggleStatus(menu.id, 'recommend')}
                          className={`p-3 rounded-2xl transition-all ${menu.is_recommended ? 'text-amber-500 bg-amber-50 shadow-inner' : 'text-slate-200 hover:text-amber-400 hover:bg-amber-50/50'}`}
                        >
                          <Star size={24} fill={menu.is_recommended ? 'currentColor' : 'none'} strokeWidth={menu.is_recommended ? 0 : 2} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl font-black text-slate-900 tracking-tighter">
                        {Number(menu.price).toLocaleString()} <span className="text-sm font-bold text-slate-300">฿</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleToggleStatus(menu.id, 'active')}
                        className={`
                          badge h-10 px-5 gap-2 transition-all active:scale-90
                          ${menu.is_active 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}
                        `}
                      >
                        {menu.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        {menu.is_active ? 'พร้อมขาย' : 'สินค้าหมด'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <Link 
                          to={`/edit-menu/${menu.id}`}
                          className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-2xl transition-all duration-300 shadow-sm"
                        >
                          <Edit size={20} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(menu.id, menu.name)}
                          className="w-12 h-12 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-2xl transition-all duration-300 shadow-sm"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredMenus.length === 0 && (
            <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest bg-white">
              <Search className="mx-auto mb-4 opacity-20" size={48} />
              ไม่พบข้อมูลเมนูที่ค้นหา
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageMenus;
