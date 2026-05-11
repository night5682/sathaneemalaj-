from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL for MySQL (XAMPP)
# Format: mysql+pymysql://user:password@host/dbname
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost/sathanimala"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # pool_pre_ping=True is useful for long-lived connections
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
