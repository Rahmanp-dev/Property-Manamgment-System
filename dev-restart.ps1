
Write-Host "Stopping Node.js processes..."
taskkill /F /IM node.exe
Write-Host "Starting Dev Server..."
npm run dev
