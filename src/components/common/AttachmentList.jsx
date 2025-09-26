import React, { useState } from 'react'
import { Download, Eye, FileText, Image, File, ExternalLink } from 'lucide-react'
import { useFileUpload } from '../../hooks/useFileUpload'

const AttachmentList = ({ attachments = [] }) => {
  const { getFileUrl, formatFileSize } = useFileUpload()
  const [loadingUrl, setLoadingUrl] = useState({})

  const getFileTypeIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />
    } else {
      return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const handleDownload = async (attachment) => {
    if (!attachment.path) return

    try {
      setLoadingUrl(prev => ({ ...prev, [attachment.path]: true }))
      
      const signedUrl = await getFileUrl(attachment.path)
      
      // Criar link temporário para download
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = attachment.name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error)
      alert('Erro ao baixar arquivo')
    } finally {
      setLoadingUrl(prev => ({ ...prev, [attachment.path]: false }))
    }
  }

  const handlePreview = async (attachment) => {
    if (!attachment.path) return

    try {
      setLoadingUrl(prev => ({ ...prev, [attachment.path]: true }))
      
      const signedUrl = await getFileUrl(attachment.path)
      
      // Abrir em nova aba para preview
      window.open(signedUrl, '_blank')
      
    } catch (error) {
      console.error('Erro ao visualizar arquivo:', error)
      alert('Erro ao visualizar arquivo')
    } finally {
      setLoadingUrl(prev => ({ ...prev, [attachment.path]: false }))
    }
  }

  if (!attachments || attachments.length === 0) {
    return null
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="text-xs text-gray-500 font-medium">
        Anexos ({attachments.length})
      </div>
      <div className="space-y-1">
        {attachments.map((attachment, index) => (
          <div
            key={`${attachment.path}-${index}`}
            className="flex items-center justify-between p-2 bg-gray-50 rounded border group hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {getFileTypeIcon(attachment.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {attachment.name}
                </div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(attachment.size)} • {new Date(attachment.uploaded_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Preview button - apenas para imagens e PDFs */}
              {(attachment.type.startsWith('image/') || attachment.type.includes('pdf')) && (
                <button
                  onClick={() => handlePreview(attachment)}
                  disabled={loadingUrl[attachment.path]}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  title="Visualizar"
                >
                  <Eye className="h-3 w-3" />
                </button>
              )}
              
              {/* Download button */}
              <button
                onClick={() => handleDownload(attachment)}
                disabled={loadingUrl[attachment.path]}
                className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Baixar"
              >
                {loadingUrl[attachment.path] ? (
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AttachmentList