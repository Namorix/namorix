#!/bin/bash
set -euo pipefail

# Dirs
TARGET_DIR="public/fonts/icomoon"
ICOMOON_DEST="packages/styles/src/base/icomoon"

# Files
VARIABLES_SRC="variables.scss"
VARIABLES_DEST="variables.scss"
STYLE_SRC="style.scss"
STYLE_DEST="fonts.scss"

# Replace
FONT_PATH_REPLACE="/public/fonts/icomoon/fonts"

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

mkdir -p "$TARGET_DIR"
cp -r "$TMP_DIR/." "$TARGET_DIR/"

mkdir -p "$ICOMOON_DEST"

if [ -f "$TMP_DIR/$VARIABLES_SRC" ]; then
    sed "s|\$icomoon-font-path: \"fonts\" !default;|\$icomoon-font-path: \"$FONT_PATH_REPLACE\" !default;|" \
        "$TMP_DIR/$VARIABLES_SRC" > "$ICOMOON_DEST/$VARIABLES_DEST"
    echo "Copied $VARIABLES_SRC → $ICOMOON_DEST/$VARIABLES_DEST"
fi

if [ -f "$TMP_DIR/$STYLE_SRC" ]; then
    cp "$TMP_DIR/$STYLE_SRC" "$ICOMOON_DEST/$STYLE_DEST"
    echo "Copied $STYLE_SRC → $ICOMOON_DEST/$STYLE_DEST"
fi

rm "$ZIP_FILE"
echo "Done!"