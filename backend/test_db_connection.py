import pymysql
from sqlalchemy import create_engine

SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost/sathanimala"

try:
    print(f"Attempting to connect to {SQLALCHEMY_DATABASE_URL}...")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    connection = engine.connect()
    print("Successfully connected to the database!")
    connection.close()
except Exception as e:
    print(f"Error connecting to the database: {e}")
    
    print("\nAttempting to connect to MySQL server without database name...")
    try:
        engine_no_db = create_engine("mysql+pymysql://root:@localhost")
        connection_no_db = engine_no_db.connect()
        print("Successfully connected to MySQL server!")
        
        print("Checking if database 'sathanimala' exists...")
        result = connection_no_db.execute("SHOW DATABASES LIKE 'sathanimala'")
        if result.fetchone():
            print("Database 'sathanimala' exists.")
        else:
            print("Database 'sathanimala' does NOT exist. You may need to create it.")
        connection_no_db.close()
    except Exception as e2:
        print(f"Error connecting to MySQL server: {e2}")
        print("\nPossible causes:")
        print("1. MySQL service (XAMPP) is not running.")
        print("2. The 'root' user has a password set.")
        print("3. PyMySQL is not installed in the current environment.")
