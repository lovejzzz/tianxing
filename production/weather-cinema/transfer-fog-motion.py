#!/usr/bin/env python3
"""Transfer subtle generated fog motion onto a locked reference plate.

The motion source is a frame-QA'd Seedance clip.  Only its low-frequency
luminance residual is used, and only inside the supplied plate's window.  The
room, landmark, exposure and composition therefore remain pixel-locked.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--plate", required=True)
    parser.add_argument("--motion", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--strength", type=float, default=0.32)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    plate = cv2.imread(args.plate, cv2.IMREAD_COLOR)
    if plate is None:
        raise SystemExit(f"could not read plate: {args.plate}")

    width, height = 720, 1280
    plate = cv2.resize(plate, (width, height), interpolation=cv2.INTER_LANCZOS4)

    capture = cv2.VideoCapture(args.motion)
    if not capture.isOpened():
        raise SystemExit(f"could not read motion clip: {args.motion}")
    fps = capture.get(cv2.CAP_PROP_FPS) or 24.0
    frames: list[np.ndarray] = []
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        frames.append(cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA))
    capture.release()
    if len(frames) != 121:
        raise SystemExit(f"expected 121 motion frames, found {len(frames)}")

    # The inner glass on the Rome master plate.  Feathering is deliberately
    # broad so the transferred atmosphere dies away before every hard edge.
    mask = np.zeros((height, width), np.float32)
    cv2.rectangle(mask, (206, 194), (519, 810), 1.0, thickness=-1)
    mask = cv2.GaussianBlur(mask, (0, 0), 18.0)

    grays = [cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32) for frame in frames]
    temporal_base = np.mean(np.stack(grays, axis=0), axis=0)

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(
        str(output), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height)
    )
    if not writer.isOpened():
        raise SystemExit(f"could not open output: {output}")

    base = plate.astype(np.float32)
    for gray in grays:
        # Large blur removes generated compression/grain and retains only the
        # slow atmospheric drift.  Subtracting the temporal mean guarantees no
        # cumulative brightening, clearing or thickening over the loop.
        residual = cv2.GaussianBlur(gray - temporal_base, (0, 0), 12.0)
        residual -= float(np.mean(residual[mask > 0.85]))
        residual = np.clip(residual, -6.0, 6.0) * args.strength
        delta = residual[:, :, None] * mask[:, :, None]
        frame = np.clip(base + delta, 0, 255).astype(np.uint8)
        writer.write(frame)
    writer.release()


if __name__ == "__main__":
    main()
