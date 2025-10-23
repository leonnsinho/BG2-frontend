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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="text-center max-w-md">
          <div className="inline-flex p-6 bg-gradient-to-br from-red-50 to-red-100/50 rounded-3xl mb-6">
            <AlertCircle className="h-20 w-20 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Acesso Negado</h1>
          <p className="text-gray-600 leading-relaxed">
            Apenas Company Admins podem acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#EBA500] mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="h-6 w-6 text-[#EBA500]" />
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Carregando políticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Modernizado */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-[#EBA500] to-[#d99500] rounded-2xl shadow-lg shadow-[#EBA500]/20">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#373435] tracking-tight">
                Políticas de Operação
              </h1>
              <p className="text-gray-500 mt-1">
                Defina e organize as políticas operacionais por jornada
              </p>
            </div>
          </div>
        </div>

        {/* Seletor de Jornadas - Minimalista */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Target className="h-5 w-5 text-[#EBA500]" />
            <h3 className="text-lg font-bold text-[#373435]">Jornada</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {journeys.map((journey) => (
              <button
                key={journey.id}
                onClick={() => setSelectedJourney(journey)}
                className={`group relative p-5 rounded-2xl border-2 transition-all duration-200 ${
                  selectedJourney?.id === journey.id
                    ? 'border-[#EBA500] bg-gradient-to-br from-[#EBA500]/10 to-[#EBA500]/5 shadow-md shadow-[#EBA500]/10'
                    : 'border-gray-200/60 hover:border-gray-300 hover:shadow-sm bg-white/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      selectedJourney?.id === journey.id ? 'ring-2 ring-[#EBA500]/30 ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: journey.color }}
                  />
                  <span className={`font-semibold text-sm ${
                    selectedJourney?.id === journey.id ? 'text-[#373435]' : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {journey.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedJourney && (
          <>
            {/* Header da seção de blocos */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-[#373435] mb-1">
                  Blocos de Políticas
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedJourney.name} • {blocks.length} {blocks.length === 1 ? 'bloco' : 'blocos'}
                </p>
              </div>
              <button
                onClick={() => openBlockModal()}
                className="group flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#EBA500] to-[#d99500] hover:shadow-lg hover:shadow-[#EBA500]/30 text-white rounded-2xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                Novo Bloco
              </button>
            </div>

            {/* Lista de Blocos */}
            {blocks.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 p-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="inline-flex p-5 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl mb-6">
                    <FolderOpen className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Nenhum bloco criado
                  </h3>
                  <p className="text-gray-500 mb-8 leading-relaxed">
                    Comece criando um novo bloco de políticas para organizar suas operações
                  </p>
                  <button
                    onClick={() => openBlockModal()}
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#EBA500] to-[#d99500] hover:shadow-lg hover:shadow-[#EBA500]/30 text-white rounded-2xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <Plus className="h-5 w-5" />
                    Criar Primeiro Bloco
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {blocks.map((block) => (
                  <div key={block.id} className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 overflow-hidden hover:shadow-md transition-all duration-200">
                    {/* Header do Bloco */}
                    <div 
                      className="p-6 cursor-pointer transition-colors relative"
                      style={{ 
                        borderLeft: `5px solid ${block.color}`,
                        background: expandedBlocks[block.id] ? 'linear-gradient(to right, rgba(235, 165, 0, 0.03), transparent)' : 'transparent'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1" onClick={() => toggleBlock(block.id)}>
                          <button className="text-gray-400 hover:text-[#EBA500] transition-all duration-300 p-1 hover:bg-[#EBA500]/10 rounded-xl">
                            {expandedBlocks[block.id] ? (
                              <ChevronDown className="h-5 w-5 transition-transform duration-300 rotate-0" />
                            ) : (
                              <ChevronRight className="h-5 w-5 transition-transform duration-300" />
                            )}
                          </button>
                          <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl">
                            <span className="text-3xl">{block.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-0.5">{block.name}</h3>
                            {block.description && (
                              <p className="text-sm text-gray-500 leading-relaxed">{block.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openSubblockModal(block.id)}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:scale-105"
                            title="Adicionar Sub-bloco"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openBlockModal(block)}
                            className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-all hover:scale-105"
                            title="Editar Bloco"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-105"
                            title="Deletar Bloco"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sub-blocos */}
                    {expandedBlocks[block.id] && (
                      <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50/30 to-transparent">
                        <div className="p-6 space-y-3">
                          {block.policy_subblocks && block.policy_subblocks.length > 0 ? (
                            <>
                              {block.policy_subblocks.map((subblock, idx) => (
                                <div 
                                  key={subblock.id} 
                                  className="group/sub bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200 opacity-0 animate-fade-in-scale"
                                  style={{ 
                                    animationDelay: `${idx * 50}ms`,
                                    animationFillMode: 'forwards'
                                  }}
                                >
                                {/* Header do Sub-bloco */}
                                <div className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1" onClick={() => toggleSubblock(subblock.id)}>
                                      <button className="text-gray-400 hover:text-[#EBA500] transition-all duration-300 p-1 hover:bg-[#EBA500]/10 rounded-lg">
                                        {expandedSubblocks[subblock.id] ? (
                                          <ChevronDown className="h-4 w-4 transition-transform duration-300 rotate-0" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 transition-transform duration-300" />
                                        )}
                                      </button>
                                      <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 text-base">{subblock.name}</h4>
                                        {subblock.description && (
                                          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{subblock.description}</p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => openContentModal(subblock.id)}
                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-all hover:scale-105"
                                        title="Adicionar Conteúdo"
                                      >
                                        <FileText className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => openAttachmentModal(subblock.id)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:scale-105"
                                        title="Adicionar Anexo"
                                      >
                                        <Paperclip className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => openSubblockModal(block.id, subblock)}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all hover:scale-105"
                                        title="Editar"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSubblock(subblock.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-105"
                                        title="Deletar"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Conteúdo do Sub-bloco */}
                                {expandedSubblocks[subblock.id] && (
                                  <div className="border-t border-gray-100 p-5 bg-gradient-to-b from-gray-50/50 to-white space-y-4">
                                    {/* Conteúdos */}
                                    {subblock.policy_contents && subblock.policy_contents.length > 0 && (
                                      <div className="space-y-3">
                                        {subblock.policy_contents.map((content, contentIdx) => (
                                          <div 
                                            key={content.id} 
                                            className="group/content bg-white rounded-xl p-4 border border-gray-200/60 hover:border-gray-300 hover:shadow-sm transition-all opacity-0 animate-fade-in-scale"
                                            style={{ 
                                              animationDelay: `${contentIdx * 40}ms`,
                                              animationFillMode: 'forwards'
                                            }}
                                          >
                                            <div className="flex justify-between items-start mb-3">
                                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-gray-600 bg-gray-100">
                                                {content.content_type}
                                              </span>
                                              <div className="flex gap-1 opacity-0 group-hover/content:opacity-100 transition-opacity">
                                                <button
                                                  onClick={() => openContentModal(subblock.id, content)}
                                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all hover:scale-105"
                                                >
                                                  <Edit className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteContent(content.id)}
                                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-105"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                            <div className="prose prose-sm max-w-none">
                                              {renderContent(content)}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Anexos */}
                                    {subblock.policy_attachments && subblock.policy_attachments.length > 0 && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-3">
                                          <Paperclip className="h-4 w-4 text-gray-400" />
                                          <h5 className="text-sm font-bold text-gray-700">Anexos</h5>
                                        </div>
                                        {subblock.policy_attachments.map((attachment, attachIdx) => (
                                          <div 
                                            key={attachment.id} 
                                            className="group/attach bg-white rounded-xl p-4 border border-gray-200/60 hover:border-gray-300 hover:shadow-sm transition-all flex items-center justify-between opacity-0 animate-fade-in-scale"
                                            style={{ 
                                              animationDelay: `${attachIdx * 40}ms`,
                                              animationFillMode: 'forwards'
                                            }}
                                          >
                                            <div className="flex items-center gap-4 flex-1">
                                              <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl">
                                                <FileIcon className="h-5 w-5 text-blue-600" />
                                              </div>
                                              <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900">{attachment.file_name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                  {formatFileSize(attachment.file_size)} • {formatDate(attachment.uploaded_at)}
                                                </p>
                                                {attachment.description && (
                                                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{attachment.description}</p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover/attach:opacity-100 transition-opacity">
                                              <a
                                                href={attachment.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:scale-105"
                                                title="Download"
                                              >
                                                <Download className="h-4 w-4" />
                                              </a>
                                              <button
                                                onClick={() => handleDeleteAttachment(attachment)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-105"
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
                                      <div className="text-center py-10 text-gray-400">
                                        <div className="inline-flex p-4 bg-gray-50 rounded-2xl mb-3">
                                          <FileText className="h-8 w-8 text-gray-300" />
                                        </div>
                                        <p className="text-sm font-medium mb-1">Nenhum conteúdo adicionado</p>
                                        <p className="text-xs">Use os botões acima para adicionar conteúdo ou anexos</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              ))}
                            </>
                          ) : (
                            <div className="p-10 text-center">
                              <div className="inline-flex p-4 bg-gray-50 rounded-2xl mb-4">
                                <FolderOpen className="h-10 w-10 text-gray-300" />
                              </div>
                              <p className="text-gray-500 mb-4 font-medium">Nenhum sub-bloco criado</p>
                              <button
                                onClick={() => openSubblockModal(block.id)}
                                className="text-[#EBA500] hover:text-[#d99500] font-semibold text-sm hover:underline"
                              >
                                + Adicionar Sub-bloco
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal de Bloco - Modernizado */}
        {showBlockModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10 rounded-2xl">
                    <FileText className="h-6 w-6 text-[#EBA500]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#373435]">
                    {editingBlock ? 'Editar Bloco' : 'Novo Bloco'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">
                    Nome do Bloco *
                  </label>
                  <input
                    type="text"
                    value={blockForm.name}
                    onChange={(e) => setBlockForm(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={100}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 focus:bg-white"
                    placeholder="Ex: Bloco Financeiro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">
                    Descrição
                  </label>
                  <textarea
                    value={blockForm.description}
                    onChange={(e) => setBlockForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 focus:bg-white resize-none"
                    placeholder="Descrição do bloco..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2.5">
                      Ícone (Emoji)
                    </label>
                    <input
                      type="text"
                      value={blockForm.icon}
                      onChange={(e) => setBlockForm(prev => ({ ...prev, icon: e.target.value }))}
                      maxLength={2}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 focus:bg-white text-3xl text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2.5">
                      Cor
                    </label>
                    <input
                      type="color"
                      value={blockForm.color}
                      onChange={(e) => setBlockForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-[58px] rounded-2xl border-2 border-gray-200 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowBlockModal(false)}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-all disabled:opacity-50 hover:scale-105"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveBlock}
                  disabled={saving || !blockForm.name.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-[#EBA500] to-[#d99500] hover:shadow-lg hover:shadow-[#EBA500]/30 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center gap-2 hover:scale-105"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Bloco
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Sub-bloco - Modernizado */}
        {showSubblockModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl">
                    <FolderOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#373435]">
                    {editingSubblock ? 'Editar Sub-bloco' : 'Novo Sub-bloco'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowSubblockModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">
                    Nome do Sub-bloco *
                  </label>
                  <input
                    type="text"
                    value={subblockForm.name}
                    onChange={(e) => setSubblockForm(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={100}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 focus:bg-white"
                    placeholder="Ex: Despesas Mensais"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">
                    Descrição
                  </label>
                  <textarea
                    value={subblockForm.description}
                    onChange={(e) => setSubblockForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 focus:bg-white resize-none"
                    placeholder="Descrição do sub-bloco..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowSubblockModal(false)}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-all disabled:opacity-50 hover:scale-105"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSubblock}
                  disabled={saving || !subblockForm.name.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-[#EBA500] to-[#d99500] hover:shadow-lg hover:shadow-[#EBA500]/30 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center gap-2 hover:scale-105"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Sub-bloco
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Conteúdo - Modernizado */}
        {showContentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-2xl">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#373435]">
                    {editingContent ? 'Editar Conteúdo' : 'Novo Conteúdo'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowContentModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">
                    Tipo de Conteúdo
                  </label>
                  <select
                    value={contentForm.content_type}
                    onChange={(e) => {
                      const type = e.target.value
                      let defaultData = { text: '' }
                      
                      if (type === 'list') defaultData = { items: [''] }
                      if (type === 'table') defaultData = { headers: [''], rows: [['']] }
                      if (type === 'heading') defaultData = { text: '', level: 2 }
                      
                      setContentForm({ content_type: type, content_data: defaultData })
                    }}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 focus:bg-white"
                  >
                    <option value="text">📝 Texto</option>
                    <option value="heading">🏷️ Título</option>
                    <option value="list">📋 Lista</option>
                    <option value="table">📊 Tabela</option>
                  </select>
                </div>

                {/* Text */}
                {contentForm.content_type === 'text' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2.5">
                      Texto
                    </label>
                    <textarea
                      value={contentForm.content_data.text || ''}
                      onChange={(e) => setContentForm(prev => ({
                        ...prev,
                        content_data: { text: e.target.value }
                      }))}
                      rows={8}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 focus:bg-white resize-none"
                      placeholder="Digite o texto da política..."
                    />
                  </div>
                )}

                {/* Heading */}
                {contentForm.content_type === 'heading' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2.5">
                        Texto do Título
                      </label>
                      <input
                        type="text"
                        value={contentForm.content_data.text || ''}
                        onChange={(e) => setContentForm(prev => ({
                          ...prev,
                          content_data: { ...prev.content_data, text: e.target.value }
                        }))}
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 focus:bg-white"
                        placeholder="Título da seção"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2.5">
                        Nível
                      </label>
                      <select
                        value={contentForm.content_data.level || 2}
                        onChange={(e) => setContentForm(prev => ({
                          ...prev,
                          content_data: { ...prev.content_data, level: parseInt(e.target.value) }
                        }))}
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 focus:bg-white"
                      >
                        <option value="2">H2 (Grande)</option>
                        <option value="3">H3 (Médio)</option>
                        <option value="4">H4 (Pequeno)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* List */}
                {contentForm.content_type === 'list' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2.5">
                      Itens da Lista
                    </label>
                    <div className="space-y-2">
                      {(contentForm.content_data.items || ['']).map((item, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const newItems = [...(contentForm.content_data.items || [''])]
                              newItems[index] = e.target.value
                              setContentForm(prev => ({
                                ...prev,
                                content_data: { items: newItems }
                              }))
                            }}
                            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 focus:bg-white"
                            placeholder={`Item ${index + 1}`}
                          />
                          <button
                            onClick={() => {
                              const newItems = (contentForm.content_data.items || ['']).filter((_, i) => i !== index)
                              setContentForm(prev => ({
                                ...prev,
                                content_data: { items: newItems.length > 0 ? newItems : [''] }
                              }))
                            }}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-105"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newItems = [...(contentForm.content_data.items || ['']), '']
                          setContentForm(prev => ({
                            ...prev,
                            content_data: { items: newItems }
                          }))
                        }}
                        className="text-[#EBA500] hover:text-[#d99500] text-sm font-bold hover:underline"
                      >
                        + Adicionar Item
                      </button>
                    </div>
                  </div>
                )}

                {/* Table */}
                {contentForm.content_type === 'table' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2.5">
                        Cabeçalhos da Tabela
                      </label>
                      <div className="flex gap-2">
                        {(contentForm.content_data.headers || ['']).map((header, index) => (
                          <input
                            key={index}
                            type="text"
                            value={header}
                            onChange={(e) => {
                              const newHeaders = [...(contentForm.content_data.headers || [''])]
                              newHeaders[index] = e.target.value
                              setContentForm(prev => ({
                                ...prev,
                                content_data: { ...prev.content_data, headers: newHeaders }
                              }))
                            }}
                            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 focus:bg-white text-sm"
                            placeholder={`Coluna ${index + 1}`}
                          />
                        ))}
                        <button
                          onClick={() => {
                            const newHeaders = [...(contentForm.content_data.headers || ['']), '']
                            const newRows = (contentForm.content_data.rows || [['']]).map(row => [...row, ''])
                            setContentForm(prev => ({
                              ...prev,
                              content_data: { ...prev.content_data, headers: newHeaders, rows: newRows }
                            }))
                          }}
                          className="px-4 py-2.5 text-[#EBA500] hover:bg-[#EBA500]/10 rounded-xl font-bold text-sm transition-all"
                        >
                          + Col
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2.5">
                        Linhas da Tabela
                      </label>
                      <div className="space-y-2">
                        {(contentForm.content_data.rows || [['']]).map((row, rowIndex) => (
                          <div key={rowIndex} className="flex gap-2">
                            {row.map((cell, cellIndex) => (
                              <input
                                key={cellIndex}
                                type="text"
                                value={cell}
                                onChange={(e) => {
                                  const newRows = [...(contentForm.content_data.rows || [['']])]
                                  newRows[rowIndex][cellIndex] = e.target.value
                                  setContentForm(prev => ({
                                    ...prev,
                                    content_data: { ...prev.content_data, rows: newRows }
                                  }))
                                }}
                                className="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 focus:bg-white text-sm"
                              />
                            ))}
                            <button
                              onClick={() => {
                                const newRows = (contentForm.content_data.rows || [['']]).filter((_, i) => i !== rowIndex)
                                setContentForm(prev => ({
                                  ...prev,
                                  content_data: { ...prev.content_data, rows: newRows.length > 0 ? newRows : [['']] }
                                }))
                              }}
                              className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-105"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const colCount = contentForm.content_data.headers?.length || 1
                            const newRow = Array(colCount).fill('')
                            const newRows = [...(contentForm.content_data.rows || [['']]), newRow]
                            setContentForm(prev => ({
                              ...prev,
                              content_data: { ...prev.content_data, rows: newRows }
                            }))
                          }}
                          className="text-[#EBA500] hover:text-[#d99500] text-sm font-bold hover:underline"
                        >
                          + Adicionar Linha
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowContentModal(false)}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-all disabled:opacity-50 hover:scale-105"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveContent}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-[#EBA500] to-[#d99500] hover:shadow-lg hover:shadow-[#EBA500]/30 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center gap-2 hover:scale-105"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Conteúdo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Anexo - Modernizado */}
        {showAttachmentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl">
                    <Paperclip className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#373435]">
                    Adicionar Anexo
                  </h2>
                </div>
                <button
                  onClick={() => setShowAttachmentModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">
                    Arquivo *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#EBA500] hover:bg-[#EBA500]/5 transition-all cursor-pointer">
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      <div className="inline-flex p-4 bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10 rounded-2xl mb-4">
                        <Upload className="h-10 w-10 text-[#EBA500]" />
                      </div>
                      {uploadFile ? (
                        <div>
                          <p className="text-gray-900 font-bold text-lg mb-1">{uploadFile.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(uploadFile.size)}</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-700 font-bold mb-2">
                            Clique para selecionar um arquivo
                          </p>
                          <p className="text-sm text-gray-500">
                            PDF, Word, Excel, imagens, etc.
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 focus:bg-white resize-none"
                    placeholder="Descrição do arquivo..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowAttachmentModal(false)}
                  disabled={uploading}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-all disabled:opacity-50 hover:scale-105"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadAttachment}
                  disabled={uploading || !uploadFile}
                  className="px-6 py-3 bg-gradient-to-r from-[#EBA500] to-[#d99500] hover:shadow-lg hover:shadow-[#EBA500]/30 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center gap-2 hover:scale-105"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Fazendo Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Fazer Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
