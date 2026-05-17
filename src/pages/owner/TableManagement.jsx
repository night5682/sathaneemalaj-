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
  const { get, post, loading } = useApi();
  const [activeTables, setActiveTables] = useState([]);
  const [activeBills, setActiveBills] = useState([]); // Store full bill data for names
  const [customerName, setCustomerName] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [previewOrderUrl, setPreviewOrderUrl] = useState('');

  // Define tables: VIP1-2, T1-25, B26-38, and Ex1-10
  const tables = [
    'VIP1', 'VIP2',
    ...Array.from({ length: 25 }, (_, i) => `T${i + 1}`),
    ...Array.from({ length: 13 }, (_, i) => `B${26 + i}`),
    ...Array.from({ length: 10 }, (_, i) => `Ex${i + 1}`)
  ];

  const [qrUrl, setQrUrl] = useState('');
  const [qrSessionToken, setQrSessionToken] = useState('');

  const buildQrUrl = (tableNum) => {
    const baseUrl = window.location.origin;
    const encoded = btoa(String(tableNum).trim());
    return `${baseUrl}/customer?table=${encoded}`;
  };

  const fetchActiveBills = async () => {
    try {
      const data = await get('/active_bills');
      setActiveBills(data); // Store full list
      setActiveTables(data.map(bill => bill.table_number.toString()));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchActiveBills();
    const interval = setInterval(fetchActiveBills, 10000);
    return () => clearInterval(interval);
  }, [get]);
  
  const sendTableOpenToReceiver = async ({ table, sessionToken }) => {
    const baseUrl = window.location.origin;

    const rawData = `${String(table).trim()}|${String(sessionToken).trim()}`;
    const encoded = btoa(rawData);

    const payload = {
      session_id: String(sessionToken),
      table_number: String(table),
      order_url: `${baseUrl}/customer?table=${encoded}`,
      created_at: new Date().toISOString()
    };

    console.log("SEND /api/table/open payload:", payload);

    const res = await fetch("http://localhost:8000/api/table/open", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API /api/table/open error ${res.status}: ${text}`);
    }

    return await res.json();
  };

  const handleOpenTable = (table) => {
    setSelectedTable(table);
    setIsQrModalOpen(true);
    setCustomerName('');

    const previewUrl = buildQrUrl(table);

    setPreviewOrderUrl(previewUrl);
    setQrUrl(previewUrl);
    setQrSessionToken('');
};

  const handleConfirmOpenTable = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user')) || {};

      const data = await post('/open-special-table', { 
        table_name: String(selectedTable),
        customer_name: customerName,
        order_url: qrUrl,
        user_id: user.id || null,
        username: user.username || '',
        owner_name: user.owner_name || user.first_name || ''
      });
      if (data && data.session_token) {
        await fetchActiveBills();
        setToast({ message: `เปิดโต๊ะ ${selectedTable} สำเร็จ`, type: 'success' });
      }
    } catch (err) {
      setToast({ message: `ผิดพลาด: ${err.message}`, type: 'error' });
    }
  };

  const generateQrUrl = (tableNum) => {
    const baseUrl = window.location.origin;
    const bill = activeBills.find(b => String(b.table_number) === String(tableNum));
    const token = bill ? bill.session_token : '';
    
    // Encode table and token into one string (e.g. T1|token)
    const rawData = `${String(tableNum).trim()}|${String(token).trim()}`;
    const encoded = btoa(rawData);
    
    return `${baseUrl}/customer?table=${encoded}`;
  };

  // const handlePrint = () => {
  //   const printWindow = window.open('', '_blank');
  //   const qrUrl = generateQrUrl(selectedTable);
  //   const date = new Date().toLocaleString('th-TH');

  //   const html = `
  //     <html>
  //       <head>
  //         <title>PRINT QR - Table ${selectedTable}</title>
  //         <style>
  //           @page { size: 80mm auto; margin: 0; }
  //           body { 
  //             width: 80mm; font-family: 'Sarabun', sans-serif; 
  //             padding: 20px; margin: 0; text-align: center;
  //           }
  //           .header { font-size: 22px; font-weight: 900; margin-bottom: 5px; }
  //           .sub-header { font-size: 14px; color: #666; margin-bottom: 20px; }
  //           .qr-container { margin: 20px auto; }
  //           .table-box { 
  //             background: #000; color: #fff; display: inline-block; 
  //             padding: 5px 20px; border-radius: 10px; font-size: 28px; font-weight: 900;
  //             margin-bottom: 20px;
  //           }
  //           .footer { font-size: 12px; color: #999; margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 10px; }
  //         </style>
  //       </head>
  //       <body>
  //         <div class="header text-uppercase">SATHANEE MALA</div>
  //         <div class="sub-header uppercase tracking-widest">Scan to Order</div>
  //         <div class="table-box">TABLE ${selectedTable}</div>
  //         <div class="qr-container" id="qr-code"></div>
  //         <div class="footer">
  //           Printed at: ${date}<br>
  //           * Please scan to start your order *
  //         </div>
  //         <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
  //         <script>
  //           window.onload = function() {
  //             var qr = qrcode(0, 'H');
  //             qr.addData('${qrUrl}');
  //             qr.make();
  //             document.getElementById('qr-code').innerHTML = qr.createImgTag(6);
  //             setTimeout(() => { window.print(); window.close(); }, 500);
  //           }
  //         </script>
  //       </body>
  //     </html>
  //   `;

  //   printWindow.document.write(html);
  //   printWindow.document.close();
  // };

  const handleSendQrData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user')) || {};

      const data = await post('/open-special-table', {
        table_name: String(selectedTable),
        customer_name: customerName,
        order_url: qrUrl,
        user_id: user.id || null,
        username: user.username || '',
        owner_name: user.owner_name || user.first_name || ''
      });

      if (!data?.session_token) {
        throw new Error("ไม่พบ session token");
      }

      const finalQrUrl = buildQrUrl(selectedTable);

      setQrSessionToken(data.session_token);
      setQrUrl(finalQrUrl);
      setPreviewOrderUrl(finalQrUrl);

      console.log("SEND /api/table/open");

      const res = await fetch("/api/table/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: data.session_token,
          table_number: String(selectedTable),
          order_url: finalQrUrl,
          created_at: new Date().toISOString()
        })
      });

      console.log("TABLE OPEN STATUS:", res.status);

      const result = await res.json();

      console.log("TABLE OPEN RESULT:", result);

      await fetchActiveBills();

      setToast({
        message: `เปิดโต๊ะและส่ง QR โต๊ะ ${selectedTable} สำเร็จ`,
        type: "success"
      });

    } catch (err) {
      setToast({
        message: `ส่งข้อมูล QR ไม่สำเร็จ: ${err.message}`,
        type: "error"
      });
    }
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

      {/* VIP Zone */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1.5 bg-amber-500 rounded-full" />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">VIP Zone</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
          {tables.filter(t => t.startsWith('VIP')).map((table) => {
            const isBusy = activeTables.includes(table);
            return (
              <button
                key={table}
                onClick={() => handleOpenTable(table)}
                className={`
                  h-24 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all duration-300 relative group overflow-hidden
                  ${isBusy 
                    ? 'bg-blue-50 border-2 border-blue-500 text-blue-600 shadow-md' 
                    : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-amber-500 hover:bg-amber-50 hover:text-amber-600 hover:-translate-y-1 shadow-sm'}
                `}
              >
                <span className={`text-[10px] font-black uppercase tracking-widest ${isBusy ? 'text-blue-400' : 'text-slate-300'}`}>
                  {isBusy ? 'Occupied' : 'Available'}
                </span>
                <span className="text-2xl font-black tracking-tighter">{table}</span>
                {!isBusy && (
                  <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Standard Zone */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1.5 bg-slate-400 rounded-full" />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Standard Zone</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
          {tables.filter(t => !t.startsWith('VIP') && !t.startsWith('Ex')).map((table) => {
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
                <span className="text-2xl font-black tracking-tighter">{table}</span>
                {!isBusy && (
                  <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Extra Zone */}
      <div className="space-y-4 mt-10">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1.5 bg-indigo-500 rounded-full" />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Extra Zone</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
          {tables.filter(t => t.startsWith('Ex')).map((table) => {
            const bill = activeBills.find(b => b.table_number === table);
            const isBusy = !!bill;
            return (
              <button
                key={table}
                onClick={() => handleOpenTable(table)}
                className={`
                  aspect-square rounded-3xl flex flex-col items-center justify-center gap-1 transition-all duration-300 relative group overflow-hidden
                  ${isBusy 
                    ? 'bg-indigo-50 border-2 border-indigo-200 text-indigo-600 shadow-md' 
                    : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 hover:-translate-y-1 shadow-sm'}
                `}
              >
                <span className="text-2xl font-black tracking-tighter">{table}</span>
                {bill?.customer_name && (
                  <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full truncate max-w-[90%] shadow-sm">
                    {bill.customer_name}
                  </span>
                )}
                {!isBusy && (
                  <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* QR Code Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`จัดการโต๊ะ ${selectedTable}`}
      >
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Customer Name for Extra Zone */}
          {selectedTable?.startsWith('Ex') && (
            <div className="w-full space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} /> ชื่อลูกค้า (โต๊ะเสริม)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น คุณสมชาย..."
                  className="input input-bordered flex-1 h-12 bg-white font-bold text-slate-700"
                />
                <button 
                  onClick={handleConfirmOpenTable}
                  disabled={loading}
                  className="btn btn-primary h-12 px-6 shadow-lg shadow-blue-200"
                >
                  {loading ? '...' : 'บันทึก'}
                </button>
              </div>
            </div>
          )}

         <div className="p-8 bg-white rounded-[40px] shadow-2xl border border-slate-100">
          {qrUrl || previewOrderUrl ? (
            <QRCodeSVG 
              value={qrUrl || previewOrderUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center text-center text-slate-400 text-sm font-bold">
              กำลังสร้าง QR...
            </div>
          )}
        </div>
          <div className="text-center space-y-2">
            <div className="text-4xl font-black text-slate-900 tracking-tighter">TABLE {selectedTable}</div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Scan to start ordering</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <button 
              onClick={() => {
                if (!qrUrl) {
                  setToast({
                    message: 'กรุณากดส่งข้อมูล QR Code ก่อน',
                    type: 'error'
                  });
                  return;
                }
                window.open(qrUrl, '_blank');
              }}
              className="btn btn-outline h-14"
            >
              <ExternalLink size={20} /> ดูหน้าลูกค้า
            </button>
            <button 
              onClick={handleSendQrData}
              className="btn btn-primary h-14"
            >
              <Printer size={20} /> ส่งข้อมูล QR Code
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default TableManagement;
