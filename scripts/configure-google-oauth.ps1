param(
  [Parameter(Mandatory = $false)]
  [string]$GoogleClientId,

  [Parameter(Mandatory = $false)]
  [switch]$ImportCalendar,

  [Parameter(Mandatory = $false)]
  [string]$FirebaseApiKey,

  [Parameter(Mandatory = $false)]
  [string]$FirebaseAuthDomain,

  [Parameter(Mandatory = $false)]
  [string]$FirebaseProjectId,

  [Parameter(Mandatory = $false)]
  [string]$FirebaseAppId,

  [Parameter(Mandatory = $false)]
  [string]$FirebaseMessagingSenderId,

  [Parameter(Mandatory = $false)]
  [string]$FirebaseStorageBucket,

  [Parameter(Mandatory = $false)]
  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"

function Require-Gh {
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI (gh) nao foi encontrado. Instale ou autentique o GitHub CLI antes de configurar o deploy."
  }

  gh auth status *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "GitHub CLI nao esta autenticado. Rode: gh auth login"
  }
}

function Prompt-SecretValue([string]$Name, [string]$CurrentValue, [bool]$Required) {
  if ($CurrentValue) {
    return $CurrentValue.Trim()
  }

  $value = Read-Host $Name
  $value = $value.Trim()
  if ($Required -and -not $value) {
    throw "$Name e obrigatorio."
  }
  return $value
}

function Set-GhSecret([string]$Name, [string]$Value) {
  if (-not $Value) {
    return
  }

  $Value | gh secret set $Name
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao salvar secret $Name."
  }
}

Require-Gh

$GoogleClientId = Prompt-SecretValue "Google OAuth Client ID Web (ex: ...apps.googleusercontent.com)" $GoogleClientId $true

Set-GhSecret "VITE_GOOGLE_CLIENT_ID" $GoogleClientId
Set-GhSecret "VITE_GOOGLE_CONTACTS_SCOPE" "https://www.googleapis.com/auth/contacts.readonly"
Set-GhSecret "VITE_GOOGLE_CALENDAR_SCOPE" "https://www.googleapis.com/auth/calendar.readonly"
Set-GhSecret "VITE_GOOGLE_IMPORT_CALENDAR" ($(if ($ImportCalendar) { "true" } else { "false" }))

if ($FirebaseApiKey -or $FirebaseAuthDomain -or $FirebaseProjectId -or $FirebaseAppId) {
  $FirebaseApiKey = Prompt-SecretValue "Firebase API Key" $FirebaseApiKey $true
  $FirebaseAuthDomain = Prompt-SecretValue "Firebase Auth Domain" $FirebaseAuthDomain $true
  $FirebaseProjectId = Prompt-SecretValue "Firebase Project ID" $FirebaseProjectId $true
  $FirebaseAppId = Prompt-SecretValue "Firebase App ID" $FirebaseAppId $true

  Set-GhSecret "VITE_FIREBASE_API_KEY" $FirebaseApiKey
  Set-GhSecret "VITE_FIREBASE_AUTH_DOMAIN" $FirebaseAuthDomain
  Set-GhSecret "VITE_FIREBASE_PROJECT_ID" $FirebaseProjectId
  Set-GhSecret "VITE_FIREBASE_APP_ID" $FirebaseAppId
  Set-GhSecret "VITE_FIREBASE_MESSAGING_SENDER_ID" $FirebaseMessagingSenderId
  Set-GhSecret "VITE_FIREBASE_STORAGE_BUCKET" $FirebaseStorageBucket
}

if (-not $SkipDeploy) {
  gh workflow run deploy-pages.yml
  if ($LASTEXITCODE -ne 0) {
    throw "Secrets salvos, mas nao consegui disparar o deploy. Rode manualmente: gh workflow run deploy-pages.yml"
  }
}

Write-Host ""
Write-Host "Google OAuth configurado para o deploy do Grafy." -ForegroundColor Green
Write-Host "Confira em alguns instantes: https://leninn-marinho-rodrigues.github.io/grafy-cogmo-prototype/#/cadastro/empresarios"
Write-Host ""
Write-Host "Dominios que devem estar autorizados no Google OAuth Client:"
Write-Host "- https://leninn-marinho-rodrigues.github.io"
Write-Host "- http://localhost:4173"
Write-Host "- http://127.0.0.1:4173"
