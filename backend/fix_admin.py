import models, database
import bcrypt
from sqlalchemy.orm import Session

def check_users():
    db = Session(database.engine)
    users = db.query(models.Login).all()
    print("--- User List ---")
    for u in users:
        print(f"Username: {u.username}, Role: {u.role}, Password Hash: {u.password[:20]}...")
    
    # Check if admin/admin exists and is hashed
    admin = db.query(models.Login).filter(models.Login.username == 'admin').first()
    if not admin:
        print("\nAdmin user not found. Creating admin/admin...")
        hashed = bcrypt.hashpw('admin'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        new_admin = models.Login(
            username='admin',
            password=hashed,
            owner_name='Admin Owner',
            nickname='เจ้าของร้าน',
            role='owner'
        )
        db.add(new_admin)
        db.commit()
        print("Admin user created with hashed password.")
    else:
        print(f"\nAdmin found. Checking password 'admin'...")
        # If password is plain 'admin', hash it
        if admin.password == 'admin':
            print("Password is plain text. Hashing it...")
            hashed = bcrypt.hashpw('admin'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            admin.password = hashed
            db.commit()
            print("Password hashed.")
        else:
            try:
                match = bcrypt.checkpw('admin'.encode('utf-8'), admin.password.encode('utf-8'))
                print(f"Password 'admin' match: {match}")
            except:
                print("Password check failed (invalid hash). Resetting to 'admin'...")
                hashed = bcrypt.hashpw('admin'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                admin.password = hashed
                db.commit()
                print("Password reset and hashed.")

if __name__ == "__main__":
    check_users()
