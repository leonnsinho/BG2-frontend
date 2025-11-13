import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

// 🔥 NOVO: Hook agora aceita companyId opcional (para Super Admin)
export const useTasks = (overrideCompanyId = null) => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Pegar company_id do perfil do usuário
  const getCompanyId = () => {
    // 🔥 PRIORIDADE: overrideCompanyId (Super Admin) > profile company
    if (overrideCompanyId) {
      console.log(`🔑 useTasks: Usando companyId override (Super Admin): ${overrideCompanyId}`)
      return overrideCompanyId
    }
    
    if (profile?.company_id) return profile.company_id
    if (profile?.user_companies && profile.user_companies.length > 0) {
      return profile.user_companies[0].company_id
    }
    return null
  }

  // Buscar TODOS os participantes da empresa (admins, gestores, usuários, etc.)
  const getCompanyUsers = async () => {
    try {
      const companyId = getCompanyId()
      
      if (!companyId) {
        console.log('❌ Company ID não encontrado')
        return []
      }

      console.log('🔍 Buscando TODOS os participantes da empresa:', companyId)

      // Passo 1: Buscar TODOS os user_companies (sem filtro de role)
      const { data: userCompanies, error: ucError } = await supabase
        .from('user_companies')
        .select('user_id, role')
        .eq('company_id', companyId)
        .eq('is_active', true)

      if (ucError) {
        console.error('❌ Erro ao buscar user_companies:', ucError)
        throw ucError
      }

      if (!userCompanies || userCompanies.length === 0) {
        console.log('📭 Nenhum participante encontrado na empresa')
        return []
      }

      const userIds = userCompanies.map(uc => uc.user_id)
      console.log('🆔 User IDs encontrados:', userIds.length, 'participantes')

      // Passo 2: Buscar dados dos profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .in('id', userIds)

      if (profilesError) {
        console.error('❌ Erro ao buscar profiles:', profilesError)
        throw profilesError
      }

      const users = profiles?.map(profile => {
        // Buscar role do user_companies para esse usuário
        const uc = userCompanies.find(u => u.user_id === profile.id)
        const roleLabel = uc?.role === 'company_admin' ? ' (Admin)' : 
                         uc?.role === 'gestor' ? ' (Gestor)' : ''
        
        return {
          id: profile.id,
          email: profile.email,
          name: (profile.full_name || profile.email) + roleLabel,
          role: uc?.role || 'user'
        }
      }) || []

      console.log('✅ Participantes finais:', users.length, 'pessoas')
      return users

    } catch (err) {
      console.error('❌ Erro geral:', err)
      setError(err.message)
      return []
    }
  }

  // Buscar tarefas da empresa
  const getTasks = async () => {
    try {
      setLoading(true)
      const companyId = getCompanyId()
      
      if (!companyId) {
        console.log('❌ getTasks: Company ID não encontrado')
        return []
      }

      console.log('🔍 getTasks: Buscando tarefas da empresa:', companyId)

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          assigned_to,
          assigned_to_name,
          process_id,
          journey_id,
          status,
          priority,
          due_date,
          created_at,
          created_by,
          company_id
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (tasksError) {
        console.error('❌ Erro ao buscar tarefas:', tasksError)
        throw tasksError
      }

      console.log('✅ getTasks: Tarefas encontradas:', tasks?.length || 0)
      
      // 🔥 Buscar dados adicionais de criadores e jornadas
      if (tasks && tasks.length > 0) {
        // Buscar criadores
        const creatorIds = [...new Set(tasks.map(t => t.created_by).filter(Boolean))]
        const journeyIds = [...new Set(tasks.map(t => t.journey_id).filter(Boolean))]
        
        let creators = []
        let journeys = []
        
        if (creatorIds.length > 0) {
          const { data: creatorsData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', creatorIds)
          creators = creatorsData || []
        }
        
        if (journeyIds.length > 0) {
          const { data: journeysData } = await supabase
            .from('journeys')
            .select('id, name')
            .in('id', journeyIds)
          journeys = journeysData || []
        }
        
        // Enriquecer tarefas com dados de criador e jornada
        return tasks.map(task => ({
          ...task,
          creator: creators.find(c => c.id === task.created_by) || null,
          journey: journeys.find(j => j.id === task.journey_id) || null
        }))
      }
      
      return tasks || []

    } catch (err) {
      console.error('❌ Erro ao carregar tarefas:', err)
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Criar nova tarefa
  const createTask = async (taskData) => {
    try {
      setLoading(true)
      const companyId = getCompanyId()
      
      console.log('🔑 createTask: companyId obtido:', companyId)
      console.log('👤 createTask: profile.id:', profile?.id)
      
      if (!companyId || !profile?.id) {
        const errorMsg = `Dados faltando: companyId=${companyId}, userId=${profile?.id}`
        console.error('❌ createTask:', errorMsg)
        throw new Error('Dados de usuário ou empresa não encontrados')
      }

      const newTask = {
        ...taskData,
        company_id: companyId,
        created_by: profile.id
      }

      console.log('💾 Criando tarefa com dados:', JSON.stringify(newTask, null, 2))

      const { data, error: createError } = await supabase
        .from('tasks')
        .insert([newTask])
        .select('*')
        .single()

      if (createError) {
        console.error('❌ Erro Supabase ao criar tarefa:', {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code
        })
        throw createError
      }

      console.log('✅ Tarefa criada com sucesso:', data)
      return data

    } catch (err) {
      console.error('❌ Erro fatal ao salvar tarefa:', {
        message: err.message,
        stack: err.stack
      })
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Atualizar tarefa existente
  const updateTask = async (taskId, updates) => {
    try {
      setLoading(true)
      console.log('🔄 Atualizando tarefa:', taskId, updates)

      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select('*')
        .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar tarefa:', updateError)
        throw updateError
      }

      console.log('✅ Tarefa atualizada:', data)
      return data

    } catch (err) {
      console.error('❌ Erro ao atualizar tarefa:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Deletar tarefa
  const deleteTask = async (taskId) => {
    try {
      setLoading(true)
      console.log('🗑️ Deletando tarefa:', taskId)

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (deleteError) {
        console.error('❌ Erro ao deletar tarefa:', deleteError)
        throw deleteError
      }

      console.log('✅ Tarefa deletada')
      return true

    } catch (err) {
      console.error('❌ Erro ao deletar tarefa:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Buscar comentários de uma tarefa
  const getTaskComments = async (taskId) => {
    try {
      console.log('🔍 Buscando comentários da tarefa:', taskId)

      const { data: comments, error: commentsError } = await supabase
        .from('task_comments')
        .select(`
          id,
          comment,
          created_at,
          user_id,
          attachments
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      if (commentsError) {
        console.error('❌ Erro ao buscar comentários:', commentsError)
        throw commentsError
      }

      // Buscar dados dos usuários separadamente
      const userIds = [...new Set(comments?.map(c => c.user_id) || [])]
      let usersData = []

      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)

        if (!profilesError) {
          usersData = profiles || []
        }
      }

      // Formatar comentários com dados do autor e anexos
      const formattedComments = comments?.map(comment => {
        const user = usersData.find(u => u.id === comment.user_id)
        return {
          id: comment.id,
          content: comment.comment,
          created_at: comment.created_at,
          author_id: comment.user_id,
          author_name: user?.full_name || user?.email || 'Usuário',
          attachments: comment.attachments || []
        }
      }) || []

      console.log('✅ Comentários encontrados:', formattedComments)
      return formattedComments

    } catch (err) {
      console.error('❌ Erro ao carregar comentários:', err)
      setError(err.message)
      return []
    }
  }

  // Adicionar comentário
  const addComment = async (taskId, content, attachments = []) => {
    try {
      setLoading(true)
      
      if (!profile?.id) {
        throw new Error('Usuário não autenticado')
      }

      console.log('💬 Adicionando comentário à tarefa:', taskId)

      const newComment = {
        task_id: taskId,
        comment: content.trim(),
        user_id: profile.id,
        attachments: attachments
      }

      const { data, error: createError } = await supabase
        .from('task_comments')
        .insert([newComment])
        .select('id, comment, created_at, user_id, attachments')
        .single()

      if (createError) {
        console.error('❌ Erro ao criar comentário:', createError)
        throw createError
      }

      // Formatar comentário retornado
      const formattedComment = {
        id: data.id,
        content: data.comment,
        created_at: data.created_at,
        author_id: data.user_id,
        author_name: profile?.full_name || profile?.email || 'Você',
        attachments: data.attachments || []
      }

      console.log('✅ Comentário criado:', formattedComment)
      return formattedComment

    } catch (err) {
      console.error('❌ Erro ao adicionar comentário:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    setError,
    getTasks,
    getCompanyUsers,
    createTask,
    updateTask,
    deleteTask,
    getTaskComments,
    addComment
  }
}
