-- =====================================================
-- SISTEMA DE HISTÓRICO DE LOGINS (ÚLTIMOS 7 DIAS)
-- =====================================================
-- Este script cria uma tabela para rastrear logins dos usuários
-- mantendo apenas os últimos 7 dias de histórico

-- =====================================================
-- 1. CRIAR TABELA DE HISTÓRICO DE LOGINS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_login_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    login_date DATE NOT NULL,
    login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, login_date) -- Um registro por usuário por dia
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON public.user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_login_date ON public.user_login_history(login_date);
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_date ON public.user_login_history(user_id, login_date DESC);

-- =====================================================
-- 2. FUNÇÃO PARA REGISTRAR LOGIN
-- =====================================================
-- Esta função registra ou atualiza o login do usuário
-- e remove registros mais antigos que 7 dias
CREATE OR REPLACE FUNCTION public.register_user_login(
    p_user_id UUID,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_cutoff_date DATE := CURRENT_DATE - INTERVAL '7 days';
BEGIN
    -- Inserir ou atualizar o login de hoje
    INSERT INTO public.user_login_history (
        user_id,
        login_date,
        login_time,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        v_today,
        NOW(),
        p_ip_address,
        p_user_agent
    )
    ON CONFLICT (user_id, login_date) 
    DO UPDATE SET
        login_time = NOW(),
        ip_address = COALESCE(EXCLUDED.ip_address, user_login_history.ip_address),
        user_agent = COALESCE(EXCLUDED.user_agent, user_login_history.user_agent);

    -- Remover registros mais antigos que 7 dias para este usuário
    DELETE FROM public.user_login_history
    WHERE user_id = p_user_id
    AND login_date < v_cutoff_date;

    -- Atualizar last_login no profiles (opcional, para compatibilidade)
    UPDATE public.profiles
    SET 
        last_login = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$;

-- =====================================================
-- 3. FUNÇÃO PARA OBTER ÚLTIMO LOGIN
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_last_login(p_user_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_login TIMESTAMPTZ;
BEGIN
    SELECT login_time INTO v_last_login
    FROM public.user_login_history
    WHERE user_id = p_user_id
    ORDER BY login_time DESC
    LIMIT 1;
    
    RETURN v_last_login;
END;
$$;

-- =====================================================
-- 4. FUNÇÃO PARA OBTER HISTÓRICO DE LOGINS (7 DIAS)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_login_history(p_user_id UUID)
RETURNS TABLE (
    login_date DATE,
    login_time TIMESTAMPTZ,
    ip_address TEXT,
    user_agent TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ulh.login_date,
        ulh.login_time,
        ulh.ip_address,
        ulh.user_agent
    FROM public.user_login_history ulh
    WHERE ulh.user_id = p_user_id
    ORDER BY ulh.login_date DESC;
END;
$$;

-- =====================================================
-- 5. FUNÇÃO DE LIMPEZA AUTOMÁTICA (OPCIONAL)
-- =====================================================
-- Esta função pode ser executada periodicamente para limpar
-- registros antigos de todos os usuários (mais de 7 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_history()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
    v_cutoff_date DATE := CURRENT_DATE - INTERVAL '7 days';
BEGIN
    DELETE FROM public.user_login_history
    WHERE login_date < v_cutoff_date;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

-- =====================================================
-- 6. VIEW PARA ESTATÍSTICAS DE LOGIN
-- =====================================================
CREATE OR REPLACE VIEW public.user_login_stats AS
SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    COUNT(ulh.id) as login_count_7days,
    MAX(ulh.login_time) as last_login,
    MIN(ulh.login_date) as first_login_in_period,
    MAX(ulh.login_date) as last_login_date,
    ARRAY_AGG(ulh.login_date ORDER BY ulh.login_date DESC) as login_dates
FROM public.profiles p
LEFT JOIN public.user_login_history ulh ON p.id = ulh.user_id
GROUP BY p.id, p.email, p.full_name;

-- =====================================================
-- 7. HABILITAR RLS (ROW LEVEL SECURITY)
-- =====================================================
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seu próprio histórico
CREATE POLICY "Users can view own login history" 
ON public.user_login_history
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Admins e gestores podem ver histórico de usuários da mesma empresa
CREATE POLICY "Admins can view company users login history" 
ON public.user_login_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'company_admin', 'gestor', 'gestor_financeiro', 
                       'gestor_estrategico', 'gestor_pessoas_cultura', 
                       'gestor_vendas_marketing', 'gestor_operacional')
    )
);

-- Política: Sistema pode inserir registros de login
CREATE POLICY "Allow service to insert login records" 
ON public.user_login_history
FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 8. GRANTS DE PERMISSÕES
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.user_login_history TO authenticated;
GRANT SELECT ON public.user_login_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_user_login TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_last_login TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_login_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_login_history TO authenticated;

-- =====================================================
-- 9. COMENTÁRIOS NA TABELA
-- =====================================================
COMMENT ON TABLE public.user_login_history IS 
'Armazena histórico de logins dos últimos 7 dias. Registros mais antigos são automaticamente removidos.';

COMMENT ON COLUMN public.user_login_history.login_date IS 
'Data do login (sem hora). Usado para manter apenas um registro por dia por usuário.';

COMMENT ON COLUMN public.user_login_history.login_time IS 
'Data e hora exata do último login do dia.';

-- =====================================================
-- 10. EXEMPLO DE USO
-- =====================================================
-- Para registrar um login:
-- SELECT register_user_login('user-uuid-here', '192.168.1.1', 'Mozilla/5.0...');

-- Para obter último login:
-- SELECT get_last_login('user-uuid-here');

-- Para obter histórico de 7 dias:
-- SELECT * FROM get_user_login_history('user-uuid-here');

-- Para ver estatísticas:
-- SELECT * FROM user_login_stats WHERE user_id = 'user-uuid-here';

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Depois, integre a função register_user_login() no código de autenticação
