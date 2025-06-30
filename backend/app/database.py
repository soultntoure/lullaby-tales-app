import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables for database connection
from dotenv import load_dotenv
load_dotenv()

# Database connection details from environment variables
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "lullabytales")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_NAME = os.getenv("DB_NAME", "lullabytales_db")

# Construct the PostgreSQL connection URL
# Example: postgresql://user:password@host:port/dbname
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create the SQLAlchemy engine
# echo=True will log all SQL statements, useful for debugging
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True # Ensures connections are still alive
)

# Create a SessionLocal class to get a database session
# autocommit=False ensures transactions are managed manually (commit/rollback)
# autoflush=False prevents flushing pending changes before a commit
session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy declarative models
Base = declarative_base()

# Dependency for FastAPI routes to get a database session
def get_db():
    db = session_local()
    try:
        yield db
    finally:
        db.close()
