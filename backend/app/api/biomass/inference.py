"""
Inference module for biomass prediction.
Loads the trained WideTilesModel once at startup and provides a predict() function.
"""
import os
import logging
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import albumentations as A
from albumentations.pytorch import ToTensorV2
import timm

logger = logging.getLogger(__name__)

# ─── Constants ────────────────────────────────────────────────────────────────
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD  = (0.229, 0.224, 0.225)

DEFAULT_WIDE_IMG  = 1024
DEFAULT_TILE_IMG  = 896
DEFAULT_GRID_ROWS = 2
DEFAULT_GRID_COLS = 3

# ─── Model Architecture (must match training exactly) ─────────────────────────

class DinoV3Backbone(nn.Module):
    def __init__(self, name: str, pretrained: bool = False):
        super().__init__()
        self.model = timm.create_model(name, pretrained=pretrained, num_classes=0)
        self.dim = (
            getattr(self.model, "num_features", None)
            or getattr(self.model, "embed_dim", None)
        )

    def forward(self, x):
        return self.model(x)


class AttnPool(nn.Module):
    def __init__(self, dim: int):
        super().__init__()
        self.score = nn.Sequential(
            nn.LayerNorm(dim),
            nn.Linear(dim, dim // 4),
            nn.GELU(),
            nn.Linear(dim // 4, 1),
        )

    def forward(self, feats):          # [B, K, D]
        w = self.score(feats).squeeze(-1)           # [B, K]
        a = torch.softmax(w, dim=1).unsqueeze(-1)   # [B, K, 1]
        return (feats * a).sum(dim=1)               # [B, D]


class WideTilesModel(nn.Module):
    def __init__(self, backbone_name: str, hidden: int = 512,
                 dropout: float = 0.4, pretrained: bool = False):
        super().__init__()
        self.backbone   = DinoV3Backbone(backbone_name, pretrained=pretrained)
        D               = int(self.backbone.dim)
        self.tile_pool  = AttnPool(D)
        self.fusion     = nn.Sequential(
            nn.Linear(2 * D, hidden),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(hidden, hidden),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
        )
        self.reg_head = nn.Linear(hidden, 1)

    def forward(self, wide, tiles):
        B, K, C, Ht, Wt = tiles.shape
        fw      = self.backbone(wide)
        ft      = self.backbone(tiles.view(B * K, C, Ht, Wt)).view(B, K, -1)
        ft_pool = self.tile_pool(ft)
        z       = self.fusion(torch.cat([fw, ft_pool], dim=1))
        return self.reg_head(z).squeeze(1)


# ─── Preprocessing ────────────────────────────────────────────────────────────

def _get_valid_tfm(img_size: int) -> A.Compose:
    return A.Compose([
        A.Resize(img_size, img_size, interpolation=cv2.INTER_AREA),
        A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ToTensorV2(),
    ])


def _split_into_grid(img_rgb: np.ndarray, grid_rows: int, grid_cols: int):
    H, W = img_rgb.shape[:2]
    ys   = np.linspace(0, H, grid_rows + 1, dtype=int)
    xs   = np.linspace(0, W, grid_cols + 1, dtype=int)
    tiles = []
    for r in range(grid_rows):
        for c in range(grid_cols):
            tiles.append(img_rgb[ys[r]:ys[r+1], xs[c]:xs[c+1]].copy())
    return tiles


# ─── Singleton predictor ──────────────────────────────────────────────────────

class BiomassPredictor:
    """Loads model once, exposes predict_from_bytes()."""

    def __init__(self):
        self._model:  Optional[WideTilesModel] = None
        self._device: Optional[torch.device]   = None
        self._wide_tfm  = _get_valid_tfm(DEFAULT_WIDE_IMG)
        self._tile_tfm  = _get_valid_tfm(DEFAULT_TILE_IMG)

    def load(
        self,
        model_path: str,
        backbone_name: str = "vit_large_patch16_dinov3_qkvb.lvd1689m",
        hidden: int        = 512,
        dropout: float     = 0.4,
        wide_img: int      = DEFAULT_WIDE_IMG,
        tile_img: int      = DEFAULT_TILE_IMG,
    ) -> None:
        path = Path(model_path)
        if not path.exists():
            raise FileNotFoundError(f"Model weights not found: {model_path}")

        logger.info("Loading biomass model from %s …", model_path)
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        self._model = WideTilesModel(
            backbone_name=backbone_name,
            hidden=hidden,
            dropout=dropout,
            pretrained=False,       # weights are in .pth
        )
        state = torch.load(path, map_location="cpu")
        self._model.load_state_dict(state)
        self._model.to(self._device)
        self._model.eval()

        self._wide_tfm = _get_valid_tfm(wide_img)
        self._tile_tfm = _get_valid_tfm(tile_img)
        logger.info("Biomass model ready on %s", self._device)

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def predict_from_bytes(
        self,
        image_bytes: bytes,
        grid_rows: int = DEFAULT_GRID_ROWS,
        grid_cols: int = DEFAULT_GRID_COLS,
        tta: bool      = False,
    ) -> float:
        """
        Accept raw image bytes, return predicted biomass (centner/ha).
        """
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded. Call load() first.")

        # Decode
        nparr   = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Cannot decode image")
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        # Preprocess
        wide   = self._wide_tfm(image=img_rgb)["image"].unsqueeze(0)  # [1,C,H,W]
        tiles  = _split_into_grid(img_rgb, grid_rows, grid_cols)
        tiles_t = torch.stack(
            [self._tile_tfm(image=t)["image"] for t in tiles], dim=0
        ).unsqueeze(0)  # [1,K,C,H,W]

        wide    = wide.to(self._device)
        tiles_t = tiles_t.to(self._device)

        with torch.no_grad():
            if not tta:
                pred = self._model(wide, tiles_t)
            else:
                preds = [
                    self._model(wide, tiles_t),
                    self._model(torch.flip(wide, [3]), torch.flip(tiles_t, [4])),
                    self._model(torch.flip(wide, [2]), torch.flip(tiles_t, [3])),
                ]
                pred = torch.stack(preds).mean(0)

        return float(pred.item())


# Global singleton
predictor = BiomassPredictor()