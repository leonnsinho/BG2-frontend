-- ===========================================
-- SISTEMA DE CONVITES - ESTRUTURA DO BANCO
-- ===========================================
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela de convites
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'consultant', 'company_admin', 'user')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Campos adicionais
    invite_message TEXT,
    permissions JSONB DEFAULT '[]',
    
    UNIQUE(email, company_id, status) -- Evitar convites duplicados pendentes
);

-- 2. Trigger para updated_at
CREATE TRIGGER update_invites_updated_at 
    BEFORE UPDATE ON public.invites 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Habilitar RLS na tabela de convites
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para invites
CREATE POLICY "Users can view invites for their companies" 
    ON public.invites FOR SELECT 
    USING (
        -- Super admins podem ver todos
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
        OR
        -- Company admins podem ver convites da sua empresa
        EXISTS (
            SELECT 1 FROM public.user_companies uc
            JOIN public.profiles p ON uc.user_id = p.id
            WHERE uc.user_id = auth.uid() 
            AND uc.company_id = invites.company_id
            AND uc.role IN ('company_admin', 'super_admin')
            AND uc.is_active = true
        )
    );

CREATE POLICY "Company admins can create invites" 
    ON public.invites FOR INSERT 
    WITH CHECK (
        -- Super admins podem criar qualquer convite
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
        OR
        -- Company admins podem criar convites para sua empresa
        EXISTS (
            SELECT 1 FROM public.user_companies uc
            WHERE uc.user_id = auth.uid() 
            AND uc.company_id = invites.company_id
            AND uc.role IN ('company_admin', 'super_admin')
            AND uc.is_active = true
        )
    );

CREATE POLICY "Users can update own invites" 
    ON public.invites FOR UPDATE 
    USING (invited_by = auth.uid());

-- 5. Função para gerar token seguro
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para criar convite
CREATE OR REPLACE FUNCTION create_invite(
    p_email TEXT,
    p_company_id UUID,
    p_role TEXT,
    p_message TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    invite_id UUID;
    invite_token TEXT;
    existing_user UUID;
    result JSON;
BEGIN
    -- Verificar se o usuário já existe
    SELECT id INTO existing_user 
    FROM auth.users 
    WHERE email = p_email;
    
    -- Verificar se já existe convite pendente
    IF EXISTS (
        SELECT 1 FROM public.invites 
        WHERE email = p_email 
        AND company_id = p_company_id 
        AND status = 'pending'
        AND expires_at > NOW()
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Já existe um convite pendente para este email nesta empresa'
        );
    END IF;
    
    -- Verificar se usuário já é membro da empresa
    IF existing_user IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_companies 
        WHERE user_id = existing_user 
        AND company_id = p_company_id 
        AND is_active = true
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Este usuário já é membro desta empresa'
        );
    END IF;
    
    -- Gerar token único
    invite_token := generate_invite_token();
    
    -- Criar convite
    INSERT INTO public.invites (
        email, 
        company_id, 
        role, 
        invited_by, 
        token, 
        invite_message
    ) VALUES (
        p_email,
        p_company_id,
        p_role,
        auth.uid(),
        invite_token,
        p_message
    ) RETURNING id INTO invite_id;
    
    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'invite_id', invite_id,
        'token', invite_token,
        'email', p_email,
        'company_id', p_company_id,
        'role', p_role,
        'expires_at', (NOW() + INTERVAL '7 days')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para aceitar convite
CREATE OR REPLACE FUNCTION accept_invite(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    invite_record RECORD;
    user_id UUID;
    result JSON;
BEGIN
    -- Buscar convite pelo token
    SELECT * INTO invite_record
    FROM public.invites 
    WHERE token = p_token 
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Convite inválido ou expirado'
        );
    END IF;
    
    -- Verificar se usuário atual corresponde ao email do convite
    SELECT auth.uid() INTO user_id;
    
    -- Verificar email do usuário atual
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_id 
        AND email = invite_record.email
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Este convite não é para o usuário atual'
        );
    END IF;
    
    -- Adicionar usuário à empresa
    INSERT INTO public.user_companies (
        user_id,
        company_id,
        role,
        is_active,
        joined_at,
        invited_by
    ) VALUES (
        user_id,
        invite_record.company_id,
        invite_record.role,
        true,
        NOW(),
        invite_record.invited_by
    ) ON CONFLICT (user_id, company_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_active = true,
        joined_at = NOW();
    
    -- Marcar convite como aceito
    UPDATE public.invites 
    SET status = 'accepted', 
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = invite_record.id;
    
    -- Retornar sucesso
    SELECT json_build_object(
        'success', true,
        'message', 'Convite aceito com sucesso!',
        'company_id', invite_record.company_id,
        'role', invite_record.role
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. View para convites com informações da empresa
CREATE OR REPLACE VIEW invite_details AS
SELECT 
    i.id,
    i.email,
    i.role,
    i.status,
    i.token,
    i.expires_at,
    i.created_at,
    i.invite_message,
    c.name as company_name,
    c.id as company_id,
    p.full_name as invited_by_name,
    p.email as invited_by_email
FROM public.invites i
JOIN public.companies c ON i.company_id = c.id
LEFT JOIN public.profiles p ON i.invited_by = p.id;

-- 9. Função para limpar convites expirados
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    UPDATE public.invites 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' 
    AND expires_at <= NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Verificar estrutura criada
SELECT 'SISTEMA DE CONVITES CRIADO COM SUCESSO!' as status
UNION ALL
SELECT 'Tabelas: invites'
UNION ALL
SELECT 'Funções: create_invite, accept_invite, cleanup_expired_invites'
UNION ALL
SELECT 'View: invite_details'
UNION ALL
SELECT 'RLS: Configurado para segurança';
