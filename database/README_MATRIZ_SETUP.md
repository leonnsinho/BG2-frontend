# 🚀 Marco 3: Setup da Matriz Bossa Digitalizada

## 📋 Visão Geral

Esta é a implementação do Marco 3 (Dias 1-2) - estrutura completa da Matriz Bossa com:
- **5 Jornadas** de negócio fundamentais
- **143 Processos** categorizados e organizados
- Sistema de **avaliação 0-5** para cada processo
- **Diagnósticos empresariais** completos
- **Histórico e versionamento** de matrizes

## 🎯 Objetivos do Marco 3

### Dias 1-2: Estrutura Database (CONCLUÍDO ✅)
- [x] Schema completo das tabelas
- [x] Seed data com 5 jornadas
- [x] 143 processos organizados por categoria
- [x] Sistema de versionamento
- [x] Políticas de segurança RLS

### Dias 3-4: Interface Frontend (PRÓXIMO 🔄)
- [ ] Componentes de navegação das jornadas
- [ ] Interface de listagem de processos
- [ ] Sistema de filtros e busca
- [ ] Layout responsivo

### Dias 5-6: Sistema de Avaliação (PLANEJADO 📋)
- [ ] Interface de scoring 0-5
- [ ] Cálculos de maturidade
- [ ] Salvamento de avaliações
- [ ] Progresso visual

### Dias 7-8: Funcionalidades Admin (PLANEJADO 📋)
- [ ] Relatórios gerenciais
- [ ] Exportação de diagnósticos
- [ ] Gestão de versões
- [ ] Validação final

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### 1. `journeys` (5 registros)
```sql
- id: UUID (PK)
- name: Jornada Estratégica, Financeira, etc.
- slug: Identificador único
- description: Descrição detalhada
- color: Cor no tema
- icon: Ícone lucide-react
- order_index: Ordem de exibição
```

#### 2. `processes` (143 registros)
```sql
- id: UUID (PK)
- journey_id: UUID (FK -> journeys)
- name: Nome do processo
- description: Descrição detalhada
- category: Categoria dentro da jornada
- weight: Peso no cálculo (1-5)
- order_index: Ordem na lista
```

#### 3. `process_evaluations`
```sql
- id: UUID (PK)
- company_id: UUID (FK -> companies)
- process_id: UUID (FK -> processes)
- score: INTEGER (0-5)
- observations: TEXT
- evaluated_by: UUID (FK -> users)
- evaluation_date: TIMESTAMP
```

#### 4. `company_diagnoses`
```sql
- id: UUID (PK)
- company_id: UUID (FK -> companies)
- matrix_version_id: UUID (FK -> matrix_versions)
- overall_score: DECIMAL
- maturity_level: TEXT
- recommendations: JSONB
- status: completed/in_progress/draft
```

#### 5. `matrix_versions`
```sql
- id: UUID (PK)
- version_number: Versão (ex: 1.0.0)
- description: Descrição das mudanças
- is_active: BOOLEAN
- total_journeys: INTEGER
- total_processes: INTEGER
```

#### 6. `process_history`
```sql
- id: UUID (PK)
- process_id: UUID (FK -> processes)
- field_changed: Campo alterado
- old_value: Valor anterior
- new_value: Novo valor
- changed_by: UUID (FK -> users)
- change_date: TIMESTAMP
```

### Views e Triggers

- **View `diagnosis_summary`**: Resumo agregado dos diagnósticos
- **View `journey_maturity`**: Maturidade por jornada
- **Triggers**: Auto-update de timestamps e logging de mudanças

## 📊 Distribuição dos Processos

| Jornada | Processos | Categorias Principais |
|---------|-----------|---------------------|
| **Estratégica** | 30 | Planejamento, Visão, Governança, Inovação |
| **Financeira** | 32 | Controle, Planejamento, Análise, Investimentos |
| **Pessoas e Cultura** | 28 | Gestão, Desenvolvimento, Performance, Cultura |
| **Receita/CRM** | 28 | Vendas, Marketing, CRM, Customer Success |
| **Operacional** | 25 | Processos, Qualidade, Automação, Logística |
| **TOTAL** | **143** | **5 Jornadas Completas** |

## 🛠️ Setup - Instruções de Instalação

### Método 1: Script Automático (Recomendado)

```bash
# Na raiz do projeto
npm run setup:matriz
```

Isso executará um script interativo que guiará você pelos passos.

### Método 2: Manual

#### Passo 1: Schema Principal
1. Abra o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Execute o arquivo: `database/schema_matriz_bossa.sql`

#### Passo 2: Dados Seed - Parte 1
1. Execute o arquivo: `database/seed_matriz_bossa_part1.sql`
2. Aguarde a conclusão (jornadas + 62 processos)

#### Passo 3: Dados Seed - Parte 2
1. Execute o arquivo: `database/seed_matriz_bossa_part2.sql`
2. Aguarde a conclusão (81 processos restantes)

### Validação

```bash
# Validar estrutura criada
npm run validate:matriz
```

## 🔒 Segurança e Políticas RLS

Todas as tabelas possuem Row Level Security (RLS) habilitado:

- **Usuários básicos**: Podem avaliar processos de suas empresas
- **Administradores**: Acesso completo aos dados de suas empresas
- **Consultores**: Acesso amplo para múltiplas empresas
- **Super admins**: Acesso total ao sistema

## 🎨 Design System - Cores das Jornadas

```css
Estratégica: #3B82F6 (blue-500)
Financeira: #10B981 (emerald-500) 
Pessoas e Cultura: #F59E0B (amber-500)
Receita/CRM: #EF4444 (red-500)
Operacional: #8B5CF6 (violet-500)
```

## 📈 Próximos Passos (Marco 3 - Dias 3-4)

Após completar o setup do banco:

1. **Componente de Navegação das Jornadas**
   - Grid responsivo com as 5 jornadas
   - Cards coloridos com ícones
   - Contagem de processos por jornada

2. **Interface de Processos**
   - Lista filtrada por jornada
   - Busca e filtros por categoria
   - Preview das avaliações existentes

3. **Sistema de Avaliação Básico**
   - Interface de scoring 0-5
   - Salvamento automático
   - Cálculo de maturidade em tempo real

## 🐛 Troubleshooting

### Erro: "relation does not exist"
- Verifique se o schema foi executado corretamente
- Confirme que todas as tabelas foram criadas

### Erro: "permission denied"
- Verifique as políticas RLS
- Confirme que o usuário tem o perfil correto

### Contagem incorreta de processos
- Execute as queries de validação no final dos seeds
- Verifique se ambos os arquivos seed foram executados

## 📞 Suporte

Para dúvidas sobre esta implementação, consulte:
- Documentação do projeto: `guia_desenvolvimento_partimap.md`
- Logs do sistema: disponíveis no Supabase Dashboard
- Validação: `npm run validate:matriz`