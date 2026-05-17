from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Enum, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
try:
    from .database import Base
except ImportError:
    from database import Base

class Login(Base):
    __tablename__ = "login"
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    owner_name = Column(String(100), nullable=False)
    nickname = Column(String(50), nullable=True)
    role = Column(Enum('owner', 'cashier', 'employee'), nullable=False, default='employee')

class TypeMenu(Base):
    __tablename__ = "type_menu"
    type_id = Column(Integer, primary_key=True, index=True)
    type_name = Column(String(50), nullable=False)
    
    menus = relationship("TableCategory", back_populates="category")

class TableCategory(Base):
    __tablename__ = "table_category"
    menu_id = Column(Integer, primary_key=True, index=True)
    menu_name = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    type_id = Column(Integer, ForeignKey("type_menu.type_id"))
    
    # Custom added columns for POS operations
    image_path = Column(String(255), default="default.jpg")
    stock_quantity = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_recommended = Column(Boolean, default=False)
    low_stock_threshold = Column(Integer, default=5)
    cost = Column(Numeric(10, 2), default=0.00)

    category = relationship("TypeMenu", back_populates="menus")

class TableActivityLog(Base):
    __tablename__ = "table_activity_log"
    
    log_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    table_number = Column(String(50), nullable=False)
    session_token = Column(String(100), nullable=False)
    order_url = Column(Text, nullable=True)

    user_id = Column(Integer, nullable=True)
    username = Column(String(100), nullable=True)
    owner_name = Column(String(255), nullable=True)

    action = Column(String(50), default="open_table")
    created_at = Column(DateTime, server_default=func.now())
    
class TableSumOrder(Base):
    __tablename__ = "table_sum_order"
    sum_order_id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String(50), nullable=False) # Changed from Integer to String to support custom names
    total_amount = Column(Numeric(10, 2), default=0.00)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Custom added columns
    status = Column(String(50), default='pending')
    note = Column(Text, nullable=True)
    customer_name = Column(String(100), nullable=True)
    session_token = Column(String(100), nullable=True)
    reprint_count = Column(Integer, default=0)
    
    items = relationship("TableLogCus", back_populates="order")

class SpecialTable(Base):
    __tablename__ = "special_tables"
    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TableLogCus(Base):
    __tablename__ = "table_log_cus"
    log_cus_id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String(50), nullable=False)
    menu_id = Column(Integer, ForeignKey("table_category.menu_id"))
    quantity = Column(Integer, nullable=False)
    order_time = Column(DateTime(timezone=True), server_default=func.now())
    
    # Custom added columns
    status = Column(String(50), default='pending')
    sum_order_id = Column(Integer, ForeignKey("table_sum_order.sum_order_id"))
    price_at_time = Column(Numeric(10, 2), default=0.00)

    order = relationship("TableSumOrder", back_populates="items")
    menu = relationship("TableCategory")

class TableLogEmp(Base):
    __tablename__ = "table_log_emp"
    log_emp_id = Column(Integer, primary_key=True, index=True)
    menu_id = Column(Integer, ForeignKey("table_category.menu_id"))
    amount = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("login.user_id"))
    update_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Assuming this acts as StockLogs
    type = Column(Enum('in', 'out'), nullable=False, default='out')
    note = Column(String(255), nullable=True)

    menu = relationship("TableCategory")
    user = relationship("Login")

