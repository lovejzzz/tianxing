#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 4 ]]; then
  echo "usage: $0 <input.mp4> <start-frame> <end-frame> <output.mp4>" >&2
  exit 64
fi

input=$1
start=$2
end=$3
output=$4

if (( end <= start + 2 )); then
  echo "end-frame must be at least three frames after start-frame" >&2
  exit 64
fi

mkdir -p "$(dirname "$output")"

# Build a true seamless ping-pong loop from the most stable section of a
# generated take. The reversed half omits both turn-around endpoints, so no
# duplicate frame creates a visible pause. The one-second cycle is repeated to
# the Weather app's canonical 121-frame delivery length (frame 120 repeats the
# opening pose, which makes the browser's loop boundary visually continuous).
ffmpeg -hide_banner -loglevel error -y -i "$input" \
  -filter_complex \
  "[0:v]trim=start_frame=${start}:end_frame=$((end + 1)),setpts=PTS-STARTPTS,fps=24,split=2[f][r0];
   [r0]trim=start_frame=1:end_frame=$((end - start)),reverse,setpts=PTS-STARTPTS[r];
   [f][r]concat=n=2:v=1:a=0[cycle];
   [cycle]loop=loop=20:size=$((2 * (end - start))):start=0,trim=end_frame=121,setpts=N/(24*TB),format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 17 -movflags +faststart "$output"
