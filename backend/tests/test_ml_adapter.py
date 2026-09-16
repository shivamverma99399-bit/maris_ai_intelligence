import io
import os
import tempfile
import numpy as np
import pytest
from PIL import Image
torch = pytest.importorskip("torch", reason="PyTorch optional in lightweight production deployment")

from app.engines.ml_unet import UNet, preprocess_sar_image, export_unet_to_onnx
from app.services.ml_service import MockMLAdapter, InferenceMLAdapter, get_ml_adapter, SpillDetectionResult
from app.core.config import settings

def test_unet_forward_pass():
    """Validates PyTorch UNet model architecture forward pass."""
    model = UNet(n_channels=1, n_classes=1, bilinear=False)
    model.eval()

    dummy_input = torch.randn(1, 1, 128, 128)
    with torch.no_grad():
        output = model(dummy_input)

    assert output.shape == (1, 1, 128, 128)
    assert not torch.isnan(output).any()


def test_unet_onnx_export_and_inference():
    """Validates ONNX model export and ONNX Runtime execution."""
    import gc
    import shutil
    import onnxruntime as ort

    model = UNet(n_channels=1, n_classes=1, bilinear=False)
    model.eval()

    tmpdir = tempfile.mkdtemp()
    try:
        onnx_path = os.path.join(tmpdir, "test_unet.onnx")
        export_unet_to_onnx(model, onnx_path, input_shape=(1, 1, 64, 64))

        assert os.path.exists(onnx_path)
        assert os.path.getsize(onnx_path) > 1000

        # Load session and test inference
        session = ort.InferenceSession(onnx_path)
        dummy_input = np.random.randn(1, 1, 64, 64).astype(np.float32)
        outputs = session.run(None, {"input": dummy_input})

        assert len(outputs) == 1
        assert outputs[0].shape == (1, 1, 64, 64)

        del session
        gc.collect()
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


def test_preprocess_sar_image():
    """Tests preprocessing from PIL Image, bytes, and numpy array."""
    # Create simple 100x100 grayscale image
    arr = np.random.randint(0, 255, (100, 100), dtype=np.uint8)
    pil_img = Image.fromarray(arr)

    # 1. From PIL
    tensor1 = preprocess_sar_image(pil_img, target_size=(256, 256))
    assert tensor1.shape == (1, 1, 256, 256)
    assert 0.0 <= float(tensor1.min()) <= float(tensor1.max()) <= 1.0

    # 2. From PNG bytes
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    tensor2 = preprocess_sar_image(png_bytes, target_size=(256, 256))
    assert tensor2.shape == (1, 1, 256, 256)
    assert tensor2.dtype == np.float32

    # 3. From numpy
    tensor3 = preprocess_sar_image(arr, target_size=(256, 256))
    assert tensor3.shape == (1, 1, 256, 256)


def test_inference_ml_adapter_synthetic():
    """Tests InferenceMLAdapter without image producing valid SpillDetectionResult."""
    adapter = InferenceMLAdapter()
    result = adapter.detect_spill(incident_id="INC-TEST-001")

    assert isinstance(result, SpillDetectionResult)
    assert result.incident_id == "INC-TEST-001"
    assert result.area_km2 > 0.0
    assert result.perimeter_km > 0.0
    assert result.elongation >= 1.0
    assert result.polygon_geojson["type"] == "Polygon"


def test_inference_ml_adapter_with_image():
    """Tests InferenceMLAdapter with realistic image bytes."""
    # Draw a simulated dark slick patch in a brighter sea background
    img = np.full((256, 256), 180, dtype=np.uint8)
    import cv2
    cv2.ellipse(img, (128, 128), (50, 18), 30, 0, 360, 40, -1)

    buf = io.BytesIO()
    Image.fromarray(img).save(buf, format="PNG")
    img_bytes = buf.getvalue()

    adapter = InferenceMLAdapter()
    result = adapter.detect_spill(
        image_bytes=img_bytes,
        incident_id="INC-TEST-IMG",
        origin_lat=18.90,
        origin_lon=72.20,
        pixel_res_meters=20.0
    )

    assert result.incident_id == "INC-TEST-IMG"
    assert result.area_km2 > 0.0
    assert result.confidence >= 0.50
    assert "coordinates" in result.polygon_geojson


def test_ml_info_api(client):
    """Tests GET /api/v1/ml/info endpoint."""
    res = client.get("/api/v1/ml/info")
    assert res.status_code == 200
    data = res.json()
    assert "ml_mode" in data
    assert "adapter_class" in data
    assert "supported_formats" in data


def test_ml_detect_api(client):
    """Tests POST /api/v1/ml/detect endpoint."""
    # 1. Form request without file
    res = client.post("/api/v1/ml/detect", data={"incident_id": "INC-API-TEST"})
    assert res.status_code == 200
    data = res.json()
    assert data["incident_id"] == "INC-API-TEST"
    assert data["area_km2"] > 0
    assert "polygon_geojson" in data

    # 2. Multipart request with image file
    img = np.full((128, 128), 150, dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(img).save(buf, format="PNG")
    buf.seek(0)

    files = {"file": ("test_sar.png", buf, "image/png")}
    res2 = client.post("/api/v1/ml/detect", data={"incident_id": "INC-API-SAR"}, files=files)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["incident_id"] == "INC-API-SAR"
    assert data2["area_km2"] > 0
