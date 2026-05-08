param (
    [string]$Title = "Task Completed",
    [string]$Description = "The task has been successfully executed.",
    [string]$Status = "Success"
)

$envFile = "d:\Project\MyProject\Nexworth\apps\api\.env.local"
if (-Not (Test-Path $envFile)) {
    Write-Error "Environment file not found at $envFile"
    exit 1
}

$webhookUrl = Get-Content $envFile | Where-Object { $_ -match "^DISCORD_WEBHOOK_URL=" } | ForEach-Object { $_.Split("=")[1].Trim('"') }

if (-Not $webhookUrl) {
    Write-Error "DISCORD_WEBHOOK_URL not found in .env.local"
    exit 1
}

$color = if ($Status -eq "Success") { 3066993 } else { 15158332 } # Green vs Red

$body = @{
    username = "Antigravity Agent (Dev)"
    content  = "**[Task Notification]** $Title"
    embeds = @(
        @{
            title = $Title
            description = $Description
            color = $color
            footer = @{ text = "Nexworth System Management" }
            timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType "application/json"
