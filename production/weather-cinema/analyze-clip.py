#!/usr/bin/env python3
"""Measure one weather clip and emit reproducible visual QA artifacts."""

from argparse import ArgumentParser
from pathlib import Path
import json
import math

import cv2
import numpy as np


parser = ArgumentParser()
parser.add_argument("input", type=Path)
parser.add_argument("--output", type=Path, required=True)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)

capture = cv2.VideoCapture(str(args.input))
frames = []
while True:
    ok, frame = capture.read()
    if not ok:
        break
    frames.append(frame)
if not frames:
    raise SystemExit("No frames decoded")

height, width = frames[0].shape[:2]
room_mask = np.zeros((height, width), np.uint8)
room_mask[:, :int(width * .26)] = 255
room_mask[:, int(width * .76):] = 255
room_mask[:int(height * .22), :] = 255
room_mask[int(height * .77):, :] = 255
room_pixels = room_mask.astype(bool)
weather_slice = (slice(int(height * .16), int(height * .76)), slice(int(width * .27), int(width * .75)))
sky_slice = (slice(int(height * .20), int(height * .50)), slice(int(width * .30), int(width * .72)))

sift = cv2.SIFT_create(nfeatures=2500, contrastThreshold=.015)
gray = [cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) for frame in frames]
keypoints_zero, descriptors_zero = sift.detectAndCompute(gray[0], room_mask)
matcher = cv2.BFMatcher(cv2.NORM_L2)
transforms = []
for index, current in enumerate(gray):
    keypoints, descriptors = sift.detectAndCompute(current, room_mask)
    if descriptors is None:
        continue
    matches = matcher.knnMatch(descriptors_zero, descriptors, k=2)
    good = [first for first, second in matches if first.distance < .7 * second.distance]
    if len(good) < 8:
        continue
    source = np.float32([keypoints_zero[item.queryIdx].pt for item in good]).reshape(-1, 1, 2)
    destination = np.float32([keypoints[item.trainIdx].pt for item in good]).reshape(-1, 1, 2)
    affine, inliers = cv2.estimateAffinePartial2D(source, destination, method=cv2.RANSAC, ransacReprojThreshold=2)
    if affine is None:
        continue
    scale = math.sqrt(affine[0, 0] ** 2 + affine[0, 1] ** 2)
    transforms.append({
        "frame": index, "matches": len(good), "inliers": int(inliers.sum()),
        "dx": float(affine[0, 2]), "dy": float(affine[1, 2]), "scale": scale,
        "angle": math.degrees(math.atan2(affine[1, 0], affine[0, 0])),
    })

weather_motion = []
room_motion = []
differences = []
for index in range(1, len(gray)):
    difference = cv2.absdiff(gray[index - 1], gray[index])
    weather_motion.append(float(difference[weather_slice].mean()))
    room_motion.append(float(difference[room_pixels].mean()))
for index in np.linspace(1, len(gray) - 1, 24, dtype=int):
    difference = np.clip(cv2.absdiff(gray[index - 1], gray[index]) * 8, 0, 255).astype(np.uint8)
    differences.append(cv2.cvtColor(cv2.resize(difference, (180, 320)), cv2.COLOR_GRAY2BGR))
rows = [np.hstack(differences[index:index + 6]) for index in range(0, len(differences), 6)]
cv2.imwrite(str(args.output / "motion-differences.jpg"), np.vstack(rows))

sample_indices = np.linspace(0, len(frames) - 1, 6, dtype=int)
samples = [cv2.resize(frames[index], (240, 427), interpolation=cv2.INTER_AREA) for index in sample_indices]
cv2.imwrite(str(args.output / "contact-sheet.jpg"), np.vstack([np.hstack(samples[:3]), np.hstack(samples[3:])]))

whole_luma = [float(item.mean()) for item in gray]
room_luma = [float(item[room_pixels].mean()) for item in gray]
sky_luma = [float(item[sky_slice].mean()) for item in gray]
valid = transforms
metrics = {
    "input": str(args.input), "width": width, "height": height, "frames": len(frames),
    "trackedFrames": len(valid),
    "dxRange": [min(item["dx"] for item in valid), max(item["dx"] for item in valid)],
    "dyRange": [min(item["dy"] for item in valid), max(item["dy"] for item in valid)],
    "scaleRange": [min(item["scale"] for item in valid), max(item["scale"] for item in valid)],
    "angleRange": [min(item["angle"] for item in valid), max(item["angle"] for item in valid)],
    "weatherMotion": [min(weather_motion), max(weather_motion), float(np.mean(weather_motion))],
    "roomMotion": [min(room_motion), max(room_motion), float(np.mean(room_motion))],
    "weatherMotionFirstLast": [weather_motion[:5], weather_motion[-5:]],
    "wholeLuma": [min(whole_luma), max(whole_luma), max(whole_luma) - min(whole_luma)],
    "roomLuma": [min(room_luma), max(room_luma), max(room_luma) - min(room_luma)],
    "skyLuma": [min(sky_luma), max(sky_luma), max(sky_luma) - min(sky_luma)],
    "lumaFirstLast": [whole_luma[0], whole_luma[-1], room_luma[0], room_luma[-1], sky_luma[0], sky_luma[-1]],
}
(args.output / "metrics.json").write_text(json.dumps(metrics, indent=2))
print(json.dumps(metrics, indent=2))
