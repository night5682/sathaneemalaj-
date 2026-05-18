import pymysql

try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='sathanimala',
        cursorclass=pymysql.cursors.DictCursor
    )

    with connection.cursor() as cursor:
        print("Altering login table role column...")
        # 1. Modify the role column to include 'cashier'
        cursor.execute("ALTER TABLE login MODIFY COLUMN role ENUM('owner', 'cashier', 'employee') NOT NULL DEFAULT 'employee'")
        print("Successfully updated role column enum to ('owner', 'cashier', 'employee')")
        
        # 2. Fix any user who got an empty role due to invalid enum previously
        cursor.execute("UPDATE login SET role = 'cashier' WHERE role = '' OR role IS NULL")
        print("Updated legacy users with empty/invalid roles to 'cashier'")

    connection.commit()
    print("Database modification successfully completed!")
except Exception as e:
    print(f"Error modifying database: {e}")
finally:
    if 'connection' in locals():
        connection.close()
