import io
import os
from typing import Optional, Tuple, Union, Any
import numpy as np
from PIL import Image

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    class _MockNN:
        Module = object
    nn = _MockNN()

from app.core.logging import logger

class DoubleConv(nn.Module):
    """(Convolution => [BatchNorm] => ReLU) * 2"""
    def __init__(self, in_channels: int, out_channels: int, mid_channels: Optional[int] = None):
        super().__init__()
        if not HAS_TORCH:
            return
        if not mid_channels:
            mid_channels = out_channels
        self.double_conv = nn.Sequential(
            nn.Conv2d(in_channels, mid_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(mid_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(mid_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.double_conv(x)


class Down(nn.Module):
    """Downscaling with maxpool then double conv"""
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        if not HAS_TORCH:
            return
        self.maxpool_conv = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(in_channels, out_channels)
        )

    def forward(self, x):
        return self.maxpool_conv(x)


class Up(nn.Module):
    """Upscaling then double conv"""
    def __init__(self, in_channels: int, out_channels: int, bilinear: bool = True):
        super().__init__()
        if not HAS_TORCH:
            return
        if bilinear:
            self.up = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
            self.conv = DoubleConv(in_channels, out_channels, in_channels // 2)
        else:
            self.up = nn.ConvTranspose2d(in_channels, in_channels // 2, kernel_size=2, stride=2)
            self.conv = DoubleConv(in_channels, out_channels)

    def forward(self, x1, x2):
        x1 = self.up(x1)
        diffY = x2.size()[2] - x1.size()[2]
        diffX = x2.size()[3] - x1.size()[3]
        x1 = F.pad(x1, [diffX // 2, diffX - diffX // 2, diffY // 2, diffY - diffY // 2])
        x = torch.cat([x2, x1], dim=1)
        return self.conv(x)


class OutConv(nn.Module):
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        if not HAS_TORCH:
            return
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size=1)

    def forward(self, x):
        return self.conv(x)


class UNet(nn.Module):
    """
    Standard U-Net Architecture tailored for Satellite SAR Oil Spill Segmentation.
    Input: (B, C, H, W) where C=1 (VV intensity) or C=2 (VV/VH dual polarization).
    Output: (B, 1, H, W) raw logits for binary oil slick mask.
    """
    def __init__(self, n_channels: int = 1, n_classes: int = 1, bilinear: bool = False):
        super().__init__()
        if not HAS_TORCH:
            raise RuntimeError("PyTorch is required to instantiate UNet architecture.")
        self.n_channels = n_channels
        self.n_classes = n_classes
        self.bilinear = bilinear

        factor = 2 if bilinear else 1
        self.inc = DoubleConv(n_channels, 32)
        self.down1 = Down(32, 64)
        self.down2 = Down(64, 128)
        self.down3 = Down(128, 256)
        self.down4 = Down(256, 512 // factor)
        self.up1 = Up(512, 256 // factor, bilinear)
        self.up2 = Up(256, 128 // factor, bilinear)
        self.up3 = Up(128, 64 // factor, bilinear)
        self.up4 = Up(64, 32, bilinear)
        self.outc = OutConv(32, n_classes)

    def forward(self, x):
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)
        x = self.up1(x5, x4)
        x = self.up2(x, x3)
        x = self.up3(x, x2)
        x = self.up4(x, x1)
        logits = self.outc(x)
        return logits


def preprocess_sar_image(
    image_input: Union[bytes, np.ndarray, Image.Image],
    target_size: Tuple[int, int] = (256, 256)
) -> np.ndarray:
    """
    Converts raw image bytes, numpy array, or PIL Image into a normalized
    (1, C, H, W) float32 tensor in range [0, 1].
    """
    if isinstance(image_input, bytes):
        pil_img = Image.open(io.BytesIO(image_input)).convert("L")
        img_arr = np.array(pil_img, dtype=np.float32)
    elif isinstance(image_input, Image.Image):
        pil_img = image_input.convert("L")
        img_arr = np.array(pil_img, dtype=np.float32)
    elif isinstance(image_input, np.ndarray):
        if image_input.ndim == 3 and image_input.shape[2] in [3, 4]:
            # Convert RGB to grayscale
            import cv2
            img_arr = cv2.cvtColor(image_input, cv2.COLOR_RGB2GRAY).astype(np.float32)
        else:
            img_arr = image_input.astype(np.float32)
    else:
        raise ValueError(f"Unsupported image input type: {type(image_input)}")

    # Resize to target size if different
    if img_arr.shape[:2] != target_size:
        import cv2
        img_arr = cv2.resize(img_arr, target_size, interpolation=cv2.INTER_LINEAR)

    # Normalize to [0.0, 1.0]
    min_val, max_val = float(img_arr.min()), float(img_arr.max())
    if max_val > min_val:
        img_arr = (img_arr - min_val) / (max_val - min_val)
    else:
        img_arr = np.zeros_like(img_arr)

    # Reshape to (1, 1, H, W)
    tensor_arr = np.expand_dims(np.expand_dims(img_arr, axis=0), axis=0)
    return tensor_arr


def export_unet_to_onnx(
    model: Any,
    output_path: str,
    input_shape: Tuple[int, int, int, int] = (1, 1, 256, 256)
) -> str:
    """Exports PyTorch UNet model to ONNX runtime format."""
    if not HAS_TORCH:
        raise RuntimeError("PyTorch is required for ONNX export.")
    model.eval()
    dummy_input = torch.randn(*input_shape)
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size', 2: 'height', 3: 'width'},
            'output': {0: 'batch_size', 2: 'height', 3: 'width'}
        }
    )
    logger.info(f"Exported UNet model to ONNX at {output_path}")
    return output_path
