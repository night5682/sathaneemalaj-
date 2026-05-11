import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Grid, 
  QrCode, 
  Printer, 
  ExternalLink,
  Users,
  CheckCircle2,
  Lock
} from 'lucide-react';

const TableManagement = () => {
  const { get, loading } = useApi();
  const [activeTables, setActiveTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Define tables: T1-25 and B26-38
  const tables = [
    ...Array.from({ length: 25 }, (_, i) => `T${i + 1}`),
    ...Array.from({ length: 13 }, (_, i) => `B${26 + i}`)
  ];

  const fetchActiveBills = async () => {
    try {
      const data = await get('/active_bills.php');
      setActiveTables(data.map(bill => bill.table_number.toString()));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchActiveBills();
    const interval = setInterval(fetchActiveBills, 10000);
    return () => clearInterval(interval);
  }, [get]);

  const handleOpenTable = (table) => {
    setSelectedTable(table);
    setIsQrModalOpen(true);
  };

  const generateQrUrl = (tableNum) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/customer?table=${tableNum}`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const qrUrl = generateQrUrl(selectedTable);
    const date = new Date().toLocaleString('th-TH');

    const html = `
      <html>
        <head>
          <title>PRINT QR - Table ${selectedTable}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              width: 80mm; font-family: 'Sarabun', sans-serif; 
              padding: 20px; margin: 0; text-align: center;
            }
            .header { font-size: 22px; font-weight: 900; margin-bottom: 5px; }
            .sub-header { font-size: 14px; color: #666; margin-bottom: 20px; }
            .qr-container { margin: 20px auto; }
            .table-box { 
              background: #000; color: #fff; display: inline-block; 
              padding: 5px 20px; border-radius: 10px; font-size: 28px; font-weight: 900;
              margin-bottom: 20px;
            }
            .footer { font-size: 12px; color: #999; margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header text-uppercase">SATHANEE MALA</div>
          <div class="sub-header uppercase tracking-widest">Scan to Order</div>
          <div class="table-box">TABLE ${selectedTable}</div>
          <div class="qr-container" id="qr-code"></div>
          <div class="footer">
            Printed at: ${date}<br>
            * Please scan to start your order *
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
          <script>
            window.onload = function() {
              var qr = qrcode(0, 'H');
              qr.addData('${qrUrl}');
              qr.make();
              document.getElementById('qr-code').innerHTML = qr.createImgTag(6);
              setTimeout(() => { window.print(); window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="animate-slide-up space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">จัดการโต๊ะ (Table Map)</h1>
          <p className="text-slate-500 mt-2 font-medium">เลือกโต๊ะเพื่อเปิด และสั่งพิมพ์ QR Code สำหรับลูกค้า</p>
        </div>
        <div className="flex gap-4">
          <div className="card py-3 px-6 flex items-center gap-3 bg-white border-slate-200 shadow-sm">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Available: {tables.length - activeTables.length}</span>
          </div>
          <div className="card py-3 px-6 flex items-center gap-3 bg-white border-slate-200 shadow-sm">
            <div className="w-3 h-3 bg-rose-500 rounded-full" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">In Use: {activeTables.length}</span>
          </div>
        </div>
      </header>

      {/* Table Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
        {tables.map((table) => {
          const isBusy = activeTables.includes(table);
          return (
            <button
              key={table}
              onClick={() => handleOpenTable(table)}
              className={`
                aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 transition-all duration-300 relative group overflow-hidden
                ${isBusy 
                  ? 'bg-rose-50 border-2 border-rose-100 text-rose-600' 
                  : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 hover:-translate-y-1 shadow-sm'}
              `}
            >
              {isBusy && <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
              <span className={`text-2xl font-black ${isBusy ? 'text-rose-700' : 'text-slate-900 group-hover:text-blue-700'}`}>
                {table}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                {isBusy ? 'In Use' : 'Available'}
              </span>
              {!isBusy && (
                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 transition-opacity" />
              )}
            </button>
          );
        })}
      </div>

      {/* QR Code Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`เปิดโต๊ะ ${selectedTable}`}
      >
        <div className="flex flex-col items-center gap-8 py-8">
          <div className="p-8 bg-white rounded-[40px] shadow-2xl border border-slate-100">
            <QRCodeSVG 
              value={generateQrUrl(selectedTable)} 
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl font-black text-slate-900 tracking-tighter">TABLE {selectedTable}</div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Scan to start ordering</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <button 
              onClick={() => window.open(generateQrUrl(selectedTable), '_blank')}
              className="btn btn-outline h-14"
            >
              <ExternalLink size={20} /> ดูหน้าลูกค้า
            </button>
            <button 
              onClick={handlePrint}
              className="btn btn-primary h-14"
            >
              <Printer size={20} /> พิมพ์ QR Code
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-bold text-center">
            เมื่อลูกค้าสแกนสั่งอาหาร รายการจะไปปรากฏที่หน้า "โต๊ะที่กำลังใช้งาน" โดยอัตโนมัติ
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default TableManagement;
