import React, { useState, useRef, useEffect } from 'react'
import { Upload, X, Download, File, AlertCircle, CheckCircle } from 'lucide-react'
import ProcessEvaluationFileService from '../services/ProcessEvaluationFileService'
import toast from 'react-hot-toast'

const FileUploadField = ({ 
  companyId, 
  processId, 
  evaluationId, 
  value = [], 
  onChange, 
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // Carregar arquivos existentes quando o evaluationId muda
  useEffect(() => {
    if (evaluationId && companyId && processId) {
      loadExistingFiles()
    }
  }, [evaluationId, companyId, processId])

  const loadExistingFiles = async () => {
    try {
      const { data, error } = await ProcessEvaluationFileService.listFiles(
        companyId, 
        processId, 
        evaluationId
      )

      if (error) {
        console.error('Erro ao carregar arquivos:', error)
        return
      }

      if (data && data.length > 0) {
        onChange(data.map(file => ({
          id: file.name,
          name: file.name,
          path: `${companyId}/${processId}/${evaluationId}/${file.name}`,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || 'application/octet-stream',
          uploaded: true,
          url: file.publicUrl
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles([...e.dataTransfer.files])
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles([...e.target.files])
    }
  }

  const handleFiles = async (files) => {
    if (!evaluationId || !companyId || !processId) {
      toast.error('Erro: Dados da avaliação não encontrados')
      return
    }

    setUploading(true)

    try {
      const { data, error } = await ProcessEvaluationFileService.uploadMultipleFiles(
        files,
        companyId,
        processId,
        evaluationId
      )

      if (error && error.length > 0) {
        error.forEach(err => {
          toast.error(`Erro ao fazer upload de ${err.file}: ${err.error.message}`)
        })
      }

      if (data && data.length > 0) {
        const newFiles = data.map(file => ({
          id: Date.now() + Math.random(),
          name: file.originalName,
          path: file.path,
          size: file.size,
          type: file.type,
          uploaded: true,
          url: file.publicUrl
        }))

        onChange([...value, ...newFiles])
        toast.success(`${data.length} arquivo(s) enviado(s) com sucesso!`)
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao fazer upload dos arquivos')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = async (fileToRemove) => {
    if (fileToRemove.uploaded && fileToRemove.path) {
      try {
        await ProcessEvaluationFileService.deleteFile(fileToRemove.path)
        toast.success('Arquivo removido com sucesso')
      } catch (error) {
        console.error('Erro ao remover arquivo:', error)
        toast.error('Erro ao remover arquivo')
      }
    }

    onChange(value.filter(file => file.id !== fileToRemove.id))
  }

  const downloadFile = async (file) => {
    try {
      const signedUrl = await ProcessEvaluationFileService.getSignedUrl(file.path)
      if (signedUrl) {
        window.open(signedUrl, '_blank')
      } else {
        toast.error('Erro ao gerar link de download')
      }
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error)
      toast.error('Erro ao baixar arquivo')
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Arquivos de Evidência
      </label>

      {/* Área de Upload */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          disabled={disabled || uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm"
        />
        
        <div className="text-center">
          <Upload className={`mx-auto h-12 w-12 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
          <div className="mt-4">
            <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
              {uploading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                  Enviando arquivos...
                </span>
              ) : (
                <>
                  <span className="font-medium text-primary-600 hover:text-primary-500">
                    Clique para selecionar arquivos
                  </span>{' '}
                  ou arraste e solte aqui
                </>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOC, XLS, PPT, TXT, CSV, Imagens, Vídeos até 50MB cada
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Arquivos */}
      {value && value.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Arquivos Anexados ({value.length})
          </h4>
          
          <div className="space-y-2">
            {value.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-lg">
                    {ProcessEvaluationFileService.getFileIcon(file.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ProcessEvaluationFileService.formatFileSize(file.size)}
                      {file.uploaded && (
                        <span className="ml-2 inline-flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                          Enviado
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {file.uploaded && (
                    <button
                      type="button"
                      onClick={() => downloadFile(file)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Baixar arquivo"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => removeFile(file)}
                    disabled={disabled}
                    className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                    title="Remover arquivo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem de aviso se não há evaluationId */}
      {(!evaluationId && value.length === 0) && (
        <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <p className="text-sm text-yellow-800">
            Salve a avaliação primeiro para poder anexar arquivos
          </p>
        </div>
      )}
    </div>
  )
}

export default FileUploadField