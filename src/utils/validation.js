import React from 'react'

// Utilitários de validação para formulários

export const validators = {
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'Este campo é obrigatório'
    }
    return null
  },

  email: (value) => {
    if (!value) return null
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Por favor, insira um email válido'
    }
    return null
  },

  minLength: (min) => (value) => {
    if (!value) return null
    
    if (value.length < min) {
      return `Deve ter pelo menos ${min} caracteres`
    }
    return null
  },

  maxLength: (max) => (value) => {
    if (!value) return null
    
    if (value.length > max) {
      return `Deve ter no máximo ${max} caracteres`
    }
    return null
  },

  password: (value) => {
    if (!value) return null
    
    if (value.length < 8) {
      return 'A senha deve ter pelo menos 8 caracteres'
    }
    
    if (!/(?=.*[a-z])/.test(value)) {
      return 'A senha deve conter pelo menos uma letra minúscula'
    }
    
    if (!/(?=.*[A-Z])/.test(value)) {
      return 'A senha deve conter pelo menos uma letra maiúscula'
    }
    
    if (!/(?=.*\d)/.test(value)) {
      return 'A senha deve conter pelo menos um número'
    }
    
    return null
  },

  confirmPassword: (originalPassword) => (value) => {
    if (!value) return null
    
    if (value !== originalPassword) {
      return 'As senhas não coincidem'
    }
    return null
  },

  phone: (value) => {
    if (!value) return null
    
    // Remove todos os caracteres não numéricos
    const cleaned = value.replace(/\D/g, '')
    
    // Verifica se tem 10 ou 11 dígitos (formato brasileiro)
    if (cleaned.length < 10 || cleaned.length > 11) {
      return 'Por favor, insira um telefone válido'
    }
    
    return null
  },

  cnpj: (value) => {
    if (!value) return null
    
    // Remove caracteres não numéricos
    const cleaned = value.replace(/\D/g, '')
    
    if (cleaned.length !== 14) {
      return 'CNPJ deve ter 14 dígitos'
    }
    
    // Validação básica do CNPJ (algoritmo completo seria mais complexo)
    if (/^(\d)\1+$/.test(cleaned)) {
      return 'CNPJ inválido'
    }
    
    return null
  },

  cpf: (value) => {
    if (!value) return null
    
    // Remove caracteres não numéricos
    const cleaned = value.replace(/\D/g, '')
    
    if (cleaned.length !== 11) {
      return 'CPF deve ter 11 dígitos'
    }
    
    // Validação básica do CPF
    if (/^(\d)\1+$/.test(cleaned)) {
      return 'CPF inválido'
    }
    
    return null
  }
}

// Função para aplicar múltiplas validações
export const validate = (value, validationRules = []) => {
  for (const rule of validationRules) {
    const error = rule(value)
    if (error) {
      return error
    }
  }
  return null
}

// Hook para gerenciar validação de formulários
export const useFormValidation = (initialValues = {}, validationSchema = {}) => {
  const [values, setValues] = React.useState(initialValues)
  const [errors, setErrors] = React.useState({})
  const [touched, setTouched] = React.useState({})

  const validateField = (name, value) => {
    const fieldValidation = validationSchema[name]
    if (fieldValidation) {
      return validate(value, fieldValidation)
    }
    return null
  }

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Validar campo em tempo real se já foi tocado
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    
    const value = values[name]
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const validateAll = () => {
    const newErrors = {}
    let isValid = true

    Object.keys(validationSchema).forEach(name => {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(Object.keys(validationSchema).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {}))

    return isValid
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  }
}

// Utilitários para formatação de campos
export const formatters = {
  phone: (value) => {
    if (!value) return value
    
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/)
    
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    
    return cleaned
  },

  cnpj: (value) => {
    if (!value) return value
    
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/)
    
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`
    }
    
    return cleaned
  },

  cpf: (value) => {
    if (!value) return value
    
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/)
    
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`
    }
    
    return cleaned
  },

  currency: (value) => {
    if (!value) return ''
    
    const numericValue = parseFloat(value.toString().replace(/[^\d]/g, '')) / 100
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue)
  }
}
