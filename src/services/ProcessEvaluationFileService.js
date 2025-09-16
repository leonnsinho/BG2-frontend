import { supabase } from './supabase'

/**
 * Service para gerenciar uploads de arquivos de avaliações de processos
 */
class ProcessEvaluationFileService {
  static BUCKET_NAME = 'process-evaluation-files'
  static MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

  /**
   * Faz upload de um arquivo para o bucket de avaliações
   * @param {File} file - O arquivo a ser enviado
   * @param {string} companyId - ID da empresa
   * @param {string} processId - ID do processo
   * @param {string} evaluationId - ID da avaliação
   * @returns {Promise<{data: object, error: object}>}
   */
  static async uploadFile(file, companyId, processId, evaluationId) {
    try {
      // Validar tamanho do arquivo
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          data: null,
          error: { message: `Arquivo muito grande. Tamanho máximo: ${this.MAX_FILE_SIZE / 1024 / 1024}MB` }
        }
      }

      // Validar tipo de arquivo
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm'
      ]

      if (!allowedTypes.includes(file.type)) {
        return {
          data: null,
          error: { message: 'Tipo de arquivo não permitido' }
        }
      }

      // Gerar nome único para o arquivo
      const fileExtension = file.name.split('.').pop()
      const timestamp = new Date().getTime()
      const randomString = Math.random().toString(36).substring(7)
      const fileName = `${timestamp}_${randomString}.${fileExtension}`

      // Definir caminho do arquivo
      const filePath = `${companyId}/${processId}/${evaluationId}/${fileName}`

      // Fazer upload
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        return { data: null, error }
      }

      // Retornar informações do arquivo
      return {
        data: {
          path: data.path,
          fullPath: data.fullPath,
          fileName: fileName,
          originalName: file.name,
          size: file.size,
          type: file.type,
          publicUrl: this.getPublicUrl(data.path)
        },
        error: null
      }

    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Faz upload de múltiplos arquivos
   * @param {File[]} files - Array de arquivos
   * @param {string} companyId - ID da empresa
   * @param {string} processId - ID do processo  
   * @param {string} evaluationId - ID da avaliação
   * @returns {Promise<{data: object[], error: object}>}
   */
  static async uploadMultipleFiles(files, companyId, processId, evaluationId) {
    const results = []
    const errors = []

    for (const file of files) {
      const result = await this.uploadFile(file, companyId, processId, evaluationId)
      if (result.error) {
        errors.push({ file: file.name, error: result.error })
      } else {
        results.push(result.data)
      }
    }

    return {
      data: results,
      error: errors.length > 0 ? errors : null
    }
  }

  /**
   * Lista arquivos de uma avaliação
   * @param {string} companyId - ID da empresa
   * @param {string} processId - ID do processo
   * @param {string} evaluationId - ID da avaliação
   * @returns {Promise<{data: object[], error: object}>}
   */
  static async listFiles(companyId, processId, evaluationId) {
    const folderPath = `${companyId}/${processId}/${evaluationId}`

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .list(folderPath, {
        limit: 100,
        offset: 0
      })

    if (error) {
      return { data: null, error }
    }

    // Adicionar URL pública para cada arquivo
    const filesWithUrls = data.map(file => ({
      ...file,
      publicUrl: this.getPublicUrl(`${folderPath}/${file.name}`),
      downloadUrl: this.getSignedUrl(`${folderPath}/${file.name}`)
    }))

    return { data: filesWithUrls, error: null }
  }

  /**
   * Deleta um arquivo
   * @param {string} filePath - Caminho completo do arquivo
   * @returns {Promise<{data: object, error: object}>}
   */
  static async deleteFile(filePath) {
    return await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([filePath])
  }

  /**
   * Obtém URL pública de um arquivo (se o bucket for público)
   * @param {string} filePath - Caminho do arquivo
   * @returns {string}
   */
  static getPublicUrl(filePath) {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }

  /**
   * Obtém URL assinada para download (para buckets privados)
   * @param {string} filePath - Caminho do arquivo
   * @param {number} expiresIn - Tempo de expiração em segundos (padrão: 1 hora)
   * @returns {Promise<string>}
   */
  static async getSignedUrl(filePath, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('Erro ao gerar URL assinada:', error)
      return null
    }

    return data.signedUrl
  }

  /**
   * Formata o tamanho do arquivo para exibição
   * @param {number} bytes - Tamanho em bytes
   * @returns {string}
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Obtém o ícone apropriado para um tipo de arquivo
   * @param {string} mimeType - Tipo MIME do arquivo
   * @returns {string}
   */
  static getFileIcon(mimeType) {
    const iconMap = {
      'application/pdf': '📄',
      'application/msword': '📝',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
      'application/vnd.ms-excel': '📊',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
      'application/vnd.ms-powerpoint': '📽️',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📽️',
      'text/plain': '📄',
      'text/csv': '📊',
      'image/jpeg': '🖼️',
      'image/png': '🖼️',
      'image/gif': '🖼️',
      'image/webp': '🖼️',
      'video/mp4': '🎥',
      'video/webm': '🎥'
    }

    return iconMap[mimeType] || '📎'
  }
}

export default ProcessEvaluationFileService