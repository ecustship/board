#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/build"

if [ ! -d "$BUILD_DIR" ]; then
  echo "build directory not found. Run npm run build first." >&2
  exit 1
fi

# Keep the original textured GLB because Main Engine renders that version.
# Remove unreferenced sidecar/source files so the deploy package is still leaner.
rm -f "$BUILD_DIR/main_engine_model/engine.gltf"
rm -f "$BUILD_DIR/main_engine_model/engine.bin"
rm -f "$BUILD_DIR/main_engine_model/engine-draco.glb"
rm -f "$BUILD_DIR/engine.gltf"
rm -rf "$BUILD_DIR/draco"

# Historical demo engine assets are not referenced by the current React app.
rm -rf "$BUILD_DIR/internal_combustion_engine"
rm -rf "$BUILD_DIR/car_engine_19_mb"
rm -rf "$BUILD_DIR/f6_boxer_engine"
rm -rf "$BUILD_DIR/low-poly_yatch_animation"

echo "Pruned deploy build:"
du -sh "$BUILD_DIR"
