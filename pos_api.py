"""
pos_api.py  —  FastAPI receiver สำหรับระบบ POS
รัน: python pos_api.py  หรือ  uvicorn pos_api:app --host 0.0.0.0 --port 42092 --reload

Endpoints:
  POST /api/table/open  → พิมพ์ QR Slip (เปิดโต๊ะ)
  POST /api/order       → พิมพ์ Kitchen Slip (ส่งครัว/บาร์)
  POST /api/invoice     → พิมพ์ Invoice / ใบเสร็จ
"""

import json
import traceback
from datetime import datetime
from typing import List, Literal, Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Import slip functions ────────────────────────────────────────────────────
from pos_open_table import print_qr_slip
from pos_order      import print_kitchen_slips
from pos_checkout   import print_check_bill, print_invoice

# ============================================================================
app = FastAPI(title="POS Printer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# REQUEST MODELS
# =========================

# ── Table Open ──────────────────────────────────────
class TableOpenRequest(BaseModel):
    session_id:   str
    table_number: str
    order_url:    str
    created_at:   datetime


# ── Order (Kitchen) ─────────────────────────────────
class OrderItem(BaseModel):
    menu_id:  int
    name:     str
    type:     Literal["food", "drink"]
    quantity: int
    price:    float
    note:     Optional[str] = None

class OrderRequest(BaseModel):
    order_id:     str
    session_id:   str
    table_number: str
    created_at:   datetime
    items:        List[OrderItem]


# ── Invoice / Checkout ──────────────────────────────
class InvoiceItem(BaseModel):
    name:     str
    quantity: int
    price:    float
    subtotal: float

class InvoiceRequest(BaseModel):
    invoice_id:     str
    session_id:     str
    table_number:   str
    payment_method: str
    subtotal:       float
    discount:       float = 0.0
    vat:            float
    service_charge: float
    grand_total:    float
    cash_received:  float = 0.0   # ส่งมาเมื่อชำระเงินสด
    created_at:     datetime
    items:          List[InvoiceItem]


# =========================
# HELPERS
# =========================
def _debug(route: str, payload: dict):
    print(f"\n{'='*52}")
    print(f"RECEIVE  {route}")
    print("="*52)
    print(json.dumps(payload, indent=2, ensure_ascii=False, default=str))
    print("="*52 + "\n")


# =========================
# ROUTES
# =========================

@app.get("/")
def root():
    return {"status": "running", "version": "1.0.0"}


# ── เปิดโต๊ะ → พิมพ์ QR Slip ───────────────────────
@app.post("/api/table/open")
def open_table(data: TableOpenRequest):
    payload = data.model_dump()
    _debug("/api/table/open", payload)
    try:
        print_qr_slip(
            table      = data.table_number,
            order_url  = data.order_url,
            opened_at  = data.created_at,
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Print error: {e}")

    return {"success": True, "message": "เปิดโต๊ะและพิมพ์ QR สำเร็จ"}


# ── ออเดอร์ → พิมพ์ Kitchen Slip ───────────────────
@app.post("/api/order")
def receive_order(data: OrderRequest):
    payload = data.model_dump()
    _debug("/api/order", payload)
    try:
        # แปลง OrderItem → dict format ที่ print_kitchen_slips ต้องการ
        items = [
            {
                "name":     item.name,
                "qty":      item.quantity,
                "note":     item.note or "",
                "category": item.type,   # "food" | "drink"
            }
            for item in data.items
        ]
        print_kitchen_slips(
            table      = data.table_number,
            order_no   = data.order_id,
            items      = items,
            ordered_at = data.created_at,
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Print error: {e}")

    return {
        "success": True,
        "message": "รับออเดอร์และส่งครัวสำเร็จ",
        "data":    payload,
    }


# ── Invoice → พิมพ์ใบเสร็จ ─────────────────────────
@app.post("/api/invoice")
def receive_invoice(data: InvoiceRequest):
    payload = data.model_dump()
    _debug("/api/invoice", payload)
    try:
        items = [
            (item.name, item.quantity, item.price)
            for item in data.items
        ]

        # พิมพ์ใบเสร็จ (Invoice)
        print_invoice(
            invoice_id     = data.invoice_id,
            table          = data.table_number,
            items          = items,
            subtotal       = data.subtotal,
            vat            = data.vat,
            service_charge = data.service_charge,
            grand_total    = data.grand_total,
            discount       = data.discount,
            payment_method = data.payment_method,
            cash_received  = data.cash_received,
            created_at     = data.created_at,
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Print error: {e}")

    return {"success": True, "message": "พิมพ์ใบเสร็จสำเร็จ"}


# ── Check Bill (optional — ถ้า frontend ต้องการเรียกแยก) ──
class CheckBillRequest(BaseModel):
    order_id:       str
    session_id:     str
    table_number:   str
    subtotal:       float
    discount:       float = 0.0
    vat:            float
    service_charge: float
    grand_total:    float
    created_at:     datetime
    items:          List[InvoiceItem]

@app.post("/api/checkbill")
def receive_checkbill(data: CheckBillRequest):
    payload = data.model_dump()
    _debug("/api/checkbill", payload)
    try:
        items = [(item.name, item.quantity, item.price) for item in data.items]
        print_check_bill(
            table          = data.table_number,
            order_no       = data.order_id,
            items          = items,
            subtotal       = data.subtotal,
            vat            = data.vat,
            service_charge = data.service_charge,
            grand_total    = data.grand_total,
            discount       = data.discount,
            created_at     = data.created_at,
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Print error: {e}")

    return {"success": True, "message": "พิมพ์ใบเช็คบิลสำเร็จ"}


# =========================
# RUN
# =========================
if __name__ == "__main__":
    uvicorn.run(
        "pos_api:app",
        host="0.0.0.0",
        port=42092,
        reload=True,
    )