param(
  [string]$BaseUrl = "https://get8.pro",
  [int]$TimeoutSec = 20
)

$ErrorActionPreference = "Stop"

function Join-Url {
  param(
    [string]$Root,
    [string]$Path
  )

  $trimmedRoot = $Root.TrimEnd("/")
  if ([string]::IsNullOrWhiteSpace($Path) -or $Path -eq "/") {
    return "$trimmedRoot/"
  }

  return "$trimmedRoot$Path"
}

function Invoke-SmokeRequest {
  param(
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -Headers @{ 'User-Agent'='Mozilla/5.0 CodexSmoke/1.0' } -TimeoutSec $TimeoutSec
    return [pscustomobject]@{
      StatusCode  = [int]$response.StatusCode
      Content     = [string]$response.Content
      ContentType = [string]$response.Headers["Content-Type"]
      Error       = $null
    }
  } catch {
    $statusCode = 0
    $content = ""
    $contentType = ""

    if ($_.Exception.Response) {
      try { $statusCode = [int]$_.Exception.Response.StatusCode.value__ } catch {}
      try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $content = $reader.ReadToEnd()
        $reader.Close()
      } catch {}
      try { $contentType = [string]$_.Exception.Response.Headers["Content-Type"] } catch {}
    }

    return [pscustomobject]@{
      StatusCode  = $statusCode
      Content     = $content
      ContentType = $contentType
      Error       = $_.Exception.Message
    }
  }
}

function Assert-Condition {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

$checks = @(
  @{
    Name = "Homepage"
    Path = "/"
    Kind = "html"
    Marker = "<title>Get8 Pro |"
  },
  @{
    Name = "Codex Module Page"
    Path = "/codex-business"
    Kind = "html"
    Marker = "codex-business"
  },
  @{
    Name = "Codex Console"
    Path = "/codex-business/app/"
    Kind = "html"
    Marker = '<form id="redeem-form" class="form">'
  },
  @{
    Name = "Codex Health"
    Path = "/codex-business/app/api/health"
    Kind = "json"
    Marker = '"service":"codex-business"'
  },
  @{
    Name = "Exchange Download"
    Path = "/exchange-download"
    Kind = "html"
    Marker = "exchange-download"
  },
  @{
    Name = "Web3 Guide"
    Path = "/web3-guide"
    Kind = "html"
    Marker = "web3-guide"
  },
  @{
    Name = "Crypto News"
    Path = "/crypto-news"
    Kind = "html"
    Marker = "crypto-news"
  }
)

$results = @()
$fallbackPatterns = @(
  'temporarily unavailable',
  'module failed to mount',
  'Codex Business service is temporarily unavailable'
)

foreach ($check in $checks) {
  $url = Join-Url -Root $BaseUrl -Path $check.Path
  $response = Invoke-SmokeRequest -Url $url
  $content = $response.Content

  Assert-Condition ($response.StatusCode -eq 200) "$($check.Name) returned HTTP $($response.StatusCode) at $url. Error: $($response.Error)"
  Assert-Condition (-not [string]::IsNullOrWhiteSpace($content)) "$($check.Name) returned an empty body at $url."
  Assert-Condition (-not $content.Contains([char]0xFFFD)) "$($check.Name) contains the Unicode replacement character at $url."

  foreach ($pattern in $fallbackPatterns) {
    Assert-Condition (-not $content.Contains($pattern)) "$($check.Name) is showing a fallback failure state at $url."
  }

  Assert-Condition ($content.Contains($check.Marker)) "$($check.Name) is missing expected marker '$($check.Marker)' at $url."

  if ($check.Kind -eq "html") {
    Assert-Condition ($content -match '<!doctype html>|<!DOCTYPE html>') "$($check.Name) did not return HTML shell content at $url."
  }

  if ($check.Kind -eq "json") {
    $json = $null
    try {
      $json = $content | ConvertFrom-Json
    } catch {
      throw "$($check.Name) did not return valid JSON at $url."
    }

    Assert-Condition ($json.ok -eq $true) "$($check.Name) did not report ok=true at $url."
    Assert-Condition ($json.service -eq "codex-business") "$($check.Name) returned an unexpected service payload at $url."
  }

  $results += [pscustomobject]@{
    Name = $check.Name
    Status = $response.StatusCode
    Url = $url
  }
}

$results | Format-Table -AutoSize | Out-String | Write-Host
Write-Host "Smoke checks passed for $BaseUrl"
