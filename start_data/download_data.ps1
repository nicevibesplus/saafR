$ProgressPreference = 'SilentlyContinue' # <--- This makes it fast
$Url = "https://download.geofabrik.de/europe/germany/nordrhein-westfalen/muenster-regbez-latest.osm.pbf"
$OutputFile = "data.osm.pbf"

Write-Host "Downloading (Progress bar hidden for speed)..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $Url -OutFile $OutputFile -UseBasicParsing
Write-Host "Done!" -ForegroundColor Green