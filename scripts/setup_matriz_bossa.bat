@echo off
echo ===============================================
echo    PARTIMAP - SETUP MATRIZ BOSSA DIGITALIZADA
echo ===============================================
echo.

echo 📋 Passo 1: Aplicar Schema no Supabase
echo.
echo Abra o Supabase Dashboard: https://app.supabase.com
echo 1. Va em SQL Editor
echo 2. Execute o arquivo: database/schema_matriz_bossa.sql
echo 3. Pressione qualquer tecla para continuar...
pause > nul
echo.

echo 🌱 Passo 2: Inserir Dados Seed - Parte 1
echo.
echo No SQL Editor do Supabase:
echo 1. Execute o arquivo: database/seed_matriz_bossa_part1.sql
echo 2. Aguarde a execução completa
echo 3. Pressione qualquer tecla para continuar...
pause > nul
echo.

echo 🌱 Passo 3: Inserir Dados Seed - Parte 2
echo.
echo No SQL Editor do Supabase:
echo 1. Execute o arquivo: database/seed_matriz_bossa_part2.sql
echo 2. Aguarde a execução completa
echo 3. Pressione qualquer tecla para continuar...
pause > nul
echo.

echo 🔍 Passo 4: Validação da Estrutura
echo.
echo Executando script de validação...

cd /d "%~dp0.."
npm run validate:matriz

echo.
echo 🎉 Setup da Matriz Bossa concluído!
echo.
echo ✅ Próximas etapas Marco 3:
echo    - Dias 3-4: Interface de navegação das jornadas
echo    - Dias 5-6: Sistema de avaliação e scoring
echo    - Dias 7-8: Funcionalidades admin e relatórios
echo.
echo Pressione qualquer tecla para finalizar...
pause > nul