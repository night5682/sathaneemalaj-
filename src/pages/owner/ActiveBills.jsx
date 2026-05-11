import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Utensils, 
  Receipt, 
  Printer, 
  ArrowRight,
  Info,
  QrCode,
  Clock,
  Trash2,
  Plus,
  Minus,
  Save,
  KeyRound,
  FileText,
  CheckCircle,
  XCircle,
  Users,
  Coffee,
  Percent
} from 'lucide-react';

const ActiveBills = () => {
  const { get, post, del, loading } = useApi();
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [showDebtorPrompt, setShowDebtorPrompt] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [debtorName, setDebtorName] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [isDiscounted, setIsDiscounted] = useState(false);

  const fetchBills = async () => {
    try {
      const data = await get('/active_bills.php');
      setBills(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchBills();
    const interval = setInterval(fetchBills, 30000);
    return () => clearInterval(interval);
  }, [get]);

  const handleShowBill = async (bill) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
    setItemsLoading(true);
    setIsModified(false);
    setShowEditConfirm(false);
    setEditReason('');
    setEditUsername('');
    setEditPassword('');
    setIsDiscounted(false);
    try {
      const items = await get('/bill_items.php', { order_id: bill.id });
      setBillItems(items);
    } catch (err) { console.error(err); }
    finally { setItemsLoading(false); }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedBill) return;
    
    if (status === 'ยกเลิก' && !showCancelPrompt) {
      setShowCancelPrompt(true);
      setShowDebtorPrompt(false);
      return;
    }

    if (status === 'ค้างชำระ' && !showDebtorPrompt) {
      setShowDebtorPrompt(true);
      setShowCancelPrompt(false);
      return;
    }

    let finalStatus = status;
    let note = status === 'ยกเลิก' ? cancelReason : (status === 'ค้างชำระ' ? `ชื่อลูกค้า: ${debtorName}` : null);
    let updatedTotal = null;

    if (isDiscounted && (status === 'ชำระแล้ว' || status === 'ค้างชำระ')) {
      updatedTotal = calculateTotal() - calculateDiscountAmount();
      if (status === 'ชำระแล้ว') {
        finalStatus = 'ลด 10%';
      } else {
        note = note ? `${note} | ลด 10%` : `ลด 10%`;
      }
    }

    try {
      await post('/active_bills.php', { 
        order_id: selectedBill.id, 
        status: finalStatus,
        note: note,
        total_price: updatedTotal
      });
      setToast({ message: `อัปเดตสถานะเป็น "${finalStatus}" เรียบร้อย`, type: 'success' });
      setIsModalOpen(false);
      setShowCancelPrompt(false);
      setShowDebtorPrompt(false);
      setCancelReason('');
      setDebtorName('');
      fetchBills();
    } catch (err) {
      setToast({ message: 'เกิดข้อผิดพลาดในการอัปเดต', type: 'error' });
    }
  };

  const handleUpdateQty = (itemId, delta) => {
    setBillItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty !== item.quantity) setIsModified(true);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleSaveChanges = async () => {
    if (!editUsername || !editPassword || !editReason) {
      setToast({ message: 'กรุณากรอก Username, Password และเหตุผล', type: 'error' });
      return;
    }

    try {
      await post('/edit_bill.php', {
        order_id: selectedBill.id,
        items: billItems.map(i => ({ id: i.id, quantity: i.quantity })),
        username: editUsername,
        password: editPassword,
        reason: editReason
      });
      
      setToast({ message: 'แก้ไขบิลเรียบร้อยแล้ว', type: 'success' });
      setIsModalOpen(false);
      fetchBills();
    } catch (err) {
      setToast({ message: err.message || 'รหัสผ่านไม่ถูกต้องหรือเกิดข้อผิดพลาด', type: 'error' });
    }
  };

  const calculateTotal = () => {
    return billItems.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0);
  };

  const calculateDiscountAmount = () => {
    if (!isDiscounted) return 0;
    const foodTotal = billItems.reduce((sum, item) => {
      return item.category === 'อาหาร' ? sum + (item.price_at_time * item.quantity) : sum;
    }, 0);
    return Math.round(foodTotal * 0.1);
  };

  const handlePrintBill = () => {
    if (!selectedBill) return;
    const printWindow = window.open('', '_blank');
    const subtotal = calculateTotal();
    const discountAmount = calculateDiscountAmount();
    const total = subtotal - discountAmount;
    const date = new Date().toLocaleString('th-TH');

    const html = `
      <html>
        <head>
          <title>Bill - Table ${selectedBill.table_number}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              width: 80mm; font-family: 'Courier New', Courier, monospace; 
              padding: 5mm; box-sizing: border-box; font-size: 12px; line-height: 1.4;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 3mm 0; }
            .item-row { display: flex; justify-content: space-between; margin: 1mm 0; }
            .footer { margin-top: 5mm; font-size: 10px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="center bold" style="font-size: 16px;">SATHANEE MALA</div>
          <div class="center">สถานีหม่าล่า</div>
          <div class="line"></div>
          <div>วันที่: ${date}</div>
          <div class="bold">โต๊ะ: ${selectedBill.table_number}</div>
          <div class="line"></div>
          <div class="bold item-row">
            <span>รายการ</span>
            <span>ราคา</span>
          </div>
          ${billItems.map(item => `
            <div class="item-row">
              <span style="flex: 1;">${item.name} x ${item.quantity}</span>
              <span>${(item.price_at_time * item.quantity).toLocaleString()}</span>
            </div>
          `).join('')}
          <div class="line"></div>
          ${isDiscounted ? `
          <div class="item-row">
            <span>ส่วนลด 10%</span>
            <span>-${discountAmount.toLocaleString()}</span>
          </div>
          <div class="line"></div>
          ` : ''}
          <div class="bold item-row" style="font-size: 14px;">
            <span>ยอดรวมทั้งสิ้น</span>
            <span>${total.toLocaleString()}.-</span>
          </div>
          <div class="line"></div>
          <div class="center footer">ขอบคุณที่ใช้บริการ<br>THANK YOU</div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const generateQrUrl = (tableNum) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/customer?table=${tableNum}`;
  };

  return (
    <div className="animate-slide-up space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">โต๊ะที่กำลังใช้งาน</h1>
          <p className="text-slate-500 mt-2 font-medium">จัดการสถานะบิลและสร้าง QR Code สำหรับสั่งอาหาร</p>
        </div>
        <div className="card py-3 px-6 flex items-center gap-4 bg-white shadow-sm border-slate-200">
          <span className="text-slate-500 font-semibold text-sm">โต๊ะที่มีลูกค้า:</span>
          <span className="text-2xl font-black text-rose-500">{bills.length}</span>
        </div>
      </header>

      {loading && bills.length === 0 ? (
        <div className="h-64 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : bills.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {bills.map((bill) => (
            <div 
              key={bill.id} 
              className="card group border-2 border-transparent hover:border-blue-500 relative overflow-hidden p-4"
            >
              <div className="absolute top-3 right-3 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
              <div className="absolute top-3 right-3 w-3 h-3 bg-rose-500 rounded-full" />

              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Utensils size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">โต๊ะ {bill.table_number}</h3>
                  <p className="text-2xl font-black text-blue-600 mt-1">{Number(bill.total_price).toLocaleString()}.-</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  <button 
                    onClick={() => handleShowBill(bill)}
                    className="btn btn-outline py-2 px-0 text-xs font-black uppercase"
                  >
                    <Receipt size={14} /> บิล
                  </button>
                  <button 
                    onClick={() => { setSelectedBill(bill); setIsQrModalOpen(true); }}
                    className="btn btn-primary py-2 px-0 text-xs font-black uppercase"
                  >
                    <QrCode size={14} /> QR
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card py-20 flex flex-col items-center justify-center text-center bg-white border-dashed border-2 border-slate-200">
          <Utensils className="text-slate-200 mb-4" size={64} />
          <h3 className="text-xl font-bold text-slate-800">ไม่มีลูกค้าในร้านขณะนี้</h3>
        </div>
      )}

      {/* Bill Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`รายละเอียดโต๊ะ ${selectedBill?.table_number}`}
        footer={
          <div className="flex flex-col w-full gap-4">
            {showCancelPrompt && (
              <div className="bg-rose-50 p-4 rounded-2xl space-y-3 animate-fade-in border border-rose-100">
                <p className="text-sm font-bold text-rose-600">กรุณาระบุเหตุผลที่ยกเลิกออเดอร์:</p>
                <input 
                  type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="เช่น ลูกค้าขอคืน, ทำผิดรายการ..."
                  className="w-full h-11 px-4 bg-white border border-rose-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowCancelPrompt(false)} className="flex-1 btn bg-white text-slate-500">ยกเลิก</button>
                  <button onClick={() => handleUpdateStatus('ยกเลิก')} className="flex-1 btn bg-rose-500 text-white">ยืนยันยกเลิกบิล</button>
                </div>
              </div>
            )}

            {showDebtorPrompt && (
              <div className="bg-orange-50 p-4 rounded-2xl space-y-3 animate-fade-in border border-orange-100">
                <div className="flex items-center gap-2 text-orange-600">
                  <Users size={18} />
                  <p className="text-sm font-bold">ค้างชำระ - กรุณาใส่ชื่อลูกค้า:</p>
                </div>
                <input 
                  type="text" value={debtorName} onChange={(e) => setDebtorName(e.target.value)}
                  placeholder="ชื่อลูกค้าที่ค้างชำระ..."
                  className="w-full h-11 px-4 bg-white border border-orange-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowDebtorPrompt(false)} className="flex-1 btn bg-white text-slate-500">ย้อนกลับ</button>
                  <button onClick={() => handleUpdateStatus('ค้างชำระ')} className="flex-1 btn bg-orange-500 text-white shadow-lg shadow-orange-500/20">บันทึกค้างชำระ</button>
                </div>
              </div>
            )}
            
            {!showCancelPrompt && !showDebtorPrompt && !showEditConfirm && (
              <div className="flex flex-wrap gap-2 justify-center w-full">
                {isModified ? (
                  <button 
                    onClick={() => setShowEditConfirm(true)}
                    className="btn btn-primary w-full h-14 bg-blue-600 hover:bg-blue-700"
                  >
                    <Save size={20} /> บันทึกการแก้ไขบิล
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus('ยกเลิก')}
                      className="btn bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border-none"
                    >
                      <XCircle size={18} /> ยกเลิก
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus('ค้างชำระ')}
                      className="btn bg-orange-100 text-orange-600 hover:bg-orange-200 border-none"
                    >
                      <Clock size={18} /> ค้างชำระ
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus('ชำระแล้ว')}
                      className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                    >
                      <CheckCircle size={18} /> ชำระแล้ว
                    </button>
                    <button 
                      onClick={() => setIsDiscounted(!isDiscounted)}
                      className={`btn w-full mt-2 border-none ${isDiscounted ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-600'}`}
                    >
                      <Percent size={18} /> {isDiscounted ? 'ยกเลิกส่วนลด 10%' : 'ลด 10%'}
                    </button>
                    <button 
                      onClick={handlePrintBill}
                      className="btn bg-blue-50 text-blue-600 hover:bg-blue-100 border-none w-full mt-2"
                    >
                      <Printer size={18} /> ปริ้นใบแจ้งยอด (Bill)
                    </button>
                  </>
                )}
              </div>
            )}

            {showEditConfirm && (
              <div className="bg-blue-50 p-6 rounded-[32px] space-y-4 animate-fade-in border border-blue-100">
                <div className="flex items-center gap-3 text-blue-800 mb-2">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-widest">ยืนยันการแก้ไขบิล</p>
                    <p className="text-[10px] font-bold opacity-70">กรุณากรอก Username/Password และเหตุผลเพื่อบันทึก</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                      <input 
                        type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)}
                        placeholder="Username"
                        className="w-full h-12 pl-12 pr-4 bg-white border border-blue-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                      />
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                      <input 
                        type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full h-12 pl-12 pr-4 bg-white border border-blue-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                    <input 
                      type="text" value={editReason} onChange={(e) => setEditReason(e.target.value)}
                      placeholder="เหตุผลในการคืนของ/แก้ไข..."
                      className="w-full h-12 pl-12 pr-4 bg-white border border-blue-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowEditConfirm(false)} className="flex-1 btn bg-white text-slate-500 h-12">ย้อนกลับ</button>
                  <button onClick={handleSaveChanges} className="flex-1 btn bg-blue-600 text-white h-12 shadow-lg shadow-blue-600/20">ยืนยันและบันทึก</button>
                </div>
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            {itemsLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {billItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-white rounded-xl shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        {item.category === 'อาหาร' ? <Utensils size={20} /> : <Coffee size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.quantity} ชิ้น x {Number(item.price_at_time).toLocaleString()}.-</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
                        <button 
                          onClick={() => handleUpdateQty(item.id, -1)}
                          className="w-8 h-8 bg-white text-slate-400 hover:text-rose-500 rounded-lg flex items-center justify-center transition-all shadow-sm"
                        >
                          {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                        </button>
                        <span className="w-6 text-center font-black text-slate-900 text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQty(item.id, 1)}
                          className="w-8 h-8 bg-white text-blue-600 rounded-lg flex items-center justify-center transition-all shadow-sm"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="font-black text-slate-900 min-w-[80px] text-right">{(item.price_at_time * item.quantity).toLocaleString()}.-</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center px-4">
            <span className="text-lg font-bold text-slate-500 uppercase tracking-widest">ยอดรวมสุทธิ</span>
            <div className="text-right">
              {isDiscounted && (
                <div className="text-sm font-bold text-purple-600 line-through opacity-70">
                  {calculateTotal().toLocaleString()} ฿
                </div>
              )}
              <span className={`text-3xl font-black tracking-tighter transition-colors ${isModified ? 'text-blue-600' : 'text-slate-900'}`}>
                {(calculateTotal() - calculateDiscountAmount()).toLocaleString()} <span className="text-xl opacity-30">฿</span>
              </span>
            </div>
          </div>
          {isModified && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-800 text-[10px] font-bold leading-relaxed">
              <Info size={18} className="shrink-0" />
              <p>บิลนี้มีการแก้ไขจำนวนรายการ กรุณากดปุ่ม "บันทึกการแก้ไขบิล" เพื่อยืนยันและบันทึกข้อมูลลงระบบ</p>
            </div>
          )}
        </div>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`QR Code โต๊ะ ${selectedBill?.table_number}`}
      >
        <div className="flex flex-col items-center gap-8 py-8">
          <div className="p-8 bg-white rounded-[40px] shadow-2xl border border-slate-100">
            <QRCodeSVG 
              value={generateQrUrl(selectedBill?.table_number)} 
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-slate-900 tracking-tight">สแกนเพื่อสั่งอาหาร</p>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Table No. {selectedBill?.table_number}</p>
          </div>
          <button 
            onClick={() => window.print()}
            className="btn btn-primary w-full h-14"
          >
            <Printer size={20} /> พิมพ์ QR Code
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ActiveBills;
