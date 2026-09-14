from typing import Generator, Tuple, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings
from app.core.logging import logger

Base = declarative_base()

def get_engine(db_uri: Optional[str] = None):
    """Creates an engine with appropriate pooling and timeout arguments."""
    uri = db_uri or settings.SQLALCHEMY_DATABASE_URI
    connect_args = {}
    
    if uri.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        return create_engine(uri, connect_args=connect_args)
    
    # PostgreSQL configuration
    return create_engine(
        uri,
        pool_pre_ping=True,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        connect_args={"connect_timeout": settings.DB_TIMEOUT_SECONDS}
    )

try:
    engine = get_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.warning(f"Database engine initialization deferred: {e}")
    engine = None
    SessionLocal = None

def check_db_connection() -> Tuple[bool, str]:
    """Tests the database connection by executing a lightweight SELECT 1 query."""
    if engine is None:
        return False, "Database engine is not initialized."
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, "Database connection active and responding."
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"

def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency providing transactional database sessions."""
    if SessionLocal is None:
        raise RuntimeError("Database engine is not initialized.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
