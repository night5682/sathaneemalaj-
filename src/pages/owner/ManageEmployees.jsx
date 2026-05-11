import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  User
} from 'lucide-react';

const ManageEmployees = () => {
  const { get, post, del, loading } = useApi();
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', nickname: '', username: '', password: '' });

  const fetchEmployees = async () => {
    try {
      const data = await get('/employees.php');
      setEmployees(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchEmployees();
  }, [get]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await post('/employees.php', formData);
      if (result.success) {
        setToast({ message: `เพิ่มพนักงานแล้ว!`, type: 'success' });
        setIsModalOpen(false);
        setFormData({ first_name: '', last_name: '', nickname: '', username: '', password: '' });
        fetchEmployees();
      }
    } catch (err) {
      setToast({ message: err.message || 'เกิดข้อผิดพลาดในการเพิ่มพนักงาน', type: 'error' });
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`ยืนยันการลบพนักงาน ${name}?`)) {
      try {
        await del(`/employees.php?id=${id}`);
        setToast({ message: 'ลบพนักงานเรียบร้อยแล้ว', type: 'success' });
        fetchEmployees();
      } catch (err) {
        setToast({ message: 'เกิดข้อผิดพลาดในการลบ', type: 'error' });
      }
    }
  };

  return (
    <div className="animate-slide-up space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">จัดการพนักงาน</h1>
          <p className="text-slate-500 mt-2 font-medium">เพิ่มพนักงานและจัดการชื่อผู้ใช้สำหรับเข้าใช้ระบบ</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary h-12 px-8 text-lg"
        >
          <UserPlus size={20} /> เพิ่มพนักงานใหม่
        </button>
      </header>

      {loading && employees.length === 0 ? (
        <div className="h-64 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map(emp => (
            <div key={emp.id} className="card group border-slate-200">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
                  <User size={28} />
                </div>
                <button 
                  onClick={() => handleDelete(emp.id, emp.nickname || emp.first_name)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {emp.nickname ? `${emp.nickname} (${emp.first_name})` : emp.first_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role: Staff</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Username</p>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-blue-600 tracking-widest">{emp.username}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {employees.length === 0 && !loading && (
        <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <User className="mx-auto text-slate-200 mb-4" size={64} />
          <h3 className="text-xl font-bold text-slate-400">ยังไม่มีข้อมูลพนักงาน</h3>
          <p className="text-slate-300 mt-2">เริ่มเพิ่มพนักงานของคุณด้วยปุ่มด้านบน</p>
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="เพิ่มพนักงานใหม่"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn btn-outline">ยกเลิก</button>
            <button form="add-employee-form" type="submit" className="btn btn-primary px-8">บันทึกข้อมูล</button>
          </>
        }
      >
        <form id="add-employee-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">ชื่อ (First Name)</label>
              <input 
                type="text" required value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="เช่น สมชาย"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">นามสกุล (Last Name)</label>
              <input 
                type="text" required value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="เช่น รักดี"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">ชื่อเล่น (Nickname)</label>
            <input 
              type="text" value={formData.nickname}
              onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="เช่น ชาย"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">ชื่อผู้ใช้ (Username)</label>
            <input 
              type="text" required value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Username สำหรับล็อกอิน"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">รหัสผ่าน (Password)</label>
            <input 
              type="password" required value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="รหัสผ่าน"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageEmployees;
