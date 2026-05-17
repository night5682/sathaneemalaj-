import sqlite3
import os

db_path = r"d:\web_pos\sathaneemalaj-\backend\pos_database.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Listing Tables ---")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
for t in tables:
    print(t[0])

print("\n--- Menu Image Paths ---")
try:
    cursor.execute("SELECT menu_id, menu_name, image_path FROM table_category")
    rows = cursor.fetchall()
    for row in rows:
        print(f"ID: {row[0]}, Name: {row[1]}, Path: {row[2]}")
except Exception as e:
    print(f"Error: {e}")

conn.close()
