param(
    [switch]$WithFrontend
)

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot

try {
    docker-compose up -d

    if ($WithFrontend) {
        Start-Process powershell -ArgumentList @(
            '-NoExit',
            '-Command',
            "cd '$repoRoot\\foodbridge-frontend'; npm run dev"
        )
    }

    .\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--app.demo.seed-enabled=true"
}
finally {
    Pop-Location
}
