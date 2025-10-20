import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  FileText, 
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  AlertCircle,
  Paperclip,
  FileIcon,
  Target
} from 'lucide-react'
import { formatDate } from '../utils/dateUtils'

export default function OperationalPoliciesPage() {
  const { profile } = useAuth()
  const [journeys, setJourneys] = useState([])
  const [selectedJourney, setSelectedJourney] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedBlocks, setExpandedBlocks] = useState({})
  const [expandedSubblocks, setExpandedSubblocks] = useState({})
  
  // Modais
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showSubblockModal, setShowSubblockModal] = useState(false)
  const [showContentModal, setShowContentModal] = useState(false)
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  
  // Estados de edição
  const [editingBlock, setEditingBlock] = useState(null)
  const [editingSubblock, setEditingSubblock] = useState(null)
  const [editingContent, setEditingContent] = useState(null)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [selectedSubblock, setSelectedSubblock] = useState(null)
  
  // Formulários
  const [blockForm, setBlockForm] = useState({
    name: '',
    description: '',
    icon: '📋',
    color: '#3B82F6'
  })
  
  const [subblockForm, setSubblockForm] = useState({
    name: '',
    description: ''
  })
  
  const [contentForm, setContentForm] = useState({
    content_type: 'text',
    content_data: { text: '' }
  })
  
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Obter company_id do usuário
  const userCompanyId = profile?.user_companies?.find(uc => 
    uc.role === 'company_admin' && uc.is_active
  )?.company_id

  useEffect(() => {
    console.log('🔍 Profile carregado:', profile)
    console.log('🏢 Company ID:', userCompanyId)
    
    if (userCompanyId) {
      loadJourneys()
    }
  }, [profile, userCompanyId])

  useEffect(() => {
    if (selectedJourney && userCompanyId) {
      console.log('📋 Carregando blocos para journey:', selectedJourney.name)
      loadBlocks()
    }
  }, [selectedJourney, userCompanyId])

  const loadJourneys = async () => {
    setLoading(true)
    try {
      console.log('🔄 Carregando jornadas...')
      const { data, error } = await supabase
        .from('journeys')
        .select('id, name, slug, color')
        .eq('is_active', true)
        .order('order_index')

      if (error) {
        console.error('❌ Erro ao carregar jornadas:', error)
        throw error
      }

      console.log('✅ Jornadas carregadas:', data?.length)
      setJourneys(data || [])
      if (data && data.length > 0) {
        setSelectedJourney(data[0])
      }
    } catch (error) {
      console.error('Erro ao carregar jornadas:', error)
      alert('Erro ao carregar jornadas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadBlocks = async () => {
    if (!selectedJourney || !userCompanyId) {
      console.log('⚠️ Sem journey ou company_id:', { selectedJourney, userCompanyId })
      return
    }

    setLoading(true)
    try {
      console.log('🔄 Carregando blocos para:', {
        company_id: userCompanyId,
        journey_id: selectedJourney.id,
        journey_name: selectedJourney.name
      })
      
      // Carregar blocos
      const { data: blocksData, error: blocksError } = await supabase
        .from('policy_blocks')
        .select(`
          *,
          policy_subblocks (
            *,
            policy_contents (*),
            policy_attachments (*)
          )
        `)
        .eq('company_id', userCompanyId)
        .eq('journey_id', selectedJourney.id)
        .eq('is_active', true)
        .order('order_index')

      if (blocksError) {
        console.error('❌ Erro ao carregar blocos:', blocksError)
        throw blocksError
      }

      console.log('✅ Blocos carregados:', blocksData?.length)
      setBlocks(blocksData || [])
    } catch (error) {
      console.error('Erro ao carregar blocos:', error)
      alert('Erro ao carregar blocos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // CRUD de Blocos
  const handleSaveBlock = async () => {
    if (!blockForm.name.trim() || !userCompanyId || !selectedJourney) {
      alert('Nome do bloco é obrigatório')
      return
    }

    setSaving(true)
    try {
      const blockData = {
        company_id: userCompanyId,
        journey_id: selectedJourney.id,
        name: blockForm.name.trim(),
        description: blockForm.description.trim(),
        icon: blockForm.icon,
        color: blockForm.color,
        order_index: blocks.length,
        created_by: profile.id
      }

      if (editingBlock) {
        // Atualizar
        const { error } = await supabase
          .from('policy_blocks')
          .update(blockData)
          .eq('id', editingBlock.id)

        if (error) throw error
      } else {
        // Criar
        const { error } = await supabase
          .from('policy_blocks')
          .insert([blockData])

        if (error) throw error
      }

      setShowBlockModal(false)
      setEditingBlock(null)
      setBlockForm({ name: '', description: '', icon: '📋', color: '#3B82F6' })
      loadBlocks()
    } catch (error) {
      console.error('Erro ao salvar bloco:', error)
      alert('Erro ao salvar bloco: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBlock = async (blockId) => {
    if (!confirm('Tem certeza que deseja deletar este bloco? Todos os sub-blocos e conteúdos serão removidos.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('policy_blocks')
        .delete()
        .eq('id', blockId)

      if (error) throw error

      loadBlocks()
    } catch (error) {
      console.error('Erro ao deletar bloco:', error)
      alert('Erro ao deletar bloco: ' + error.message)
    }
  }

  // CRUD de Sub-blocos
  const handleSaveSubblock = async () => {
    if (!subblockForm.name.trim() || !selectedBlock) {
      alert('Nome do sub-bloco é obrigatório')
      return
    }

    setSaving(true)
    try {
      const block = blocks.find(b => b.id === selectedBlock)
      const subblockData = {
        block_id: selectedBlock,
        name: subblockForm.name.trim(),
        description: subblockForm.description.trim(),
        order_index: block?.policy_subblocks?.length || 0,
        created_by: profile.id
      }

      if (editingSubblock) {
        const { error } = await supabase
          .from('policy_subblocks')
          .update(subblockData)
          .eq('id', editingSubblock.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('policy_subblocks')
          .insert([subblockData])

        if (error) throw error
      }

      setShowSubblockModal(false)
      setEditingSubblock(null)
      setSubblockForm({ name: '', description: '' })
      loadBlocks()
    } catch (error) {
      console.error('Erro ao salvar sub-bloco:', error)
      alert('Erro ao salvar sub-bloco: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSubblock = async (subblockId) => {
    if (!confirm('Tem certeza que deseja deletar este sub-bloco? Todo o conteúdo será removido.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('policy_subblocks')
        .delete()
        .eq('id', subblockId)

      if (error) throw error

      loadBlocks()
    } catch (error) {
      console.error('Erro ao deletar sub-bloco:', error)
      alert('Erro ao deletar sub-bloco: ' + error.message)
    }
  }

  // CRUD de Conteúdo
  const handleSaveContent = async () => {
    if (!selectedSubblock) return

    setSaving(true)
    try {
      const block = blocks.find(b => b.policy_subblocks?.some(sb => sb.id === selectedSubblock))
      const subblock = block?.policy_subblocks?.find(sb => sb.id === selectedSubblock)
      
      const contentData = {
        subblock_id: selectedSubblock,
        content_type: contentForm.content_type,
        content_data: contentForm.content_data,
        order_index: subblock?.policy_contents?.length || 0,
        created_by: profile.id
      }

      if (editingContent) {
        const { error } = await supabase
          .from('policy_contents')
          .update(contentData)
          .eq('id', editingContent.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('policy_contents')
          .insert([contentData])

        if (error) throw error
      }

      setShowContentModal(false)
      setEditingContent(null)
      setContentForm({ content_type: 'text', content_data: { text: '' } })
      loadBlocks()
    } catch (error) {
      console.error('Erro ao salvar conteúdo:', error)
      alert('Erro ao salvar conteúdo: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteContent = async (contentId) => {
    if (!confirm('Tem certeza que deseja deletar este conteúdo?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('policy_contents')
        .delete()
        .eq('id', contentId)

      if (error) throw error

      loadBlocks()
    } catch (error) {
      console.error('Erro ao deletar conteúdo:', error)
      alert('Erro ao deletar conteúdo: ' + error.message)
    }
  }

  // Upload de Anexos
  const handleUploadAttachment = async () => {
    if (!uploadFile || !selectedSubblock) {
      alert('Selecione um arquivo')
      return
    }

    setUploading(true)
    try {
      // Upload para Supabase Storage
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${userCompanyId}/${selectedJourney.id}/${selectedSubblock}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('policy-attachments')
        .upload(filePath, uploadFile)

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('policy-attachments')
        .getPublicUrl(filePath)

      // Salvar registro no banco
      const { error: dbError } = await supabase
        .from('policy_attachments')
        .insert([{
          subblock_id: selectedSubblock,
          file_name: uploadFile.name,
          file_size: uploadFile.size,
          file_type: uploadFile.type,
          file_url: urlData.publicUrl,
          storage_path: filePath,
          description: uploadDescription.trim(),
          uploaded_by: profile.id
        }])

      if (dbError) throw dbError

      setShowAttachmentModal(false)
      setUploadFile(null)
      setUploadDescription('')
      loadBlocks()
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAttachment = async (attachment) => {
    if (!confirm('Tem certeza que deseja deletar este anexo?')) {
      return
    }

    try {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('policy-attachments')
        .remove([attachment.storage_path])

      if (storageError) console.error('Erro ao deletar do storage:', storageError)

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('policy_attachments')
        .delete()
        .eq('id', attachment.id)

      if (dbError) throw dbError

      loadBlocks()
    } catch (error) {
      console.error('Erro ao deletar anexo:', error)
      alert('Erro ao deletar anexo: ' + error.message)
    }
  }

  const toggleBlock = (blockId) => {
    setExpandedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }))
  }

  const toggleSubblock = (subblockId) => {
    setExpandedSubblocks(prev => ({ ...prev, [subblockId]: !prev[subblockId] }))
  }

  const openBlockModal = (block = null) => {
    if (block) {
      setEditingBlock(block)
      setBlockForm({
        name: block.name,
        description: block.description || '',
        icon: block.icon || '📋',
        color: block.color || '#3B82F6'
      })
    } else {
      setEditingBlock(null)
      setBlockForm({ name: '', description: '', icon: '📋', color: '#3B82F6' })
    }
    setShowBlockModal(true)
  }

  const openSubblockModal = (blockId, subblock = null) => {
    setSelectedBlock(blockId)
    if (subblock) {
      setEditingSubblock(subblock)
      setSubblockForm({
        name: subblock.name,
        description: subblock.description || ''
      })
    } else {
      setEditingSubblock(null)
      setSubblockForm({ name: '', description: '' })
    }
    setShowSubblockModal(true)
  }

  const openContentModal = (subblockId, content = null) => {
    setSelectedSubblock(subblockId)
    if (content) {
      setEditingContent(content)
      setContentForm({
        content_type: content.content_type,
        content_data: content.content_data
      })
    } else {
      setEditingContent(null)
      setContentForm({ content_type: 'text', content_data: { text: '' } })
    }
    setShowContentModal(true)
  }

  const openAttachmentModal = (subblockId) => {
    setSelectedSubblock(subblockId)
    setUploadFile(null)
    setUploadDescription('')
    setShowAttachmentModal(true)
  }

  const renderContent = (content) => {
    switch (content.content_type) {
      case 'text':
        return <p className="text-gray-700 whitespace-pre-wrap">{content.content_data.text}</p>
      
      case 'list':
        return (
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {content.content_data.items?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )
      
      case 'heading':
        const HeadingTag = `h${content.content_data.level || 3}`
        return React.createElement(HeadingTag, {
          className: `font-bold text-gray-900 ${content.content_data.level === 2 ? 'text-xl' : 'text-lg'}`
        }, content.content_data.text)
      
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {content.content_data.headers?.map((header, index) => (
                    <th key={index} className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-900">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.content_data.rows?.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 border border-gray-300 text-sm text-gray-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      
      default:
        return null
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Verificar se é company_admin em user_companies
  const isCompanyAdmin = profile?.user_companies?.some(uc => 
    uc.role === 'company_admin' && uc.is_active
  ) || profile?.role === 'super_admin'

  if (!isCompanyAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Apenas Company Admins podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#373435] mb-2">
            Políticas de Operação
          </h1>
          <p className="text-gray-600">
            Defina e organize as políticas operacionais por jornada
          </p>
        </div>

        {/* Seletor de Jornadas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#373435] mb-4">Selecione a Jornada</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {journeys.map((journey) => (
              <button
                key={journey.id}
                onClick={() => setSelectedJourney(journey)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedJourney?.id === journey.id
                    ? 'border-[#EBA500] bg-[#EBA500]/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: journey.color }}
                  />
                  <span className="font-medium text-gray-900">{journey.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedJourney && (
          <>
            {/* Botão para adicionar bloco */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#373435]">
                Blocos de Políticas - {selectedJourney.name}
              </h2>
              <button
                onClick={() => openBlockModal()}
                className="flex items-center gap-2 px-4 py-2 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="h-5 w-5" />
                Novo Bloco
              </button>
            </div>

            {/* Lista de Blocos */}
            {blocks.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-12 text-center">
                <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum bloco criado ainda
                </h3>
                <p className="text-gray-600 mb-6">
                  Comece criando um novo bloco de políticas para esta jornada
                </p>
                <button
                  onClick={() => openBlockModal()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Criar Primeiro Bloco
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {blocks.map((block) => (
                  <div key={block.id} className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
                    {/* Header do Bloco */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderLeft: `4px solid ${block.color}` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1" onClick={() => toggleBlock(block.id)}>
                          <button className="text-gray-400 hover:text-gray-600">
                            {expandedBlocks[block.id] ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                          <span className="text-2xl">{block.icon}</span>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{block.name}</h3>
                            {block.description && (
                              <p className="text-sm text-gray-600 mt-0.5">{block.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openSubblockModal(block.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Adicionar Sub-bloco"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openBlockModal(block)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Editar Bloco"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deletar Bloco"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sub-blocos */}
                    {expandedBlocks[block.id] && (
                      <div className="border-t border-gray-200 bg-gray-50/50">
                        {block.policy_subblocks && block.policy_subblocks.length > 0 ? (
                          <div className="p-4 space-y-3">
                            {block.policy_subblocks.map((subblock) => (
                              <div key={subblock.id} className="bg-white rounded-xl border border-gray-200">
                                {/* Header do Sub-bloco */}
                                <div className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1" onClick={() => toggleSubblock(subblock.id)}>
                                      <button className="text-gray-400 hover:text-gray-600">
                                        {expandedSubblocks[subblock.id] ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4" />
                                        )}
                                      </button>
                                      <div>
                                        <h4 className="font-semibold text-gray-900">{subblock.name}</h4>
                                        {subblock.description && (
                                          <p className="text-sm text-gray-600 mt-0.5">{subblock.description}</p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => openContentModal(subblock.id)}
                                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm"
                                        title="Adicionar Conteúdo"
                                      >
                                        <FileText className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => openAttachmentModal(subblock.id)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                                        title="Adicionar Anexo"
                                      >
                                        <Paperclip className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => openSubblockModal(block.id, subblock)}
                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
                                        title="Editar"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSubblock(subblock.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                                        title="Deletar"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Conteúdo do Sub-bloco */}
                                {expandedSubblocks[subblock.id] && (
                                  <div className="border-t border-gray-200 p-4 bg-gray-50/50 space-y-4">
                                    {/* Conteúdos */}
                                    {subblock.policy_contents && subblock.policy_contents.length > 0 && (
                                      <div className="space-y-3">
                                        {subblock.policy_contents.map((content) => (
                                          <div key={content.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="flex justify-between items-start mb-2">
                                              <span className="text-xs font-medium text-gray-500 uppercase">
                                                {content.content_type}
                                              </span>
                                              <div className="flex gap-1">
                                                <button
                                                  onClick={() => openContentModal(subblock.id, content)}
                                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteContent(content.id)}
                                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </button>
                                              </div>
                                            </div>
                                            {renderContent(content)}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Anexos */}
                                    {subblock.policy_attachments && subblock.policy_attachments.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="text-sm font-semibold text-gray-700">Anexos</h5>
                                        {subblock.policy_attachments.map((attachment) => (
                                          <div key={attachment.id} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <FileIcon className="h-5 w-5 text-gray-400" />
                                              <div>
                                                <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                                                <p className="text-xs text-gray-500">
                                                  {formatFileSize(attachment.file_size)} • {formatDate(attachment.uploaded_at)}
                                                </p>
                                                {attachment.description && (
                                                  <p className="text-xs text-gray-600 mt-1">{attachment.description}</p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex gap-1">
                                              <a
                                                href={attachment.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Download"
                                              >
                                                <Download className="h-4 w-4" />
                                              </a>
                                              <button
                                                onClick={() => handleDeleteAttachment(attachment)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Deletar"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Empty state */}
                                    {(!subblock.policy_contents || subblock.policy_contents.length === 0) &&
                                     (!subblock.policy_attachments || subblock.policy_attachments.length === 0) && (
                                      <div className="text-center py-6 text-gray-500 text-sm">
                                        Nenhum conteúdo ou anexo ainda. Clique nos botões acima para adicionar.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-500">
                            <p className="mb-3">Nenhum sub-bloco criado</p>
                            <button
                              onClick={() => openSubblockModal(block.id)}
                              className="text-[#EBA500] hover:text-[#EBA500]/80 font-medium text-sm"
                            >
                              + Adicionar Sub-bloco
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal de Bloco */}
        {showBlockModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#373435]">
                  {editingBlock ? 'Editar Bloco' : 'Novo Bloco'}
                </h2>
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Bloco *
                  </label>
                  <input
                    type="text"
                    value={blockForm.name}
                    onChange={(e) => setBlockForm(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500]"
                    placeholder="Ex: Bloco Financeiro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={blockForm.description}
                    onChange={(e) => setBlockForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500] resize-none"
                    placeholder="Descrição do bloco..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ícone (Emoji)
                    </label>
                    <input
                      type="text"
                      value={blockForm.icon}
                      onChange={(e) => setBlockForm(prev => ({ ...prev, icon: e.target.value }))}
                      maxLength={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500] text-2xl text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor
                    </label>
                    <input
                      type="color"
                      value={blockForm.color}
                      onChange={(e) => setBlockForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-[54px] rounded-xl border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowBlockModal(false)}
                  disabled={saving}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveBlock}
                  disabled={saving || !blockForm.name.trim()}
                  className="px-6 py-2 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Sub-bloco */}
        {showSubblockModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#373435]">
                  {editingSubblock ? 'Editar Sub-bloco' : 'Novo Sub-bloco'}
                </h2>
                <button
                  onClick={() => setShowSubblockModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Sub-bloco *
                  </label>
                  <input
                    type="text"
                    value={subblockForm.name}
                    onChange={(e) => setSubblockForm(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500]"
                    placeholder="Ex: Despesas Mensais"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={subblockForm.description}
                    onChange={(e) => setSubblockForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500] resize-none"
                    placeholder="Descrição do sub-bloco..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSubblockModal(false)}
                  disabled={saving}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSubblock}
                  disabled={saving || !subblockForm.name.trim()}
                  className="px-6 py-2 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Conteúdo - continua no próximo arquivo... */}
        {/* (devido ao limite de caracteres, vou criar a continuação) */}
      </div>
    </div>
  )
}
