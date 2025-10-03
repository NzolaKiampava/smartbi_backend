#!/usr/bin/env pwsh
# Deploy Authentication Fix

Write-Host "🔧 Adding authentication fix..." -ForegroundColor Cyan
git add api/graphql.ts UPLOAD_FIX_SUMMARY.md

Write-Host "📝 Committing changes..." -ForegroundColor Cyan
git commit -m "fix: process JWT authentication in serverless GraphQL handler before creating context"

Write-Host "🚀 Pushing to GitHub/Vercel..." -ForegroundColor Cyan
git push

Write-Host "" 
Write-Host "✅ Done! Wait 2-3 minutes for Vercel to deploy." -ForegroundColor Green
Write-Host "🌐 Then test login at: https://smartbi-rcs.vercel.app" -ForegroundColor Yellow
