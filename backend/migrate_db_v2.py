import pymysql

def migrate():
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='sathanimala',
        cursorclass=pymysql.cursors.DictCursor
    )

    try:
        with connection.cursor() as cursor:
            # 1. Update `login`
            print("Updating login table...")
            try:
                cursor.execute("ALTER TABLE login ADD COLUMN role ENUM('owner', 'employee') NOT NULL DEFAULT 'employee'")
            except Exception as e:
                print(f"login role column might already exist: {e}")

            # 2. Update `table_category`
            print("Updating table_category table...")
            try:
                cursor.execute("ALTER TABLE table_category ADD COLUMN image_path VARCHAR(255) DEFAULT 'default.jpg'")
                cursor.execute("ALTER TABLE table_category ADD COLUMN stock_quantity INT DEFAULT 0")
                cursor.execute("ALTER TABLE table_category ADD COLUMN is_active BOOLEAN DEFAULT TRUE")
                cursor.execute("ALTER TABLE table_category ADD COLUMN is_recommended BOOLEAN DEFAULT FALSE")
                cursor.execute("ALTER TABLE table_category ADD COLUMN low_stock_threshold INT DEFAULT 5")
                cursor.execute("ALTER TABLE table_category ADD COLUMN cost DECIMAL(10,2) DEFAULT 0.00")
            except Exception as e:
                print(f"table_category columns might already exist: {e}")

            # 3. Update `table_sum_order`
            print("Updating table_sum_order table...")
            try:
                cursor.execute("ALTER TABLE table_sum_order ADD COLUMN status VARCHAR(50) DEFAULT 'pending'")
                cursor.execute("ALTER TABLE table_sum_order ADD COLUMN note TEXT NULL")
            except Exception as e:
                print(f"table_sum_order columns might already exist: {e}")

            # 4. Update `table_log_cus`
            print("Updating table_log_cus table...")
            try:
                cursor.execute("ALTER TABLE table_log_cus ADD COLUMN status VARCHAR(50) DEFAULT 'pending'")
                cursor.execute("ALTER TABLE table_log_cus ADD COLUMN sum_order_id INT NULL")
                cursor.execute("ALTER TABLE table_log_cus ADD CONSTRAINT fk_sum_order FOREIGN KEY (sum_order_id) REFERENCES table_sum_order(sum_order_id) ON DELETE CASCADE")
                cursor.execute("ALTER TABLE table_log_cus ADD COLUMN price_at_time DECIMAL(10,2) DEFAULT 0.00")
            except Exception as e:
                print(f"table_log_cus columns might already exist: {e}")

            # Also, seed `type_menu` according to new requirements if it's empty
            cursor.execute("SELECT COUNT(*) as count FROM type_menu")
            result = cursor.fetchone()
            if result['count'] == 0:
                print("Seeding type_menu...")
                categories = ['เครื่องดื่ม', 'เมนูทอด', 'เมนูต้ม', 'เมนูยำ', 'เมนูทานเล่น', 'อาหารจานเดียว', 'หม่าล่า']
                for cat in categories:
                    cursor.execute("INSERT INTO type_menu (type_name) VALUES (%s)", (cat,))

        connection.commit()
        print("Migration complete!")
    finally:
        connection.close()

if __name__ == "__main__":
    migrate()
