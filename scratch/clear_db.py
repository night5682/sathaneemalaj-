import sys
import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker

# Add the current directory to path so we can import backend modules
sys.path.append(os.path.abspath('.'))

from backend.database import SQLALCHEMY_DATABASE_URL
from backend import models

def clear_test_data():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    print("Starting database cleanup...")
    
    try:
        # 1. Clear Order Logs and Summaries (Transaction data)
        print("Clearing order history and logs...")
        db.query(models.TableLogCus).delete()
        db.query(models.TableSumOrder).delete()
        db.query(models.TableLogEmp).delete()
        
        # 2. Clear Menu data (Master data)
        print("Clearing menus and categories...")
        db.query(models.TableCategory).delete()
        db.query(models.TypeMenu).delete()
        
        # We do NOT touch models.Login
        
        db.commit()
        print("Cleanup successful! Only login data remains.")
        
    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_test_data()
