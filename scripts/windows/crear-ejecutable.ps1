param(
  [string]$OutputPath = "CapiClub Inventario.exe",
  [string]$IconSourcePath = "public\brand\capiclub-icon.png"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$sourcePath = Join-Path $PSScriptRoot "launcher\CapiClubInventarioLauncher.cs"
$iconPath = Join-Path $PSScriptRoot "launcher\capiclub.ico"
$resolvedIconSourcePath = if ([System.IO.Path]::IsPathRooted($IconSourcePath)) {
  $IconSourcePath
} else {
  Join-Path $root $IconSourcePath
}
$resolvedOutputPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) {
  $OutputPath
} else {
  Join-Path $root $OutputPath
}

function New-IcoFromPng {
  param(
    [string]$PngPath,
    [string]$IcoPath
  )

  Add-Type -AssemblyName System.Drawing

  $sizes = @(256, 128, 64, 48, 32, 16)
  $sourceImage = [System.Drawing.Image]::FromFile($PngPath)
  $entries = New-Object System.Collections.Generic.List[object]

  try {
    foreach ($size in $sizes) {
      $bitmap = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($sourceImage, 0, 0, $size, $size)

        $stream = New-Object System.IO.MemoryStream
        $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
        $entries.Add([pscustomobject]@{
          Size = $size
          Data = $stream.ToArray()
        })
        $stream.Dispose()
      } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
      }
    }
  } finally {
    $sourceImage.Dispose()
  }

  $outputDirectory = Split-Path -Parent $IcoPath
  if ($outputDirectory -and -not (Test-Path $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory | Out-Null
  }

  $fileStream = [System.IO.File]::Create($IcoPath)
  $writer = New-Object System.IO.BinaryWriter $fileStream

  try {
    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]$entries.Count)

    $offset = 6 + (16 * $entries.Count)
    foreach ($entry in $entries) {
      $dimension = if ($entry.Size -eq 256) { 0 } else { $entry.Size }
      $writer.Write([byte]$dimension)
      $writer.Write([byte]$dimension)
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([UInt16]1)
      $writer.Write([UInt16]32)
      $writer.Write([UInt32]$entry.Data.Length)
      $writer.Write([UInt32]$offset)
      $offset += $entry.Data.Length
    }

    foreach ($entry in $entries) {
      $writer.Write($entry.Data)
    }
  } finally {
    $writer.Dispose()
    $fileStream.Dispose()
  }
}

if (-not (Test-Path $sourcePath)) {
  throw "No se encontro el codigo fuente del lanzador: $sourcePath"
}

if (-not (Test-Path $resolvedIconSourcePath)) {
  throw "No se encontro el PNG base del icono: $resolvedIconSourcePath"
}

$outputDirectory = Split-Path -Parent $resolvedOutputPath
if ($outputDirectory -and -not (Test-Path $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

if (Test-Path $resolvedOutputPath) {
  Remove-Item -LiteralPath $resolvedOutputPath -Force
}

New-IcoFromPng -PngPath $resolvedIconSourcePath -IcoPath $iconPath

$source = Get-Content -LiteralPath $sourcePath -Raw

Add-Type -AssemblyName Microsoft.CSharp
$provider = New-Object Microsoft.CSharp.CSharpCodeProvider
$parameters = New-Object System.CodeDom.Compiler.CompilerParameters
$parameters.GenerateExecutable = $true
$parameters.GenerateInMemory = $false
$parameters.OutputAssembly = $resolvedOutputPath
$parameters.CompilerOptions = "/target:exe /win32icon:`"$iconPath`""
$parameters.ReferencedAssemblies.Add("System.dll") | Out-Null
$parameters.ReferencedAssemblies.Add("System.Core.dll") | Out-Null

$result = $provider.CompileAssemblyFromSource($parameters, $source)
if ($result.Errors.Count -gt 0) {
  $messages = $result.Errors | ForEach-Object { "$($_.FileName)($($_.Line),$($_.Column)): $($_.ErrorText)" }
  throw "No se pudo compilar el ejecutable:`n$($messages -join "`n")"
}

Write-Host "Ejecutable creado en $resolvedOutputPath"
