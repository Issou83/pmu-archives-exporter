Write-Host "=== TEST FINAL AVEC API PRODUCTION ==="
Write-Host ""
Write-Host "Attente du redeploiement..."
Start-Sleep -Seconds 35

$start = Get-Date
try {
    $r = Invoke-WebRequest -Uri "https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2024&months=janvier&reunionNumbers=1&countries=FR" -UseBasicParsing -TimeoutSec 70
    $dur = ((Get-Date) - $start).TotalSeconds
    Write-Host "OK: Reponse en $([math]::Round($dur, 2)) secondes"
    
    $d = $r.Content | ConvertFrom-Json
    Write-Host "Total: $($d.Count) reunions"
    Write-Host ""
    
    Write-Host "=== VERIFICATION DES DATES (10 premieres) ==="
    $d | Select-Object -First 10 | ForEach-Object {
        Write-Host "  - $($_.hippodrome) R$($_.reunionNumber): $($_.dateLabel) ($($_.dateISO))"
    }
    Write-Host ""
    
    $uniqueDates = ($d | Select-Object -ExpandProperty dateISO -Unique).Count
    $totalDates = $d.Count
    $datesEnding01 = ($d | Where-Object { $_.dateISO -match '-01$' }).Count
    $datesNot01 = $totalDates - $datesEnding01
    
    Write-Host "STATISTIQUES:"
    Write-Host "  - Dates uniques: $uniqueDates / $totalDates"
    Write-Host "  - Dates se terminant par '-01' (fallback?): $datesEnding01 / $totalDates"
    Write-Host "  - Dates variees (pas fallback): $datesNot01 / $totalDates"
    Write-Host ""
    
    if ($datesEnding01 -eq $totalDates) {
        Write-Host "  ATTENTION: Toutes les dates utilisent le fallback (1er jour)"
    } elseif ($datesEnding01 -gt ($totalDates * 0.5)) {
        Write-Host "  ATTENTION: Plus de 50% des dates utilisent le fallback"
    } else {
        Write-Host "  OK: Les dates sont variees, extraction depuis pages individuelles fonctionne !"
    }
} catch {
    $msg = $_.Exception.Message
    Write-Host "ERREUR: $msg"
}
