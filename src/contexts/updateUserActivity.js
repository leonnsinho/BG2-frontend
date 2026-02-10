// Função separada para update de atividade do usuário

export const updateUserActivity = async (supabase, userId) => {
  try {
    // Primeiro, buscar o login_count atual
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('login_count, first_login_at')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Erro ao buscar perfil atual:', fetchError)
      throw fetchError
    }

    const now = new Date().toISOString()
    const newLoginCount = (currentProfile?.login_count || 0) + 1
    const firstLogin = currentProfile?.first_login_at || now

    // Atualizar os campos - USANDO last_login_at
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        last_login_at: now,
        login_count: newLoginCount,
        first_login_at: firstLogin,
        last_activity_at: now
      })
      .eq('id', userId)
      .select()

    if (updateError) {
      console.error('Erro ao atualizar atividade:', updateError.message, updateError)
      throw updateError
    }
  } catch (error) {
    console.error('Erro ao registrar login:', error.message || error)
  }
}
