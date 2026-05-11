import models, database
import bcrypt
from sqlalchemy.orm import Session

def setup_owners():
    db = Session(database.engine)
    
    owners = [
        {"username": "admin1", "name": "พี่เก๋", "nickname": "พี่เก๋"},
        {"username": "admin2", "name": "พี่ใหญ่", "nickname": "พี่ใหญ่"}
    ]
    
    for owner_data in owners:
        user = db.query(models.Login).filter(models.Login.username == owner_data["username"]).first()
        hashed = bcrypt.hashpw(owner_data["username"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        if not user:
            print(f"Creating owner: {owner_data['username']}...")
            new_user = models.Login(
                username=owner_data["username"],
                password=hashed,
                owner_name=owner_data["name"],
                nickname=owner_data["nickname"],
                role='owner'
            )
            db.add(new_user)
        else:
            print(f"Updating owner: {owner_data['username']}...")
            user.owner_name = owner_data["name"]
            user.nickname = owner_data["nickname"]
            user.role = 'owner'
            # Reset password to username for convenience
            user.password = hashed
            
    # Optional: Delete the generic 'admin' account
    admin = db.query(models.Login).filter(models.Login.username == 'admin').first()
    if admin:
        print("Deleting generic 'admin' account...")
        db.delete(admin)
        
    db.commit()
    print("Owner accounts setup completed.")

if __name__ == "__main__":
    setup_owners()
