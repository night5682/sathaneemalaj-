import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Toast from '../../components/ui/Toast';
import {
  ArrowLeft,
  Upload,
  Save,
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';

const AddMenu = () => {
  const navigate = useNavigate();
  const { postMultipart, loading } = useApi();
  const [toast, setToast] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const categories = [
    'เครื่องดื่ม',
    // 'แอลกอฮอล์',
    'มิ๊กเซอร์',
    'เมนูผัด',
    'เมนูกับแกล้ม',
    'เมนูส้มตำ',
    'เมนูจุ่ม',
    'เมนูทอด',
    'เมนูต้ม',
    'เมนูยำ',
    'เมนูทานเล่น',
    'อาหารจานเดียว'
  ];

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    main_category: 'เครื่องดื่ม',
    stock_quantity: '0',
    low_stock_threshold: '5',
    menu_image: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, menu_image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });

    try {
      await postMultipart('/menus', data);
      setToast({ message: 'เพิ่มเมนูใหม่เรียบร้อยแล้ว', type: 'success' });
      setTimeout(() => navigate('/manage-menus'), 1500);
    } catch (err) {
      setToast({ message: 'เกิดข้อผิดพลาดในการบันทึก', type: 'error' });
    }
  };

  return (
    <div className="animate-slide-up max-w-4xl mx-auto space-y-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <header className="flex items-center gap-4">
        <Link
          to="/manage-menus"
          className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">
            <span>จัดการเมนู</span>
            <ChevronRight size={14} />
            <span className="text-blue-600">เพิ่มรายการใหม่</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">เพิ่มเมนูใหม่</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Image Upload */}
        <div className="md:col-span-1 space-y-6">
          <div className="card p-4 flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 w-full text-center">รูปภาพเมนู</h3>
            <div className="relative w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 group">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover animate-fade" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                  <ImageIcon size={64} strokeWidth={1} />
                  <p className="text-xs font-bold mt-2">ยังไม่มีรูปภาพ</p>
                </div>
              )}
              <label className="absolute inset-0 cursor-pointer bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2">
                <Upload size={20} /> เปลี่ยนรูป
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} required />
              </label>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 text-center leading-relaxed">
              รองรับไฟล์ JPG, PNG และ WebP <br /> แนะนำขนาด 800x800 พิกเซล
            </p>
          </div>
        </div>

        {/* Right Col: Details Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="card space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">ชื่อเมนู <span className="text-rose-500">*</span></label>
                <input
                  type="text" name="name" required value={formData.name} onChange={handleChange}
                  placeholder="เช่น ปีกไก่ทอดน้ำปลา"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">ราคา (บาท) <span className="text-rose-500">*</span></label>
                <input
                  type="number" name="price" required value={formData.price} onChange={handleChange}
                  placeholder="เช่น 89"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">หมวดหมู่</label>
              <select
                name="main_category" value={formData.main_category} onChange={handleChange}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">จำนวนในคลังเริ่มต้น</label>
                <input
                  type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">แจ้งเตือนสินค้าใกล้หมด (ต่ำกว่า)</label>
                <input
                  type="number" name="low_stock_threshold" value={formData.low_stock_threshold} onChange={handleChange}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-4">
              <Link to="/manage-menus" className="btn btn-outline h-12 px-8">ยกเลิก</Link>
              <button
                type="submit" disabled={loading}
                className="btn btn-primary h-12 px-10 shadow-lg shadow-blue-600/20"
              >
                {loading ? <LoadingSpinner size="sm" color="white" /> : <><Save size={20} /> บันทึกลงระบบ</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddMenu;
