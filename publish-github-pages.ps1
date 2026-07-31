$ErrorActionPreference = 'Stop'

$ProjectRoot = $PSScriptRoot
$DistRoot = Join-Path $ProjectRoot 'dist'
$PublishRoot = 'C:\petrov_usb_publish'

Write-Host ''
Write-Host '=== PETROV_USB GitHub Pages deployment ==='
Write-Host ''

if (-not (Test-Path -LiteralPath $PublishRoot)) {
    throw "Publish directory not found: $PublishRoot"
}

$PublishGitRoot = Join-Path $PublishRoot '.git'

if (-not (Test-Path -LiteralPath $PublishGitRoot)) {
    throw "Directory is not a Git repository: $PublishRoot"
}

Write-Host '[1/5] Building production version...'

Push-Location $ProjectRoot

try {
    & npm.cmd run build

    if ($LASTEXITCODE -ne 0) {
        throw 'npm run build failed.'
    }
}
finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $DistRoot)) {
    throw "Build directory not found: $DistRoot"
}

Write-Host '[2/5] Removing previous published files...'

Get-ChildItem -LiteralPath $PublishRoot -Force |
    Where-Object {
        $_.Name -ne '.git'
    } |
    Remove-Item -Recurse -Force

Write-Host '[3/5] Copying new build...'

Get-ChildItem -LiteralPath $DistRoot -Force |
    ForEach-Object {
        Copy-Item `
            -LiteralPath $_.FullName `
            -Destination $PublishRoot `
            -Recurse `
            -Force
    }

$PublishedHeadersPath = Join-Path $PublishRoot '_headers'

if (Test-Path -LiteralPath $PublishedHeadersPath) {
    Remove-Item -LiteralPath $PublishedHeadersPath -Force
}

$RequiredFiles = @(
    'index.html',
    '.nojekyll',
    'robots.txt',
    'content\cases.json'
)

foreach ($RelativePath in $RequiredFiles) {
    $FullPath = Join-Path $PublishRoot $RelativePath

    if (-not (Test-Path -LiteralPath $FullPath)) {
        throw "Required file is missing: $RelativePath"
    }
}

Write-Host '[4/5] Checking Git changes...'

Push-Location $PublishRoot

try {
    & git add -A

    if ($LASTEXITCODE -ne 0) {
        throw 'git add failed.'
    }

    & git diff --cached --quiet
    $DiffExitCode = $LASTEXITCODE

    if ($DiffExitCode -eq 0) {
        Write-Host ''
        Write-Host 'No changes to publish.'
        Write-Host 'The published site is already up to date.'
        Write-Host ''
        return
    }

    if ($DiffExitCode -ne 1) {
        throw 'Unable to check Git changes.'
    }

    Write-Host '[5/5] Publishing to GitHub...'

    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $CommitMessage = "Publish PETROV_USB $Timestamp"

    & git commit -m $CommitMessage

    if ($LASTEXITCODE -ne 0) {
        throw 'git commit failed.'
    }

    & git push origin main

    if ($LASTEXITCODE -ne 0) {
        throw 'git push failed.'
    }
}
finally {
    Pop-Location
}

Write-Host ''
Write-Host 'Deployment completed successfully.'
Write-Host 'Site URL: https://detective-quest.github.io/'
Write-Host ''