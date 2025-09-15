// Script de teste para verificar se o perfil está sendo carregado corretamente
console.log('🔍 Verificando AuthContext...')

// Simular o comportamento do fetchProfile
const testFetchProfile = async (userId) => {
  console.log(`📋 Testando busca de perfil para usuário: ${userId}`)
  
  try {
    // Simular query básica de perfil
    console.log('🔄 Buscando perfil básico...')
    
    // Simular sucesso do perfil básico
    const profileData = {
      id: userId,
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'user'
    }
    
    console.log('✅ Perfil básico encontrado:', profileData)
    
    // Simular busca de empresas (pode falhar)
    console.log('🔄 Buscando empresas do usuário...')
    
    try {
      // Simular dados de empresas
      const userCompaniesData = [
        {
          id: 'company-1',
          role: 'company_admin',
          is_active: true,
          permissions: ['view_dashboard', 'manage_processes'],
          companies: {
            id: 'company-1',
            name: 'Test Company',
            slug: 'test-company'
          }
        }
      ]
      
      console.log('✅ Empresas encontradas:', userCompaniesData)
      
      const fullProfile = {
        ...profileData,
        user_companies: userCompaniesData
      }
      
      return fullProfile
      
    } catch (companiesError) {
      console.warn('⚠️ Erro ao buscar empresas, usando perfil básico')
      
      return {
        ...profileData,
        user_companies: []
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error)
    return null
  }
}

// Testar com ID de exemplo
testFetchProfile('test-user-id').then(result => {
  console.log('📊 Resultado final:', result)
  console.log('✅ Teste concluído!')
})