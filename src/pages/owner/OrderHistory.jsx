import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  Calendar, 
  Search, 
  Wallet, 
  ReceiptText,
  Clock,
  LayoutGrid,
  CheckCircle
} from 'lucide-react';
import Toast from '../../components/ui/Toast';

const OrderHistory = () => {
  const { get, post, loading } = useApi();
  const [data, setData] = useState({ orders: [], total: 0 });
  const [toast, setToast] = useState(null);
  const [dateStart, setDateStart] = useState(new Date().toISOString().split('T')[0]);
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0]);

  const fetchHistory = useCallback(async () => {
    try {
      const result = await get('/orders.php', { date_start: dateStart, date_end: dateEnd });
      setData(result);
    } catch (err) { console.error(err); }
  }, [get, dateStart, dateEnd]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleConfirmPayment = async (orderId) => {
    if (!window.confirm('ยืนยันว่าลูกค้าชำระเงินเรียบร้อยแล้ว?')) return;
    try {
      await post('/active_bills.php', { order_id: orderId, status: 'ชำระแล้ว' });
      setToast({ message: 'ยืนยันการชำระเงินเรียบร้อย', type: 'success' });
      fetchHistory();
    } catch (err) {
      setToast({ message: 'เกิดข้อผิดพลาด', type: 'error' });
    }
  };

  return (
    <div className="animate-slide-up space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ประวัติการขาย</h1>
          <p className="text-slate-500 mt-2 font-medium">ดูรายการออเดอร์ย้อนหลังและสรุปยอดขายตามช่วงเวลา</p>
        </div>
      </header>

      {/* Filter Panel */}
      <div className="card p-6 bg-white border-slate-200 shadow-sm flex flex-col md:flex-row items-end gap-6">
        <div className="flex-1 w-full space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" /> จากวันที่
          </label>
          <input 
            type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
          />
        </div>
        <div className="flex-1 w-full space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" /> ถึงวันที่
          </label>
          <input 
            type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
          />
        </div>
        <button 
          onClick={fetchHistory}
          className="btn btn-primary h-12 px-8 w-full md:w-auto"
        >
          <Search size={20} /> ค้นหาข้อมูล
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-blue-600 text-white border-none shadow-xl shadow-blue-600/20 flex items-center gap-6 p-8">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
            <Wallet size={32} />
          </div>
          <div>
            <p className="text-blue-100 font-bold uppercase tracking-wider text-sm">ยอดขายรวมในช่วงเวลา</p>
            <p className="text-4xl font-black mt-1">
              {Number(data.total).toLocaleString()} <span className="text-xl font-bold opacity-70">฿</span>
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-6 p-8 border-slate-200">
          <div className="p-4 bg-slate-100 rounded-2xl text-slate-600">
            <ReceiptText size={32} />
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-sm">จำนวนออเดอร์ทั้งหมด</p>
            <p className="text-4xl font-black text-slate-900 mt-1">
              {data.orders.length} <span className="text-xl font-bold text-slate-300 italic">Orders</span>
            </p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="card p-0 overflow-hidden border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs text-center">ID</th>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs">วันเวลาที่ชำระเงิน</th>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs text-center">โต๊ะ</th>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs text-right">ยอดชำระสุทธิ</th>
                  <th className="px-6 py-5 font-bold text-slate-600 uppercase tracking-wider text-xs text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-center font-black text-blue-600 text-sm">#{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{new Date(order.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-0.5"><Clock size={12} /> {new Date(order.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-black text-xs">
                        <LayoutGrid size={14} /> โต๊ะ {order.table_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xl font-black text-slate-900">
                        {Number(order.total_price).toLocaleString()}.-
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          (order.status === 'ชำระแล้ว' || order.status === 'ลด 10%') ? 'bg-emerald-100 text-emerald-700' : 
                          order.status === 'ยกเลิก' ? 'bg-rose-100 text-rose-700' : 
                          order.status === 'แก้ไขบิล' ? 'bg-blue-100 text-blue-700' : 
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {order.status}
                        </span>
                        {order.note && (
                          <span className="text-[10px] text-slate-400 font-bold italic max-w-[120px] truncate" title={order.note}>
                            * {order.note}
                          </span>
                        )}
                        {order.status === 'ค้างชำระ' && (
                          <button 
                            onClick={() => handleConfirmPayment(order.id)}
                            className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                          >
                            <CheckCircle size={12} /> ยืนยันการชำระ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.orders.length === 0 && (
            <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest bg-white">
              <ReceiptText className="mx-auto mb-4 opacity-10" size={64} />
              ไม่พบประวัติการขายในช่วงเวลานี้
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
