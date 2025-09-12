import { supabase } from '../services/supabase'

/**
 * Serviço de validações backend
 * Centraliza todas as validações de servidor
 */
export class BackendValidationService {
  
  // Validações de usuário
  static async validateUser(userData) {
    const errors = []

    try {
      // Validar email único
      if (userData.email) {
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(userData.email)
        if (existingUser && existingUser.id !== userData.id) {
          errors.push({
            field: 'email',
            message: 'Este email já está em uso'
          })
        }
      }

      // Validar dados obrigatórios
      if (!userData.full_name || userData.full_name.trim().length < 2) {
        errors.push({
          field: 'full_name',
          message: 'Nome completo deve ter pelo menos 2 caracteres'
        })
      }

      // Validar formato do email
      if (userData.email && !this.isValidEmail(userData.email)) {
        errors.push({
          field: 'email',
          message: 'Formato de email inválido'
        })
      }

      // Validar telefone se fornecido
      if (userData.phone && !this.isValidPhone(userData.phone)) {
        errors.push({
          field: 'phone',
          message: 'Formato de telefone inválido'
        })
      }

      return {
        isValid: errors.length === 0,
        errors
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Erro ao validar dados do usuário'
        }]
      }
    }
  }

  // Validações de empresa
  static async validateCompany(companyData) {
    const errors = []

    try {
      // Validar nome único
      if (companyData.name) {
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('name', companyData.name.trim())
          .single()

        if (existingCompany && existingCompany.id !== companyData.id) {
          errors.push({
            field: 'name',
            message: 'Já existe uma empresa com este nome'
          })
        }
      }

      // Validar dados obrigatórios
      if (!companyData.name || companyData.name.trim().length < 2) {
        errors.push({
          field: 'name',
          message: 'Nome da empresa deve ter pelo menos 2 caracteres'
        })
      }

      // Validar CNPJ se fornecido
      if (companyData.cnpj && !this.isValidCNPJ(companyData.cnpj)) {
        errors.push({
          field: 'cnpj',
          message: 'CNPJ inválido'
        })
      }

      // Validar email da empresa
      if (companyData.email && !this.isValidEmail(companyData.email)) {
        errors.push({
          field: 'email',
          message: 'Email da empresa inválido'
        })
      }

      return {
        isValid: errors.length === 0,
        errors
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Erro ao validar dados da empresa'
        }]
      }
    }
  }

  // Validações de convite
  static async validateInvite(inviteData) {
    const errors = []

    try {
      // Validar email
      if (!inviteData.email || !this.isValidEmail(inviteData.email)) {
        errors.push({
          field: 'email',
          message: 'Email inválido'
        })
      }

      // Verificar se já existe convite pendente
      if (inviteData.email && inviteData.company_id) {
        const { data: existingInvite } = await supabase
          .from('invites')
          .select('id')
          .eq('email', inviteData.email)
          .eq('company_id', inviteData.company_id)
          .eq('status', 'pending')
          .single()

        if (existingInvite) {
          errors.push({
            field: 'email',
            message: 'Já existe um convite pendente para este email nesta empresa'
          })
        }
      }

      // Verificar se usuário já é membro da empresa
      if (inviteData.email && inviteData.company_id) {
        const { data: user } = await supabase.auth.admin.getUserByEmail(inviteData.email)
        
        if (user) {
          const { data: membership } = await supabase
            .from('user_companies')
            .select('id')
            .eq('user_id', user.id)
            .eq('company_id', inviteData.company_id)
            .eq('is_active', true)
            .single()

          if (membership) {
            errors.push({
              field: 'email',
              message: 'Este usuário já é membro desta empresa'
            })
          }
        }
      }

      // Validar role
      const validRoles = ['super_admin', 'consultant', 'company_admin', 'user']
      if (!inviteData.role || !validRoles.includes(inviteData.role)) {
        errors.push({
          field: 'role',
          message: 'Função inválida'
        })
      }

      // Validar company_id
      if (!inviteData.company_id) {
        errors.push({
          field: 'company_id',
          message: 'Empresa é obrigatória'
        })
      }

      return {
        isValid: errors.length === 0,
        errors
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Erro ao validar dados do convite'
        }]
      }
    }
  }

  // Validações de permissão
  static async validatePermissions(userId, action, resource = null) {
    try {
      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          *,
          user_companies (
            role,
            is_active,
            company_id,
            permissions
          )
        `)
        .eq('id', userId)
        .single()

      if (!profile) {
        return {
          hasPermission: false,
          reason: 'Usuário não encontrado'
        }
      }

      // Super admin tem todas as permissões
      if (profile.role === 'super_admin') {
        return { hasPermission: true }
      }

      // Verificar permissões específicas por ação
      return this.checkActionPermission(profile, action, resource)
    } catch (error) {
      return {
        hasPermission: false,
        reason: 'Erro ao verificar permissões'
      }
    }
  }

  // Verificar permissão para ação específica
  static checkActionPermission(profile, action, resource) {
    const permissions = {
      // Ações de usuário
      'invite_users': ['super_admin', 'consultant', 'company_admin'],
      'manage_users': ['super_admin', 'consultant', 'company_admin'],
      'view_users': ['super_admin', 'consultant', 'company_admin', 'user'],
      'delete_users': ['super_admin', 'consultant'],

      // Ações de empresa
      'create_companies': ['super_admin'],
      'manage_companies': ['super_admin', 'consultant'],
      'view_companies': ['super_admin', 'consultant', 'company_admin'],

      // Ações de sistema
      'access_admin': ['super_admin', 'consultant', 'company_admin'],
      'manage_system': ['super_admin'],
      'view_reports': ['super_admin', 'consultant', 'company_admin'],

      // Ações de projeto (futuro)
      'create_projects': ['super_admin', 'consultant', 'company_admin', 'user'],
      'manage_projects': ['super_admin', 'consultant', 'company_admin'],
      'delete_projects': ['super_admin', 'consultant', 'company_admin']
    }

    const requiredRoles = permissions[action]
    if (!requiredRoles) {
      return {
        hasPermission: false,
        reason: 'Ação não reconhecida'
      }
    }

    // Verificar role global
    if (requiredRoles.includes(profile.role)) {
      return { hasPermission: true }
    }

    // Verificar roles nas empresas
    if (profile.user_companies) {
      const hasRoleInCompany = profile.user_companies.some(uc =>
        uc.is_active && requiredRoles.includes(uc.role)
      )

      if (hasRoleInCompany) {
        return { hasPermission: true }
      }
    }

    return {
      hasPermission: false,
      reason: 'Permissão insuficiente'
    }
  }

  // Validações de formato
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isValidPhone(phone) {
    // Aceitar formatos: (11) 99999-9999, 11999999999, +5511999999999
    const phoneRegex = /^(\+55)?\s?(\(?\d{2}\)?)\s?(\d{4,5})-?(\d{4})$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  static isValidCNPJ(cnpj) {
    // Remover caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '')
    
    // Verificar se tem 14 dígitos
    if (cleanCNPJ.length !== 14) return false
    
    // Verificar se não é sequência repetida
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
    
    // Validar dígitos verificadores (algoritmo simplificado)
    return this.validateCNPJDigits(cleanCNPJ)
  }

  static validateCNPJDigits(cnpj) {
    // Implementação simplificada da validação do CNPJ
    try {
      let length = cnpj.length - 2
      let numbers = cnpj.substring(0, length)
      let digits = cnpj.substring(length)
      let sum = 0
      let pos = length - 7

      for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--
        if (pos < 2) pos = 9
      }

      let result = sum % 11 < 2 ? 0 : 11 - sum % 11
      if (result != digits.charAt(0)) return false

      length = length + 1
      numbers = cnpj.substring(0, length)
      sum = 0
      pos = length - 7

      for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--
        if (pos < 2) pos = 9
      }

      result = sum % 11 < 2 ? 0 : 11 - sum % 11
      return result == digits.charAt(1)
    } catch {
      return false
    }
  }

  // Validar dados de projeto (preparado para futuro)
  static async validateProject(projectData) {
    const errors = []

    // Validar nome
    if (!projectData.name || projectData.name.trim().length < 3) {
      errors.push({
        field: 'name',
        message: 'Nome do projeto deve ter pelo menos 3 caracteres'
      })
    }

    // Validar empresa
    if (!projectData.company_id) {
      errors.push({
        field: 'company_id',
        message: 'Empresa é obrigatória'
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Validação de senha
  static validatePassword(password) {
    const errors = []

    if (password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve ter pelo menos uma letra maiúscula')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve ter pelo menos uma letra minúscula')
    }

    if (!/\d/.test(password)) {
      errors.push('Senha deve ter pelo menos um número')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Senha deve ter pelo menos um caractere especial')
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.getPasswordStrength(password)
    }
  }

  // Calcular força da senha
  static getPasswordStrength(password) {
    let score = 0

    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1

    if (score < 3) return 'weak'
    if (score < 5) return 'medium'
    return 'strong'
  }
}

// Hook para usar as validações
export function useValidation() {
  return {
    validateUser: BackendValidationService.validateUser,
    validateCompany: BackendValidationService.validateCompany,
    validateInvite: BackendValidationService.validateInvite,
    validatePermissions: BackendValidationService.validatePermissions,
    validatePassword: BackendValidationService.validatePassword,
    isValidEmail: BackendValidationService.isValidEmail,
    isValidPhone: BackendValidationService.isValidPhone,
    isValidCNPJ: BackendValidationService.isValidCNPJ
  }
}
