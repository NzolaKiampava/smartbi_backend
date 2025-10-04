# ============================================
# Deploy Script - SmartBI Backend
# Fix: Use SERVICE_ROLE_KEY for file uploads
# ============================================

Write-Host "`n=== SmartBI Backend Deploy ===" -ForegroundColor Cyan
Write-Host "Deploying: Remove auto bucket creation, use existing bucket" -ForegroundColor Yellow

# Stage changes
Write-Host "`n[1/4] Staging changes..." -ForegroundColor Green
git add api/upload.ts PRODUCTION_SETUP.md

# Commit
Write-Host "`n[2/4] Committing..." -ForegroundColor Green
git commit -m "fix: remove auto bucket creation, use existing file-uploads bucket

- Removed automatic bucket creation from api/upload.ts
- Bucket 'file-uploads' must be created manually in Supabase
- Still requires SUPABASE_SERVICE_ROLE_KEY for RLS bypass
- Updated documentation in PRODUCTION_SETUP.md"

# Push
Write-Host "`n[3/4] Pushing to GitHub..." -ForegroundColor Green
git push

Write-Host "`n[4/4] Deploy complete!" -ForegroundColor Green

# Next steps
Write-Host "`n=== IMPORTANT: Next Steps ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "✓ Bucket 'file-uploads' já criado manualmente no Supabase" -ForegroundColor Green
Write-Host ""
Write-Host "1. Adicionar SUPABASE_SERVICE_ROLE_KEY no Vercel:" -ForegroundColor White
Write-Host "   → https://vercel.com/nzolaKiampava/smartbi-backend/settings/environment-variables" -ForegroundColor Gray
Write-Host "   → Obter key: Supabase Dashboard -> Settings -> API -> service_role key" -ForegroundColor Gray
Write-Host "   → Adicionar: SUPABASE_SERVICE_ROLE_KEY = [sua-service-role-key]" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Redesploy no Vercel:" -ForegroundColor White
Write-Host "   → Vercel vai fazer deploy automaticamente deste push, OU" -ForegroundColor Gray
Write-Host "   → Redesploy manual: https://vercel.com/nzolaKiampava/smartbi-backend" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Testar upload em: https://smartbi-rcs.vercel.app" -ForegroundColor White
Write-Host ""
Write-Host "📖 Detalhes completos em: PRODUCTION_SETUP.md" -ForegroundColor Cyan
Write-Host ""
