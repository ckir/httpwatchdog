$counter = 0
while ($true) {
    $counter++
    Write-Host "Running $counter times"
    node.exe HTTPWatchdog.js --port=9999 --timeout=300000node HTTPWatchdog.js --port=9999 --timeout=300000
    Start-Sleep -Seconds 1.5
}

