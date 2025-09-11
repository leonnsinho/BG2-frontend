@echo off
chcp 65001 >nul
echo ===================================
echo   SISTEMA DE RESTAURAÇÃO PARTIMAP
echo ===================================
echo.

:: Verificar se é um repositório Git
git status >nul 2>&1
if errorlevel 1 (
    echo ❌ Erro: Este não é um repositório Git válido.
    pause
    exit /b 1
)

echo 📋 Histórico de backups disponíveis:
echo.
git log --oneline -10
echo.

echo ⚠️  ATENÇÃO: Esta operação irá desfazer todas as mudanças
echo    não salvas e restaurar o projeto para a versão escolhida.
echo.
echo 🔍 Digite o ID do commit para restaurar (primeiros caracteres):
echo    Exemplo: a1b2c3d ou pressione ENTER para cancelar
set /p "commit_id="

if "%commit_id%"=="" (
    echo ❌ Operação cancelada pelo usuário.
    pause
    exit /b 0
)

:: Verificar se o commit existe
git cat-file -e %commit_id% 2>nul
if errorlevel 1 (
    echo ❌ Commit não encontrado: %commit_id%
    echo    Verifique o ID e tente novamente.
    pause
    exit /b 1
)

:: Mostrar informações do commit
echo.
echo 📄 Informações do commit selecionado:
git show --stat %commit_id%
echo.

echo ❓ Tem certeza que deseja restaurar para esta versão?
echo    Digite 'SIM' (maiúsculo) para confirmar ou qualquer outra coisa para cancelar:
set /p "confirmacao="

if not "%confirmacao%"=="SIM" (
    echo ❌ Operação cancelada pelo usuário.
    echo    Para confirmar, digite 'SIM' em letras maiúsculas.
    pause
    exit /b 0
)

echo.
echo 🔄 Restaurando projeto...

:: Fazer reset hard para o commit especificado
git reset --hard %commit_id%

if %errorlevel% equ 0 (
    echo ✅ Projeto restaurado com sucesso!
    echo 📅 Versão atual:
    git log --oneline -1
    echo.
    echo 📋 Status do repositório:
    git status --porcelain
) else (
    echo ❌ Erro ao restaurar projeto.
)

echo.
echo Pressione qualquer tecla para continuar...
pause >nul
