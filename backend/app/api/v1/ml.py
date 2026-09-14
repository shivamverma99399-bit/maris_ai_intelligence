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

@router.post("/predict-live")
async def predict_live_endpoint(
    file: UploadFile = File(..., description="Sentinel-1 SAR image (PNG, JPG, JPEG)")
):
    """
    Directly queries the live MARIS Oil Spill Segmentation model on Render.
    Trained on Sentinel-1 SAR Oil Spill Detection Dataset & SOS Segmentation Dataset.
    Returns oil probability, pixel counts, bounding box, centroid, and rendered mask/overlay URLs.
    """
    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read image file: {e}"
        )

    adapter = get_ml_adapter()
    detection = adapter.detect_spill(
        image_bytes=image_bytes,
        incident_id="SAR-LIVE-SCAN",
        origin_lat=18.868,
        origin_lon=72.132,
        pixel_res_meters=20.0
    )

    return {
        "status": "success",
        "model_version": detection.model_version,
        "confidence": detection.confidence,
        "area_km2": detection.area_km2,
        "perimeter_km": detection.perimeter_km,
        "elongation": detection.elongation,
        "centroid_lat": detection.centroid_lat,
        "centroid_lon": detection.centroid_lon,
        "polygon_geojson": detection.polygon_geojson,
        "mask_url": detection.mask_url,
        "overlay_url": detection.overlay_url,
        "raw_prediction": detection.raw_prediction,
        "datasets": [
            "https://www.kaggle.com/datasets/harikrishnacs/sentinel-1-sar-oil-spill-detection-dataset",
            "https://www.kaggle.com/datasets/bitsandlayers/sar-oil-spill-segmentation-dataset-sos"
        ]
    }
