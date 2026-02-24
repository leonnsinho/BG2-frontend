import React, { useState, useEffect, useRef } from 'react'
import { X, FileText, CheckSquare, Paperclip, Plus, Save, Trash2, Edit2, Download, ExternalLink, GripVertical, Bold, Italic, Link as LinkIcon, List, Heading, Upload, Loader2, Eye } from 'lucide-react'
import { supabase } from '../services/supabase'
import { renderIcon } from '../utils/iconRenderer'

export default function BlockCardModal({ block, isOpen, isInline = false, onClose, onUpdate }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [internalDescription, setInternalDescription] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [tags, setTags] = useState([])
  const [checklists, setChecklists] = useState([])
  const [attachments, setAttachments] = useState([])
  const [selectedAttachments, setSelectedAttachments] = useState([])
  const [showChecklistForm, setShowChecklistForm] = useState(false)
  const [showAttachmentForm, setShowAttachmentForm] = useState(false)
  const [newChecklistName, setNewChecklistName] = useState('')
  const [attachmentType, setAttachmentType] = useState('file') // 'file' ou 'link'
  const [attachmentLink, setAttachmentLink] = useState('')
  const [saving, setSaving] = useState(false)
  const editorRef = useRef(null) // Para o editor contentEditable
  const [isEditorInitialized, setIsEditorInitialized] = useState(false)
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false
  })

  // Verificar formatações ativas ao mover o cursor
  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline')
    })
  }

  // Inicializar conteúdo do editor apenas uma vez
  useEffect(() => {
    if (isEditingDescription && editorRef.current && !isEditorInitialized) {
      editorRef.current.innerHTML = internalDescription || ''
      setIsEditorInitialized(true)
      editorRef.current.focus()
    }
    if (!isEditingDescription) {
      setIsEditorInitialized(false)
    }
  }, [isEditingDescription])

  // Função para aplicar formatação diretamente (execCommand)
  const applyRichFormatting = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    // Atualizar estado imediatamente
    setTimeout(updateActiveFormats, 10)
  }

  // Função para inserir link
  const insertLink = () => {
    const url = prompt('Digite a URL:')
    if (url) {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const selectedText = selection.toString()
        if (selectedText) {
          applyRichFormatting('createLink', url)
        } else {
          // Se não há texto selecionado, inserir texto + link
          const link = document.createElement('a')
          link.href = url
          link.textContent = url
          link.target = '_blank'
          link.rel = 'noopener noreferrer'
          link.className = 'text-blue-600 hover:underline'
          
          const range = selection.getRangeAt(0)
          range.insertNode(link)
          range.collapse(false)
        }
      }
    }
  }

  // Converter HTML para texto ao salvar
  const getEditorContent = () => {
    if (!editorRef.current) return internalDescription
    return editorRef.current.innerHTML
  }

  // Salvar com conteúdo HTML
  const handleSaveDescriptionRich = async () => {
    const htmlContent = getEditorContent()
    
    setSaving(true)
    const { error } = await supabase
      .from('policy_blocks')
      .update({ internal_description: htmlContent })
      .eq('id', block.id)

    if (!error) {
      setIsEditingDescription(false)
      setInternalDescription(htmlContent)
      block.internal_description = htmlContent
      onUpdate?.({ ...block, internal_description: htmlContent })
    }
    setSaving(false)
  }

  useEffect(() => {
    if (block && isOpen) {
      loadBlockData()
    }
  }, [block, isOpen])

  const loadBlockData = async () => {
    setTitle(block.name || '')
    setDescription(block.description || '')
    setInternalDescription(block.internal_description || '')
    
    console.log('📋 Carregando dados do bloco:', block.id)

    // Carregar checklists
    const { data: checklistsData, error: checklistError } = await supabase
      .from('policy_checklists')
      .select('*, policy_checklist_items(*)')
      .eq('block_id', block.id)
      .order('created_at')

    if (checklistError) {
      console.error('❌ Erro ao carregar checklists:', checklistError)
    } else {
      console.log('✅ Checklists carregadas:', checklistsData)
      setChecklists(checklistsData || [])
    }

    // Carregar anexos
    const { data: attachmentsData, error: attachError } = await supabase
      .from('policy_attachments')
      .select('*')
      .eq('block_id', block.id)
      .order('created_at')

    if (attachError) {
      console.error('❌ Erro ao carregar anexos:', attachError)
    } else {
      console.log('✅ Anexos carregados:', attachmentsData)
      setAttachments(attachmentsData || [])
    }

    // Carregar tags (se existir na estrutura)
    if (block.tags) {
      setTags(block.tags)
    }
  }

  const handleSaveTitle = async () => {
    if (!title.trim()) return

    setSaving(true)
    const { error } = await supabase
      .from('policy_blocks')
      .update({ name: title })
      .eq('id', block.id)

    if (!error) {
      setIsEditingTitle(false)
      // Atualizar o bloco localmente ao invés de recarregar tudo
      if (block) {
        block.name = title
      }
      onUpdate?.({ ...block, name: title })
    }
    setSaving(false)
  }

  const handleSaveDescription = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('policy_blocks')
      .update({ internal_description: internalDescription })
      .eq('id', block.id)

    if (!error) {
      setIsEditingDescription(false)
      // Atualizar o bloco localmente ao invés de recarregar tudo
      if (block) {
        block.internal_description = internalDescription
      }
      onUpdate?.({ ...block, internal_description: internalDescription })
    }
    setSaving(false)
  }

  // ========== CHECKLIST FUNCTIONS ==========
  const handleCreateChecklist = async () => {
    if (!newChecklistName.trim()) return

    console.log('🔄 Criando checklist:', {
      block_id: block.id,
      name: newChecklistName,
      company_id: block.company_id
    })

    setSaving(true)
    const { data, error } = await supabase
      .from('policy_checklists')
      .insert({
        block_id: block.id,
        name: newChecklistName,
        company_id: block.company_id
      })
      .select('*, policy_checklist_items(*)')
      .single()

    if (error) {
      console.error('❌ Erro ao criar checklist:', error)
      alert(`Erro ao criar checklist: ${error.message}`)
      setSaving(false)
      return
    }

    if (data) {
      console.log('✅ Checklist criada:', data)
      setChecklists([...checklists, data])
      setNewChecklistName('')
      setShowChecklistForm(false)
    }
    setSaving(false)
  }

  const handleDeleteChecklist = async (checklistId) => {
    if (!confirm('Deseja realmente deletar esta checklist?')) return

    setSaving(true)
    const { error } = await supabase
      .from('policy_checklists')
      .delete()
      .eq('id', checklistId)

    if (!error) {
      setChecklists(checklists.filter(c => c.id !== checklistId))
    }
    setSaving(false)
  }

  const handleAddChecklistItem = async (checklistId, itemText) => {
    if (!itemText.trim()) return

    setSaving(true)
    const { data, error } = await supabase
      .from('policy_checklist_items')
      .insert({
        checklist_id: checklistId,
        text: itemText,
        is_completed: false
      })
      .select()
      .single()

    if (!error && data) {
      setChecklists(checklists.map(cl => 
        cl.id === checklistId 
          ? { ...cl, policy_checklist_items: [...(cl.policy_checklist_items || []), data] }
          : cl
      ))
    }
    setSaving(false)
  }

  const handleToggleChecklistItem = async (checklistId, itemId, isCompleted) => {
    setSaving(true)
    const { error } = await supabase
      .from('policy_checklist_items')
      .update({ is_completed: !isCompleted })
      .eq('id', itemId)

    if (!error) {
      setChecklists(checklists.map(cl =>
        cl.id === checklistId
          ? {
              ...cl,
              policy_checklist_items: cl.policy_checklist_items.map(item =>
                item.id === itemId ? { ...item, is_completed: !isCompleted } : item
              )
            }
          : cl
      ))
    }
    setSaving(false)
  }

  const handleDeleteChecklistItem = async (checklistId, itemId) => {
    setSaving(true)
    const { error } = await supabase
      .from('policy_checklist_items')
      .delete()
      .eq('id', itemId)

    if (!error) {
      setChecklists(checklists.map(cl =>
        cl.id === checklistId
          ? {
              ...cl,
              policy_checklist_items: cl.policy_checklist_items.filter(item => item.id !== itemId)
            }
          : cl
      ))
    }
    setSaving(false)
  }

  // ========== ATTACHMENT FUNCTIONS ==========
  const handleUploadFile = async (files) => {
    if (!files || files.length === 0) return

    setSaving(true)
    const fileArray = Array.isArray(files) ? files : [files]
    let uploadedCount = 0
    let failedCount = 0
    const newAttachments = []

    for (const file of fileArray) {
      try {
        console.log('📎 Iniciando upload:', file.name)
        
        // Sanitizar nome do arquivo (remover espaços e caracteres especiais)
        const sanitizedName = file.name
          .replace(/\s+/g, '_')  // Substituir espaços por underscore
          .replace(/[^a-zA-Z0-9._-]/g, '')  // Remover caracteres especiais
        
        const fileName = `${Date.now()}_${sanitizedName}`
        const filePath = `${block.company_id}/${fileName}` // Sem 'attachments/' no início

        // Upload para Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('policy-attachments')
          .upload(filePath, file)

        if (uploadError) {
          console.error('❌ Erro no upload para storage:', uploadError)
          failedCount++
          continue
        }

        console.log('✅ Upload para storage OK:', uploadData)

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('policy-attachments')
          .getPublicUrl(filePath)

        console.log('📝 Salvando no banco de dados...')

        // Salvar no banco - usando campos corretos da tabela
        const { data, error } = await supabase
          .from('policy_attachments')
          .insert({
            block_id: block.id,
            company_id: block.company_id,
            name: file.name,
            file_path: filePath,
            url: publicUrl,
            type: 'file',
            file_size: file.size
          })
          .select()
          .single()

        if (error) {
          console.error('❌ Erro ao salvar no banco:', error)
          failedCount++
          continue
        }

        console.log('✅ Anexo salvo com sucesso!')
        uploadedCount++
        newAttachments.push(data)
      } catch (err) {
        console.error('❌ Erro ao processar arquivo:', err)
        failedCount++
      }
    }

    // Atualizar lista de anexos uma vez com todos os novos arquivos
    if (newAttachments.length > 0) {
      setAttachments([...attachments, ...newAttachments])
    }

    setSaving(false)

    // Mostrar resultado
    if (uploadedCount > 0 && failedCount === 0) {
      alert(`✅ ${uploadedCount} arquivo(s) enviado(s) com sucesso!`)
    } else if (uploadedCount > 0 && failedCount > 0) {
      alert(`⚠️ ${uploadedCount} arquivo(s) enviado(s), ${failedCount} falharam.`)
    } else if (failedCount > 0) {
      alert(`❌ Falha ao enviar todos os arquivos`)
      return
    }

    if (data) {
      console.log('✅ Anexo salvo:', data)
      setAttachments([...attachments, data])
      setShowAttachmentForm(false)
    }
    setSaving(false)
  }

  const handleDownloadAttachment = async (attachment) => {
    try {
      // Suportar tanto file_path quanto usar url
      const filePath = attachment.file_path
      
      if (!filePath) {
        console.error('❌ Caminho do arquivo não encontrado')
        alert('Erro: caminho do arquivo não encontrado')
        return
      }

      const { data, error } = await supabase.storage
        .from('policy-attachments')
        .download(filePath)

      if (error) {
        console.error('❌ Erro ao baixar arquivo:', error)
        alert('Erro ao baixar arquivo')
        return
      }

      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.name || attachment.file_name || 'arquivo'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('❌ Erro ao baixar:', err)
      alert('Erro ao baixar arquivo')
    }
  }

  const handleViewAttachment = async (attachment) => {
    try {
      // Verificar se tem file_path
      const filePath = attachment.file_path
      
      if (!filePath) {
        console.error('❌ Caminho do arquivo não encontrado')
        alert('Erro: caminho do arquivo não encontrado')
        return
      }

      // Criar URL assinada (funciona com RLS)
      const { data, error } = await supabase.storage
        .from('policy-attachments')
        .createSignedUrl(filePath, 3600) // URL válida por 1 hora

      if (error) {
        console.error('❌ Erro ao gerar URL:', error)
        alert('Erro ao visualizar arquivo')
        return
      }

      // Classificar o tipo de arquivo para decidir como visualizar
      const fileName = attachment.name || attachment.file_name || ''
      const fileExtension = fileName.split('.').pop().toLowerCase()
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
      const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']

      if (fileExtension === 'pdf' || imageExtensions.includes(fileExtension)) {
        // PDF e imagens: abrir URL assinada diretamente em nova aba
        window.open(data.signedUrl, '_blank')
      } else if (officeExtensions.includes(fileExtension)) {
        // Word / Excel / PowerPoint: abrir via Microsoft Office Online Viewer
        const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(data.signedUrl)}`
        window.open(viewerUrl, '_blank')
      } else {
        // Para outros tipos desconhecidos, fazer download
        handleDownloadAttachment(attachment)
      }
    } catch (err) {
      console.error('❌ Erro ao visualizar:', err)
      alert('Erro ao visualizar arquivo')
    }
  }

  const toggleAttachmentSelection = (attachmentId) => {
    setSelectedAttachments(prev => 
      prev.includes(attachmentId) 
        ? prev.filter(id => id !== attachmentId)
        : [...prev, attachmentId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedAttachments.length === attachments.length) {
      setSelectedAttachments([])
    } else {
      setSelectedAttachments(attachments.map(a => a.id))
    }
  }

  const handleBulkDownload = async () => {
    if (selectedAttachments.length === 0) return
    
    setSaving(true)
    let successCount = 0
    let failCount = 0

    for (const attachmentId of selectedAttachments) {
      const attachment = attachments.find(a => a.id === attachmentId)
      if (!attachment) continue

      try {
        await handleDownloadAttachment(attachment)
        successCount++
        // Pequeno delay entre downloads
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (err) {
        console.error('❌ Erro ao baixar:', err)
        failCount++
      }
    }

    setSaving(false)
    setSelectedAttachments([])
    
    if (successCount > 0 && failCount === 0) {
      alert(`✅ ${successCount} arquivo(s) baixado(s) com sucesso!`)
    } else if (successCount > 0 && failCount > 0) {
      alert(`⚠️ ${successCount} arquivo(s) baixado(s), ${failCount} falharam.`)
    } else {
      alert('❌ Falha ao baixar arquivos')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedAttachments.length === 0) return
    
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir ${selectedAttachments.length} anexo(s)?`
    )
    
    if (!confirmDelete) return

    setSaving(true)
    let successCount = 0
    let failCount = 0

    for (const attachmentId of selectedAttachments) {
      const attachment = attachments.find(a => a.id === attachmentId)
      if (!attachment) continue

      try {
        // Deletar do storage
        if (attachment.file_path) {
          const { error: storageError } = await supabase.storage
            .from('policy-attachments')
            .remove([attachment.file_path])
          
          if (storageError) {
            console.error('❌ Erro ao deletar do storage:', storageError)
          }
        }

        // Deletar do banco
        const { error: dbError } = await supabase
          .from('policy_attachments')
          .delete()
          .eq('id', attachmentId)

        if (dbError) {
          console.error('❌ Erro ao deletar do banco:', dbError)
          failCount++
        } else {
          successCount++
        }
      } catch (err) {
        console.error('❌ Erro ao deletar anexo:', err)
        failCount++
      }
    }

    // Atualizar lista de anexos
    setAttachments(attachments.filter(a => !selectedAttachments.includes(a.id)))
    setSelectedAttachments([])
    setSaving(false)
    
    if (successCount > 0 && failCount === 0) {
      alert(`✅ ${successCount} anexo(s) excluído(s) com sucesso!`)
    } else if (successCount > 0 && failCount > 0) {
      alert(`⚠️ ${successCount} anexo(s) excluído(s), ${failCount} falharam.`)
    } else {
      alert('❌ Falha ao excluir anexos')
    }
  }

  const handleAddLink = async () => {
    if (!attachmentLink.trim()) return

    setSaving(true)
    const { data, error } = await supabase
      .from('policy_attachments')
      .insert({
        block_id: block.id,
        company_id: block.company_id,
        file_name: attachmentLink,
        file_url: attachmentLink,
        file_type: 'link'
      })
      .select()
      .single()

    if (!error && data) {
      setAttachments([...attachments, data])
      setAttachmentLink('')
      setShowAttachmentForm(false)
    }
    setSaving(false)
  }

  const handleDeleteAttachment = async (attachmentId, filePath) => {
    if (!confirm('Deseja realmente deletar este anexo?')) return

    setSaving(true)

    // Deletar arquivo do storage se não for link
    if (filePath && !filePath.startsWith('http')) {
      await supabase.storage
        .from('policy-attachments')
        .remove([filePath])
    }

    // Deletar do banco
    const { error } = await supabase
      .from('policy_attachments')
      .delete()
      .eq('id', attachmentId)

    if (!error) {
      setAttachments(attachments.filter(a => a.id !== attachmentId))
    }
    setSaving(false)
  }

  const calculateChecklistProgress = (checklist) => {
    const items = checklist.policy_checklist_items || []
    if (items.length === 0) return 0
    const completed = items.filter(item => item.is_completed).length
    return Math.round((completed / items.length) * 100)
  }

  if (!isOpen || !block) return null

  // Modo inline (dentro de aba) - sem overlay
  if (isInline) {
    return (
      <div 
        className="bg-white rounded-3xl shadow-lg border border-gray-200 w-full overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div 
          className="p-6 border-b border-gray-200"
          style={{ 
            background: `linear-gradient(135deg, ${block.color}10 0%, white 100%)`,
            borderTop: `4px solid ${block.color}`
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                {renderIcon(block.icon, 'h-6 w-6')}
              </div>
              {isEditingTitle ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="flex-1 text-2xl font-bold text-gray-900 border-2 border-blue-500 rounded-lg px-3 py-1 focus:outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                <h2 
                  className="flex-1 text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {title}
                </h2>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChecklistForm(!showChecklistForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <CheckSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Checklist</span>
            </button>
            <button
              onClick={() => setShowAttachmentForm(!showAttachmentForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Paperclip className="h-4 w-4" />
              <span className="text-sm font-medium">Anexo</span>
            </button>
          </div>
        </div>

        {/* Content - Resto do modal (checklists, descrição, anexos, etc) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Descrição Interna */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Descrição
              </h3>
            </div>
            {isEditingDescription ? (
              <div>
                {/* Barra de Ferramentas de Formatação */}
                <div className="flex items-center gap-1 mb-2 p-2 bg-gray-100 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => applyRichFormatting('bold')}
                    className={`p-2 rounded transition-colors ${
                      activeFormats.bold 
                        ? 'bg-blue-500 text-white' 
                        : 'hover:bg-gray-200 text-gray-700'
                    }`}
                    title="Negrito (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyRichFormatting('italic')}
                    className={`p-2 rounded transition-colors ${
                      activeFormats.italic 
                        ? 'bg-blue-500 text-white' 
                        : 'hover:bg-gray-200 text-gray-700'
                    }`}
                    title="Itálico (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={insertLink}
                    className="p-2 hover:bg-gray-200 rounded transition-colors text-blue-600"
                    title="Inserir Link"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <button
                    type="button"
                    onClick={() => applyRichFormatting('formatBlock', '<h2>')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
                    title="Título"
                  >
                    <Heading className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyRichFormatting('insertUnorderedList')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
                    title="Lista"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <div className="flex-1" />
                  <span className="text-xs text-gray-500">Editor rico</span>
                </div>
                
                {/* Editor contentEditable com formatação em tempo real */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="w-full min-h-[120px] max-h-[400px] p-3 border-2 border-blue-500 rounded-lg focus:outline-none overflow-y-auto bg-white prose prose-sm max-w-none"
                  style={{
                    minHeight: '120px',
                  }}
                  onBlur={(e) => {
                    setInternalDescription(e.currentTarget.innerHTML)
                  }}
                  onKeyUp={updateActiveFormats}
                  onMouseUp={updateActiveFormats}
                  onClick={updateActiveFormats}
                />
                
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleSaveDescriptionRich}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center gap-1"
                    disabled={saving}
                  >
                    <Save className="h-3 w-3" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInternalDescription(block.internal_description || '')
                      setIsEditingDescription(false)
                    }}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={(e) => {
                  // Se clicou em um link, não abrir o editor
                  if (e.target.tagName === 'A') {
                    e.stopPropagation()
                    return
                  }
                  setIsEditingDescription(true)
                }}
                className="min-h-[80px] p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                {internalDescription ? (
                  <div 
                    className="text-gray-700 prose prose-sm max-w-none break-words overflow-wrap-anywhere [&_a]:text-blue-600 [&_a]:hover:underline [&_a]:cursor-pointer"
                    dangerouslySetInnerHTML={{ __html: internalDescription }}
                    onClick={(e) => {
                      // Garantir que links abram em nova aba
                      if (e.target.tagName === 'A') {
                        e.preventDefault()
                        e.stopPropagation()
                        const href = e.target.getAttribute('href')
                        if (href) {
                          // Se não começar com http/https, adicionar https://
                          const url = href.startsWith('http') ? href : `https://${href}`
                          window.open(url, '_blank', 'noopener,noreferrer')
                        }
                      }
                    }}
                  />
                ) : (
                  <p className="text-gray-400 italic">Clique para adicionar descrição...</p>
                )}
              </div>
            )}
          </div>

          {/* Form de Nova Checklist */}
          {showChecklistForm && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={newChecklistName}
                onChange={(e) => setNewChecklistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateChecklist()}
                placeholder="Nome da checklist..."
                className="w-full p-2 border border-gray-300 rounded-lg mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateChecklist}
                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setShowChecklistForm(false)
                    setNewChecklistName('')
                  }}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Checklists */}
          {checklists.map((checklist) => (
            <div key={checklist.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  {checklist.name}
                </h3>
                <button
                  onClick={() => handleDeleteChecklist(checklist.id)}
                  className="p-1 hover:bg-red-50 rounded text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Bar */}
              {checklist.policy_checklist_items && checklist.policy_checklist_items.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{calculateChecklistProgress(checklist)}%</span>
                    <span>
                      {checklist.policy_checklist_items.filter(item => item.is_completed).length}/
                      {checklist.policy_checklist_items.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculateChecklistProgress(checklist)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Checklist Items */}
              <div className="space-y-2">
                {checklist.policy_checklist_items?.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 group">
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={() => handleToggleChecklistItem(item.checklist_id, item.id, item.is_completed)}
                      className="mt-1 h-4 w-4 text-green-500 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className={`flex-1 text-sm ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => handleDeleteChecklistItem(item.checklist_id, item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-500 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Item */}
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Adicionar item..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      handleAddChecklistItem(checklist.id, e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          ))}

          {/* Form de Novo Anexo */}
          {showAttachmentForm && (
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 space-y-4 shadow-sm">
              {/* Toggle Arquivo/Link */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAttachmentType('file')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    attachmentType === 'file'
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Arquivo
                </button>
                <button
                  onClick={() => setAttachmentType('link')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    attachmentType === 'link'
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  <LinkIcon className="h-4 w-4" />
                  Link
                </button>
              </div>

              {/* Upload de Arquivo */}
              {attachmentType === 'file' ? (
                <div className="relative">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-white hover:bg-blue-50 transition-all hover:border-blue-500 group">
                    {saving ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                        <p className="text-sm text-blue-600 font-medium">Enviando arquivo...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-10 w-10 text-blue-400 group-hover:text-blue-600 transition-colors" />
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                            Clique para selecionar ou arraste aqui
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, imagens, documentos até 10MB
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      multiple
                      onChange={(e) => e.target.files.length > 0 && handleUploadFile(Array.from(e.target.files))}
                      className="hidden"
                      disabled={saving}
                    />
                  </label>
                </div>
              ) : (
                /* Input de Link */
                <div className="space-y-3">
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="url"
                      value={attachmentLink}
                      onChange={(e) => setAttachmentLink(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                      placeholder="Cole o link aqui... (https://...)" 
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                  <button
                    onClick={handleAddLink}
                    disabled={!attachmentLink.trim()}
                    className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Link
                  </button>
                </div>
              )}

              {/* Botão Cancelar */}
              <button
                onClick={() => {
                  setShowAttachmentForm(false)
                  setAttachmentLink('')
                }}
                className="w-full px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-all border border-gray-300"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Anexos */}
          {attachments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Anexos ({attachments.length})
                </h3>
                
                {/* Botões de ação em massa */}
                {selectedAttachments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">
                      {selectedAttachments.length} selecionado(s)
                    </span>
                    <button
                      onClick={handleBulkDownload}
                      disabled={saving}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title="Baixar selecionados"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={saving}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title="Excluir selecionados"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
              
              {/* Checkbox selecionar todos */}
              {attachments.length > 1 && (
                <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedAttachments.length === attachments.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    Selecionar todos
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Checkbox de seleção */}
                      <input
                        type="checkbox"
                        checked={selectedAttachments.includes(attachment.id)}
                        onChange={() => toggleAttachmentSelection(attachment.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                        {attachment.type === 'file' && attachment.file_size && (
                          <p className="text-xs text-gray-500">
                            {(attachment.file_size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {attachment.type === 'file' && attachment.file_path && (
                        <>
                          <button
                            onClick={() => handleViewAttachment(attachment)}
                            className="p-1.5 hover:bg-green-100 rounded text-green-600"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadAttachment(attachment)}
                            className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                            title="Baixar"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {attachment.type === 'link' && attachment.url && (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                          title="Abrir link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="p-1.5 hover:bg-red-100 rounded text-red-600"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Modo popup/modal (original)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-6 border-b border-gray-200"
          style={{ 
            background: `linear-gradient(135deg, ${block.color}10 0%, white 100%)`,
            borderTop: `4px solid ${block.color}`
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                {renderIcon(block.icon, 'h-6 w-6')}
              </div>
              {isEditingTitle ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="flex-1 text-2xl font-bold text-gray-900 border-2 border-blue-500 rounded-lg px-3 py-1 focus:outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                <h2 
                  className="flex-1 text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {title}
                </h2>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChecklistForm(!showChecklistForm)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all text-sm font-medium"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Checklist</span>
            </button>
            <button
              onClick={() => setShowAttachmentForm(!showAttachmentForm)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all text-sm font-medium"
            >
              <Paperclip className="h-4 w-4" />
              <span>Anexo</span>
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Checklist Form */}
          {showChecklistForm && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Nova Checklist</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistName}
                  onChange={(e) => setNewChecklistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateChecklist()}
                  placeholder="Nome da checklist..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCreateChecklist}
                  disabled={!newChecklistName.trim() || saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Criar
                </button>
                <button
                  onClick={() => {
                    setShowChecklistForm(false)
                    setNewChecklistName('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Attachment Form */}
          {showAttachmentForm && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Adicionar Anexo</h3>
              
              {/* Toggle tipo de anexo */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setAttachmentType('file')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    attachmentType === 'file'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  Arquivo
                </button>
                <button
                  onClick={() => setAttachmentType('link')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    attachmentType === 'link'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  Link
                </button>
              </div>

              {attachmentType === 'file' ? (
                <div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => e.target.files.length > 0 && handleUploadFile(Array.from(e.target.files))}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={attachmentLink}
                    onChange={(e) => setAttachmentLink(e.target.value)}
                    placeholder="Cole o link aqui..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddLink}
                    disabled={!attachmentLink.trim() || saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setShowAttachmentForm(false)
                  setAttachmentLink('')
                }}
                className="mt-3 w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Descrição</h3>
            {isEditingDescription ? (
              <div className="space-y-2">
                <textarea
                  value={internalDescription}
                  onChange={(e) => setInternalDescription(e.target.value)}
                  placeholder="😃 Diga o que quer com um emoji. Basta digitar ':'."
                  className="w-full px-4 py-3 border-2 border-blue-500 rounded-lg focus:outline-none min-h-[120px] resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDescription}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setInternalDescription(block.internal_description || '')
                      setIsEditingDescription(false)
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingDescription(true)}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors min-h-[80px]"
              >
                {internalDescription ? (
                  <p className="text-gray-700 whitespace-pre-wrap break-words overflow-wrap-anywhere">{internalDescription}</p>
                ) : (
                  <p className="text-gray-400">Clique para adicionar uma descrição...</p>
                )}
              </div>
            )}
          </div>

          {/* Checklists */}
          {checklists.length > 0 && (
            <div className="space-y-4">
              {checklists.map((checklist) => (
                <ChecklistSection
                  key={checklist.id}
                  checklist={checklist}
                  onAddItem={handleAddChecklistItem}
                  onToggleItem={handleToggleChecklistItem}
                  onDeleteItem={handleDeleteChecklistItem}
                  onDeleteChecklist={handleDeleteChecklist}
                  calculateProgress={calculateChecklistProgress}
                />
              ))}
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Anexos ({attachments.length})
                </h3>
                
                {/* Botões de ação em massa */}
                {selectedAttachments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">
                      {selectedAttachments.length} selecionado(s)
                    </span>
                    <button
                      onClick={handleBulkDownload}
                      disabled={saving}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title="Baixar selecionados"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={saving}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title="Excluir selecionados"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
              
              {/* Checkbox selecionar todos */}
              {attachments.length > 1 && (
                <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <input
                    type="checkbox"
                    checked={selectedAttachments.length === attachments.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    Selecionar todos
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Checkbox de seleção */}
                      <input
                        type="checkbox"
                        checked={selectedAttachments.includes(attachment.id)}
                        onChange={() => toggleAttachmentSelection(attachment.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Paperclip className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.file_name}
                        </p>
                        {attachment.file_size && (
                          <p className="text-xs text-gray-500">
                            {(attachment.file_size / 1024).toFixed(2)} KB
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {attachment.file_type !== 'link' ? (
                        <>
                          <button
                            onClick={() => handleViewAttachment(attachment)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadAttachment(attachment)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Baixar"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Abrir link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id, attachment.file_path)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente auxiliar para Checklist
function ChecklistSection({ checklist, onAddItem, onToggleItem, onDeleteItem, onDeleteChecklist, calculateProgress }) {
  const [newItemText, setNewItemText] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const progress = calculateProgress(checklist)
  const items = checklist.policy_checklist_items || []

  const handleSubmitItem = () => {
    if (newItemText.trim()) {
      onAddItem(checklist.id, newItemText)
      setNewItemText('')
      setShowAddItem(false)
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">{checklist.name}</h3>
        </div>
        <button
          onClick={() => onDeleteChecklist(checklist.id)}
          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Deletar checklist"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.is_completed}
              onChange={() => onToggleItem(checklist.id, item.id, item.is_completed)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className={`flex-1 text-sm ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {item.text}
            </span>
            <button
              onClick={() => onDeleteItem(checklist.id, item.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Item */}
      {showAddItem ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitItem()}
            placeholder="Adicionar um item..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleSubmitItem}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Adicionar
          </button>
          <button
            onClick={() => {
              setShowAddItem(false)
              setNewItemText('')
            }}
            className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddItem(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors w-full"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar item</span>
        </button>
      )}
    </div>
  )
}
