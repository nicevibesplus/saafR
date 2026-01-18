# Define source and destination
$Url = "https://download.geofabrik.de/europe/germany/nordrhein-westfalen/muenster-regbez-latest.osm.pbf"
$OutputFile = "data.osm.pbf"

Write-Host "Starting download from Geofabrik..." -ForegroundColor Cyan

try {
    # -UseBasicParsing is used for compatibility with older Windows PowerShell versions
    # It is ignored/not needed in PowerShell Core (Linux), but harmless to include.
    Invoke-WebRequest -Uri $Url -OutFile $OutputFile -UseBasicParsing
    
    Write-Host "Success! File saved as $OutputFile" -ForegroundColor Green
}
catch {
    Write-Host "Error: The download failed." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}