import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { profile } = useAuth()

  const uploadFile = async (file, taskId) => {
    if (!file || !profile?.id) {
      throw new Error('Arquivo ou usuário não encontrado')
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${profile.id}/${taskId}/${fileName}`

      // Upload do arquivo
      const { data, error } = await supabase.storage
        .from('task-files')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100)
          }
        })

      if (error) {
        throw error
      }

      // Retornar informações do arquivo
      const fileInfo = {
        name: file.name,
        path: data.path,
        size: file.size,
        type: file.type,
        uploaded_at: new Date().toISOString()
      }

      return fileInfo
    } catch (error) {
      console.error('Erro no upload:', error)
      throw error
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const getFileUrl = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-files')
        .createSignedUrl(filePath, 3600) // URL válida por 1 hora

      if (error) {
        throw error
      }

      return data.signedUrl
    } catch (error) {
      console.error('Erro ao gerar URL:', error)
      throw error
    }
  }

  const deleteFile = async (filePath) => {
    try {
      const { error } = await supabase.storage
        .from('task-files')
        .remove([filePath])

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      throw error
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊'
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📋'
    if (fileType.includes('text')) return '📄'
    return '📎'
  }

  return {
    uploadFile,
    getFileUrl,
    deleteFile,
    formatFileSize,
    getFileIcon,
    uploading,
    uploadProgress
  }
}