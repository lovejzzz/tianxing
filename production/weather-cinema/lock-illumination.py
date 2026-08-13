#!/usr/bin/env python3
"""Lock broad illumination to the first frame while retaining local weather motion."""

from argparse import ArgumentParser
from pathlib import Path
import subprocess
import tempfile

import cv2
import numpy as np


parser = ArgumentParser()
parser.add_argument("input", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument("--sigma", type=float, default=42.0)
parser.add_argument("--crf", type=int, default=15)
args = parser.parse_args()

with tempfile.TemporaryDirectory(prefix="weather-illumination-") as temporary:
    root = Path(temporary)
    source = root / "source"
    locked = root / "locked"
    source.mkdir()
    locked.mkdir()
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(args.input),
        "-vsync", "0", str(source / "%03d.png"),
    ], check=True)
    paths = sorted(source.glob("*.png"))
    if not paths:
        raise SystemExit("No video frames were decoded")
    reference = cv2.imread(str(paths[0]), cv2.IMREAD_COLOR).astype(np.float32)
    reference_field = cv2.GaussianBlur(reference, (0, 0), args.sigma, args.sigma)
    for path in paths:
        frame = cv2.imread(str(path), cv2.IMREAD_COLOR).astype(np.float32)
        field = cv2.GaussianBlur(frame, (0, 0), args.sigma, args.sigma)
        gain = np.clip((reference_field + 2.0) / (field + 2.0), 0.68, 1.32)
        corrected = np.clip(frame * gain, 0, 255).astype(np.uint8)
        cv2.imwrite(str(locked / path.name), corrected)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-framerate", "24",
        "-i", str(locked / "%03d.png"), "-c:v", "libx264", "-preset", "slow",
        "-crf", str(args.crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        str(args.output),
    ], check=True)
