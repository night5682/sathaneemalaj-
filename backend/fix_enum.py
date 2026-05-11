import pymysql

try:
    # Connect to MySQL
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='sathanimala'
    )
    
    with connection.cursor() as cursor:
        # Update the enum column in orders table
        print("Updating status column in orders table...")
        sql = """
        ALTER TABLE orders MODIFY COLUMN status ENUM(
            'ชำระแล้ว', 'ค้างชำระ', 'ยกเลิก', 'แก้ไขบิล', 'ลด 10%', 
            'pending', 'cooking', 'served', 'completed', 'cancelled'
        ) DEFAULT 'pending';
        """
        cursor.execute(sql)
        connection.commit()
        print("Successfully updated database schema.")

except Exception as e:
    print(f"Error updating database: {e}")
finally:
    if 'connection' in locals():
        connection.close()
