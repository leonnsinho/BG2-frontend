-- =====================================================
-- MIGRATIONS: Sistema de Packs de Tarefas
-- =====================================================
-- Criado em: 2025-12-06
-- Objetivo: Criar estrutura para templates/packs de tarefas
--          que podem ser associados a processos e reutilizados
-- =====================================================

-- 1. Tabela de Packs de Tarefas
-- =====================================================
CREATE TABLE IF NOT EXISTS task_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_task_packs_created_by ON task_packs(created_by);
CREATE INDEX IF NOT EXISTS idx_task_packs_name ON task_packs(name);

-- Comentários
COMMENT ON TABLE task_packs IS 'Templates/packs de tarefas que podem ser reutilizados em diferentes processos';
COMMENT ON COLUMN task_packs.name IS 'Nome do pack (ex: "Onboarding de Cliente", "Implementação de CRM")';
COMMENT ON COLUMN task_packs.description IS 'Descrição do objetivo e uso deste pack';
COMMENT ON COLUMN task_packs.created_by IS 'Super Admin que criou o pack';


-- 2. Tabela de Templates de Tarefas dentro dos Packs
-- =====================================================
CREATE TABLE IF NOT EXISTS task_pack_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id UUID NOT NULL REFERENCES task_packs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  default_days_to_complete INTEGER DEFAULT 7,
  default_status VARCHAR(50) DEFAULT 'pending',
  order_in_pack INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_task_pack_templates_pack_id ON task_pack_templates(pack_id);
CREATE INDEX IF NOT EXISTS idx_task_pack_templates_order ON task_pack_templates(pack_id, order_in_pack);

-- Comentários
COMMENT ON TABLE task_pack_templates IS 'Tarefas template que fazem parte de um pack';
COMMENT ON COLUMN task_pack_templates.pack_id IS 'Referência ao pack que contém esta tarefa';
COMMENT ON COLUMN task_pack_templates.title IS 'Título da tarefa template';
COMMENT ON COLUMN task_pack_templates.description IS 'Descrição detalhada da tarefa';
COMMENT ON COLUMN task_pack_templates.default_days_to_complete IS 'Prazo padrão em dias para completar a tarefa';
COMMENT ON COLUMN task_pack_templates.default_status IS 'Status inicial da tarefa quando criada (pending, in_progress, etc)';
COMMENT ON COLUMN task_pack_templates.order_in_pack IS 'Ordem da tarefa dentro do pack (0-based index)';


-- 3. Tabela de Associação Processo <-> Pack
-- =====================================================
CREATE TABLE IF NOT EXISTS process_task_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES task_packs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(process_id, pack_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_process_task_packs_process_id ON process_task_packs(process_id);
CREATE INDEX IF NOT EXISTS idx_process_task_packs_pack_id ON process_task_packs(pack_id);

-- Comentários
COMMENT ON TABLE process_task_packs IS 'Associação entre processos e packs de tarefas disponíveis';
COMMENT ON COLUMN process_task_packs.process_id IS 'Processo que pode usar este pack';
COMMENT ON COLUMN process_task_packs.pack_id IS 'Pack de tarefas associado';


-- 4. Function para atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_task_packs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para task_packs
DROP TRIGGER IF EXISTS trigger_update_task_packs_updated_at ON task_packs;
CREATE TRIGGER trigger_update_task_packs_updated_at
  BEFORE UPDATE ON task_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_task_packs_updated_at();


-- 5. RLS (Row Level Security) Policies
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE task_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_pack_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_task_packs ENABLE ROW LEVEL SECURITY;

-- Policies para task_packs
-- Super Admins podem fazer tudo
CREATE POLICY "Super admins can manage task packs"
  ON task_packs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Todos podem ver packs (temporário - ajustar depois)
CREATE POLICY "Users can view task packs"
  ON task_packs
  FOR SELECT
  USING (true);

-- Policies para task_pack_templates
-- Super Admins podem fazer tudo
CREATE POLICY "Super admins can manage task pack templates"
  ON task_pack_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Todos podem ver templates (temporário - ajustar depois)
CREATE POLICY "Users can view templates"
  ON task_pack_templates
  FOR SELECT
  USING (true);

-- Policies para process_task_packs
-- Super Admins podem fazer tudo
CREATE POLICY "Super admins can manage process task pack associations"
  ON process_task_packs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Todos podem ver associações (temporário - ajustar depois)
CREATE POLICY "Users can view pack associations"
  ON process_task_packs
  FOR SELECT
  USING (true);


-- 6. Dados de exemplo (opcional - comentado)
-- =====================================================
/*
-- Exemplo de pack de onboarding
INSERT INTO task_packs (name, description) VALUES
  ('Onboarding de Cliente', 'Tarefas padrão para integração de novos clientes');

-- Exemplo de tarefas do pack
INSERT INTO task_pack_templates (pack_id, title, description, default_days_to_complete, order_in_pack)
SELECT 
  id,
  unnest(ARRAY[
    'Setup inicial do sistema',
    'Importação de dados existentes',
    'Configuração de permissões',
    'Treinamento da equipe',
    'Validação e testes',
    'Go-live e acompanhamento'
  ]),
  unnest(ARRAY[
    'Configurar ambiente e credenciais de acesso',
    'Migrar dados do sistema anterior',
    'Definir roles e permissões dos usuários',
    'Realizar sessão de treinamento com a equipe',
    'Validar funcionamento e corrigir problemas',
    'Acompanhar primeiros dias de uso'
  ]),
  unnest(ARRAY[3, 5, 2, 7, 3, 7]),
  unnest(ARRAY[0, 1, 2, 3, 4, 5])
FROM task_packs
WHERE name = 'Onboarding de Cliente'
LIMIT 1;
*/


-- =====================================================
-- FIM DAS MIGRATIONS
-- =====================================================
-- Para executar:
-- 1. Copie todo este código
-- 2. Execute no SQL Editor do Supabase
-- 3. Verifique se as tabelas foram criadas com sucesso
-- =====================================================
