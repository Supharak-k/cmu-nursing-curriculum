Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
foreach ($language in @('en', 'th')) {
    $source = Join-Path $projectRoot "image\5906x5315 $language.png"
    $destination = Join-Path $projectRoot "image\web\faculty-logo-$language.png"
    $original = [System.Drawing.Image]::FromFile($source)
    $width = 320
    $height = [int][Math]::Round($original.Height * $width / $original.Width)
    $bitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.DrawImage($original, 0, 0, $width, $height)
        $bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
        $original.Dispose()
    }
    Get-Item -LiteralPath $destination | Select-Object Name, Length
}
