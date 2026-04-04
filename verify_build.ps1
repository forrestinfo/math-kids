$ErrorActionPreference = 'Continue'
$out = Invoke-WebRequest -Uri 'https://api.github.com/repos/forrestinfo/math-kids/actions/runs' -Headers @{
    'Accept' = 'application/vnd.github+json'
    'Authorization' = "Bearer $env:GITHUB_TOKEN"
    'User-Agent' = 'OpenClaw'
} -UseBasicParsing -TimeoutSec 15
$data = $out.Content | ConvertFrom-Json
$run = $data.workflow_runs[0]
Write-Output "Status: $($run.status)"
Write-Output "Conclusion: $($run.conclusion)"
Write-Output "Run ID: $($run.id)"
