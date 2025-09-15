import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Configuração do Supabase
const supabaseUrl = 'https://ecmgbinyotuxhiniadom.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbWdiaW55b3R1eGhpbmlhZG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTA1NzksImV4cCI6MjA3MzEyNjU3OX0.rN5erJupCKJpJ8cdVy-ECF69kZfao6O_QHOd_DriTxM'
const supabase = createClient(supabaseUrl, supabaseKey)

async function setupMatrizBossa() {
  console.log('🚀 Iniciando setup da Matriz Bossa Digitalizada...')
  
  try {
    // 1. Executar schema principal
    console.log('📋 1. Executando schema principal...')
    const schemaScript = fs.readFileSync('../database/schema_matriz_bossa.sql', 'utf8')
    
    // Note: Este é um exemplo - no ambiente real você executaria via Supabase Dashboard
    // ou usando um client administrativo
    console.log('⚠️ Execute o arquivo schema_matriz_bossa.sql no Supabase Dashboard manualmente')
    
    // 2. Validar se tabelas existem
    console.log('🔍 2. Validando existência das tabelas...')
    
    const tabelas = [
      'journeys',
      'processes', 
      'process_evaluations',
      'company_diagnoses',
      'matrix_versions',
      'process_history'
    ]
    
    for (const tabela of tabelas) {
      const { data, error } = await supabase
        .from(tabela)
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ Erro ao validar tabela ${tabela}:`, error.message)
      } else {
        console.log(`✅ Tabela ${tabela} criada com sucesso`)
      }
    }
    
    // 3. Inserir dados seed das jornadas
    console.log('🌱 3. Inserindo dados seed das jornadas...')
    
    const jornadas = [
      {
        name: 'Jornada Estratégica',
        slug: 'estrategica',
        description: 'Planejamento estratégico, visão, missão, valores e direcionamento organizacional',
        color: '#3B82F6',
        icon: 'target',
        order_index: 1
      },
      {
        name: 'Jornada Financeira',
        slug: 'financeira', 
        description: 'Gestão financeira completa, fluxo de caixa, DRE, indicadores e planejamento orçamentário',
        color: '#10B981',
        icon: 'trending-up',
        order_index: 2
      },
      {
        name: 'Jornada Pessoas e Cultura',
        slug: 'pessoas-cultura',
        description: 'Gestão de pessoas, cultura organizacional, desenvolvimento e performance',
        color: '#F59E0B',
        icon: 'users',
        order_index: 3
      },
      {
        name: 'Jornada Receita/CRM',
        slug: 'receita-crm',
        description: 'Gestão comercial, vendas, relacionamento com clientes e geração de receita',
        color: '#EF4444',
        icon: 'trending-up',
        order_index: 4
      },
      {
        name: 'Jornada Operacional',
        slug: 'operacional',
        description: 'Processos operacionais, qualidade, automações e excelência operacional',
        color: '#8B5CF6',
        icon: 'settings',
        order_index: 5
      }
    ]
    
    const { data: jornadasData, error: jornadasError } = await supabase
      .from('journeys')
      .upsert(jornadas, { onConflict: 'slug' })
      .select()
    
    if (jornadasError) {
      console.log('❌ Erro ao inserir jornadas:', jornadasError.message)
    } else {
      console.log(`✅ ${jornadasData.length} jornadas inseridas com sucesso`)
    }
    
    // 4. Criar versão inicial
    console.log('📝 4. Criando versão inicial da matriz...')
    
    const { data: versionData, error: versionError } = await supabase
      .from('matrix_versions')
      .insert({
        version_number: '1.0.0',
        description: 'Versão inicial da Matriz Bossa com 5 jornadas e 143 processos fundamentais',
        is_active: true,
        total_journeys: 5,
        total_processes: 143
      })
      .select()
    
    if (versionError) {
      console.log('❌ Erro ao criar versão:', versionError.message)
    } else {
      console.log('✅ Versão 1.0.0 criada com sucesso')
    }
    
    // 5. Validação final
    console.log('🔍 5. Validação final...')
    
    const { count: jornadasCount } = await supabase
      .from('journeys')
      .select('*', { count: 'exact', head: true })
    
    const { count: processesCount } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
    
    console.log('📊 Resumo final:')
    console.log(`   Jornadas: ${jornadasCount}/5`)
    console.log(`   Processos: ${processesCount}/143`)
    
    if (jornadasCount === 5) {
      console.log('🎉 Setup da Matriz Bossa concluído com sucesso!')
      console.log('📋 Próximos passos:')
      console.log('   1. Execute os scripts SQL no Supabase Dashboard')
      console.log('   2. Importe os 143 processos usando seed_matriz_bossa_part1.sql e part2.sql')
      console.log('   3. Valide a estrutura no Dashboard do Supabase')
    } else {
      console.log('⚠️ Setup incompleto. Verifique os logs acima.')
    }
    
  } catch (error) {
    console.error('❌ Erro durante o setup:', error.message)
  }
}

// Função para validar estrutura existente
async function validateMatrizStructure() {
  console.log('🔍 Validando estrutura da Matriz Bossa...')
  
  try {
    // Validar jornadas
    const { data: journeys, error: journeysError } = await supabase
      .from('journeys')
      .select('id, name, slug, order_index')
      .order('order_index')
    
    if (journeysError) {
      console.log('❌ Erro ao buscar jornadas:', journeysError.message)
      return
    }
    
    console.log('📋 Jornadas encontradas:')
    journeys.forEach((journey, index) => {
      console.log(`   ${index + 1}. ${journey.name} (${journey.slug})`)
    })
    
    // Validar processos por jornada
    for (const journey of journeys) {
      const { count } = await supabase
        .from('processes')
        .select('*', { count: 'exact', head: true })
        .eq('journey_id', journey.id)
      
      console.log(`   📊 ${journey.name}: ${count} processos`)
    }
    
    // Validar total
    const { count: totalProcesses } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
    
    console.log(`📊 Total geral: ${totalProcesses} processos`)
    
    if (totalProcesses === 143) {
      console.log('✅ Estrutura da Matriz Bossa está completa!')
    } else {
      console.log('⚠️ Estrutura incompleta. Execute os scripts de seed.')
    }
    
  } catch (error) {
    console.error('❌ Erro na validação:', error.message)
  }
}

// Executar baseado no argumento
const command = process.argv[2]

if (command === 'setup') {
  setupMatrizBossa()
} else if (command === 'validate') {
  validateMatrizStructure()
} else {
  console.log('Uso: node setup_matriz_bossa.js [setup|validate]')
}