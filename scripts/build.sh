#!/usr/bin/env bash

cd "$(dirname "$0")/../"

rm -rf dist/

npx esbuild src/main.ts src/preload.ts \
  --target=es2015 \
  --platform=node \
  --format=cjs \
  --packages=external \
  --minify \
  --bundle \
  --outdir=dist/

