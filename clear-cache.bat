@echo off
echo ====================================
echo  LIMPANDO CACHE DO PROJETO
echo ====================================
echo.

REM Limpar dist
if exist dist (
    echo [1/3] Removendo pasta dist...
    rd /s /q dist
    echo      ✓ dist removido
) else (
    echo      - dist nao encontrado
)

REM Limpar cache do Vite
if exist node_modules\.vite (
    echo [2/3] Removendo cache do Vite...
    rd /s /q node_modules\.vite
    echo      ✓ Cache Vite removido
) else (
    echo      - Cache Vite nao encontrado
)

REM Limpar cache do navegador (instruções)
echo [3/3] Cache do navegador...
echo      ! IMPORTANTE: Pressione Ctrl+Shift+R no navegador
echo        para forcar recarregamento sem cache!

echo.
echo ====================================
echo  CACHE LIMPO COM SUCESSO!
echo ====================================
echo.
echo Agora execute: npm run dev
echo.
pause
