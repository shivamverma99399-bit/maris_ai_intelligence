from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional
from app.core.config import settings
from app.services.ml_service import get_ml_adapter, SpillDetectionResult

router = APIRouter(prefix="/ml", tags=["Machine Learning Inference"])

@router.get("/info")
def get_ml_info():
    """Returns active ML model status, runtime engine, and inference configuration."""
    adapter = get_ml_adapter()
    return {
        "ml_mode": settings.ML_MODE,
        "model_path": settings.MODEL_PATH,
        "adapter_class": adapter.__class__.__name__,
        "pytorch_available": hasattr(adapter, "pytorch_model") and adapter.pytorch_model is not None,
        "onnx_available": hasattr(adapter, "onnx_session") and adapter.onnx_session is not None,
        "supported_formats": ["PNG", "JPEG", "TIFF", "GeoTIFF"],
        "default_pixel_resolution_meters": 20.0
    }

@router.post("/detect", response_model=SpillDetectionResult)
async def detect_spill_endpoint(
    file: Optional[UploadFile] = File(None, description="Satellite SAR image file (PNG, JPG, TIFF)"),
    incident_id: Optional[str] = Form(None, description="Associated incident ID"),
    origin_lat: Optional[float] = Form(None, description="Scene georeferencing top-left latitude"),
    origin_lon: Optional[float] = Form(None, description="Scene georeferencing top-left longitude"),
    pixel_res_meters: float = Form(20.0, description="Spatial pixel resolution in meters")
):
    """
    Runs SAR oil spill deep learning segmentation (PyTorch/ONNX U-Net) on uploaded satellite imagery.
    Returns georeferenced polygon and slick geometric features (area, perimeter, elongation).
    """
    image_bytes: Optional[bytes] = None
    if file is not None:
        try:
            image_bytes = await file.read()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to read uploaded image: {e}"
            )

    adapter = get_ml_adapter()
    detection = adapter.detect_spill(
        image_bytes=image_bytes,
        incident_id=incident_id,
        origin_lat=origin_lat,
        origin_lon=origin_lon,
        pixel_res_meters=pixel_res_meters
    )
    return detection
