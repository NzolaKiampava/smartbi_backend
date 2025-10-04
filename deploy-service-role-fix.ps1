#!/usr/bin/env pwsh
# Deploy Service Role Key Fix

Write-Host "🔧 Committing service role key fix..." -ForegroundColor Cyan
git add api/upload.ts VERCEL_SERVICE_ROLE_SETUP.md UPLOAD_FIX_SUMMARY.md

Write-Host "📝 Creating commit..." -ForegroundColor Cyan
git commit -m "fix: use SUPABASE_SERVICE_ROLE_KEY for bucket operations to bypass RLS"

Write-Host "🚀 Pushing to GitHub/Vercel..." -ForegroundColor Cyan
git push

Write-Host "" 
Write-Host "⚠️  IMPORTANTE: Você precisa adicionar a variável no Vercel!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Siga os passos em: VERCEL_SERVICE_ROLE_SETUP.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumo rápido:" -ForegroundColor White
Write-Host "1. Vá para Supabase Dashboard → Settings → API" -ForegroundColor Gray
Write-Host "2. Copie a chave 'service_role' (não a 'anon'!)" -ForegroundColor Gray
Write-Host "3. Vá para Vercel → Settings → Environment Variables" -ForegroundColor Gray
Write-Host "4. Adicione: SUPABASE_SERVICE_ROLE_KEY = <sua-chave>" -ForegroundColor Gray
Write-Host "5. Redeploy o projeto" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Após isso, o upload vai funcionar!" -ForegroundColor Green
