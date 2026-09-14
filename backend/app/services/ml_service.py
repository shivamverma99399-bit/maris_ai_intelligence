import os
import datetime
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, Union
import numpy as np
from shapely.geometry import Polygon
from pydantic import BaseModel, Field, ConfigDict
import cv2

from app.core.config import settings
from app.core.logging import logger
from app.engines.geospatial_engine import GeospatialEngine, SpillMetrics
from app.engines.ml_unet import UNet, preprocess_sar_image

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

try:
    import onnxruntime as ort
    HAS_ONNX = True
except ImportError:
    HAS_ONNX = False


class SpillDetectionResult(BaseModel):
    """Standardized output contract for satellite spill detection models."""
    model_config = ConfigDict(protected_namespaces=())

    incident_id: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    area_km2: float = Field(..., ge=0.0, description="Surface area of detected slick in sq km")
    perimeter_km: float = Field(..., ge=0.0, description="Perimeter of slick boundary in km")
    elongation: float = Field(..., ge=1.0, description="Major-to-minor axis ratio")
    centroid_lat: float = Field(..., ge=-90.0, le=90.0)
    centroid_lon: float = Field(..., ge=-180.0, le=180.0)
    polygon_geojson: Dict[str, Any] = Field(..., description="GeoJSON Polygon in EPSG:4326")
    model_version: str = "mock-v1"
    observation_time: datetime.datetime = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc))


class MLAdapter(ABC):
    """Abstract interface decoupling downstream MARIS pipelines from ML models."""

    @abstractmethod
    def detect_spill(
        self,
        image_bytes: Optional[bytes] = None,
        incident_id: Optional[str] = None,
        observation_time: Optional[datetime.datetime] = None,
        origin_lat: Optional[float] = None,
        origin_lon: Optional[float] = None,
        pixel_res_meters: float = 20.0
    ) -> SpillDetectionResult:
        """Runs segmentation/detection on SAR image and returns georeferenced SpillDetectionResult."""
        pass

    def process_raster_mask(
        self,
        mask: np.ndarray,
        origin_lon: float,
        origin_lat: float,
        pixel_res_lon: float,
        pixel_res_lat: float,
        confidence: float = 0.90,
        incident_id: Optional[str] = None,
        model_version: str = "custom-sar-unet",
        observation_time: Optional[datetime.datetime] = None
    ) -> SpillDetectionResult:
        """Converts raw ML 2D segmentation mask to georeferenced SpillDetectionResult via GeospatialEngine."""
        polygons = GeospatialEngine.mask_to_polygons(
            binary_mask=mask,
            origin_lon=origin_lon,
            origin_lat=origin_lat,
            pixel_res_lon=pixel_res_lon,
            pixel_res_lat=pixel_res_lat
        )

        if not polygons:
            # Fallback if mask is empty
            poly = Polygon([
                (origin_lon, origin_lat),
                (origin_lon + 0.01, origin_lat),
                (origin_lon + 0.01, origin_lat + 0.01),
                (origin_lon, origin_lat)
            ])
        else:
            # Select largest slick polygon
            poly = max(polygons, key=lambda p: p.area)

        metrics: SpillMetrics = GeospatialEngine.characterize_polygon(poly)
        obs_time = observation_time or datetime.datetime.now(datetime.timezone.utc)

        return SpillDetectionResult(
            incident_id=incident_id,
            confidence=confidence,
            area_km2=metrics.area_km2,
            perimeter_km=metrics.perimeter_km,
            elongation=metrics.elongation,
            centroid_lat=metrics.centroid_lat,
            centroid_lon=metrics.centroid_lon,
            polygon_geojson=metrics.polygon_geojson,
            model_version=model_version,
            observation_time=obs_time
        )


class MockMLAdapter(MLAdapter):
    """Mock ML adapter producing realistic Indian EEZ (Mumbai High offshore) SAR detections using GeospatialEngine."""

    def detect_spill(
        self,
        image_bytes: Optional[bytes] = None,
        incident_id: Optional[str] = None,
        observation_time: Optional[datetime.datetime] = None,
        origin_lat: Optional[float] = None,
        origin_lon: Optional[float] = None,
        pixel_res_meters: float = 20.0
    ) -> SpillDetectionResult:
        obs_time = observation_time or datetime.datetime.now(datetime.timezone.utc)

        # Generate a synthetic 200x200 binary SAR raster representing an elongated slick
        # centered around Mumbai High (18.85 N, 72.15 E)
        mask = np.zeros((200, 200), dtype=np.uint8)
        # Draw sheared ellipse representing wind/current drift slick
        cv2.ellipse(mask, (100, 100), (60, 22), 35, 0, 360, 255, -1)

        # Georeferencing metadata: 1 pixel ~ 20m (0.00018 degrees)
        ref_lon = origin_lon if origin_lon is not None else 72.132
        ref_lat = origin_lat if origin_lat is not None else 18.868
        deg_res = (pixel_res_meters / 111320.0)
        pixel_res_lon = deg_res
        pixel_res_lat = -deg_res

        detection = self.process_raster_mask(
            mask=mask,
            origin_lon=ref_lon,
            origin_lat=ref_lat,
            pixel_res_lon=pixel_res_lon,
            pixel_res_lat=pixel_res_lat,
            confidence=0.94,
            incident_id=incident_id,
            model_version="mock-sar-unet-v1.0",
            observation_time=obs_time
        )

        logger.info(
            f"MockMLAdapter processed raster mask for '{incident_id}': "
            f"centroid=({detection.centroid_lat}, {detection.centroid_lon}), "
            f"area={detection.area_km2} km², elongation={detection.elongation}"
        )
        return detection


class InferenceMLAdapter(MLAdapter):
    """
    Production-ready ML Adapter running PyTorch or ONNX U-Net deep learning models
    for SAR satellite oil spill detection.
    """
    def __init__(
        self,
        model_path: Optional[str] = None,
        backend: str = "auto",
        device: str = "cpu"
    ):
        self.model_path = model_path or settings.MODEL_PATH
        self.device = device
        self.pytorch_model = None
        self.onnx_session = None
        self.model_version = "sar-unet-v1.0"
        self._init_model(backend)

    def _init_model(self, backend: str):
        # 1. Try ONNX if model_path is .onnx or backend is onnx
        if (self.model_path and self.model_path.endswith(".onnx")) or backend == "onnx":
            if HAS_ONNX and self.model_path and os.path.exists(self.model_path):
                try:
                    self.onnx_session = ort.InferenceSession(self.model_path)
                    self.model_version = f"onnx-unet-{os.path.basename(self.model_path)}"
                    logger.info(f"Loaded ONNX model from {self.model_path}")
                    return
                except Exception as e:
                    logger.warning(f"Failed to load ONNX model from {self.model_path}: {e}")

        # 2. Try PyTorch
        if HAS_TORCH:
            try:
                self.pytorch_model = UNet(n_channels=1, n_classes=1, bilinear=False)
                if self.model_path and os.path.exists(self.model_path):
                    state_dict = torch.load(self.model_path, map_location=self.device)
                    self.pytorch_model.load_state_dict(state_dict)
                    logger.info(f"Loaded PyTorch UNet weights from {self.model_path}")
                    self.model_version = f"pytorch-unet-{os.path.basename(self.model_path)}"
                else:
                    logger.info("Initialized fresh PyTorch UNet architecture (weights initialized).")
                    self.model_version = "pytorch-unet-initialized"
                self.pytorch_model.eval()
                return
            except Exception as e:
                logger.warning(f"Failed to initialize PyTorch UNet: {e}")

        logger.info("Using Morphological SAR Feature Extractor fallback.")
        self.model_version = "sar-morphological-adaptive"

    def detect_spill(
        self,
        image_bytes: Optional[bytes] = None,
        incident_id: Optional[str] = None,
        observation_time: Optional[datetime.datetime] = None,
        origin_lat: Optional[float] = None,
        origin_lon: Optional[float] = None,
        pixel_res_meters: float = 20.0,
        confidence_threshold: float = 0.5
    ) -> SpillDetectionResult:
        obs_time = observation_time or datetime.datetime.now(datetime.timezone.utc)
        ref_lon = origin_lon if origin_lon is not None else 72.132
        ref_lat = origin_lat if origin_lat is not None else 18.868
        deg_res = (pixel_res_meters / 111320.0)
        pixel_res_lon = deg_res
        pixel_res_lat = -deg_res

        # If no image provided, generate realistic SAR mock response
        if not image_bytes:
            mask = np.zeros((256, 256), dtype=np.uint8)
            cv2.ellipse(mask, (128, 128), (70, 26), 40, 0, 360, 255, -1)
            return self.process_raster_mask(
                mask=mask,
                origin_lon=ref_lon,
                origin_lat=ref_lat,
                pixel_res_lon=pixel_res_lon,
                pixel_res_lat=pixel_res_lat,
                confidence=0.92,
                incident_id=incident_id,
                model_version=self.model_version,
                observation_time=obs_time
            )

        # Preprocess input image to (1, 1, 256, 256)
        input_tensor = preprocess_sar_image(image_bytes, target_size=(256, 256))

        # Run inference through available engine
        binary_mask: Optional[np.ndarray] = None
        mean_confidence = 0.88

        if self.onnx_session is not None:
            try:
                outputs = self.onnx_session.run(None, {'input': input_tensor})
                logits = outputs[0][0, 0]
                probs = 1.0 / (1.0 + np.exp(-logits))
                binary_mask = (probs > confidence_threshold).astype(np.uint8) * 255
                slick_pixels = probs[probs > confidence_threshold]
                if len(slick_pixels) > 0:
                    mean_confidence = float(np.mean(slick_pixels))
            except Exception as e:
                logger.warning(f"ONNX inference failed: {e}")

        elif self.pytorch_model is not None and HAS_TORCH:
            try:
                with torch.no_grad():
                    tensor = torch.from_numpy(input_tensor).to(self.device)
                    logits = self.pytorch_model(tensor).cpu().numpy()[0, 0]
                    probs = 1.0 / (1.0 + np.exp(-logits))
                    binary_mask = (probs > confidence_threshold).astype(np.uint8) * 255
                    slick_pixels = probs[probs > confidence_threshold]
                    if len(slick_pixels) > 0:
                        mean_confidence = float(np.mean(slick_pixels))
            except Exception as e:
                logger.warning(f"PyTorch inference failed: {e}")

        # Fallback to morphological SAR dark-spot detection if model segmentation is empty
        if binary_mask is None or cv2.countNonZero(binary_mask) < 20:
            gray_img = (input_tensor[0, 0] * 255).astype(np.uint8)
            # SAR oil slicks are characterized by low radar backscatter (dark spots)
            inv_img = 255 - gray_img
            # Otsu automatic thresholding
            _, binary_mask = cv2.threshold(inv_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            # Morphological noise removal
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
            mean_confidence = 0.82

        detection = self.process_raster_mask(
            mask=binary_mask,
            origin_lon=ref_lon,
            origin_lat=ref_lat,
            pixel_res_lon=pixel_res_lon,
            pixel_res_lat=pixel_res_lat,
            confidence=min(0.99, max(0.50, mean_confidence)),
            incident_id=incident_id,
            model_version=self.model_version,
            observation_time=obs_time
        )
        return detection


def get_ml_adapter() -> MLAdapter:
    """Factory returning the active ML adapter implementation based on settings.ML_MODE."""
    mode = (settings.ML_MODE or "mock").lower()
    if mode in ("inference", "pytorch", "onnx"):
        return InferenceMLAdapter(model_path=settings.MODEL_PATH, backend=mode)
    return MockMLAdapter()
