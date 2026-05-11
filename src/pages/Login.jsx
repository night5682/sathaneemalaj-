import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Toast from '../components/ui/Toast';
import { Lock, User } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { post, loading } = useApi();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // If already logged in, redirect
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const payload = { username, password };

      const result = await post('/auth.php', payload);
      if (result.success) {
        localStorage.setItem('user', JSON.stringify(result.user));
        setToast({ message: 'เข้าสู่ระบบสำเร็จ', type: 'success' });
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err) {
      setToast({ message: err.message || 'การเข้าสู่ระบบล้มเหลว', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">SATHANEE MALA</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Management System Login</p>
        </div>

        <div className="card shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">ชื่อผู้ใช้ (Username)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
                  placeholder="Username"
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">รหัสผ่าน (Password)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full btn btn-primary h-14 text-lg mt-4"
            >
              {loading ? <LoadingSpinner size="sm" color="white" /> : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

