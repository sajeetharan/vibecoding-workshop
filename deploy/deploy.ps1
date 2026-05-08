param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [string]$Region = "us-central1",
  [string]$ServiceName = "campus-vibe-board"
)

$ErrorActionPreference = "Stop"

Write-Host "Setting active project to $ProjectId"
gcloud config set project $ProjectId | Out-Null

Write-Host "Enabling required services"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com | Out-Null

Write-Host "Deploying $ServiceName from source in app/"
gcloud run deploy $ServiceName --source app --region $Region --allow-unauthenticated

Write-Host "Deployment complete."
