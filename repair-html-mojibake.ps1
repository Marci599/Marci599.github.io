$ErrorActionPreference = "Stop"

$ansi = [System.Text.Encoding]::GetEncoding(
    [System.Globalization.CultureInfo]::CurrentCulture.TextInfo.ANSICodePage
)
$utf8 = [System.Text.UTF8Encoding]::new($false)

# Typical mojibake markers when UTF-8 bytes were decoded as ANSI first.
$mojibakePattern = '[\u00C3\u00C2\u00E2\u0102\u0139\u00C5]'

$htmlFiles = Get-ChildItem -Path $PSScriptRoot -Recurse -File -Filter *.html
$fixedCount = 0

foreach ($file in $htmlFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, $utf8)

    if ($content -match $mojibakePattern) {
        $recovered = [System.Text.Encoding]::UTF8.GetString($ansi.GetBytes($content))

        if ($recovered -ne $content) {
            [System.IO.File]::WriteAllText($file.FullName, $recovered, $utf8)
            $fixedCount++
            Write-Host "Fixed: $($file.FullName)"
        }
    }
}

Write-Host ""
Write-Host "Done. Repaired $fixedCount file(s)."
