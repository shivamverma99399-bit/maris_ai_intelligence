from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.api.v1 import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern lifespan handler for startup and shutdown events."""
    logger.info(f"Starting {settings.PROJECT_NAME} backend in {settings.ENVIRONMENT} mode...")
    try:
        from app.core.database import engine
        from app.models import init_db
        if engine is not None:
            init_db(engine)
            logger.info("Database schemas verified/initialized successfully.")
    except Exception as e:
        logger.warning(f"Database schema auto-initialization deferred: {e}")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME} backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="MARIS — Maritime AI Intelligence System API (NTRO PS-26143)",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS middleware for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register v1 API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    """Root endpoint providing MARIS platform status and documentation links."""
    return {
        "title": settings.PROJECT_NAME,
        "version": "0.1.0",
        "status": "online",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
