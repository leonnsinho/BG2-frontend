import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook para gerenciamento de logs de atividade
 * Registra ações dos usuários para auditoria e monitoramento
 */
export function useActivityLogs() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)

  // Registrar uma atividade
  const logActivity = async (action, details = {}) => {
    if (!user || !profile) return

    try {
      const logData = {
        user_id: user.id,
        user_email: user.email,
        user_name: profile.full_name || user.email,
        action,
        details: details || {},
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        company_id: details.company_id || null,
        resource_type: details.resource_type || null,
        resource_id: details.resource_id || null
      }

      // Em produção, você enviaria para um sistema de logs
      // Por enquanto, vamos simular e logar no console
      console.log('📊 Activity Log:', logData)
      
      // Salvar no localStorage para demonstração
      saveLogLocally(logData)
      
      return { success: true, data: logData }
    } catch (error) {
      console.error('❌ Erro ao registrar atividade:', error)
      return { success: false, error: error.message }
    }
  }

  // Obter IP do cliente (simplificado)
  const getClientIP = async () => {
    try {
      // Em produção, você usaria um serviço real
      return 'localhost'
    } catch {
      return 'unknown'
    }
  }

  // Salvar log localmente para demonstração
  const saveLogLocally = (logData) => {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('partimap_activity_logs') || '[]')
      existingLogs.unshift(logData) // Adicionar no início
      
      // Manter apenas os últimos 100 logs
      const trimmedLogs = existingLogs.slice(0, 100)
      localStorage.setItem('partimap_activity_logs', JSON.stringify(trimmedLogs))
    } catch (error) {
      console.warn('Não foi possível salvar log localmente:', error)
    }
  }

  // Obter logs salvos localmente
  const getLocalLogs = () => {
    try {
      return JSON.parse(localStorage.getItem('partimap_activity_logs') || '[]')
    } catch {
      return []
    }
  }

  // Logs específicos para diferentes ações

  // Auth logs
  const logLogin = async (method = 'email') => {
    return logActivity('user.login', {
      method,
      timestamp: new Date().toISOString()
    })
  }

  const logLogout = async () => {
    return logActivity('user.logout')
  }

  const logPasswordChange = async () => {
    return logActivity('user.password_change')
  }

  // User management logs
  const logInviteUser = async (inviteData) => {
    return logActivity('invite.created', {
      target_email: inviteData.email,
      company_id: inviteData.company_id,
      role: inviteData.role,
      resource_type: 'invite'
    })
  }

  const logAcceptInvite = async (inviteData) => {
    return logActivity('invite.accepted', {
      company_id: inviteData.company_id,
      role: inviteData.role,
      resource_type: 'invite',
      resource_id: inviteData.id
    })
  }

  const logUserUpdate = async (userId, changes) => {
    return logActivity('user.updated', {
      target_user_id: userId,
      changes,
      resource_type: 'user',
      resource_id: userId
    })
  }

  const logUserDelete = async (userId) => {
    return logActivity('user.deleted', {
      target_user_id: userId,
      resource_type: 'user',
      resource_id: userId
    })
  }

  // Company logs
  const logCompanyCreate = async (companyData) => {
    return logActivity('company.created', {
      company_name: companyData.name,
      resource_type: 'company',
      resource_id: companyData.id
    })
  }

  const logCompanyUpdate = async (companyId, changes) => {
    return logActivity('company.updated', {
      company_id: companyId,
      changes,
      resource_type: 'company',
      resource_id: companyId
    })
  }

  // Project logs (preparado para futuro)
  const logProjectCreate = async (projectData) => {
    return logActivity('project.created', {
      project_name: projectData.name,
      company_id: projectData.company_id,
      resource_type: 'project',
      resource_id: projectData.id
    })
  }

  const logProjectUpdate = async (projectId, changes) => {
    return logActivity('project.updated', {
      project_id: projectId,
      changes,
      resource_type: 'project',
      resource_id: projectId
    })
  }

  // Settings logs
  const logSettingsUpdate = async (section, changes) => {
    return logActivity('settings.updated', {
      section,
      changes,
      resource_type: 'settings'
    })
  }

  // Permission logs
  const logPermissionChange = async (targetUserId, oldRole, newRole, companyId) => {
    return logActivity('permission.changed', {
      target_user_id: targetUserId,
      old_role: oldRole,
      new_role: newRole,
      company_id: companyId,
      resource_type: 'permission'
    })
  }

  // System logs
  const logSystemAction = async (action, details) => {
    return logActivity(`system.${action}`, {
      ...details,
      resource_type: 'system'
    })
  }

  // Error logs
  const logError = async (error, context = {}) => {
    return logActivity('error.occurred', {
      error_message: error.message || error,
      error_stack: error.stack || null,
      context,
      resource_type: 'error'
    })
  }

  // Limpar logs locais
  const clearLocalLogs = () => {
    localStorage.removeItem('partimap_activity_logs')
  }

  // Exportar logs (para debug)
  const exportLogs = () => {
    const logs = getLocalLogs()
    const blob = new Blob([JSON.stringify(logs, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `partimap_logs_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Estatísticas de atividade
  const getActivityStats = () => {
    const logs = getLocalLogs()
    
    const stats = {
      total: logs.length,
      byAction: {},
      byUser: {},
      byDate: {},
      last24h: 0,
      lastWeek: 0
    }

    const now = new Date()
    const day24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const week7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    logs.forEach(log => {
      // Por ação
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1
      
      // Por usuário
      stats.byUser[log.user_email] = (stats.byUser[log.user_email] || 0) + 1
      
      // Por data
      const date = log.timestamp.split('T')[0]
      stats.byDate[date] = (stats.byDate[date] || 0) + 1
      
      // Últimas 24h e 7 dias
      const logDate = new Date(log.timestamp)
      if (logDate > day24h) stats.last24h++
      if (logDate > week7d) stats.lastWeek++
    })

    return stats
  }

  return {
    // Estados
    loading,
    
    // Função principal
    logActivity,
    
    // Logs específicos - Auth
    logLogin,
    logLogout,
    logPasswordChange,
    
    // Logs específicos - Users
    logInviteUser,
    logAcceptInvite,
    logUserUpdate,
    logUserDelete,
    
    // Logs específicos - Companies
    logCompanyCreate,
    logCompanyUpdate,
    
    // Logs específicos - Projects
    logProjectCreate,
    logProjectUpdate,
    
    // Logs específicos - Settings
    logSettingsUpdate,
    logPermissionChange,
    
    // Logs específicos - System
    logSystemAction,
    logError,
    
    // Utilitários
    getLocalLogs,
    clearLocalLogs,
    exportLogs,
    getActivityStats
  }
}
