# Sistema de Backup Partimap

Sistema de backup automatizado implementado com Git para o projeto Partimap.

## 📁 Arquivos do Sistema

- **backup.bat** - Script principal para fazer backups
- **restaurar.bat** - Script para restaurar versões anteriores  
- **historico.bat** - Visualizar histórico de backups
- **menu-backup.bat** - Menu interativo para todas as funções

## 🚀 Como Usar

### Método 1: Menu Interativo (Recomendado)
1. Duplo clique em `menu-backup.bat`
2. Escolha a opção desejada no menu

### Método 2: Scripts Individuais

#### Fazer Backup
1. Duplo clique em `backup.bat`
2. Digite uma mensagem descritiva
3. Aguarde a confirmação

#### Restaurar Versão
1. Duplo clique em `restaurar.bat` 
2. Escolha o commit desejado do histórico
3. Digite 'SIM' para confirmar

#### Ver Histórico
1. Duplo clique em `historico.bat`
2. Visualize os commits anteriores

## ✅ Funcionalidades

- ✅ **Backup Automatizado**: Detecta mudanças e cria commits
- ✅ **Mensagens Descritivas**: Cada backup tem uma descrição
- ✅ **Timestamps Automáticos**: Data e hora adicionadas automaticamente
- ✅ **Restauração Segura**: Confirmação obrigatória para restaurar
- ✅ **Histórico Visual**: Lista completa de versões anteriores
- ✅ **Validações**: Verifica repositório Git e existência de commits
- ✅ **Interface Amigável**: Scripts com emojis e mensagens claras

## 📋 Exemplos de Uso

### Fazer um Backup
```
================================
   SISTEMA DE BACKUP PARTIMAP
================================

📂 Mudanças detectadas no projeto...
📝 Digite uma mensagem para este backup: Implementadas novas funcionalidades de login

✅ Backup realizado com sucesso!
📅 Data/Hora: 2025-01-11 14:30
💬 Mensagem: Implementadas novas funcionalidades de login
```

### Ver Histórico
```
===================================
   HISTÓRICO DE BACKUPS PARTIMAP
===================================

📋 Histórico completo de backups:
* 2a72171 Sistema de backup implementado - Interface limpa
* 9c0be4f Corrigir configuração do Tailwind CSS  
* 9e23a9d Atualizar documentação do projeto
```

## ⚙️ Configuração

O sistema já está configurado e pronto para uso:

- ✅ Repositório Git inicializado
- ✅ Usuário Git configurado (Leon Rodriguez)
- ✅ .gitignore configurado para React/Node.js
- ✅ Scripts de backup criados

## 🔧 Troubleshooting

### Erro "Não é um repositório Git válido"
- **Causa**: Diretório não tem Git inicializado
- **Solução**: Execute `git init` na pasta do projeto

### Erro "Commit não encontrado"  
- **Causa**: ID de commit incorreto
- **Solução**: Verifique o ID no histórico e tente novamente

### "Não há mudanças para backup"
- **Situação Normal**: Significa que não há arquivos modificados
- **Ação**: Continue trabalhando e tente fazer backup depois

## 📊 Vantagens vs Backup ZIP

| Aspecto | Backup ZIP | Sistema Git |
|---------|------------|-------------|
| **Automatização** | ❌ Manual | ✅ Automatizado |
| **Histórico** | ❌ Nomes confusos | ✅ Mensagens descritivas |
| **Espaço** | ❌ Arquivos grandes | ✅ Apenas diferenças |
| **Recuperação** | ❌ Sobrescrever tudo | ✅ Versão específica |
| **Organização** | ❌ Muitos arquivos | ✅ Histórico organizado |

## 🏆 Status do Sistema

- 🟢 **Operacional**: Sistema implementado e funcionando
- 🟢 **Testado**: Scripts validados e funcionais  
- 🟢 **Documentado**: Instruções completas disponíveis
- 🟢 **User-Friendly**: Interface simples e intuitiva

## 📝 Próximos Passos

Para usar o sistema em outros projetos:

1. Copie os arquivos .bat para o novo projeto
2. Execute `git init` na pasta
3. Configure usuário: `git config user.name "Seu Nome"`
4. Configure email: `git config user.email "seu@email.com"`
5. Adapte o .gitignore conforme necessário

---

**Sistema implementado em**: 11/09/2025  
**Versão**: 1.0  
**Status**: ✅ Ativo e Funcional
