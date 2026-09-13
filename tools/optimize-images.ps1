# Resize + re-encode the DNNHS screenshots for the web.
# Produces two JPEGs per source: -lg (lightbox) and -sm (gallery thumbnail).
Add-Type -AssemblyName System.Drawing

$src = 'C:\portfolio\assets\img'
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
             Where-Object { $_.MimeType -eq 'image/jpeg' }

function Save-Resized {
    param($Image, [int]$MaxWidth, [string]$OutPath, [int]$Quality)

    $ratio = $MaxWidth / $Image.Width
    if ($ratio -gt 1) { $ratio = 1 }            # never upscale
    $w = [int]($Image.Width  * $ratio)
    $h = [int]($Image.Height * $ratio)

    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    # Screenshots have transparent-free white backgrounds; fill to be safe for JPEG
    $g.Clear([System.Drawing.Color]::White)
    $g.DrawImage($Image, 0, 0, $w, $h)

    $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality, [int64]$Quality)
    $bmp.Save($OutPath, $jpegCodec, $ep)

    $g.Dispose(); $bmp.Dispose(); $ep.Dispose()
    return "{0}x{1}" -f $w, $h
}

$results = @()
Get-ChildItem $src -Filter '*.png' | Sort-Object Name | ForEach-Object {
    $img  = [System.Drawing.Image]::FromFile($_.FullName)
    $base = $_.BaseName
    $beforeKB = [math]::Round($_.Length / 1KB, 1)

    $lgPath = Join-Path $src "$base-lg.jpg"
    $smPath = Join-Path $src "$base-sm.jpg"
    $lgDim = Save-Resized -Image $img -MaxWidth 1600 -OutPath $lgPath -Quality 80
    $smDim = Save-Resized -Image $img -MaxWidth 620  -OutPath $smPath -Quality 76
    $img.Dispose()

    $results += [pscustomobject]@{
        Name     = $base
        BeforeKB = $beforeKB
        LgKB     = [math]::Round((Get-Item $lgPath).Length / 1KB, 1)
        LgDim    = $lgDim
        SmKB     = [math]::Round((Get-Item $smPath).Length / 1KB, 1)
        SmDim    = $smDim
    }
}

$results | Format-Table -AutoSize
"";
"Originals total : {0} KB" -f [math]::Round((($results | Measure-Object BeforeKB -Sum).Sum), 1)
"Large total     : {0} KB" -f [math]::Round((($results | Measure-Object LgKB     -Sum).Sum), 1)
"Thumbs total    : {0} KB" -f [math]::Round((($results | Measure-Object SmKB     -Sum).Sum), 1)
