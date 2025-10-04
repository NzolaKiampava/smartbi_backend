# Script de Deploy - Correção CORS no download de ficheiros
Write-Host "🚀 Iniciando deploy da correção CORS..." -ForegroundColor Green
Write-Host ""

# Adicionar arquivos
Write-Host "📝 Adicionando arquivos ao Git..." -ForegroundColor Cyan
git add api/files.ts
git add src/services/file-analysis-database.service.ts
git add src/resolvers/file-analysis.resolvers.ts
git add src/schema/file-analysis.schema.ts
git add testing/

# Commit
Write-Host "💾 Fazendo commit..." -ForegroundColor Cyan
git commit -m "fix: adicionar headers CORS corretos para download de ficheiros"

# Push
Write-Host "📤 Enviando para o repositório..." -ForegroundColor Cyan
git push

Write-Host ""
Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host "⏳ Aguarde 2-3 minutos para o Vercel fazer o deploy automático" -ForegroundColor Yellow
Write-Host ""
Write-Host "🧪 Depois teste novamente:" -ForegroundColor Cyan
Write-Host "   1. Listar: GET https://smartbi-backend-psi.vercel.app/api/files" -ForegroundColor White
Write-Host "   2. Download: GET https://smartbi-backend-psi.vercel.app/api/files/{id}/download" -ForegroundColor White
