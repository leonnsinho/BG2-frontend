# 🚀 Partimap - Sistema de Gestão SaaS

## 📋 Sobre o Projeto

O **Partimap** é uma plataforma web completa para digitalizar e automatizar a metodologia das **5 Jornadas de Gestão da Matriz Bossa**, incluindo CRM integrado, ferramentas financeiras e dashboards inteligentes.

### 🎯 Objetivos
- Digitalizar a metodologia das 5 Jornadas de Gestão
- Implementar CRM integrado para gestão comercial  
- Criar ferramentas financeiras completas (DRE, DFC, fluxo de caixa)
- Desenvolver plataforma escalável para centenas de empresas
- Automatizar processos de diagnóstico e acompanhamento

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** - Biblioteca JavaScript
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utility-first
- **React Router v6** - Roteamento
- **React Hook Form** - Gerenciamento de formulários
- **Zustand** - Gerenciamento de estado global
- **Lucide React** - Ícones

### Backend & Database
- **Supabase** - BaaS (Backend as a Service)
- **PostgreSQL** - Banco de dados
- **Row Level Security (RLS)** - Segurança a nível de linha
- **Real-time** - Updates em tempo real

### Deploy & Infraestrutura
- **Netlify** - Deploy do frontend
- **Supabase** - Hospedagem do backend
- **Stripe** - Processamento de pagamentos

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes de interface base
│   ├── layout/         # Componentes de layout
│   └── forms/          # Componentes de formulário
├── pages/              # Páginas da aplicação
├── hooks/              # Custom hooks
├── services/           # Integrações externas (Supabase, etc)
├── utils/              # Funções utilitárias
├── styles/             # Estilos globais
└── database/           # Scripts SQL e schemas
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### Instalação

1. **Clone o repositório**
```bash
git clone [url-do-repositorio]
cd partimap-frontend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. **Configure o banco de dados**
- Acesse o painel do Supabase
- Execute o script `src/database/setup.sql` no SQL Editor

5. **Execute o projeto**
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 📅 Cronograma de Desenvolvimento

### 🏗️ FASE 1 - Fundação Técnica (15 dias)
- ✅ **Marco 1**: Arquitetura e Design System (5 dias)
- ⏳ **Marco 2**: Sistema de Usuários e Permissões (5 dias)

### 🎯 FASE 2 - Core Business (20 dias)
- **Marco 3**: Matriz Bossa Digitalizada (8 dias)
- **Marco 4**: Jornada Estratégica (4 dias)
- **Marco 5**: Jornada Financeira (6 dias)
- **Marco 6**: Jornada Pessoas e Cultura (4 dias)
- **Marco 7**: Jornada Receita + CRM (6 dias)
- **Marco 8**: Jornada Operacional (4 dias)

### 🚀 FASE 3 - Automação e Entrega (15 dias)
- **Marco 9**: Sistema de Relatórios (6 dias)
- **Marco 10**: Sistema SaaS e Billing (5 dias)
- **Marco 11**: Sistema de Metas SMART (4 dias)
- **Marco 12**: Entrega Final e Treinamento (3 dias)

## 🏢 Sistema Multi-Tenant

O Partimap suporta múltiplas empresas com isolamento completo de dados:

### 👥 Perfis de Usuário
- **Super Admin**: Acesso total ao sistema
- **Consultor**: Gestão de múltiplas empresas
- **Admin Empresa**: Gestão da própria empresa
- **Usuário**: Acesso básico às funcionalidades

### 🔒 Segurança
- **Row Level Security (RLS)** habilitado
- Isolamento completo de dados entre empresas
- Autenticação JWT com Supabase Auth
- Permissões granulares por funcionalidade

## 🎨 Design System

### Cores Principais
```css
primary: #3b82f6     /* Azul principal */
secondary: #0ea5e9   /* Azul secundário */
success: #22c55e     /* Verde sucesso */
warning: #f59e0b     /* Amarelo aviso */
danger: #ef4444      /* Vermelho erro */
```

### Componentes Base
- **Buttons**: Variações primary, secondary, success, danger
- **Cards**: Layout base com shadow-soft
- **Inputs**: Formulários com validação
- **Navigation**: Header e sidebar responsivos

## 📊 Funcionalidades Principais

### 📈 5 Jornadas de Gestão
1. **Estratégica**: Planejamento e políticas
2. **Financeira**: Fluxo de caixa, DRE, DFC
3. **Pessoas e Cultura**: RH e avaliações
4. **Receita**: CRM e pipeline de vendas  
5. **Operacional**: Processos e qualidade

### 🔧 Ferramentas
- **CRM integrado** com pipeline Kanban
- **Fluxo de caixa** automatizado (8 módulos)
- **Relatórios** automáticos em PDF
- **Dashboards** executivos em tempo real
- **Sistema de metas** SMART

## 📞 Suporte

**StormCore - Equipe de Desenvolvimento**
- 📧 Email: contato@stormcore.com.br
- 🌐 Website: www.stormcore.com.br

---

## 📄 Licença

Este projeto é propriedade da **Bossa Focus** e **StormCore**.
Todos os direitos reservados.

---

> **Transformando metodologia em tecnologia escalável** 🚀+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
