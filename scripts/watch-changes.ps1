Param(
    [string]$PathToWatch = ".",
    [string]$LogFile = "tmp/file-changes.log"
)

if (-not (Test-Path "$PSScriptRoot\..\tmp")) {
    New-Item -ItemType Directory -Path "$PSScriptRoot\..\tmp" | Out-Null
}

$absPath = Resolve-Path $PathToWatch
$fsw = New-Object System.IO.FileSystemWatcher $absPath.Path, '*'
$fsw.IncludeSubdirectories = $true
$fsw.EnableRaisingEvents = $true

function LogEvent($eventType, $e) {
    $time = Get-Date -Format o
    $line = "[$time] " + $eventType + ": " + $e.FullPath
    $line | Out-File -FilePath $LogFile -Append -Encoding utf8
    Write-Output $line
}

Register-ObjectEvent $fsw Created -SourceIdentifier FileCreated -Action { LogEvent 'Created' $Event.SourceEventArgs }
Register-ObjectEvent $fsw Changed -SourceIdentifier FileChanged -Action { LogEvent 'Changed' $Event.SourceEventArgs }
Register-ObjectEvent $fsw Deleted -SourceIdentifier FileDeleted -Action { LogEvent 'Deleted' $Event.SourceEventArgs }
Register-ObjectEvent $fsw Renamed -SourceIdentifier FileRenamed -Action { LogEvent 'Renamed' $Event.SourceEventArgs }

Write-Output "Watching $absPath.Path (subdirs included). Logging to $LogFile"

# Keep the script running
while ($true) { Start-Sleep -Seconds 1 }
