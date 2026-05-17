from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime
import uvicorn
import json

app = FastAPI(title="POS Receiver API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# TABLE OPEN
# =========================

class TableOpenRequest(BaseModel):
    session_id: str
    table_number: str
    order_url: str
    created_at: datetime


# =========================
# ORDER
# =========================

class OrderItem(BaseModel):
    menu_id: int
    name: str
    type: Literal["food", "drink"]
    quantity: int
    price: float
    note: Optional[str] = None


class OrderRequest(BaseModel):
    order_id: str
    session_id: str
    table_number: str
    created_at: datetime
    items: List[OrderItem]


# =========================
# INVOICE
# =========================

class InvoiceItem(BaseModel):
    name: str
    quantity: int
    price: float
    subtotal: float


class InvoiceRequest(BaseModel):
    invoice_id: str
    session_id: str
    table_number: str
    payment_method: str
    subtotal: float
    discount: float
    vat: float
    service_charge: float
    grand_total: float
    created_at: datetime
    items: List[InvoiceItem]


# =========================
# API
# =========================

@app.get("/")
def root():
    return {
        "status": "running"
    }


@app.post("/api/table/open")
def open_table(data: TableOpenRequest):

    payload = data.model_dump()

    print("\n==============================")
    print("DEBUG: RECEIVE /api/table/open")
    print("==============================")
    print(json.dumps(payload, indent=2, ensure_ascii=False, default=str))
    print("==============================\n")

    return {
        "success": True
    }


@app.post("/api/order")
def receive_order(data: OrderRequest):
    payload = data.model_dump()

    print("\n==============================")
    print("DEBUG: RECEIVE /api/order")
    print("==============================")
    print(json.dumps(payload, indent=2, ensure_ascii=False, default=str))
    print("==============================\n")

    return {
        "success": True,
        "message": "รับข้อมูลออเดอร์สำเร็จ",
        "data": payload
    }


@app.post("/api/invoice")
def receive_invoice(data: InvoiceRequest):

    payload = data.model_dump()

    print("\n==============================")
    print("DEBUG: RECEIVE /api/invoice")
    print("==============================")
    print(json.dumps(payload, indent=2, ensure_ascii=False, default=str))
    print("==============================\n")

    return {
        "success": True
    }


# =========================
# RUN
# =========================

if __name__ == "__main__":
    uvicorn.run(
        "pos_api:app",
        host="0.0.0.0",
        port=42092,
        reload=True
    )