import React, { useState, useEffect } from 'react'
import toast from '@/lib/toast'
import { X, User, Calendar, MessageCircle, Send, Edit3, Check, Clock, AlertCircle, Paperclip } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTasks } from '../../hooks/useTasks'
import { useFileUpload } from '../../hooks/useFileUpload'
import { supabase } from '../../services/supabase'
import FileUploadArea from '../common/FileUploadArea'
import AttachmentList from '../common/AttachmentList'

const TaskSidebar = ({ isOpen, onClose, task, users = [], onTaskUpdate }) => {
  const { profile } = useAuth()
  const { updateTask, getTaskComments, addComment } = useTasks()
  const { uploadFile, uploading, uploadProgress } = useFileUpload()
  
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [assignedUserName, setAssignedUserName] = useState(null)
  
  // 🔥 Buscar nome do usuário atribuído quando necessário
  useEffect(() => {
    const fetchAssignedUserName = async () => {
      if (!task?.assigned_to) {
        setAssignedUserName(null)
        return
      }
      
      // Se já tem na lista de users, usa
      if (users && users.length > 0) {
        const usuario = users.find(u => u.id === task.assigned_to)
        if (usuario) {
          setAssignedUserName(usuario.name)
          return
        }
      }
      
      // Senão, busca direto do profiles
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', task.assigned_to)
          .single()
        
        if (error) throw error
        
        setAssignedUserName(data.full_name || data.email || 'Usuário')
      } catch (error) {
        console.error('Erro ao buscar nome do usuário:', error)
        setAssignedUserName('Erro ao carregar')
      }
    }
    
    if (task) {
      fetchAssignedUserName()
    }
  }, [task?.assigned_to, users])
  
  // 🔥 Função para obter nome do responsável
  const getResponsavelName = () => {
    // 1. Se já tem responsavel mapeado, usa ele
    if (task.responsavel) return task.responsavel
    
    // 2. Se tem assigned_to_name (responsável manual), usa ele
    if (task.assigned_to_name) return task.assigned_to_name
    
    // 3. Usa o nome buscado do banco
    if (assignedUserName) return assignedUserName
    
    // 4. Se não encontrou nada, retorna fallback
    return task.assigned_to ? 'Carregando...' : 'Não atribuído'
  }
  
  useEffect(() => {
    if (isOpen && task) {
      // Delay para trigger da animação
      const timer = setTimeout(() => setIsVisible(true), 50)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isOpen, task])
  
  useEffect(() => {
    if (task) {
      setTempTitle(task.texto || '')
      if (isOpen) {
        loadComments()
      }
    }
  }, [task, isOpen])

  const loadComments = async () => {
    if (!task?.id) return
    
    setIsLoadingComments(true)
    try {
      const taskComments = await getTaskComments(task.id)
      setComments(taskComments)
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() && selectedFiles.length === 0) return

    setIsAddingComment(true)
    try {
      let uploadedAttachments = []

      // Upload dos arquivos se houver
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          try {
            const fileInfo = await uploadFile(file, task.id)
            uploadedAttachments.push(fileInfo)
          } catch (error) {
            console.error('Erro ao fazer upload do arquivo:', file.name, error)
            toast.alert(`Erro ao enviar arquivo: ${file.name}`)
            return
          }
        }
      }

      // Adicionar comentário com anexos
      const savedComment = await addComment(task.id, newComment || '📎 Anexo(s) enviado(s)', uploadedAttachments)
      setComments([...comments, savedComment])
      setNewComment('')
      setSelectedFiles([])
      setShowFileUpload(false)
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      toast.alert('Erro ao adicionar comentário')
    } finally {
      setIsAddingComment(false)
    }
  }

  const handleFileSelect = (file) => {
    setSelectedFiles(prev => [...prev, file])
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateTitle = async () => {
    if (!tempTitle.trim() || tempTitle === task.texto) {
      setEditingTitle(false)
      return
    }

    try {
      await updateTask(task.id, { title: tempTitle })
      setEditingTitle(false)
      
      // 🔥 NOVO: Notificar componente pai sobre atualização
      if (onTaskUpdate && task.processoId) {
        onTaskUpdate(task.processoId)
      }
    } catch (error) {
      console.error('Erro ao atualizar título:', error)
      setTempTitle(task.texto)
      setEditingTitle(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Concluída'
      case 'in_progress':
        return 'Em Andamento'
      case 'pending':
        return 'Pendente'
      default:
        return 'Desconhecido'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Não definida'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!task) return null

  return (
    <div className={`fixed inset-0 z-40 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white dark:bg-gray-800 shadow-2xl z-10 rounded-l-[40px] sm:rounded-l-[40px] transform transition-transform duration-500 ease-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 rounded-tl-[40px] sm:rounded-tl-[40px] flex-shrink-0">
          <div className="flex items-center space-x-2">
            {getStatusIcon(task.status)}
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {getStatusLabel(task.status)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Title Section */}
          <div className="p-4 sm:p-6">
            {editingTitle && profile?.role !== 'user' ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleUpdateTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateTitle()
                    if (e.key === 'Escape') {
                      setTempTitle(task.texto)
                      setEditingTitle(false)
                    }
                  }}
                  className="w-full text-xl sm:text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0"
                  autoFocus
                />
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>Enter para salvar • Esc para cancelar</span>
                </div>
              </div>
            ) : (
              <div 
                className={profile?.role !== 'user' ? "group cursor-pointer" : ""}
                onClick={() => profile?.role !== 'user' && setEditingTitle(true)}
              >
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  {task.texto}
                </h1>
                {profile?.role !== 'user' && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                    <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
                      <Edit3 className="h-3 w-3" />
                      <span>Clique para editar</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Task Details */}
          <div className="px-4 sm:px-6 space-y-4">
            {/* Responsible */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#EBA500]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-[#EBA500]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">
                  Responsável
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {getResponsavelName()}
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">
                  Data Limite
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {formatDate(task.dataLimite || task.due_date)}
                </div>
              </div>
            </div>

            {/* Description */}
            {task.descricao && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">
                  Descrição
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  {task.descricao}
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
            <div className="mt-6 sm:mt-8 border-t border-gray-100 dark:border-gray-700 pb-4 sm:pb-6">
            <div className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                  Comentários ({comments.length})
                </h3>
              </div>

              {/* Comments List */}
              <div className="space-y-4 mb-6">
                {isLoadingComments ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin w-6 h-6 border-2 border-[#EBA500] border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm">Carregando comentários...</p>
                  </div>
                ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nenhum comentário ainda</p>
                    <p className="text-xs text-gray-400 mt-1">Seja o primeiro a comentar</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-[#EBA500]/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-3 w-3 text-[#EBA500]" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {comment.author_name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {formatDateTime(comment.created_at)}
                        </span>
                      </div>
                      <div className="ml-8">
                        {comment.content && (
                          <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-2">
                            {comment.content}
                          </div>
                        )}
                        <AttachmentList attachments={comment.attachments} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Comment - Fixed at bottom */}
        <div className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-bl-[40px] sm:rounded-bl-[40px] flex-shrink-0">
          <div className="p-4 sm:p-6 space-y-3">
            {/* File Upload Area */}
            {showFileUpload && (
              <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                <FileUploadArea
                  onFileSelect={handleFileSelect}
                  selectedFiles={selectedFiles}
                  onRemoveFile={handleRemoveFile}
                  disabled={isAddingComment}
                  maxFiles={3}
                />
              </div>
            )}

            {/* Comment Input */}
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                className="w-full p-3 pr-12 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-colors"
                rows={3}
              />
              {/* Attach Files Button */}
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                className={`absolute bottom-3 right-3 p-1.5 rounded transition-colors ${
                  showFileUpload 
                    ? 'bg-[#EBA500] text-white' 
                    : 'text-gray-400 hover:text-[#EBA500] hover:bg-[#EBA500]/10'
                }`}
                title="Anexar arquivos"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </div>

            {/* Progress bar durante upload */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Enviando arquivos...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                  <div 
                    className="bg-[#EBA500] h-1 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-400">
                {selectedFiles.length > 0 && (
                  <span>{selectedFiles.length} arquivo(s) selecionado(s)</span>
                )}
              </div>
              <button
                onClick={handleAddComment}
                disabled={(!newComment.trim() && selectedFiles.length === 0) || isAddingComment || uploading}
                className="flex items-center space-x-2 px-4 py-2 bg-[#EBA500] text-white rounded-lg text-sm font-medium hover:bg-[#EBA500]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>
                  {isAddingComment || uploading ? 'Enviando...' : 'Comentar'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskSidebar