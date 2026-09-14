import logging
import sys

def setup_logging(log_level: str = "INFO") -> logging.Logger:
    """Configures structured logging for MARIS services."""
    log_format = (
        "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
    )
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger("maris")

logger = setup_logging()
