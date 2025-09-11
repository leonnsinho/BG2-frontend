@echo off
chcp 65001 >nul
echo ===================================
echo     MENU SISTEMA BACKUP PARTIMAP
echo ===================================
echo.
echo Escolha uma opção:
echo.
echo 1. 💾 Fazer Backup
echo 2. 🔄 Restaurar Versão
echo 3. 📋 Ver Histórico
echo 4. 📊 Status do Projeto
echo 5. ❌ Sair
echo.
set /p "opcao=Digite sua escolha (1-5): "

if "%opcao%"=="1" (
    call backup.bat
    goto menu
)
if "%opcao%"=="2" (
    call restaurar.bat
    goto menu
)
if "%opcao%"=="3" (
    call historico.bat
    goto menu
)
if "%opcao%"=="4" (
    echo.
    echo 📊 Status atual do repositório:
    git status
    echo.
    echo 📈 Estatísticas do projeto:
    git log --oneline --graph --decorate -5
    echo.
    pause
    goto menu
)
if "%opcao%"=="5" (
    echo.
    echo ✅ Saindo do sistema de backup...
    exit /b 0
)

echo.
echo ❌ Opção inválida. Tente novamente.
pause
goto menu

:menu
cls
goto :eof
