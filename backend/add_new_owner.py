import models, database
import bcrypt
from sqlalchemy.orm import Session

def add_owner():
    db = Session(database.engine)
    
    username = "Sathaneemhala"
    password = "Stnml123456"
    name = "เจ้าของร้าน"
    nickname = "เจ้าของร้าน"
    role = "owner"
    
    # Check if user already exists
    user = db.query(models.Login).filter(models.Login.username == username).first()
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    if not user:
        print(f"Creating owner: {username}...")
        new_user = models.Login(
            username=username,
            password=hashed,
            owner_name=name,
            nickname=nickname,
            role=role
        )
        db.add(new_user)
        db.commit()
        print(f"Owner {username} created successfully!")
    else:
        print(f"Updating owner: {username}...")
        user.owner_name = name
        user.nickname = nickname
        user.role = role
        user.password = hashed
        db.commit()
        print(f"Owner {username} updated successfully!")

if __name__ == "__main__":
    add_owner()
