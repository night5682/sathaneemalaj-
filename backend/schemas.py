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
    table_number: str
    security_key: Optional[str] = None
    items: List[CartItem]

class StatusUpdate(BaseModel):
    order_id: int
    status: str
    note: Optional[str] = None
    total_price: Optional[float] = None
    username: Optional[str] = None

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
    role: Optional[str] = 'employee'

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

class SpecialTableOpen(BaseModel):
    table_name: str
    customer_name: Optional[str] = None
    preview_only: Optional[bool] = False
    order_url: Optional[str] = None
    user_id: Optional[int] = None
    username: Optional[str] = None
    owner_name: Optional[str] = None