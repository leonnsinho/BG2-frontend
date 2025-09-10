-- ===========================================
-- SCRIPT SQL PARA SETUP INICIAL DO PARTIMAP
-- ===========================================
-- Este script cria a estrutura básica de tabelas
-- para o sistema Partimap com RLS habilitado

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. TABELA DE PERFIS DE USUÁRIO
-- ===========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'consultant', 'company_admin', 'user')),
    company_id UUID,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 2. TABELA DE EMPRESAS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    address JSONB,
    website TEXT,
    industry TEXT,
    size TEXT CHECK (size IN ('micro', 'pequena', 'media', 'grande')),
    subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'professional', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'trial')),
    subscription_ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ===========================================
-- 3. TABELA DE RELAÇÃO USUÁRIO-EMPRESA
-- ===========================================
CREATE TABLE IF NOT EXISTS public.user_companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'consultant', 'company_admin', 'user')),
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

-- ===========================================
-- 4. FUNÇÃO PARA ATUALIZAR TIMESTAMP
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===========================================
-- 5. TRIGGERS PARA UPDATED_AT
-- ===========================================
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON public.companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_companies_updated_at 
    BEFORE UPDATE ON public.user_companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 6. FUNÇÃO PARA CRIAR PERFIL AUTOMÁTICO
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- ===========================================
-- 7. TRIGGER PARA CRIAÇÃO AUTOMÁTICA DE PERFIL
-- ===========================================
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- 8. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ===========================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
CREATE POLICY "Usuários podem ver próprio perfil" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Super admins podem ver todos os perfis"
    ON public.profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Políticas para COMPANIES
CREATE POLICY "Usuários podem ver empresas vinculadas" 
    ON public.companies FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_companies 
            WHERE user_id = auth.uid() AND company_id = id AND is_active = true
        )
    );

CREATE POLICY "Company admins podem atualizar própria empresa" 
    ON public.companies FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_companies 
            WHERE user_id = auth.uid() 
            AND company_id = id 
            AND role IN ('company_admin', 'super_admin')
            AND is_active = true
        )
    );

-- Políticas para USER_COMPANIES
CREATE POLICY "Usuários podem ver próprias relações empresa" 
    ON public.user_companies FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Company admins podem gerenciar usuários da empresa" 
    ON public.user_companies FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_companies admin_rel
            WHERE admin_rel.user_id = auth.uid()
            AND admin_rel.company_id = user_companies.company_id
            AND admin_rel.role IN ('company_admin', 'super_admin')
            AND admin_rel.is_active = true
        )
    );

-- ===========================================
-- 9. INSERIR DADOS INICIAIS (OPCIONAL)
-- ===========================================

-- Inserir empresa demo (opcional para desenvolvimento)
-- INSERT INTO public.companies (id, name, cnpj, email) 
-- VALUES (
--     '00000000-0000-0000-0000-000000000001',
--     'Empresa Demo',
--     '00.000.000/0001-00',
--     'demo@partimap.com'
-- );

-- ===========================================
-- 10. VIEWS ÚTEIS PARA DESENVOLVIMENTO
-- ===========================================

-- View para ver usuários com suas empresas
CREATE OR REPLACE VIEW user_company_details AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role as user_role,
    c.id as company_id,
    c.name as company_name,
    uc.role as company_role,
    uc.is_active as is_active_in_company
FROM public.profiles p
LEFT JOIN public.user_companies uc ON p.id = uc.user_id
LEFT JOIN public.companies c ON uc.company_id = c.id;

-- ===========================================
-- SCRIPT CONCLUÍDO
-- ===========================================
-- Execute este script no SQL Editor do Supabase
-- para criar toda a estrutura básica do sistema
