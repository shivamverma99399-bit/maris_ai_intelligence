from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # General metadata
    PROJECT_NAME: str = "MARIS — Maritime AI Intelligence System"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", description="Environment: development, testing, production")
    DEBUG: bool = True

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database (PostgreSQL + PostGIS)
    DATABASE_URL: Optional[str] = None
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "maris_db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_TIMEOUT_SECONDS: int = 5

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """Computes the primary SQLAlchemy connection URI."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # ML Adapter configuration
    ML_MODE: str = "mock"  # "mock" or "inference"
    MODEL_PATH: Optional[str] = None

    # Oceanographic & Drift configuration
    OCEAN_DATA_PROVIDER: str = "cached"  # "cached", "era5", "copernicus"
    OPENDRIFT_NUM_PARTICLES: int = 500
    OPENDRIFT_DURATION_HOURS: int = 24

settings = Settings()
