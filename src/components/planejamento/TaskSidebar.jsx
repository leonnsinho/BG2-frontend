import React, { useState, useEffect } from 'react'
import { X, User, Calendar, MessageCircle, Send, Edit3, Check, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTasks } from '../../hooks/useTasks'

const TaskSidebar = ({ isOpen, onClose, task, users = [] }) => {
  const { profile } = useAuth()
  const { updateTask, getTaskComments, addComment } = useTasks()
  
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState('')
  
  useEffect(() => {
    if (task) {
      setTempTitle(task.texto || '')
      loadComments()
    }
  }, [task])

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
    if (!newComment.trim()) return

    setIsAddingComment(true)
    try {
      const savedComment = await addComment(task.id, newComment)
      setComments([...comments, savedComment])
      setNewComment('')
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      alert('Erro ao adicionar comentário')
    } finally {
      setIsAddingComment(false)
    }
  }

  const handleUpdateTitle = async () => {
    if (!tempTitle.trim() || tempTitle === task.texto) {
      setEditingTitle(false)
      return
    }

    try {
      await updateTask(task.id, { title: tempTitle })
      setEditingTitle(false)
      // Aqui idealmente recarregaríamos a tarefa ou atualizaríamos via callback
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

  if (!isOpen || !task) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            {getStatusIcon(task.status)}
            <span className="text-sm font-medium text-gray-600">
              {getStatusLabel(task.status)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Title Section */}
          <div className="p-6">
            {editingTitle ? (
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
                  className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0"
                  autoFocus
                />
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>Enter para salvar • Esc para cancelar</span>
                </div>
              </div>
            ) : (
              <div 
                className="group cursor-pointer"
                onClick={() => setEditingTitle(true)}
              >
                <h1 className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                  {task.texto}
                </h1>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Edit3 className="h-3 w-3" />
                    <span>Clique para editar</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Task Details */}
          <div className="px-6 space-y-4">
            {/* Responsible */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#EBA500]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-[#EBA500]" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                  Responsável
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {task.responsavel || 'Não atribuído'}
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                  Data Limite
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(task.dataLimite)}
                </div>
              </div>
            </div>

            {/* Description */}
            {task.descricao && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                  Descrição
                </div>
                <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">
                  {task.descricao}
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="mt-8 border-t border-gray-100">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">
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
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nenhum comentário ainda</p>
                    <p className="text-xs text-gray-400 mt-1">Seja o primeiro a comentar</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-[#EBA500]/20 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-[#EBA500]" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {comment.author_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(comment.created_at)}
                        </span>
                      </div>
                      <div className="ml-8 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                        {comment.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <div className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicione um comentário..."
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-colors"
                  rows={3}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isAddingComment}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#EBA500] text-white rounded-lg text-sm font-medium hover:bg-[#EBA500]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isAddingComment ? 'Enviando...' : 'Comentar'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TaskSidebar