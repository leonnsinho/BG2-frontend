/**
 * Utilitários para formatação de datas
 */

/**
 * Formata uma data para o formato brasileiro dd/mm/yyyy
 * @param {string|Date} date - A data a ser formatada
 * @returns {string} Data formatada
 */
export function formatDate(date) {
  if (!date) return 'Data não disponível'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida'
    }
    
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}

/**
 * Formata uma data com hora para o formato brasileiro dd/mm/yyyy às HH:mm
 * @param {string|Date} date - A data a ser formatada
 * @returns {string} Data e hora formatadas
 */
export function formatDateTime(date) {
  if (!date) return 'Data não disponível'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida'
    }
    
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error)
    return 'Data inválida'
  }
}

/**
 * Formata uma data de forma relativa (ex: "há 2 dias", "ontem", "hoje")
 * @param {string|Date} date - A data a ser formatada
 * @returns {string} Data formatada de forma relativa
 */
export function formatRelativeDate(date) {
  if (!date) return 'Data não disponível'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida'
    }
    
    const now = new Date()
    const diffTime = now - dateObj
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    
    if (diffMinutes < 1) {
      return 'Agora mesmo'
    } else if (diffMinutes < 60) {
      return `há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`
    } else if (diffHours < 24) {
      return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`
    } else if (diffDays === 1) {
      return 'Ontem'
    } else if (diffDays < 7) {
      return `há ${diffDays} dias`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `há ${weeks} semana${weeks > 1 ? 's' : ''}`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `há ${months} m${months > 1 ? 'eses' : 'ês'}`
    } else {
      const years = Math.floor(diffDays / 365)
      return `há ${years} ano${years > 1 ? 's' : ''}`
    }
  } catch (error) {
    console.error('Erro ao formatar data relativa:', error)
    return 'Data inválida'
  }
}

/**
 * Obtém o início do dia para uma data
 * @param {string|Date} date - A data
 * @returns {Date} Data com horário 00:00:00
 */
export function startOfDay(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const result = new Date(dateObj)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Obtém o final do dia para uma data
 * @param {string|Date} date - A data
 * @returns {Date} Data com horário 23:59:59
 */
export function endOfDay(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const result = new Date(dateObj)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Verifica se uma data está no passado
 * @param {string|Date} date - A data a ser verificada
 * @returns {boolean} True se a data for no passado
 */
export function isPastDate(date) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj < new Date()
  } catch (error) {
    return false
  }
}

/**
 * Verifica se uma data está no futuro
 * @param {string|Date} date - A data a ser verificada
 * @returns {boolean} True se a data for no futuro
 */
export function isFutureDate(date) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj > new Date()
  } catch (error) {
    return false
  }
}

/**
 * Calcula a diferença em dias entre duas datas
 * @param {string|Date} date1 - Primeira data
 * @param {string|Date} date2 - Segunda data
 * @returns {number} Diferença em dias
 */
export function differenceInDays(date1, date2) {
  try {
    const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1
    const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2
    
    const diffTime = Math.abs(dateObj2 - dateObj1)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } catch (error) {
    return 0
  }
}