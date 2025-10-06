# Dashboard do Usuário - Funcionalidades Implementadas

## 📋 Visão Geral
Dashboard dedicado para usuários com `role='user'` visualizarem e gerenciarem suas tarefas atribuídas, organizadas por jornada.

## ✨ Funcionalidades

### 1. Saudação Dinâmica
- **Bom dia** (00:00 - 11:59)
- **Boa tarde** (12:00 - 17:59)
- **Boa noite** (18:00 - 23:59)
- Exibe o primeiro nome do usuário
- Mostra contagem de tarefas pendentes/em progresso

### 2. Cards de Jornadas
Cada jornada exibe:
- 🎯 Ícone emoji característico
- Nome da jornada
- Total de tarefas
- Estatísticas:
  - Tarefas pendentes (amarelo)
  - Tarefas concluídas (verde)
- Click para expandir/recolher lista de tarefas

**Jornadas Disponíveis:**
- 🎯 Estratégica (roxo)
- 💰 Financeira (verde)
- 👥 Pessoas e Cultura (rosa)
- 📊 Receita e CRM (azul)
- ⚙️ Operacional (laranja)

### 3. Lista de Tarefas
Ao clicar em uma jornada, exibe todas as tarefas atribuídas com:

#### Informações da Tarefa:
- Título da tarefa
- Descrição (se houver)
- Status atual com badge colorido:
  - ⏰ **Pendente** (cinza)
  - 🔵 **Em Progresso** (azul)
  - ✅ **Concluída** (verde)
- Processo relacionado (se houver)
- Data de vencimento (se houver)

#### Ações Disponíveis:
1. **Alterar Status**
   - Dropdown para mudar entre: Pendente → Em Progresso → Concluída
   - Atualização em tempo real no banco de dados
   - Toast de confirmação

2. **Botão de Comentários**
   - Abre sidebar lateral com sistema de comentários
   - Visualizar comentários de outros participantes
   - Adicionar novos comentários
   - Interface tipo chat

## 🗨️ Sistema de Comentários

### Sidebar de Comentários (`TaskCommentsSidebar`)
Funcionalidades:
- **Visualização de Comentários**
  - Lista cronológica de comentários
  - Avatar e nome do autor
  - Timestamp formatado (hora ou data)
  - Diferenciação visual (próprios comentários em azul, outros em cinza)
  - Auto-scroll para mensagens recentes

- **Adicionar Comentários**
  - Campo de texto multi-linha
  - Botão de envio
  - Feedback visual durante envio
  - Toast de confirmação

- **Design**
  - Overlay escuro ao abrir
  - Slide-in animation da direita
  - Responsivo (tela cheia no mobile, 500px no desktop)
  - Header com título e ícone
  - Footer fixo com campo de input

## 🗄️ Estrutura de Dados

### Tabelas Utilizadas:

#### `tasks`
```sql
- id (UUID)
- title (TEXT)
- description (TEXT)
- status (TEXT) → 'pending' | 'in_progress' | 'completed'
- assigned_to (UUID) → profiles.id
- journey_id (UUID) → journeys.id
- process_id (UUID) → processes.id
- due_date (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### `task_comments`
```sql
- id (UUID)
- task_id (UUID) → tasks.id
- user_id (UUID) → auth.users.id
- comment (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔐 Segurança (RLS)
- Usuários só visualizam tarefas atribuídas a eles (`assigned_to = profile.id`)
- Comentários são filtrados por tarefas acessíveis ao usuário
- Políticas de RLS no Supabase garantem isolamento de dados

## 🎨 UI/UX

### Animações:
- Fade-in e slide-in ao expandir lista de tarefas
- Hover effects nos cards de jornada
- Gradiente de fundo ao passar o mouse
- Rotação da seta (ChevronRight) ao expandir
- Pulse animation no indicador de seleção

### Responsividade:
- Grid de 1 coluna (mobile)
- Grid de 2 colunas (tablet)
- Grid de 3 colunas (desktop)
- Sidebar de comentários em tela cheia no mobile

### Feedback Visual:
- Loading spinner durante carregamento
- Toast notifications para ações (sucesso/erro)
- Estados vazios amigáveis
- Animação de envio nos comentários

## 📂 Arquivos Criados/Modificados

### Novos Arquivos:
1. `src/components/dashboard/UserDashboard.jsx` (367 linhas)
   - Dashboard principal para usuários comuns
   
2. `src/components/tasks/TaskCommentsSidebar.jsx` (180 linhas)
   - Componente de sidebar de comentários

### Arquivos Modificados:
3. `src/pages/DashboardPage.jsx`
   - Adicionado condicional para renderizar UserDashboard quando `role='user'`

## 🚀 Como Testar

1. **Login como Usuário Comum:**
   - Fazer login com conta que tenha `role='user'` no perfil
   - E que esteja associada a uma empresa

2. **Verificar Tarefas Atribuídas:**
   - Certifique-se de que o usuário tem tarefas atribuídas
   - Pode atribuir tarefas em `/planejamento-estrategico`

3. **Testar Funcionalidades:**
   - ✅ Verificar saudação dinâmica
   - ✅ Clicar nos cards de jornada
   - ✅ Visualizar lista de tarefas
   - ✅ Alterar status das tarefas
   - ✅ Abrir sidebar de comentários
   - ✅ Adicionar comentários
   - ✅ Visualizar comentários de outros

## 🔧 Próximas Melhorias Sugeridas

- [ ] Filtros de tarefas (por status, data, etc.)
- [ ] Ordenação de tarefas
- [ ] Notificações para tarefas próximas do vencimento
- [ ] Modal de detalhes completos da tarefa
- [ ] Histórico de alterações de status
- [ ] Anexos nos comentários (já preparado no banco)
- [ ] Menções (@) nos comentários
- [ ] Reações/likes nos comentários
- [ ] Busca de tarefas
- [ ] Exportar lista de tarefas (PDF/Excel)

## 📝 Observações Técnicas

- Utiliza React Hooks (useState, useEffect, useRef)
- Integração com Supabase para queries em tempo real
- Toast notifications via react-hot-toast
- Ícones do Lucide React
- Estilização com Tailwind CSS
- Arquitetura de componentes reutilizáveis
