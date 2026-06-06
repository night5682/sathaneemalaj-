import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import {
  Beer,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  History,
  TrendingUp
} from 'lucide-react';

const DEFAULT_IMAGE = "/assets/img/menus/default.jpg";

const getImageUrl = (imagePath) => {
  if (!imagePath) return DEFAULT_IMAGE;

  if (imagePath.startsWith("http://localhost:42091")) {
    return imagePath.replace("http://localhost:42091", "");
  }

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  if (imagePath.startsWith("dist/")) {
    return `/${imagePath.replace("dist/", "")}`;
  }

  let path = imagePath.startsWith("/")
    ? imagePath
    : `/assets/img/menus/${imagePath}`;
    
  if (path.startsWith("/assets/")) {
    path = `/api${path}`;
  }
  
  return path;
};

const StockBeverage = () => {
  const { get, put, loading } = useApi();
  const [drinks, setDrinks] = useState([]);
  const [toast, setToast] = useState(null);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStock, setNewStock] = useState('');

  const fetchDrinks = async () => {
    try {
      const data = await get('/stock');
      setDrinks(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchDrinks();
  }, [get]);

  const handleEditStock = (drink) => {
    setSelectedDrink(drink);
    setNewStock('0');
    setIsModalOpen(true);
  };

  const handleUpdateStock = async () => {
    if (!selectedDrink || newStock === '') return;
    const user = JSON.parse(localStorage.getItem('user'));
    const adjustment = parseInt(newStock) || 0;
    const finalStock = Math.max(0, selectedDrink.stock_quantity + adjustment);
    
    try {
      await put(`/stock?id=${selectedDrink.id}`, {
        stock_quantity: finalStock,
        user_id: user?.id || 0,
        note: `ปรับสต็อกด้วยตนเอง: ${adjustment >= 0 ? '+' : ''}${adjustment} ชิ้น (จาก ${selectedDrink.stock_quantity} เป็น ${finalStock})`
      });
      setToast({ message: `อัปเดตสต็อก ${selectedDrink.name} เรียบร้อยแล้ว`, type: 'success' });
      setIsModalOpen(false);
      fetchDrinks();
    } catch (err) {
      setToast({ message: 'เกิดข้อผิดพลาดในการอัปเดต', type: 'error' });
    }
  };

  const lowStockCount = drinks.filter(d => d.stock_quantity <= d.low_stock_threshold).length;

  return (
    <div className="animate-slide-up space-y-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">คลังเครื่องดื่ม</h1>
          <p className="text-slate-500 mt-2 font-medium">จัดการจำนวนคงเหลือและสถานะของเครื่องดื่มทั้งหมด</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.href = '/stock-history'}
            className="btn btn-primary h-12 px-6 gap-2"
          >
            <History size={20} /> ประวัติสต็อก
          </button>
          <button
            onClick={fetchDrinks}
            className="btn btn-outline h-12 px-6 gap-2 bg-white"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} /> รีเฟรชข้อมูล
          </button>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-amber-50 border-amber-200 flex items-center gap-5">
          <div className="p-4 bg-amber-500 rounded-2xl text-white">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-amber-600 font-bold uppercase tracking-wider text-xs">สินค้าใกล้หมด</p>
            <p className="text-3xl font-black text-amber-900 mt-1">{lowStockCount} <span className="text-sm font-bold opacity-60">รายการ</span></p>
          </div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200 flex items-center gap-5">
          <div className="p-4 bg-emerald-500 rounded-2xl text-white">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-emerald-600 font-bold uppercase tracking-wider text-xs">จำนวนสินค้าทั้งหมด</p>
            <p className="text-3xl font-black text-emerald-900 mt-1">
              {drinks.reduce((acc, curr) => acc + parseInt(curr.stock_quantity), 0)} <span className="text-sm font-bold opacity-60">ชิ้น</span>
            </p>
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-200 flex items-center gap-5">
          <div className="p-4 bg-blue-500 rounded-2xl text-white">
            <Beer size={28} />
          </div>
          <div>
            <p className="text-blue-600 font-bold uppercase tracking-wider text-xs">รายการเครื่องดื่ม</p>
            <p className="text-3xl font-black text-blue-900 mt-1">{drinks.length} <span className="text-sm font-bold opacity-60">รายการ</span></p>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      {loading && drinks.length === 0 ? (
        <div className="h-64 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="card p-0 overflow-hidden border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs">เครื่องดื่ม</th>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs">ชนิด</th>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs text-center">คงเหลือ</th>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs text-center">สถานะ</th>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {drinks.map((drink) => {
                  const isLow = drink.stock_quantity <= drink.low_stock_threshold;
                  const isOut = drink.stock_quantity <= 0;
                  return (
                    <tr key={drink.id} className={`hover:bg-slate-50/50 transition-colors ${isOut ? 'opacity-60 bg-slate-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={getImageUrl(drink.image_path)}
                            alt={drink.name}
                            className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_IMAGE;
                            }}
                          />
                          <div>
                            <h3 className="font-bold text-slate-900">{drink.name}</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1">{Number(drink.price).toLocaleString()}.- / ชิ้น</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-500 text-sm uppercase tracking-tighter">
                        {drink.category_name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-2xl font-black ${isOut ? 'text-rose-600' : isLow ? 'text-amber-500' : 'text-slate-900'}`}>
                          {Number(drink.stock_quantity).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isOut ? (
                          <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-[10px] font-black uppercase tracking-widest">สินค้าหมด</span>
                        ) : isLow ? (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest">ใกล้หมด</span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest">ปกติ</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleEditStock(drink)}
                            className="btn btn-outline py-2 px-4 text-sm gap-2 border-blue-100 text-blue-600 hover:bg-blue-50"
                          >
                            <History size={16} /> ปรับสต็อก
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`ปรับจำนวนสต็อก: ${selectedDrink?.name}`}
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn btn-outline">ยกเลิก</button>
            <button onClick={handleUpdateStock} className="btn btn-primary h-12 px-8">ยืนยันการปรับ</button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-8 py-4">
            <button
              onClick={() => setNewStock(prev => (parseInt(prev || 0) - 1).toString())}
              className="text-rose-500 hover:scale-110 transition-transform"
            >
              <MinusCircle size={48} />
            </button>
            <input
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              className="w-32 h-20 text-center text-4xl font-black bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-500 outline-none"
            />
            <button
              onClick={() => setNewStock(prev => (parseInt(prev || 0) + 1).toString())}
              className="text-emerald-500 hover:scale-110 transition-transform"
            >
              <PlusCircle size={48} />
            </button>
          </div>

          {selectedDrink && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-around items-center text-center">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">จำนวนเดิม</p>
                <p className="text-xl font-extrabold text-slate-700 mt-1">
                  {selectedDrink.stock_quantity} ชิ้น
                </p>
              </div>
              <div className="text-slate-300 font-light text-2xl">→</div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">การปรับปรุง</p>
                <p className={`text-xl font-extrabold mt-1 ${parseInt(newStock || 0) > 0 ? 'text-emerald-600' : parseInt(newStock || 0) < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                  {parseInt(newStock || 0) > 0 ? `+${parseInt(newStock || 0)}` : parseInt(newStock || 0)} ชิ้น
                </p>
              </div>
              <div className="text-slate-300 font-light text-2xl">→</div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">จำนวนใหม่</p>
                <p className="text-xl font-black text-blue-600 mt-1">
                  {Math.max(0, selectedDrink.stock_quantity + (parseInt(newStock || 0)))} ชิ้น
                </p>
              </div>
            </div>
          )}

          <p className="text-center text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">ระบุจำนวนสินค้าที่ต้องการปรับเปลี่ยน (บวก/ลบ)</p>
        </div>
      </Modal>
    </div>
  );
};

export default StockBeverage;
