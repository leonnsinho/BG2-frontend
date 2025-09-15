-- Políticas RLS para Matriz Bossa
-- Execute este SQL no Supabase SQL Editor

-- 1. Permitir leitura das jornadas para usuários autenticados
CREATE POLICY "Usuários podem ver jornadas" ON public.journeys
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Permitir leitura dos processos para usuários autenticados  
CREATE POLICY "Usuários podem ver processos" ON public.processes
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Permitir que usuários criem e vejam suas próprias avaliações
CREATE POLICY "Usuários podem criar avaliações" ON public.process_evaluations
    FOR INSERT WITH CHECK (auth.uid() = evaluator_id);

CREATE POLICY "Usuários podem ver avaliações da sua empresa" ON public.process_evaluations
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- 4. Permitir que usuários vejam diagnósticos da sua empresa
CREATE POLICY "Usuários podem ver diagnósticos da empresa" ON public.company_diagnoses
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- 5. Permitir leitura das versões da matriz
CREATE POLICY "Usuários podem ver versões da matriz" ON public.matrix_versions
    FOR SELECT USING (auth.role() = 'authenticated');

-- 7. Para desenvolvimento: Permitir inserção de dados seed (temporário)
-- ATENÇÃO: Remova essas políticas após o setup inicial!

CREATE POLICY "Allow seed data insertion" ON public.journeys
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow seed processes insertion" ON public.processes  
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow seed versions insertion" ON public.matrix_versions
    FOR INSERT WITH CHECK (true);