$ErrorActionPreference = "Stop"

# Dirs
$TARGET_DIR = "public/fonts/icomoon"
$ICOMOON_DEST = "packages/styles/src/base/icomoon"

# Files
$VARIABLES_SRC = "variables.scss"
$VARIABLES_DEST = "variables.scss"
$STYLE_SRC = "style.scss"
$STYLE_DEST = "fonts.scss"

# Replace
$FONT_PATH_REPLACE = "/public/fonts/icomoon/fonts"

$ZIP_FILE = Get-ChildItem -Filter "*icomoon*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $ZIP_FILE) {
    Write-Error "Error: No icomoon zip file found!"
    exit 1
}

try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($ZIP_FILE.FullName)
    $zip.Dispose()
} catch {
    Write-Error "Error: Zip file is corrupt: $($ZIP_FILE.Name)"
    exit 1
}

Write-Host "Processing: $($ZIP_FILE.Name)"

$TMP_DIR = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }

try {
    Expand-Archive -Path $ZIP_FILE.FullName -DestinationPath $TMP_DIR.FullName -Force

    New-Item -ItemType Directory -Path $TARGET_DIR -Force | Out-Null
    Copy-Item -Path "$($TMP_DIR.FullName)\*" -Destination $TARGET_DIR -Recurse -Force

    New-Item -ItemType Directory -Path $ICOMOON_DEST -Force | Out-Null

    $VAR_SRC_PATH = Join-Path $TMP_DIR.FullName $VARIABLES_SRC
    if (Test-Path $VAR_SRC_PATH) {
        $content = Get-Content $VAR_SRC_PATH -Raw
        $content = $content -replace [regex]::Escape('$icomoon-font-path: "fonts" !default;'), "`$icomoon-font-path: `"$FONT_PATH_REPLACE`" !default;"
        Set-Content -Path (Join-Path $ICOMOON_DEST $VARIABLES_DEST) -Value $content -NoNewline
        Write-Host "Copied $VARIABLES_SRC → $ICOMOON_DEST/$VARIABLES_DEST"
    }

    $STYLE_SRC_PATH = Join-Path $TMP_DIR.FullName $STYLE_SRC
    if (Test-Path $STYLE_SRC_PATH) {
        Copy-Item -Path $STYLE_SRC_PATH -Destination (Join-Path $ICOMOON_DEST $STYLE_DEST) -Force
        Write-Host "Copied $STYLE_SRC → $ICOMOON_DEST/$STYLE_DEST"
    }

    Remove-Item $ZIP_FILE.FullName
    Write-Host "Done!"
} finally {
    Remove-Item -Recurse -Force $TMP_DIR.FullName
}