$ErrorActionPreference = 'Stop'

$ProjectRoot = $PSScriptRoot
$DistRoot = Join-Path $ProjectRoot 'dist'

# Репозиторий корневого сайта detective-quest.github.io
$PublishRoot = 'C:\petrov_usb_publish'

# Сайт Василия публикуется только в подпапку /site/
$SitePublishRoot = Join-Path $PublishRoot 'site'

Write-Host ''
Write-Host '=== VASILY COMPUTER GitHub Pages deployment ==='
Write-Host ''

# ---------------------------------------------------------
# 1. Проверка папок и Git-репозитория
# ---------------------------------------------------------

if (-not (Test-Path -LiteralPath $PublishRoot)) {
    throw "Publish directory not found: $PublishRoot"
}

$PublishGitRoot = Join-Path $PublishRoot '.git'

if (-not (Test-Path -LiteralPath $PublishGitRoot)) {
    throw "Directory is not a Git repository: $PublishRoot"
}

$RootIndexPath = Join-Path $PublishRoot 'index.html'

if (-not (Test-Path -LiteralPath $RootIndexPath)) {
    throw 'Root Igor Petrov site is missing index.html. Deployment stopped.'
}

$RemoteUrl = (
    & git `
        -C $PublishRoot `
        remote get-url origin |
        Select-Object -First 1
).Trim()

if ($LASTEXITCODE -ne 0) {
    throw 'Unable to read Git remote URL.'
}

if (
    $RemoteUrl -notmatch
    'detective-quest\.github\.io'
) {
    throw "Unexpected publish repository: $RemoteUrl"
}

$CurrentBranchOutput = @(
    & git `
        -C $PublishRoot `
        rev-parse `
        --abbrev-ref `
        HEAD 2>&1
)

$GitBranchExitCode = $LASTEXITCODE

if (
    $GitBranchExitCode -ne 0 -or
    $CurrentBranchOutput.Count -eq 0
) {
    throw 'Unable to determine the current Git branch.'
}

$CurrentBranch = (
    $CurrentBranchOutput |
        Select-Object -First 1
).ToString().Trim()

if ($CurrentBranch -eq 'HEAD') {
    throw 'The publish repository is in detached HEAD state.'
}

if ($CurrentBranch -ne 'main') {
    throw "Expected branch main, current branch: $CurrentBranch"
}

$InitialGitStatus = @(
    & git `
        -C $PublishRoot `
        status --porcelain
)

if ($LASTEXITCODE -ne 0) {
    throw 'Unable to check the publish repository status.'
}

if ($InitialGitStatus.Count -gt 0) {
    Write-Host ''
    Write-Host 'The publish repository contains uncommitted changes:'
    Write-Host ''

    $InitialGitStatus |
        ForEach-Object {
            Write-Host $_
        }

    Write-Host ''

    throw 'Deployment stopped to protect existing files.'
}

Write-Host '[1/6] Safety checks passed.'
Write-Host "Repository: $RemoteUrl"
Write-Host "Target: $SitePublishRoot"
Write-Host ''

# ---------------------------------------------------------
# 2. Production build
# ---------------------------------------------------------

Write-Host '[2/6] Building production version...'

Push-Location $ProjectRoot

try {
    & npm.cmd run build

    if ($LASTEXITCODE -ne 0) {
        throw 'npm.cmd run build failed.'
    }
}
finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $DistRoot)) {
    throw "Build directory not found: $DistRoot"
}

# ---------------------------------------------------------
# 3. Очистка только папки /site/
# ---------------------------------------------------------

Write-Host '[3/6] Updating only the /site/ directory...'

if (-not (Test-Path -LiteralPath $SitePublishRoot)) {
    New-Item `
        -ItemType Directory `
        -Path $SitePublishRoot `
        -Force |
        Out-Null
}
else {
    Get-ChildItem `
        -LiteralPath $SitePublishRoot `
        -Force |
        Remove-Item `
            -Recurse `
            -Force
}

# Корневая папка сайта Игоря здесь не затрагивается.

# ---------------------------------------------------------
# 4. Копирование новой сборки
# ---------------------------------------------------------

Write-Host '[4/6] Copying the Vasily computer build...'

Get-ChildItem `
    -LiteralPath $DistRoot `
    -Force |
    ForEach-Object {
        Copy-Item `
            -LiteralPath $_.FullName `
            -Destination $SitePublishRoot `
            -Recurse `
            -Force
    }

# Cloudflare-файл на GitHub Pages не требуется.
$PublishedHeadersPath = Join-Path `
    $SitePublishRoot `
    '_headers'

if (Test-Path -LiteralPath $PublishedHeadersPath) {
    Remove-Item `
        -LiteralPath $PublishedHeadersPath `
        -Force
}

# ---------------------------------------------------------
# 5. Проверка собранного сайта
# ---------------------------------------------------------

Write-Host '[5/6] Checking published files...'

$RequiredPaths = @(
    'index.html',
    'assets',
    'content\cases.json',
    'content\vasily-computer\manifest.json'
)

foreach ($RelativePath in $RequiredPaths) {
    $FullPath = Join-Path `
        $SitePublishRoot `
        $RelativePath

    if (-not (Test-Path -LiteralPath $FullPath)) {
        throw "Required site file is missing: site\$RelativePath"
    }
}

# Дополнительная защита:
# корневой index.html сайта Игоря должен остаться на месте.
if (-not (Test-Path -LiteralPath $RootIndexPath)) {
    throw 'Root Igor Petrov site was unexpectedly changed. Deployment stopped.'
}

# ---------------------------------------------------------
# 6. Git commit и push только папки site
# ---------------------------------------------------------

Write-Host '[6/6] Publishing /site/ to GitHub...'

Push-Location $PublishRoot

try {
    & git add -A -- site

    if ($LASTEXITCODE -ne 0) {
        throw 'git add for the site directory failed.'
    }

    $StagedFiles = @(
        & git diff `
            --cached `
            --name-only
    )

    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to inspect staged files.'
    }

    if ($StagedFiles.Count -eq 0) {
        Write-Host ''
        Write-Host 'No changes to publish.'
        Write-Host 'The Vasily computer site is already up to date.'
        Write-Host ''

        return
    }

    $UnexpectedFiles = @(
        $StagedFiles |
            Where-Object {
                $_ -notmatch '^site/'
            }
    )

    if ($UnexpectedFiles.Count -gt 0) {
        Write-Host ''
        Write-Host 'Unexpected staged files detected:'

        $UnexpectedFiles |
            ForEach-Object {
                Write-Host $_
            }

        & git reset

        throw 'Deployment stopped. Only files inside /site/ may be published.'
    }

    Write-Host ''
    Write-Host 'Files prepared for publication:'

    $StagedFiles |
        ForEach-Object {
            Write-Host $_
        }

    Write-Host ''

    $Timestamp = Get-Date `
        -Format 'yyyy-MM-dd HH:mm:ss'

    $CommitMessage =
        "Publish Vasily computer site $Timestamp"

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
Write-Host 'Vasily site: https://detective-quest.github.io/site/'
Write-Host 'Igor site remains: https://detective-quest.github.io/'
Write-Host ''