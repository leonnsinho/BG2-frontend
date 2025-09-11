@echo off
chcp 65001 >nul
echo ===================================
echo    HISTÓRICO DE BACKUPS PARTIMAP
echo ===================================
echo.

:: Verificar se é um repositório Git
git status >nul 2>&1
if errorlevel 1 (
    echo ❌ Erro: Este não é um repositório Git válido.
    pause
    exit /b 1
)

echo 📊 Status atual do repositório:
git status --porcelain
echo.

echo 📋 Histórico completo de backups:
echo.
git log --oneline --graph --decorate --all -15
echo.

echo 📅 Últimos 5 commits detalhados:
echo.
git log --pretty=format:"📅 %ad - 💬 %s - 👤 %an" --date=local -5
echo.
echo.

echo 🔍 Comandos úteis:
echo    - Para ver diferenças: git diff [commit-id]
echo    - Para ver arquivos alterados: git show --stat [commit-id]
echo    - Para ver conteúdo específico: git show [commit-id]
echo.

echo Pressione qualquer tecla para continuar...
pause >nul
