from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

class LoginRequest(BaseModel):
    username: str
    password: str

class CartItem(BaseModel):
    id: int # menu_id
    name: str
    price: Decimal
    qty: int
    image: Optional[str] = None

class OrderCreate(BaseModel):
    table_number: int
    items: List[CartItem]

class StatusUpdate(BaseModel):
    order_id: int
    status: str
    note: Optional[str] = None
    total_price: Optional[float] = None

class ItemDelete(BaseModel):
    item_id: int
    order_id: int

class BillEditItem(BaseModel):
    id: int # order_item_id
    quantity: int

class BillEditRequest(BaseModel):
    order_id: int
    items: List[BillEditItem]
    username: str
    password: str
    reason: str

class ProductionUpdate(BaseModel):
    id: int
    status: str

class EmployeeCreate(BaseModel):
    first_name: str # Maps to owner_name
    last_name: str # Maps to owner_name combined
    nickname: Optional[str] = None
    username: str
    password: str

class ToggleStatus(BaseModel):
    id: int
    type: str # 'active' or 'recommend'

class StockUpdate(BaseModel):
    id: int
    action: str # 'add' or 'subtract'
    amount: int

class StockManualUpdate(BaseModel):
    stock_quantity: int
    user_id: int
    note: Optional[str] = None
