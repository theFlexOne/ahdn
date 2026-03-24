#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./generate-image-variants.sh <input-image-path> <preset> [output-dir]
#
# Examples:
#   ./generate-image-variants.sh ./bg_hero_1.jpg her:contentReference[oaicite:0]{index=0}dist/images
#
# Requirements:
#   - node
#   - npx
#   - sharp-cli available via npx
#   - sharp available to Node for metadata reading
#     Easiest:
#       npm install --save-dev sharp sharp-cli

usage() {
  cat <<'EOF'
Usage:
  generate-image-variants.sh <input-image-path> <preset> [output-dir]

Presets:
  thumbnail
  content
  hero

Output filenames:
  <input-base>-<sm|md|lg>.<jpg|webp|avif>

Notes:
  - Widths come from the selected preset.
  - Aspect ratio is preserved.
  - If the input image width is smaller than a target width, that variant is skipped.
  - Output dir defaults to the input file's directory.
EOF
}

if [[ $# -lt 2 || $# -gt 3 ]]; then
  usage
  exit 1
fi

INPUT_PATH="$1"
PRESET="$2"
OUTPUT_DIR="${3:-$(dirname "$INPUT_PATH")}"

if [[ ! -f "$INPUT_PATH" ]]; then
  echo "Error: input file does not exist: $INPUT_PATH" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

INPUT_FILENAME="$(basename "$INPUT_PATH")"
INPUT_BASENAME="${INPUT_FILENAME%.*}"

declare -A PRESET_SM
declare -A PRESET_MD
declare -A PRESET_LG

PRESET_SM[thumbnail]=240
PRESET_MD[thumbnail]=400
PRESET_LG[thumbnail]=640

PRESET_SM[content]=600
PRESET_MD[content]=900
PRESET_LG[content]=1440

PRESET_SM[hero]=768
PRESET_MD[hero]=1280
PRESET_LG[hero]=1920

if [[ -z "${PRESET_SM[$PRESET]:-}" ]]; then
  echo "Error: invalid preset '$PRESET'. Must be one of: thumbnail, content, hero" >&2
  exit 1
fi

SM_WIDTH="${PRESET_SM[$PRESET]}"
MD_WIDTH="${PRESET_MD[$PRESET]}"
LG_WIDTH="${PRESET_LG[$PRESET]}"

# Read metadata with sharp so we can skip upscales ourselves.
INPUT_WIDTH="$(
  node -e "
    const sharp = require('sharp');
    sharp(process.argv[1]).metadata()
      .then(m => {
        if (!m.width) throw new Error('Could not determine image width');
        process.stdout.write(String(m.width));
      })
      .catch(err => {
        console.error(err.message || err);
        process.exit(1);
      });
  " "$INPUT_PATH"
)"

if ! [[ "$INPUT_WIDTH" =~ ^[0-9]+$ ]]; then
  echo "Error: failed to read input width for $INPUT_PATH" >&2
  exit 1
fi

echo "Input: $INPUT_PATH"
echo "Preset: $PRESET"
echo "Input width: $INPUT_WIDTH"
echo "Output dir: $OUTPUT_DIR"
echo

generate_variant() {
  local label="$1"
  local width="$2"
  local format="$3"

  if (( INPUT_WIDTH < width )); then
    echo "Skipping ${label}.${format} (${width}px): input is smaller than target width"
    return 0
  fi

  local ext="$format"
  if [[ "$format" == "jpg" ]]; then
    # sharp-cli accepts jpg/jpeg as output format; use jpg for filename.
    format="jpg"
  fi

  local output_path="${OUTPUT_DIR}/${INPUT_BASENAME}-${label}.${ext}"

  echo "Generating: $output_path"

  npx sharp-cli \
    --input "$INPUT_PATH" \
    --output "$output_path" \
    --format "$format" \
    resize "$width"
}

for size_label in sm md lg; do
  case "$size_label" in
    sm) target_width="$SM_WIDTH" ;;
    md) target_width="$MD_WIDTH" ;;
    lg) target_width="$LG_WIDTH" ;;
  esac

  generate_variant "$size_label" "$target_width" "jpg"
  generate_variant "$size_label" "$target_width" "webp"
  generate_variant "$size_label" "$target_width" "avif"
done

echo
echo "Done."