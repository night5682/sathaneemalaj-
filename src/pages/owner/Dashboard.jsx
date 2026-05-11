import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  PackageSearch 
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const { get, loading, error } = useApi();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await get('/dashboard.php');
        setData(result);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };
    fetchData();
  }, [get]);

  if (loading && !data) return <div className="h-96 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="p-8 text-center text-rose-500 bg-rose-50 rounded-2xl border border-rose-100">{error}</div>;
  if (!data) return null;

  const stats = [
    { 
      label: 'ยอดขายวันนี้', 
      value: data.today_sales, 
      icon: <Calendar className="text-blue-600" />, 
      color: 'bg-blue-50' 
    },
    { 
      label: 'ยอดขายเดือนนี้', 
      value: data.month_sales, 
      icon: <TrendingUp className="text-indigo-600" />, 
      color: 'bg-indigo-50' 
    },
    { 
      label: 'ยอดขายปีนี้', 
      value: data.year_sales, 
      icon: <BarChart3 className="text-violet-600" />, 
      color: 'bg-violet-50' 
    },
  ];

  const chartData = {
    labels: data.stock_chart.map(item => item.category_name),
    datasets: [
      {
        data: data.stock_chart.map(item => item.total_value),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="animate-slide-up space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ภาพรวมระบบ</h1>
        <p className="text-slate-500 mt-2 font-medium">ยินดีต้อนรับกลับสู่ SATHANEE MALA Management System</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="card group">
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">
                  {Number(stat.value).toLocaleString()} <span className="text-lg font-bold text-slate-400">฿</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="text-blue-600" size={24} />
              สัดส่วนยอดขายตามหมวดหมู่
            </h2>
          </div>
          <div className="h-[400px] flex items-center justify-center p-4">
            {data.stock_chart.length > 0 ? (
              <Pie 
                data={chartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: { family: 'Outfit', size: 13, weight: '600' }
                      }
                    }
                  }
                }} 
              />
            ) : (
              <p className="text-slate-400 font-medium">ไม่มีข้อมูลสต็อก</p>
            )}
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col justify-center p-10 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4 opacity-90">Quick Summary</h2>
            <p className="text-lg opacity-80 leading-relaxed mb-8">
              ระบบทำงานปกติ เชื่อมต่อฐานข้อมูลสำเร็จ <br />
              มีรายการออเดอร์ใหม่พร้อมให้ตรวจสอบ
            </p>
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-xl font-bold transition-colors">
              ดูรายละเอียดเพิ่มเติม
            </button>
          </div>
          {/* Abstract blobs */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20%] left-[-20%] w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
