import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  History, 
  ArrowLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  User,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StockHistory = () => {
  const { get, loading } = useApi();
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchLogs = async () => {
    try {
      const data = await get('/stock_history.php');
      setLogs(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchLogs();
  }, [get]);

  const filteredLogs = logs.filter(log => 
    log.menu_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.note && log.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-slide-up space-y-8 max-w-7xl mx-auto p-4 lg:p-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/stock-beverage')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ประวัติการปรับสต็อก</h1>
            <p className="text-slate-500 mt-1 font-medium">แสดงรายการนำเข้าและส่งออกสินค้าทั้งหมด</p>
          </div>
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อเมนู, ผู้ปรับ หรือเหตุผล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium shadow-sm transition-all"
          />
        </div>
      </header>

      {loading && logs.length === 0 ? (
        <div className="h-64 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="card p-0 overflow-hidden border-slate-200 shadow-xl bg-white rounded-[32px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-widest text-[10px]">วัน-เวลา</th>
                  <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-widest text-[10px]">รายการสินค้า</th>
                  <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">ประเภท</th>
                  <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">จำนวน</th>
                  <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-widest text-[10px]">ผู้ปรับสต็อก</th>
                  <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-widest text-[10px]">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log) => {
                  const isIncoming = log.type === 'in';
                  const date = new Date(log.update_date);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{date.toLocaleDateString('th-TH')}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase">{date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-black text-slate-900">{log.menu_name}</p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isIncoming ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                          {isIncoming ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                          {isIncoming ? 'นำเข้า' : 'เบิกออก'}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`text-lg font-black ${isIncoming ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIncoming ? '+' : '-'}{log.amount}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                            <User size={14} />
                          </div>
                          <p className="font-bold text-slate-700 text-sm">{log.user_name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm text-slate-500 font-medium italic">{log.note || '-'}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                <History size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-300 uppercase tracking-tight">ไม่พบประวัติการปรับสต็อก</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockHistory;
