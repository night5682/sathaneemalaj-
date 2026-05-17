import sqlite3
conn = sqlite3.connect('backend/pos_database.db')
cursor = conn.cursor()
cursor.execute("SELECT menu_name, image_path FROM table_category LIMIT 10")
for row in cursor.fetchall():
    print(f"{row[0]}: {row[1]}")
conn.close()
