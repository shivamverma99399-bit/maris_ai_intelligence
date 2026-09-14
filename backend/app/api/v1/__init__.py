from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import check_db_connection
from app.api.v1.incidents import router as incidents_router
from app.api.v1.spills import router as spills_router
from app.api.v1.environment import router as environment_router
from app.api.v1.drift import router as drift_router
from app.api.v1.origin import router as origin_router
from app.api.v1.ais import router as ais_router
from app.api.v1.candidates import router as candidates_router
from app.api.v1.ml import router as ml_router
from app.api.v1.counterfactual import router as counterfactual_router

api_router = APIRouter()

# Register sub-routers
api_router.include_router(incidents_router)
api_router.include_router(spills_router)
api_router.include_router(environment_router)
api_router.include_router(drift_router)
api_router.include_router(origin_router)
api_router.include_router(ais_router)
api_router.include_router(candidates_router)
api_router.include_router(ml_router)
api_router.include_router(counterfactual_router)

@api_router.get("/health", tags=["System"])
def health_check():
    """Returns application liveness status."""
    return {
        "status": "healthy",
        "service": "MARIS API",
        "version": "0.1.0",
        "system": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }

@api_router.get("/health/db", tags=["System"])
def database_health_check():
    """Checks database readiness and connectivity."""
    is_connected, message = check_db_connection()
    status_code = status.HTTP_200_OK if is_connected else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content={
            "database_status": "connected" if is_connected else "disconnected",
            "message": message,
            "host": settings.POSTGRES_SERVER if not settings.DATABASE_URL else "configured_url",
            "database": settings.POSTGRES_DB
        }
    )

@api_router.get("/config", tags=["System"])
def system_configuration():
    """Exposes safe, non-sensitive runtime parameters for investigation UI."""
    return {
        "project_name": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "ml_mode": settings.ML_MODE,
        "ocean_data_provider": settings.OCEAN_DATA_PROVIDER,
        "opendrift_particles": settings.OPENDRIFT_NUM_PARTICLES,
        "opendrift_duration_hours": settings.OPENDRIFT_DURATION_HOURS
    }
