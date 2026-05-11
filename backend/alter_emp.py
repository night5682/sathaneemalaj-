import pymysql
conn = pymysql.connect(host='localhost', user='root', password='', database='sathanimala')
cursor = conn.cursor()
try:
    cursor.execute("ALTER TABLE table_log_emp ADD COLUMN type ENUM('in', 'out') NOT NULL DEFAULT 'out'")
    cursor.execute("ALTER TABLE table_log_emp ADD COLUMN note VARCHAR(255) NULL")
except Exception as e:
    print(e)
conn.commit()
conn.close()
