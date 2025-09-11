# Sistema de Backup Automatizado com Git

## Visão Geral

Este sistema foi desenvolvido para substituir o processo manual de backup por compactação ZIP, implementando uma solução automatizada baseada em Git que oferece controle de versão, histórico completo de mudanças e facilidade de uso através de scripts batch personalizados.

## Objetivos

- **Automatizar backups**: Eliminar a necessidade de compactar manualmente o projeto em ZIP
- **Controle de versão**: Manter histórico completo de todas as modificações
- **Facilidade de uso**: Scripts simples que qualquer pessoa pode executar
- **Segurança**: Validações e confirmações para evitar perda de dados
- **Rastreabilidade**: Mensagens descritivas para cada backup

## Componentes do Sistema

### 1. Repositório Git
- **Inicialização**: `git init` no diretório do projeto
- **Configuração**: Nome e email do usuário configurados
- **Ignore**: Arquivo `.gitignore` configurado para excluir arquivos desnecessários

### 2. Scripts de Automação

#### `backup.bat` - Script de Backup
**Localização**: Raiz do projeto
**Função**: Automatizar o processo de backup com Git

**Fluxo de execução**:
1. Verifica se há mudanças no projeto
2. Solicita mensagem descritiva do commit
3. Adiciona todos os arquivos modificados
4. Cria commit com timestamp e mensagem
5. Exibe confirmação do backup realizado

#### `restaurar.bat` - Script de Restauração
**Localização**: Raiz do projeto
**Função**: Restaurar o projeto para uma versão anterior específica

**Fluxo de execução**:
1. Exibe histórico de commits disponíveis
2. Solicita ID do commit desejado
3. Valida se o commit existe
4. Confirma a operação com o usuário
5. Executa o reset para a versão escolhida

## Implementação Passo a Passo

### Pré-requisitos
- Git instalado no sistema
- Acesso ao terminal/prompt de comando
- Conhecimento básico de Git (opcional)

### 1. Configuração Inicial

```bash
# 1. Navegar até o diretório do projeto
cd "caminho/para/seu/projeto"

# 2. Inicializar repositório Git
git init

# 3. Configurar usuário (substitua pelos seus dados)
git config user.name "Seu Nome"
git config user.email "seu.email@exemplo.com"

# 4. Criar arquivo .gitignore (se não existir)
# Adicionar as exclusões necessárias:
node_modules/
dist/
*.log
.env
.DS_Store
```

### 2. Criação do arquivo backup.bat

```batch
@echo off
chcp 65001 >nul
echo ================================
echo    SISTEMA DE BACKUP WEBPLAN
echo ================================
echo.

:: Verificar se há mudanças
git status --porcelain >nul 2>&1
if errorlevel 1 (
    echo ❌ Erro: Este não é um repositório Git válido.
    echo    Execute 'git init' primeiro.
    pause
    exit /b 1
)

:: Verificar se há mudanças para commit
git diff-index --quiet HEAD 2>nul
if %errorlevel% equ 0 (
    echo ✅ Não há mudanças para fazer backup.
    echo    Todos os arquivos estão atualizados.
    pause
    exit /b 0
)

echo 📂 Mudanças detectadas no projeto...
echo.
echo 📝 Digite uma mensagem para este backup:
set /p "commit_message="

if "%commit_message%"=="" (
    echo ❌ Mensagem de commit não pode estar vazia.
    pause
    exit /b 1
)

echo.
echo 🔄 Fazendo backup...

:: Adicionar todos os arquivos
git add .

:: Criar commit com timestamp
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set mydate=%%c-%%b-%%a
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a:%%b
git commit -m "[%mydate% %mytime%] %commit_message%"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Backup realizado com sucesso!
    echo 📅 Data/Hora: %mydate% %mytime%
    echo 💬 Mensagem: %commit_message%
    echo.
    echo 📊 Status atual do repositório:
    git log --oneline -5
) else (
    echo ❌ Erro ao fazer backup.
)

echo.
pause
```

### 3. Criação do arquivo restaurar.bat

```batch
@echo off
chcp 65001 >nul
echo ===================================
echo   SISTEMA DE RESTAURAÇÃO WEBPLAN
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
echo    Exemplo: a1b2c3d ou a1b2c3d4e5f6g7h8
set /p "commit_id="

if "%commit_id%"=="" (
    echo ❌ ID do commit não pode estar vazio.
    pause
    exit /b 1
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
echo    Digite 'sim' para confirmar ou qualquer outra coisa para cancelar:
set /p "confirmacao="

if /i not "%confirmacao%"=="sim" (
    echo ❌ Operação cancelada pelo usuário.
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
) else (
    echo ❌ Erro ao restaurar projeto.
)

echo.
pause
```

## Como Usar o Sistema

### Fazer Backup
1. Duplo clique em `backup.bat`
2. Digite uma mensagem descritiva das mudanças
3. Pressione Enter
4. Aguarde a confirmação

### Restaurar Versão
1. Duplo clique em `restaurar.bat`
2. Visualize o histórico de commits
3. Digite o ID do commit desejado
4. Confirme a operação
5. Aguarde a restauração

## Vantagens do Sistema

### Comparado ao ZIP Manual
- ✅ **Automático**: Não precisa compactar manualmente
- ✅ **Histórico**: Mantém registro de todas as versões
- ✅ **Mensagens**: Cada backup tem uma descrição
- ✅ **Timestamps**: Data e hora automáticas
- ✅ **Diferenças**: Mostra apenas arquivos modificados
- ✅ **Restauração específica**: Volta para qualquer versão

### Recursos Avançados
- ✅ **Validação**: Verifica se há mudanças antes do backup
- ✅ **Confirmação**: Evita operações acidentais
- ✅ **Feedback visual**: Mensagens claras de status
- ✅ **Histórico limitado**: Mostra apenas commits recentes
- ✅ **Encoding UTF-8**: Suporte a caracteres especiais

## Implementação em Outros Projetos

### 1. Cópia Rápida
```bash
# Copiar arquivos necessários para novo projeto
copy backup.bat "caminho/novo/projeto/"
copy restaurar.bat "caminho/novo/projeto/"
copy .gitignore "caminho/novo/projeto/" (se aplicável)
```

### 2. Configuração por Projeto
```bash
cd "caminho/novo/projeto"
git init
git config user.name "Seu Nome"
git config user.email "seu.email@exemplo.com"
```

### 3. Customização do .gitignore
Adapte o `.gitignore` conforme o tipo de projeto:

**React/Node.js**:
```
node_modules/
dist/
build/
.env
*.log
.DS_Store
```

**PHP**:
```
vendor/
.env
*.log
cache/
.DS_Store
```

**Python**:
```
__pycache__/
*.pyc
venv/
.env
*.log
.DS_Store
```

## Estrutura de Arquivos Final

```
projeto/
├── backup.bat           # Script de backup
├── restaurar.bat        # Script de restauração  
├── .gitignore          # Exclusões do Git
├── .git/               # Diretório do Git (oculto)
└── [arquivos do projeto]
```

## Troubleshooting

### Problemas Comuns

**1. "Este não é um repositório Git válido"**
- Solução: Execute `git init` no diretório

**2. "Commit não encontrado"**
- Solução: Verifique o ID do commit no histórico

**3. "Erro ao fazer backup"**
- Solução: Verifique permissões de escrita no diretório

**4. Caracteres especiais não aparecem**
- Solução: O script já inclui `chcp 65001` para UTF-8

### Comandos Git Úteis

```bash
# Ver status atual
git status

# Ver histórico completo
git log --oneline

# Ver diferenças não commitadas
git diff

# Ver diferenças de um commit específico
git show [commit-id]

# Voltar para o último commit
git reset --hard HEAD
```

## Considerações de Segurança

1. **Backup remoto**: Considere usar GitHub/GitLab para backup na nuvem
2. **Dados sensíveis**: Sempre configure o `.gitignore` adequadamente
3. **Confirmações**: Scripts incluem validações para evitar erros
4. **Reversibilidade**: Git permite desfazer qualquer operação

## Conclusão

Este sistema oferece uma solução robusta e fácil de usar para backup de projetos, substituindo métodos manuais por uma abordagem automatizada e profissional. A implementação em outros projetos é simples e rápida, bastando copiar os scripts e fazer a configuração inicial do Git.

O sistema é especialmente útil para desenvolvedores que trabalham sozinhos ou em equipes pequenas que precisam de controle de versão sem a complexidade de ferramentas mais avançadas.
