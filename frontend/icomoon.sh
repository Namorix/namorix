#!/bin/bash
set -euo pipefail

# Dirs
ICOMOON_DEST="packages/styles/src/base/icomoon"

# Files
VARIABLES_SRC="variables.scss"
VARIABLES_DEST="variables.scss"
STYLE_SRC="style.scss"
STYLE_DEST="fonts.scss"
FONT_FACE_DEST="_font-face.scss"

ZIP_FILE=$(ls -t *icomoon*.zip 2>/dev/null | head -n 1)
if [ -z "$ZIP_FILE" ]; then
    echo "Error: No icomoon zip file found!"
    exit 1
fi

if ! unzip -t "$ZIP_FILE" &>/dev/null; then
    echo "Error: Zip file is corrupt: $ZIP_FILE"
    exit 1
fi

echo "Processing: $ZIP_FILE"

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

unzip -o "$ZIP_FILE" -d "$TMP_DIR"

mkdir -p "$ICOMOON_DEST"

# 1. variables.scss — only keep the content codes, drop font-path (no longer needed since the font is inlined as base64)
if [ -f "$TMP_DIR/$VARIABLES_SRC" ]; then
    grep -v 'icomoon-font-path' "$TMP_DIR/$VARIABLES_SRC" > "$ICOMOON_DEST/$VARIABLES_DEST"
    echo "Copied $VARIABLES_SRC → $ICOMOON_DEST/$VARIABLES_DEST (dropped font-path)"
fi

# 2. style.scss → fonts.scss, drop the old @font-face block (split out into _font-face.scss)
if [ -f "$TMP_DIR/$STYLE_SRC" ]; then
    sed '/^@font-face {/,/^}/d' "$TMP_DIR/$STYLE_SRC" > "$ICOMOON_DEST/$STYLE_DEST"
    echo "Copied $STYLE_SRC → $ICOMOON_DEST/$STYLE_DEST (dropped @font-face)"
fi

# 3. Generate the base64-inlined @font-face from the .woff file
WOFF_FILE=$(find "$TMP_DIR/fonts" -name "*.woff" | head -n 1)
if [ -z "$WOFF_FILE" ]; then
    echo "Error: No .woff file found in zip!"
    exit 1
fi

WOFF_BASE64=$(base64 -w 0 "$WOFF_FILE")

cat > "$ICOMOON_DEST/$FONT_FACE_DEST" <<EOF
@use "variables" as *;

@font-face {
  font-family: '#{\$icomoon-font-family}';
  src: url("data:font/woff;charset=utf-8;base64,${WOFF_BASE64}") format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}
EOF
echo "Generated $FONT_FACE_DEST (base64-inlined font, $(( ${#WOFF_BASE64} / 1024 )) KB)"

# 4. Copy selection.json — kept so it can be imported back into the IcoMoon app when icons need adding/editing
SELECTION_FILE="$TMP_DIR/selection.json"
if [ -f "$SELECTION_FILE" ]; then
    cp "$SELECTION_FILE" "$ICOMOON_DEST/selection.json"
    echo "Copied selection.json → $ICOMOON_DEST/selection.json"
else
    echo "Warning: selection.json not found in zip, skipped"
fi

rm "$ZIP_FILE"
echo "Done!"