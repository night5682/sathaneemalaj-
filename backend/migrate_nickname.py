from sqlalchemy import text
from database import engine

def migrate():
    try:
        with engine.connect() as connection:
            print("Checking for 'nickname' column in 'login' table...")
            result = connection.execute(text("SHOW COLUMNS FROM login LIKE 'nickname'")).fetchone()
            
            if not result:
                print("Adding 'nickname' column...")
                connection.execute(text("ALTER TABLE login ADD COLUMN nickname VARCHAR(50) AFTER owner_name"))
                connection.commit()
                print("Column 'nickname' added successfully.")
            else:
                print("Column 'nickname' already exists.")
            
        print("Migration completed.")
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
