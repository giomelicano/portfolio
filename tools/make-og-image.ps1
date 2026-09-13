# Generate the 1200x630 Open Graph card referenced by index.html's og:image.
# Monochrome, matching the site: #FFFFFF ground, #222222 ink, #6F6F6F muted.
Add-Type -AssemblyName System.Drawing

$W, $H = 1200, 630
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.Clear([System.Drawing.Color]::FromArgb(255, 255, 255))

$ink   = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 34, 34))
$muted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(111, 111, 111))
$ghost = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(242, 242, 242))
$line  = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(212, 212, 212), 2)

# Giant ghosted watermark, echoing the hero
$fWatermark = New-Object System.Drawing.Font("Segoe UI", 210, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString("PORTFOLIO", $fWatermark, $ghost, -40, 215)

$pad = 80

# Small uppercase eyebrow with a rule, like the site's section labels
$fEyebrow = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawLine($line, $pad, 132, ($pad + 44), 132)
$g.DrawString("WEB DEVELOPER", $fEyebrow, $muted, ($pad + 58), 121)

# Name — the headline
$fName = New-Object System.Drawing.Font("Segoe UI Light", 92, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString("Jose Gio L.", $fName, $ink, ($pad - 6), 190)
$g.DrawString("Melicano",   $fName, $ink, ($pad - 6), 292)

# Supporting line
$fSub = New-Object System.Drawing.Font("Segoe UI", 30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString("4th-year BS Information Systems student", $fSub, $muted, ($pad - 2), 420)

# Footer rule + stack
$g.DrawLine($line, $pad, 520, ($W - $pad), 520)
$fFoot = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString("HTML  ·  CSS  ·  JavaScript  ·  PHP  ·  MySQL", $fFoot, $ink, ($pad - 2), 548)

$fUrl = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$urlText = "giomelicano-portfolio.netlify.app"
$urlSize = $g.MeasureString($urlText, $fUrl)
$g.DrawString($urlText, $fUrl, $muted, ($W - $pad - $urlSize.Width), 548)

# Save as PNG
$out = "C:\portfolio\assets\img\og-image.png"
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()

$f = Get-Item $out
"Created {0}  —  {1}x{2}, {3} KB" -f $f.Name, $W, $H, [math]::Round($f.Length/1KB, 1)
