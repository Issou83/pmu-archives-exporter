# Script PowerShell pour lancer les tests et afficher les résultats

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LANCEMENT DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Join-Path $PSScriptRoot "test-avec-log.js"

if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Fichier test-avec-log.js non trouvé!" -ForegroundColor Red
    exit 1
}

# Nettoyer les anciens fichiers
if (Test-Path "test-log.txt") {
    Remove-Item "test-log.txt" -Force
}
if (Test-Path "test-avec-log-results.json") {
    Remove-Item "test-avec-log-results.json" -Force
}

Write-Host "🔄 Lancement du test..." -ForegroundColor Yellow
Write-Host ""

# Lancer le test en arrière-plan et suivre le fichier de log
$job = Start-Job -ScriptBlock {
    param($scriptPath)
    Set-Location $using:PSScriptRoot
    node $scriptPath 2>&1
} -ArgumentList $scriptPath

# Suivre le fichier de log
$logFile = Join-Path $PSScriptRoot "test-log.txt"
$lastSize = 0

Write-Host "📊 Suivi du test en cours..." -ForegroundColor Yellow
Write-Host ""

while ($job.State -eq "Running" -or (Test-Path $logFile)) {
    if (Test-Path $logFile) {
        $currentSize = (Get-Item $logFile).Length
        if ($currentSize -gt $lastSize) {
            $content = Get-Content $logFile -Raw
            $newContent = $content.Substring($lastSize)
            if ($newContent.Length -gt 0) {
                Write-Host $newContent -NoNewline
            }
            $lastSize = $currentSize
        }
    }
    Start-Sleep -Milliseconds 500
}

# Attendre la fin du job
Wait-Job $job | Out-Null
$output = Receive-Job $job
Remove-Job $job

# Afficher les résultats finaux
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RÉSULTATS FINAUX" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "test-avec-log-results.json") {
    $results = Get-Content "test-avec-log-results.json" | ConvertFrom-Json
    
    Write-Host "📊 Résultats par test:" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($result in $results) {
        $statusColor = if ($result.status -eq "success") { "Green" } else { "Red" }
        $statusIcon = if ($result.status -eq "success") { "✅" } else { "❌" }
        
        Write-Host "  $statusIcon $($result.test)" -ForegroundColor $statusColor
        
        if ($result.status -eq "success") {
            Write-Host "     ⏱️  Durée: $($result.duration)s" -ForegroundColor Gray
            Write-Host "     📊 Réunions: $($result.totalReunions)" -ForegroundColor Gray
            Write-Host "     📈 Rapports: $($result.withReports) ($($result.reportRate)%)" -ForegroundColor Gray
            Write-Host "     🏇 Hippodromes inconnus: $($result.unknownHippo)" -ForegroundColor Gray
        } else {
            Write-Host "     ❌ Erreur: $($result.error)" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    $success = ($results | Where-Object { $_.status -eq "success" }).Count
    $total = $results.Count
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "RÉSUMÉ" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ Succès: $success/$total" -ForegroundColor Green
    Write-Host "❌ Échecs: $($total - $success)/$total" -ForegroundColor Red
    
    if ($success -gt 0) {
        $avgReportRate = ($results | Where-Object { $_.reportRate } | Measure-Object -Property reportRate -Average).Average
        $totalUnknown = ($results | Where-Object { $_.unknownHippo } | Measure-Object -Property unknownHippo -Sum).Sum
        
        Write-Host "📈 Taux moyen de rapports: $([math]::Round($avgReportRate, 1))%" -ForegroundColor Yellow
        Write-Host "🏇 Total hippodromes inconnus: $totalUnknown" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Aucun fichier de résultats trouvé!" -ForegroundColor Red
}

Write-Host ""
Write-Host "📄 Log complet disponible dans: test-log.txt" -ForegroundColor Cyan
Write-Host "📄 Résultats JSON disponibles dans: test-avec-log-results.json" -ForegroundColor Cyan

