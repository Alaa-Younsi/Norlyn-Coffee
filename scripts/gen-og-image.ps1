# One-off: generates public/og-image.png (1200x630 social share card).
# Run: powershell -ExecutionPolicy Bypass -File scripts/gen-og-image.ps1
Add-Type -AssemblyName System.Drawing

$width = 1200; $height = 630
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

# espresso-dark background
$g.Clear([System.Drawing.Color]::FromArgb(255, 19, 14, 10))

# smooth radial gold glow (PathGradientBrush — concentric circles band visibly)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(150, -200, 900, 900)
$glow = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
$glow.CenterColor = [System.Drawing.Color]::FromArgb(110, 201, 162, 75)
$glow.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 201, 162, 75))
$g.FillEllipse($glow, 150, -200, 900, 900)

# logo (inverted to cream so the black text reads on dark)
# Read from assets-src, not public: this is a build INPUT, and a copy kept in
# public/ is 145 kB shipped to every visitor of a file only this script opens.
$logo = [System.Drawing.Image]::FromFile("$PSScriptRoot\..\assets-src\raw\NORLYN-COFFEE-logo.png")
$logoW = 560; $logoH = [int]($logo.Height * ($logoW / $logo.Width))
$logoBmp = New-Object System.Drawing.Bitmap($logo, $logoW, $logoH)
# invert dark pixels -> cream, keep alpha
for ($y = 0; $y -lt $logoH; $y++) {
  for ($x = 0; $x -lt $logoW; $x++) {
    $p = $logoBmp.GetPixel($x, $y)
    if ($p.A -gt 0 -and ($p.R + $p.G + $p.B) -lt 240) {
      $logoBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, 243, 234, 222))
    }
  }
}
$g.DrawImage($logoBmp, [int](($width - $logoW) / 2), 150, $logoW, $logoH)

# title + tagline
$fontTitle = New-Object System.Drawing.Font("Georgia", 44, [System.Drawing.FontStyle]::Bold)
$fontTag = New-Object System.Drawing.Font("Segoe UI", 20)
$gold = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 214, 178, 112))
$cream = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 243, 234, 222))
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = [System.Drawing.StringAlignment]::Center

$g.DrawString("MORIVA", $fontTitle, $gold, [System.Drawing.RectangleF]::new(0, 400, $width, 80), $fmt)
$g.DrawString("Capsules espresso premium - Paiement a la livraison, 69 wilayas", $fontTag, $cream, [System.Drawing.RectangleF]::new(0, 490, $width, 50), $fmt)

$out = "$PSScriptRoot\..\public\og-image.png"
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $logo.Dispose(); $logoBmp.Dispose()
Write-Output "wrote $out"
