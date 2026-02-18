$ErrorActionPreference = "Stop"

$today = Get-Date -Format "yyyy-MM-dd"
# Handles both:
# - "Updated on 2026-02-18"
# - "Updated on`n    2026-02-18"
$patternWithDate = '(Updated on)(\s*)\d{4}-\d{2}-\d{2}'
$replacementWithDate = '${1}${2}' + $today

# Handles:
# - "Updated on</a>"
# - "Updated on`n    </a>"
$patternWithoutDate = '(Updated on)(\s*)(</a>)'
$replacementWithoutDate = '${1}${2}' + $today + '${3}'

$htmlFiles = Get-ChildItem -Path $PSScriptRoot -Recurse -File -Filter *.html
$updatedCount = 0
$filesWithMarker = 0

foreach ($file in $htmlFiles) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $hasUtf8Bom = $bytes.Length -ge 3 -and
        $bytes[0] -eq 0xEF -and
        $bytes[1] -eq 0xBB -and
        $bytes[2] -eq 0xBF

    if ($hasUtf8Bom) {
        $content = [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
    }
    else {
        $content = [System.Text.Encoding]::UTF8.GetString($bytes)
    }

    $updated = [regex]::Replace($content, $patternWithDate, $replacementWithDate)
    $updated = [regex]::Replace($updated, $patternWithoutDate, $replacementWithoutDate)

    if ($content -match 'Updated on') {
        $filesWithMarker++
    }

    if ($updated -ne $content) {
        $writeEncoding = if ($hasUtf8Bom) {
            [System.Text.UTF8Encoding]::new($true)
        }
        else {
            [System.Text.UTF8Encoding]::new($false)
        }

        [System.IO.File]::WriteAllText(
            $file.FullName,
            $updated,
            $writeEncoding
        )
        $updatedCount++
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host ""
Write-Host "Done. Updated $updatedCount file(s) to: Updated on $today"
Write-Host "HTML files with 'Updated on' marker: $filesWithMarker / $($htmlFiles.Count)"
