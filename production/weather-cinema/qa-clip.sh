#!/bin/sh
set -eu

if [ "$#" -ne 2 ]; then
  echo "usage: $0 input.mp4 output-directory" >&2
  exit 2
fi

input=$1
output=$2
mkdir -p "$output"
cp "$input" "$output/source.mp4"
python3 production/weather-cinema/analyze-clip.py "$output/source.mp4" --output "$output/analysis"
ffmpeg -hide_banner -loglevel error -y -i "$output/source.mp4" \
  -vf "select='eq(n,0)+eq(n,1)+eq(n,2)+eq(n,3)+eq(n,4)+eq(n,116)+eq(n,117)+eq(n,118)+eq(n,119)+eq(n,120)',scale=240:426,tile=5x2" \
  -vsync 0 "$output/seam-sheet.jpg"
