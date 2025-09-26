import React, { useRef } from 'react'
import { Paperclip, X, Upload, FileText, Image, File } from 'lucide-react'
import { useFileUpload } from '../../hooks/useFileUpload'

const FileUploadArea = ({ 
  onFileSelect, 
  selectedFiles = [], 
  onRemoveFile,
  disabled = false,
  maxFiles = 5 
}) => {
  const fileInputRef = useRef(null)
  const { formatFileSize, getFileIcon, uploading } = useFileUpload()

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    
    // Verificar limite de arquivos
    if (selectedFiles.length + files.length > maxFiles) {
      alert(`Máximo de ${maxFiles} arquivos permitidos`)
      return
    }

    // Verificar tamanho dos arquivos (10MB cada)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      alert('Alguns arquivos excedem o limite de 10MB')
      return
    }

    files.forEach(file => {
      onFileSelect(file)
    })

    // Limpar input
    e.target.value = ''
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    
    // Verificar limite de arquivos
    if (selectedFiles.length + files.length > maxFiles) {
      alert(`Máximo de ${maxFiles} arquivos permitidos`)
      return
    }

    // Verificar tamanho dos arquivos
    const maxSize = 10 * 1024 * 1024 // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      alert('Alguns arquivos excedem o limite de 10MB')
      return
    }

    files.forEach(file => {
      onFileSelect(file)
    })
  }

  const getFileTypeIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />
    } else if (file.type.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />
    } else {
      return <File className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-3">
      {/* Área de Upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
            : 'border-gray-300 hover:border-[#EBA500] hover:bg-[#EBA500]/5'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
        />
        
        <div className="space-y-2">
          <Upload className={`h-8 w-8 mx-auto ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
          <div className="text-sm">
            <span className={disabled ? 'text-gray-400' : 'text-gray-600'}>
              Clique para selecionar ou arraste arquivos aqui
            </span>
            <div className="text-xs text-gray-400 mt-1">
              Máximo {maxFiles} arquivos • 10MB cada • JPG, PNG, PDF, DOC, XLS...
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Arquivos Selecionados */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Arquivos selecionados ({selectedFiles.length}/{maxFiles})
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileTypeIcon(file)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveFile(index)
                  }}
                  className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploadArea