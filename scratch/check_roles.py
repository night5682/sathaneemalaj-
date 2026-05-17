import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.abspath('.'))
from backend.database import SQLALCHEMY_DATABASE_URL
from backend import models

def check_roles():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    users = db.query(models.Login).all()
    print("Checking database users and roles:")
    for u in users:
        print(f"User: {u.username}, Role: {u.role}, Nickname: {u.nickname}")
    db.close()

if __name__ == "__main__":
    check_roles()
