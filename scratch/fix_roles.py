import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.abspath('.'))
from backend.database import SQLALCHEMY_DATABASE_URL
from backend import models

def fix_empty_roles():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    # Update users with empty or null roles to 'employee'
    updated_count = db.query(models.Login).filter(
        (models.Login.role == '') | (models.Login.role == None)
    ).update({models.Login.role: 'employee'}, synchronize_session=False)
    
    db.commit()
    print(f"Fixed {updated_count} users with empty roles.")
    db.close()

if __name__ == "__main__":
    fix_empty_roles()
