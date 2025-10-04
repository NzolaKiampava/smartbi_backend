@echo off
echo.
echo ========================================
echo   DEPLOY - Correcao CORS Completa
echo ========================================
echo.

echo [1/4] Adicionando arquivos...
git add api/files.ts
git add src/services/file-analysis-database.service.ts

echo.
echo [2/4] Fazendo commit...
git commit -m "fix: adicionar headers CORS completos em todas as respostas da API de files"

echo.
echo [3/4] Enviando para GitHub...
git push

echo.
echo [4/4] Deploy concluido!
echo.
echo ========================================
echo   AGUARDE 2-3 MINUTOS
echo ========================================
echo.
echo O Vercel vai fazer o deploy automatico.
echo Depois teste novamente o download!
echo.
pause
