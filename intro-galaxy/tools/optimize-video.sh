#!/usr/bin/env bash
#
# optimize-video.sh
# Genera las tres versiones que usa el prototipo Intro Galaxy:
#   - WebM VP9 sin audio
#   - MP4 H.264 de respaldo
#   - Poster WebP
#
# Uso:
#   ./tools/optimize-video.sh /ruta/al/clip.mp4 <id>
#
# Ejemplo:
#   ./tools/optimize-video.sh ~/Videos/gw2.mov gw2
#
set -euo pipefail

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Error: ffmpeg no está instalado." >&2
  exit 1
fi

INPUT="${1:-}"
ID="${2:-}"

if [[ -z "$INPUT" || -z "$ID" ]]; then
  echo "Uso: $0 /ruta/al/clip.mp4 <id>" >&2
  exit 1
fi

if [[ ! -f "$INPUT" ]]; then
  echo "Error: no existe el archivo $INPUT" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VIDEO_DIR="$ROOT/assets/videos"
POSTER_DIR="$ROOT/assets/posters"
mkdir -p "$VIDEO_DIR" "$POSTER_DIR"

WEBM="$VIDEO_DIR/$ID.webm"
MP4="$VIDEO_DIR/$ID.mp4"
POSTER="$POSTER_DIR/$ID.webp"

echo "Generando WebM VP9..."
ffmpeg -y -hide_banner -loglevel error \
  -i "$INPUT" \
  -t 8 \
  -vf "scale='min(1280,iw)':-2,fps=30,format=yuv420p" \
  -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -an \
  "$WEBM"

echo "Generando MP4 H.264..."
ffmpeg -y -hide_banner -loglevel error \
  -i "$WEBM" \
  -c:v libx264 -crf 28 -preset medium -pix_fmt yuv420p \
  -movflags +faststart -an \
  "$MP4"

echo "Generando poster WebP..."
ffmpeg -y -hide_banner -loglevel error \
  -ss 2 -i "$WEBM" \
  -frames:v 1 -vf "scale='min(960,iw)':-2" \
  "$POSTER"

echo
echo "Listo:"
ls -lh "$WEBM" "$MP4" "$POSTER"
echo
echo "Ahora edita config.js y asigna estas rutas al proyecto '$ID'."
