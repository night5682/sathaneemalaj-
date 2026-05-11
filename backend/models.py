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
    role = Column(Enum('owner', 'employee'), nullable=False, default='employee')

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

class TableSumOrder(Base):
    __tablename__ = "table_sum_order"
    sum_order_id = Column(Integer, primary_key=True, index=True)
    table_number = Column(Integer, nullable=False) # In SQL it's int(11), previously was string
    total_amount = Column(Numeric(10, 2), default=0.00)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Custom added columns
    status = Column(String(50), default='pending')
    note = Column(Text, nullable=True)
    
    items = relationship("TableLogCus", back_populates="order")

class TableLogCus(Base):
    __tablename__ = "table_log_cus"
    log_cus_id = Column(Integer, primary_key=True, index=True)
    table_number = Column(Integer, nullable=False)
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

