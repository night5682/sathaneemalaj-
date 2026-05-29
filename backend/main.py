from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session
import bcrypt
from typing import List, Optional
from decimal import Decimal
import os
import shutil
import random
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from . import models, database, schemas
from .database import engine, get_db
from fastapi.responses import FileResponse
import secrets

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SATHANEEMHALA POS API")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"LOG: Request Path -> {request.url.path}")
    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pathlib import Path


# --- Image Path / Static Files ---
# หมายเหตุ:
# - ไฟล์รูปจริงอยู่ใน: dist/assets/img/menus/
# - URL ที่ส่งให้ frontend ต้องเป็น: /assets/img/menus/xxx.webp
# - ห้ามส่ง path แบบ dist/assets/... ไปให้ browser

BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = BASE_DIR / "public"
ASSETS_DIR = PUBLIC_DIR / "assets"
DIST_DIR = BASE_DIR / "dist"
UPLOAD_DIR = ASSETS_DIR / "img" / "menus"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# DEFAULT_IMAGE_PATH = "/assets/img/default.jpg"
DEFAULT_IMAGE_PATH = "/assets/img/menus/default.jpg"

app.mount(
    "/api/assets",
    StaticFiles(directory=str(ASSETS_DIR)),
    name="assets"
)

def normalize_image_path(image_path: Optional[str]) -> str:
    """
    แปลง path รูปให้เป็น URL ที่ browser เปิดได้จริง
    รองรับข้อมูลเก่าใน DB เช่น:
    - dist/assets/img/menus/menu_1.webp
    - assets/img/menus/menu_1.webp
    - default.jpg
    - menu_1.webp
    """
    if not image_path:
        return DEFAULT_IMAGE_PATH

    path = str(image_path).replace("\\", "/").strip()

    if path == "" or path.lower() == "default.jpg":
        return DEFAULT_IMAGE_PATH

    if path.startswith("dist/"):
        path = path.replace("dist/", "", 1)

    if path.startswith("/assets/"):
        return path

    if path.startswith("assets/"):
        return f"/{path}"

    filename = Path(path).name
    return f"/assets/img/menus/{filename}"

def save_menu_image(menu_id: int, menu_image: UploadFile) -> str:
    ext = Path(menu_image.filename).suffix.lower()

    allowed_ext = [".jpg", ".jpeg", ".png", ".webp"]

    if ext not in allowed_ext:
        raise HTTPException(
            status_code=400,
            detail="รองรับเฉพาะไฟล์ JPG, PNG, WEBP เท่านั้น"
        )

    image_filename = f"menu_{menu_id}{ext}"
    save_path = UPLOAD_DIR / image_filename

    # Delete existing images with the same menu_id to avoid dangling files
    # if the new image has a different extension, or just to be safe.
    for existing_file in UPLOAD_DIR.glob(f"menu_{menu_id}.*"):
        try:
            existing_file.unlink()
        except OSError:
            pass

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(menu_image.file, buffer)

    return f"/assets/img/menus/{image_filename}"

# --- End of Image Path / Static Files ---

def verify_password(plain_password: str, hashed_password: str):
    try:
        if hashed_password.startswith('$2y$'):
            hashed_password = hashed_password.replace('$2y$', '$2b$', 1)
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"Verify password error: {e}")
        return False

def hash_password(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# --- Auth Routes ---
@app.post("/api/auth")
async def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Authenticate by username and password
    user = db.query(models.Login).filter(models.Login.username == data.username).first()
    if user and (user.password == data.password or verify_password(data.password, user.password)):
        return {"success": True, "user": {
            "id": user.user_id,
            "username": user.username,
            "owner_name": user.owner_name,
            "nickname": user.nickname,
            "role": user.role
        }}
    raise HTTPException(status_code=401, detail="Invalid username or password")

# --- Menu Routes ---
@app.get("/api/menus")
async def get_menus(customer: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.TableCategory).join(models.TypeMenu)
    
    menus = query.order_by(models.TableCategory.is_recommended.desc(), models.TableCategory.menu_id.desc()).all()
    
    result = []
    for menu in menus:
        menu_dict = {
            "id": menu.menu_id,
            "name": menu.menu_name,
            "price": float(menu.price),
            "cost": float(menu.cost),
            "stock_quantity": menu.stock_quantity,
            "low_stock_threshold": menu.low_stock_threshold,
            "image_path": normalize_image_path(menu.image_path),
            "is_active": menu.is_active,
            "is_recommended": menu.is_recommended,
            "category_name": menu.category.type_name,
            "category_id": menu.category.type_id
        }
        result.append(menu_dict)
    return result

@app.post("/api/menus")
async def create_menu(
    name: str = Form(...),
    price: float = Form(...),
    main_category: str = Form(...),
    stock_quantity: int = Form(0),
    low_stock_threshold: int = Form(5),
    menu_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    category = db.query(models.TypeMenu).filter(models.TypeMenu.type_name == main_category).first()
    if not category:
        # Create category if not exists just in case
        category = models.TypeMenu(type_name=main_category)
        db.add(category)
        db.commit()
        db.refresh(category)
    
    cat_id = category.type_id
    
    new_menu = models.TableCategory(
        type_id=cat_id,
        menu_name=name,
        price=price,
        stock_quantity=stock_quantity,
        low_stock_threshold=low_stock_threshold,
        image_path=DEFAULT_IMAGE_PATH # Placeholder
    )
    db.add(new_menu)
    db.flush() # Get the new_menu.menu_id
    
    if menu_image:
        new_menu.image_path = save_menu_image(new_menu.menu_id, menu_image)
            
    db.commit()
    db.refresh(new_menu)
    return {"success": True, "id": new_menu.menu_id}

@app.put("/api/menus/{id}")
async def update_menu(
    id: int,
    name: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    main_category: Optional[str] = Form(None),
    stock_quantity: Optional[int] = Form(None),
    low_stock_threshold: Optional[int] = Form(None),
    menu_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    menu = db.query(models.TableCategory).filter(models.TableCategory.menu_id == id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Not found")
    
    if name is not None: menu.menu_name = name
    if price is not None: menu.price = price
    if stock_quantity is not None: menu.stock_quantity = stock_quantity
    if low_stock_threshold is not None: menu.low_stock_threshold = low_stock_threshold
    
    if main_category:
        category = db.query(models.TypeMenu).filter(models.TypeMenu.type_name == main_category).first()
        if category: menu.type_id = category.type_id
        
    if menu_image:
        menu.image_path = save_menu_image(id, menu_image)
        
    db.commit()
    return {"success": True}

@app.delete("/api/menus")
async def delete_menu(id: int, db: Session = Depends(get_db)):
    menu = db.query(models.TableCategory).filter(models.TableCategory.menu_id == id).first()
    if not menu: raise HTTPException(status_code=404, detail="Not found")
    
    # Check if this menu has been ordered (table_log_cus)
    has_orders = db.query(models.TableLogCus).filter(models.TableLogCus.menu_id == id).first()
    if has_orders:
        raise HTTPException(status_code=400, detail="ไม่สามารถลบเมนูนี้ได้เนื่องจากมีประวัติการสั่งอาหารแล้ว แนะนำให้ใช้การ 'ปิดการใช้งาน' แทน")
    
    # Delete associated stock logs first
    db.query(models.TableLogEmp).filter(models.TableLogEmp.menu_id == id).delete()
    
    db.delete(menu)
    db.commit()
    return {"success": True}

@app.post("/api/toggle_status")
async def toggle_menu_status(data: schemas.ToggleStatus, db: Session = Depends(get_db)):
    menu = db.query(models.TableCategory).filter(models.TableCategory.menu_id == data.id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    
    if data.type == 'active':
        menu.is_active = not menu.is_active
    elif data.type == 'recommend':
        menu.is_recommended = not menu.is_recommended
        
    db.commit()
    return {"success": True}

@app.post("/api/open-special-table")
async def open_special_table(data: schemas.SpecialTableOpen, db: Session = Depends(get_db)):
    table_number = data.table_name
    
    # Check for active order
    active_order = db.query(models.TableSumOrder).filter(
        models.TableSumOrder.table_number == table_number,
        models.TableSumOrder.status.notin_(['ชำระแล้ว', 'ลด 10%', 'ยกเลิก', 'ค้างชำระ', 'completed', 'cancelled'])
    ).first()
    
    new_token = secrets.token_hex(8)
    
    if active_order:
        if not active_order.session_token:
            active_order.session_token = new_token
            db.commit()
        else:
            new_token = active_order.session_token
    else:
        # Create new order/session
        active_order = models.TableSumOrder(
            table_number=table_number,
            customer_name=data.customer_name or f"Table {table_number}",
            session_token=new_token,
            status="กำลังสั่ง",
            total_amount=0
        )
        db.add(active_order)
    
    if not data.preview_only:
        log = models.TableActivityLog(
            table_number=table_number,
            session_token=new_token,
            order_url=data.order_url,
            user_id=data.user_id,
            username=data.username,
            owner_name=data.owner_name,
            action="open_table"
        )

        db.add(log)
        db.commit()
    return {
        "success": True,
        "session_token": new_token,
        "table_number": table_number
    }

@app.get("/api/validate-table-session")
async def validate_table_session(
    table_number: str,
    security_key: str = "",
    db: Session = Depends(get_db)
):
    final_states = ['ชำระแล้ว', 'ลด 10%', 'ยกเลิก', 'ค้างชำระ', 'completed', 'cancelled']

    order = db.query(models.TableSumOrder).filter(
        models.TableSumOrder.table_number == table_number,
        models.TableSumOrder.status.notin_(final_states)
    ).order_by(models.TableSumOrder.created_at.desc()).first()

    if not order:
        return {
            "valid": False,
            "message": "โต๊ะนี้ถูกเช็คบิลแล้ว หรือไม่มี session ที่ใช้งานอยู่"
        }

    if order.session_token and security_key and security_key != order.session_token:
        return {
            "valid": False,
            "message": "QR Code นี้หมดอายุ กรุณาสแกน QR ใหม่"
        }

    return {
        "valid": True,
        "table_number": table_number,
        "session_token": order.session_token
    }

@app.get("/api/customer/order-items")
async def get_customer_order_items(
    table_number: str,
    security_key: str = "",
    db: Session = Depends(get_db)
):
    final_states = ['ชำระแล้ว', 'ลด 10%', 'ยกเลิก', 'ค้างชำระ', 'completed', 'cancelled']
    order = db.query(models.TableSumOrder).filter(
        models.TableSumOrder.table_number == table_number,
        models.TableSumOrder.status.notin_(final_states)
    ).order_by(models.TableSumOrder.created_at.desc()).first()

    if not order:
        return {"success": False, "items": []}

    if order.session_token and security_key and security_key != order.session_token:
        return {"success": False, "items": []}

    items = db.query(models.TableLogCus).filter(models.TableLogCus.sum_order_id == order.sum_order_id).all()
    result = []
    for item in items:
        result.append({
            "name": item.menu.menu_name,
            "quantity": item.quantity,
            "price_at_time": float(item.price_at_time),
            "status": item.status or 'pending',
            "order_time": item.order_time.isoformat() if item.order_time else None
        })
    return {"success": True, "items": result, "status": order.status}

@app.post("/api/table-activity-log")
async def create_table_activity_log(
    data: dict,
    db: Session = Depends(get_db)
):
    log = models.TableActivityLog(
        table_number=data.get("table_number"),
        session_token=data.get("session_token"),
        user_id=data.get("user_id"),
        username=data.get("username"),
        owner_name=data.get("owner_name"),
        action=data.get("action", "activity")
    )

    db.add(log)
    db.commit()

    return {"success": True}

# --- Order Routes ---
@app.post("/api/orders")
async def place_order(data: schemas.OrderCreate, db: Session = Depends(get_db)):
    final_states = ['ชำระแล้ว', 'ลด 10%', 'ยกเลิก', 'ค้างชำระ', 'completed', 'cancelled']
    existing_order = db.query(models.TableSumOrder).filter(
        models.TableSumOrder.table_number == data.table_number,
        models.TableSumOrder.status.notin_(final_states)
    ).order_by(models.TableSumOrder.created_at.desc()).first()

    total_order_price = sum(item.price * item.qty for item in data.items)
    
    if not existing_order:
        # If no active order exists, we create one automatically
        existing_order = models.TableSumOrder(
            table_number=data.table_number, 
            total_amount=total_order_price,
            status="กำลังสั่ง",
            customer_name=f"Table {data.table_number}",
            session_token=data.security_key # Set the initial token from the scan
        )
        db.add(existing_order)
        db.flush()
        current_order_id = existing_order.sum_order_id
    else:
        # Security Check: Verify token
        if existing_order.session_token:
            if data.security_key and data.security_key != existing_order.session_token:
                raise HTTPException(status_code=403, detail="รหัสความปลอดภัยไม่ถูกต้อง กรุณาสแกน QR Code ใหม่")

        current_order_id = existing_order.sum_order_id
        existing_order.total_amount = Decimal(str(existing_order.total_amount)) + total_order_price
    
    for item in data.items:
        order_item = models.TableLogCus(
            sum_order_id=current_order_id,
            table_number=data.table_number,
            menu_id=item.id,
            quantity=item.qty,
            price_at_time=item.price
        )
        db.add(order_item)
    
    db.commit()
    return {"success": True, "order_id": current_order_id}

@app.get("/api/orders")
async def get_order_history(date_start: str, date_end: str, db: Session = Depends(get_db)):
    start = datetime.strptime(date_start, "%Y-%m-%d").date()
    end = datetime.strptime(date_end, "%Y-%m-%d").date()
    
    orders = db.query(models.TableSumOrder).filter(
        func.date(models.TableSumOrder.created_at) >= start,
        func.date(models.TableSumOrder.created_at) <= end
    ).order_by(models.TableSumOrder.created_at.desc()).all()
    
    total = sum(float(o.total_amount) for o in orders if o.status in ['ชำระแล้ว', 'ลด 10%'])
    
    result = []
    for o in orders:
        result.append({
            "id": o.sum_order_id,
            "table_number": str(o.table_number),
            "total_price": float(o.total_amount),
            "status": o.status,
            "note": o.note,
            "created_at": o.created_at
        })
        
    return {"orders": result, "total": total}

# --- Active Bills ---
@app.get("/api/active_bills")
async def get_active_bills(db: Session = Depends(get_db)):
    bills = db.query(models.TableSumOrder).filter(
        models.TableSumOrder.status.notin_(['ชำระแล้ว', 'ลด 10%', 'ยกเลิก', 'ค้างชำระ', 'completed', 'cancelled'])
    ).order_by(models.TableSumOrder.created_at.asc()).all()
    
    result = []
    for b in bills:
        result.append({
            "id": b.sum_order_id,
            "table_number": str(b.table_number),
            "total_price": float(b.total_amount),
            "status": b.status,
            "note": b.note,
            "session_token": b.session_token,
            "customer_name": b.customer_name,
            "created_at": b.created_at
        })
    return result

@app.post("/api/active_bills")
async def update_bill_status(data: schemas.StatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.TableSumOrder).filter(models.TableSumOrder.sum_order_id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    final_states = ['ชำระแล้ว', 'ค้างชำระ', 'ลด 10%']
    if data.status in final_states and order.status not in final_states:
        for item in order.items:
            if item.menu.category.type_name in ['เครื่องดื่ม', 'แอลกอฮอล์', 'มิ๊กเซอร์']:
                item.menu.stock_quantity -= item.quantity
                log = models.TableLogEmp(
                    menu_id=item.menu_id,
                    type='out',
                    amount=item.quantity,
                    note=f"Order #{order.sum_order_id} Status: {data.status}"
                )
                db.add(log)
    elif data.status == 'ยกเลิก' and order.status != 'ยกเลิก':
        for item in order.items:
            if item.menu.category.type_name in ['เครื่องดื่ม', 'แอลกอฮอล์', 'มิ๊กเซอร์']:
                # Just log the cancellation in stock history without changing quantity
                log = models.TableLogEmp(
                    menu_id=item.menu_id,
                    type='in', # or out, doesn't matter since amount is 0
                    amount=0,
                    note=f"ยกเลิกบิลโดย: {data.username or 'ไม่ระบุ'} | เหตุผล: {data.note}"
                )
                db.add(log)

    order.status = data.status
    if data.note:
        order.note = data.note
    if data.total_price is not None:
        order.total_amount = data.total_price
    db.commit()
    return {"success": True}

@app.get("/api/bill_items")
async def get_bill_items(order_id: int, db: Session = Depends(get_db)):
    items = db.query(models.TableLogCus).filter(models.TableLogCus.sum_order_id == order_id).all()
    result = []
    for item in items:
        result.append({
            "id": item.log_cus_id,
            "name": item.menu.menu_name,
            "quantity": item.quantity,
            "price_at_time": float(item.price_at_time),
            "category": item.menu.category.type_name
        })
    return result

@app.delete("/api/bill_items")
async def delete_bill_item(item_id: int, order_id: int, db: Session = Depends(get_db)):
    item = db.query(models.TableLogCus).filter(
        models.TableLogCus.log_cus_id == item_id, 
        models.TableLogCus.sum_order_id == order_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    order = db.query(models.TableSumOrder).filter(models.TableSumOrder.sum_order_id == order_id).first()
    if order:
        order.total_amount = float(order.total_amount) - (float(item.price_at_time) * item.quantity)
    
    db.delete(item)
    db.commit()
    return {"success": True}

@app.post("/api/edit_bill")
async def edit_bill(data: schemas.BillEditRequest, db: Session = Depends(get_db)):
    # 1. Verify credentials
    staff = db.query(models.Login).filter(models.Login.username == data.username).first()
    if not staff or (staff.password != data.password and not verify_password(data.password, staff.password)):
        raise HTTPException(status_code=401, detail="รหัสผ่านไม่ถูกต้อง")

    # 2. Get Order
    order = db.query(models.TableSumOrder).filter(models.TableSumOrder.sum_order_id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="ไม่พบออเดอร์")

    # 3. Update Items
    new_total = 0
    for item_data in data.items:
        order_item = db.query(models.TableLogCus).filter(models.TableLogCus.log_cus_id == item_data.id).first()
        if order_item:
            order_item.quantity = item_data.quantity
            new_total += float(order_item.price_at_time) * item_data.quantity
    
    # 4. Update Order
    order.total_amount = new_total
    order.status = 'แก้ไขบิล'
    
    timestamp = datetime.now().strftime("%H:%M")
    note_entry = f"[{timestamp}] แก้ไขโดย {staff.owner_name}: {data.reason}"
    if order.note:
        order.note = f"{order.note} | {note_entry}"
    else:
        order.note = note_entry

    db.commit()
    return {"success": True}

# --- Production (Kitchen/Bar) ---
@app.get("/api/production")
async def get_production(type: str, db: Session = Depends(get_db)):
    # Find category IDs based on type.
    # Assuming 'เครื่องดื่ม' is bar, rest is kitchen.
    drink_cat = db.query(models.TypeMenu).filter(models.TypeMenu.type_name == 'เครื่องดื่ม').first()
    drink_id = drink_cat.type_id if drink_cat else -1
    
    query = db.query(
        models.TableLogCus.log_cus_id.label('id'),
        models.TableLogCus.quantity,
        models.TableLogCus.status,
        models.TableLogCus.sum_order_id.label('order_id'),
        models.TableCategory.menu_name.label('name'),
        models.TypeMenu.type_name.label("category"),
        models.TableLogCus.table_number,
        models.TableLogCus.order_time
    ).join(models.TableCategory).join(models.TypeMenu).filter(
        models.TableLogCus.status != 'completed',
        models.TableLogCus.sum_order_id != None
    )
    
    if type == 'kitchen':
        query = query.filter(models.TableCategory.type_id != drink_id)
    else:
        query = query.filter(models.TableCategory.type_id == drink_id)

    items = query.order_by(models.TableLogCus.order_time.asc()).all()
    
    return [
        {
            'id': i.id, 
            'quantity': i.quantity, 
            'status': i.status, 
            'order_id': i.order_id,
            'name': i.name, 
            'category': i.category,
            'table_number': str(i.table_number), 
            'order_time': i.order_time
        } for i in items
    ]

@app.put("/api/production")
async def update_production_status(data: schemas.ProductionUpdate, db: Session = Depends(get_db)):
    item = db.query(models.TableLogCus).filter(models.TableLogCus.log_cus_id == data.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.status = data.status
    db.commit()
    return {"success": True}

# --- Dashboard Stats ---
@app.get("/api/dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()
    
    def get_sales_sum(query):
        val = query.scalar()
        return float(val) if val else 0.0

    today_sales = get_sales_sum(db.query(func.sum(models.TableSumOrder.total_amount)).filter(
        models.TableSumOrder.status.in_(['ชำระแล้ว', 'ลด 10%']),
        func.date(models.TableSumOrder.created_at) == today
    ))

    month_sales = get_sales_sum(db.query(func.sum(models.TableSumOrder.total_amount)).filter(
        models.TableSumOrder.status.in_(['ชำระแล้ว', 'ลด 10%']),
        func.extract('month', models.TableSumOrder.created_at) == today.month,
        func.extract('year', models.TableSumOrder.created_at) == today.year
    ))

    year_sales = get_sales_sum(db.query(func.sum(models.TableSumOrder.total_amount)).filter(
        models.TableSumOrder.status.in_(['ชำระแล้ว', 'ลด 10%']),
        func.extract('year', models.TableSumOrder.created_at) == today.year
    ))

    sales_data = db.query(
        models.TypeMenu.type_name.label("category_name"),
        func.sum(models.TableLogCus.quantity * models.TableLogCus.price_at_time).label("total_value")
    ).join(models.TableCategory, models.TableLogCus.menu_id == models.TableCategory.menu_id)\
     .join(models.TypeMenu, models.TableCategory.type_id == models.TypeMenu.type_id)\
     .join(models.TableSumOrder, models.TableLogCus.sum_order_id == models.TableSumOrder.sum_order_id)\
     .filter(models.TableSumOrder.status.in_(['ชำระแล้ว', 'ลด 10%']))\
     .group_by(models.TypeMenu.type_name).all()

    return {
        "today_sales": today_sales,
        "month_sales": month_sales,
        "year_sales": year_sales,
        "stock_chart": [
            {"category_name": r.category_name, "total_value": float(r.total_value)} 
            for r in sales_data
        ]
    }

# --- Employee Management ---
@app.get("/api/employees")
async def get_employees(db: Session = Depends(get_db)):
    users = db.query(models.Login).filter(models.Login.role.in_(['employee', 'cashier'])).all()
    return [{"id": u.user_id, "first_name": u.owner_name, "last_name": "", "nickname": u.nickname, "username": u.username, "role": u.role} for u in users]

@app.post("/api/employees")
async def add_employee(data: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    # Check if username exists
    if db.query(models.Login).filter(models.Login.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_pwd = hash_password(data.password)
    
    new_emp = models.Login(
        username=data.username,
        password=hashed_pwd,
        owner_name=f"{data.first_name} {data.last_name}".strip(),
        nickname=data.nickname,
        role=data.role if data.role in ['employee', 'cashier'] else 'employee'
    )
    db.add(new_emp)
    db.commit()
    return {"success": True}

@app.delete("/api/employees")
async def delete_employee(id: int, db: Session = Depends(get_db)):
    emp = db.query(models.Login).filter(models.Login.user_id == id, models.Login.role.in_(['employee', 'cashier'])).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()
    return {"success": True}

# --- Stock Management ---
@app.get("/api/stock")
async def get_stock(db: Session = Depends(get_db)):
    drink_cat = db.query(models.TypeMenu).filter(models.TypeMenu.type_name == 'เครื่องดื่ม').first()
    if not drink_cat: return []
    
    items = db.query(models.TableCategory).filter(models.TableCategory.type_id == drink_cat.type_id).all()
    return [{
        "id": i.menu_id,
        "name": i.menu_name,
        "price": float(i.price),
        "image_path": normalize_image_path(i.image_path),
        "category_name": drink_cat.type_name,
        "stock_quantity": i.stock_quantity,
        "low_stock_threshold": i.low_stock_threshold
    } for i in items]

@app.put("/api/stock")
async def update_stock_manual(id: int, data: schemas.StockManualUpdate, db: Session = Depends(get_db)):
    menu = db.query(models.TableCategory).filter(models.TableCategory.menu_id == id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    
    diff = data.stock_quantity - menu.stock_quantity
    menu.stock_quantity = data.stock_quantity
    
    # Log the change
    log = models.TableLogEmp(
        menu_id=id,
        user_id=data.user_id,
        type='in' if diff >= 0 else 'out',
        amount=abs(diff),
        note=data.note or "Manual update via Stock Management"
    )
    db.add(log)
    db.commit()
    return {"success": True}

@app.get("/api/stock_history")
async def get_stock_history(db: Session = Depends(get_db)):
    try:
        # Use joinedload or just rely on relationships
        logs = db.query(models.TableLogEmp).order_by(models.TableLogEmp.update_date.desc()).all()
        
        result = []
        for log in logs:
            # Use the relationship to get user info
            user_name = "System/Unknown"
            if log.user:
                user_name = log.user.nickname if log.user.nickname else log.user.owner_name
            elif log.user_id:
                # Fallback in case relationship fails but ID exists
                user = db.query(models.Login).filter(models.Login.user_id == log.user_id).first()
                if user: user_name = user.nickname if user.nickname else user.owner_name
                
            result.append({
                "id": log.log_emp_id,
                "menu_name": log.menu.menu_name if log.menu else "Unknown Item",
                "amount": log.amount,
                "type": log.type,
                "note": log.note,
                "user_name": user_name,
                "update_date": log.update_date.isoformat() if log.update_date else datetime.now().isoformat()
            })
        return result
    except Exception as e:
        print(f"Error in get_stock_history: {e}")
        return []

@app.post("/api/stock")
async def update_stock(data: schemas.StockUpdate, db: Session = Depends(get_db)):
    menu = db.query(models.TableCategory).filter(models.TableCategory.menu_id == data.id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    
    if data.action == 'add':
        menu.stock_quantity += data.amount
        log_type = 'in'
    elif data.action == 'subtract':
        menu.stock_quantity -= data.amount
        log_type = 'out'
    
    log = models.TableLogEmp(
        menu_id=data.id,
        type=log_type,
        amount=data.amount,
        note=f"Update via Python Backend ({data.action})"
    )
    db.add(log)
    db.commit()
    return {"success": True}

@app.get("/api/dashboard")
async def get_dashboard(db: Session = Depends(get_db)):
    from sqlalchemy import extract
    from datetime import datetime

    now = datetime.now()
    
    # Base query for completed orders
    base_sales_query = db.query(func.sum(models.TableSumOrder.total_amount)).filter(
        models.TableSumOrder.status.in_(['completed', 'ชำระแล้ว'])
    )

    # Today's sales
    today_sales = base_sales_query.filter(
        extract('year', models.TableSumOrder.created_at) == now.year,
        extract('month', models.TableSumOrder.created_at) == now.month,
        extract('day', models.TableSumOrder.created_at) == now.day
    ).scalar() or 0

    # Month's sales
    month_sales = base_sales_query.filter(
        extract('year', models.TableSumOrder.created_at) == now.year,
        extract('month', models.TableSumOrder.created_at) == now.month
    ).scalar() or 0

    # Year's sales
    year_sales = base_sales_query.filter(
        extract('year', models.TableSumOrder.created_at) == now.year
    ).scalar() or 0

    # Stock chart data
    stock_data = db.query(
        models.TypeMenu.type_name.label("category_name"),
        func.sum(models.TableCategory.stock_quantity).label("total_value")
    ).join(
        models.TableCategory, models.TypeMenu.type_id == models.TableCategory.type_id
    ).group_by(models.TypeMenu.type_name).all()

    stock_chart = [{"category_name": row.category_name, "total_value": float(row.total_value or 0)} for row in stock_data]

    return {
        "today_sales": float(today_sales),
        "month_sales": float(month_sales),
        "year_sales": float(year_sales),
        "stock_chart": stock_chart
    }

# --- SPA Routing Catch-all ---
# This must be the very last route
@app.get("/{rest_of_path:path}")
async def serve_frontend(rest_of_path: str):
    # 1. Check if it's an image request that missed the main route
    if any(ext in rest_of_path.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp', '.jfif']):
        filename = rest_of_path.split('/')[-1]
        img_path = UPLOAD_DIR / filename
        if img_path.is_file():
            return FileResponse(str(img_path))

    # 2. Check if the requested path is a file in the dist folder
    file_path = DIST_DIR / rest_of_path
    if file_path.is_file():
        return FileResponse(str(file_path))
    
    # 3. Otherwise, serve index.html for SPA routing
    index_path = DIST_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    
    raise HTTPException(status_code=404, detail="Not Found")
