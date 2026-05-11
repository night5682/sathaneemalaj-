import pymysql
from sqlalchemy import create_engine, text

# Database connection details (matching your backend)
DB_URL = "mysql+pymysql://root:@localhost/sathanimala"

def migrate():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("Checking for 'note' column in 'orders' table...")
        try:
            # Check if column exists
            result = conn.execute(text("SHOW COLUMNS FROM orders LIKE 'note'"))
            # Update status enum to include 'แก้ไขบิล'
            print("Updating status enum...")
            conn.execute(text("ALTER TABLE orders MODIFY COLUMN status ENUM('ชำระแล้ว', 'ค้างชำระ', 'ยกเลิก', 'แก้ไขบิล', 'pending', 'cooking', 'served', 'completed', 'cancelled') DEFAULT 'pending'"))
            conn.execute(text("COMMIT"))
            print("Status enum updated.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
