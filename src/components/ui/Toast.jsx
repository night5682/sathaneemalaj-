import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-rose-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  const colors = {
    success: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    error: 'border-rose-100 bg-rose-50 text-rose-900',
    info: 'border-blue-100 bg-blue-50 text-blue-900',
  };

  return (
    <div className={`
      fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 
      rounded-2xl border shadow-xl animate-slide-in-right max-w-sm
      ${colors[type]}
    `}>
      <span className="shrink-0">{icons[type]}</span>
      <p className="font-medium text-sm flex-1">{message}</p>
      <button 
        onClick={onClose}
        className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
