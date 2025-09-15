import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ecmgbinyotuxhiniadom.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbWdiaW55b3R1eGhpbmlhZG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTA1NzksImV4cCI6MjA3MzEyNjU3OX0.rN5erJupCKJpJ8cdVy-ECF69kZfao6O_QHOd_DriTxM'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...')
  
  try {
    // Testar se as tabelas existem
    console.log('\n📋 Testando tabelas...')
    
    const tables = ['journeys', 'processes', 'process_evaluations', 'company_diagnoses', 'matrix_versions', 'process_history']
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ Erro na tabela ${table}:`, error.message)
        } else {
          console.log(`✅ Tabela ${table}: ${count || 0} registros`)
        }
      } catch (err) {
        console.log(`❌ Erro ao acessar ${table}:`, err.message)
      }
    }
    
    // Testar inserção nas jornadas
    console.log('\n🌱 Testando inserção de jornadas...')
    
    const journeys = [
      {
        name: 'Jornada Estratégica',
        slug: 'estrategica',
        description: 'Planejamento estratégico, visão, missão, valores e direcionamento organizacional',
        color: '#3B82F6',
        icon: 'target',
        order_index: 1
      }
    ]
    
    const { data: insertData, error: insertError } = await supabase
      .from('journeys')
      .upsert(journeys, { onConflict: 'slug' })
      .select()
    
    if (insertError) {
      console.log('❌ Erro ao inserir jornada:', insertError.message)
    } else {
      console.log('✅ Jornada inserida:', insertData)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testConnection()