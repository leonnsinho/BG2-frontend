import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import SuperAdminBanner from '../components/SuperAdminBanner'
import { useSearchParams } from 'react-router-dom' // 🔥 NOVO: Para ler query params
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
  Target,
  List,
  Grid3X3,
  Layers,
  Edit2,
  Search
} from 'lucide-react'
import { formatDate } from '../utils/dateUtils'

export default function OperationalPoliciesPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams() // 🔥 NOVO: Hook para ler URL
  const [journeys, setJourneys] = useState([])
  const [selectedJourney, setSelectedJourney] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedBlocks, setExpandedBlocks] = useState({})
  const [expandedSubblocks, setExpandedSubblocks] = useState({})
  const [expandedSubSubblocks, setExpandedSubSubblocks] = useState({}) // 🔥 NOVO: Para 3º nível
  const [viewMode, setViewMode] = useState('list') // 🔥 NOVO: 'list' ou 'grid'
  const [searchQuery, setSearchQuery] = useState('') // 🔥 NOVO: Busca de blocos
  const [subblockSearchQuery, setSubblockSearchQuery] = useState('') // 🔥 NOVO: Busca de sub-blocos
  
  // Modais
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showSubblockModal, setShowSubblockModal] = useState(false)
  const [showSubSubblockModal, setShowSubSubblockModal] = useState(false) // 🔥 NOVO: Modal para sub-sub-blocos
  const [showContentModal, setShowContentModal] = useState(false)
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  
  // 🔥 NOVO: Modais de visualização
  const [showBlockViewModal, setShowBlockViewModal] = useState(false)
  const [showSubblockViewModal, setShowSubblockViewModal] = useState(false)
  const [viewingBlock, setViewingBlock] = useState(null)
  const [viewingSubblock, setViewingSubblock] = useState(null)
  
  // Estados de edição
  const [editingBlock, setEditingBlock] = useState(null)
  const [editingSubblock, setEditingSubblock] = useState(null)
  const [editingSubSubblock, setEditingSubSubblock] = useState(null) // 🔥 NOVO: Edição de sub-sub-blocos
  const [editingContent, setEditingContent] = useState(null)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [selectedSubblock, setSelectedSubblock] = useState(null)
  const [selectedParentSubblock, setSelectedParentSubblock] = useState(null) // 🔥 NOVO: Parent para criar sub-sub-bloco
  
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
  
  // 🔥 NOVO: Form para sub-sub-blocos (3º nível)
  const [subSubblockForm, setSubSubblockForm] = useState({
    name: '',
    description: '',
    parent_subblock_id: null
  })
  
  const [contentForm, setContentForm] = useState({
    content_type: 'text',
    content_data: { text: '' }
  })
  
  const [uploadFiles, setUploadFiles] = useState([])
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 🔥 NOVO: Verificar se há companyId na URL (Super Admin) ou usar do perfil
  const urlCompanyId = searchParams.get('companyId')
  const userCompanyId = urlCompanyId || profile?.user_companies?.find(uc => 
    uc.role === 'company_admin' && uc.is_active
  )?.company_id

  useEffect(() => {
    console.log('🔍 Profile carregado:', profile)
    console.log('🏢 Company ID:', userCompanyId)
    console.log('🔗 URL Company ID:', urlCompanyId)
    console.log('🎯 Journey param:', searchParams.get('journey'))
    
    if (userCompanyId) {
      loadJourneys()
    }
  }, [profile, userCompanyId, urlCompanyId, searchParams])

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
      
      // 🔥 NOVO: Verificar se há jornada especificada na URL
      const journeyParam = searchParams.get('journey')
      
      if (journeyParam && data && data.length > 0) {
        // Procurar jornada pelo slug
        const journeyFromUrl = data.find(j => j.slug === journeyParam)
        if (journeyFromUrl) {
          console.log('🎯 Selecionando jornada da URL:', journeyFromUrl.name)
          setSelectedJourney(journeyFromUrl)
        } else {
          // Se não encontrar, selecionar a primeira
          setSelectedJourney(data[0])
        }
      } else if (data && data.length > 0) {
        // Se não há parâmetro na URL, selecionar a primeira
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
          policy_subblocks!policy_subblocks_block_id_fkey (
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

      // 🔥 NOVO: Organizar sub-blocos em hierarquia de 3 níveis
      const organizedBlocks = (blocksData || []).map(block => {
        const allSubblocks = block.policy_subblocks || []
        
        // Separar sub-blocos de nível 1 (sem parent) e nível 2 (com parent)
        const level1Subblocks = allSubblocks
          .filter(sb => !sb.parent_subblock_id || sb.level === 1)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        
        const level2Subblocks = allSubblocks
          .filter(sb => sb.parent_subblock_id && sb.level === 2)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        
        // Adicionar children aos sub-blocos de nível 1
        const hierarchicalSubblocks = level1Subblocks.map(parentSubblock => ({
          ...parentSubblock,
          children: level2Subblocks.filter(child => child.parent_subblock_id === parentSubblock.id)
        }))
        
        return {
          ...block,
          policy_subblocks: hierarchicalSubblocks
        }
      })

      console.log('✅ Blocos carregados com hierarquia:', organizedBlocks.length)
      setBlocks(organizedBlocks)
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
      
      await loadBlocks()
      
      // 🔥 Se estiver visualizando um bloco, buscar dados atualizados
      if (viewingBlock && viewingBlock.id === selectedBlock) {
        const { data: updatedBlock, error } = await supabase
          .from('policy_blocks')
          .select(`
            *,
            policy_subblocks (
              *,
              policy_contents (*),
              policy_attachments (*)
            )
          `)
          .eq('id', selectedBlock)
          .single()
        
        if (!error && updatedBlock) {
          setViewingBlock(updatedBlock)
        }
      }
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

      await loadBlocks()
      
      // 🔥 Se estiver visualizando um bloco, buscar dados atualizados
      if (viewingBlock) {
        const { data: updatedBlock, error } = await supabase
          .from('policy_blocks')
          .select(`
            *,
            policy_subblocks (
              *,
              policy_contents (*),
              policy_attachments (*)
            )
          `)
          .eq('id', viewingBlock.id)
          .single()
        
        if (!error && updatedBlock) {
          setViewingBlock(updatedBlock)
        }
      }
      
      // 🔥 Se o sub-bloco deletado estava sendo visualizado, fechar o modal
      if (viewingSubblock && viewingSubblock.id === subblockId) {
        closeSubblockView()
      }
    } catch (error) {
      console.error('Erro ao deletar sub-bloco:', error)
      alert('Erro ao deletar sub-bloco: ' + error.message)
    }
  }

  // 🔥 NOVO: CRUD de Sub-Sub-blocos (3º nível)
  const handleSaveSubSubblock = async () => {
    if (!subSubblockForm.name.trim() || !selectedParentSubblock) {
      alert('Nome do sub-bloco é obrigatório')
      return
    }

    setSaving(true)
    try {
      // Buscar o parent subblock para pegar o block_id
      const block = blocks.find(b => 
        b.policy_subblocks?.some(sb => sb.id === selectedParentSubblock)
      )
      
      if (!block) {
        throw new Error('Bloco pai não encontrado')
      }

      const parentSubblock = block.policy_subblocks.find(sb => sb.id === selectedParentSubblock)
      const childrenCount = parentSubblock?.children?.length || 0

      const subSubblockData = {
        block_id: block.id,
        parent_subblock_id: selectedParentSubblock,
        level: 2, // 🔥 Sub-sub-bloco é sempre nível 2
        name: subSubblockForm.name.trim(),
        description: subSubblockForm.description.trim(),
        order_index: childrenCount,
        created_by: profile.id
      }

      if (editingSubSubblock) {
        const { error } = await supabase
          .from('policy_subblocks')
          .update(subSubblockData)
          .eq('id', editingSubSubblock.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('policy_subblocks')
          .insert([subSubblockData])

        if (error) throw error
      }

      setShowSubSubblockModal(false)
      setEditingSubSubblock(null)
      setSubSubblockForm({ name: '', description: '', parent_subblock_id: null })
      setSelectedParentSubblock(null)
      
      await loadBlocks()
      
      // 🔥 Atualizar viewingBlock se estiver aberto
      if (viewingBlock) {
        const { data: updatedBlock, error } = await supabase
          .from('policy_blocks')
          .select(`
            *,
            policy_subblocks!policy_subblocks_block_id_fkey (
              *,
              policy_contents (*),
              policy_attachments (*)
            )
          `)
          .eq('id', viewingBlock.id)
          .single()
        
        if (!error && updatedBlock) {
          // Reorganizar hierarquia
          const allSubblocks = updatedBlock.policy_subblocks || []
          const level1 = allSubblocks.filter(sb => !sb.parent_subblock_id || sb.level === 1)
          const level2 = allSubblocks.filter(sb => sb.parent_subblock_id && sb.level === 2)
          
          updatedBlock.policy_subblocks = level1.map(parent => ({
            ...parent,
            children: level2.filter(child => child.parent_subblock_id === parent.id)
          }))
          
          setViewingBlock(updatedBlock)

          // 🔥 NOVO: Atualizar viewingSubblock se estiver aberto
          if (viewingSubblock) {
            const updatedSubblock = updatedBlock.policy_subblocks.find(sb => sb.id === viewingSubblock.id)
            if (updatedSubblock) {
              setViewingSubblock(updatedSubblock)
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao salvar sub-sub-bloco:', error)
      alert('Erro ao salvar sub-sub-bloco: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSubSubblock = async (subSubblockId) => {
    if (!confirm('Tem certeza que deseja deletar este sub-bloco? Todo o conteúdo será removido.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('policy_subblocks')
        .delete()
        .eq('id', subSubblockId)

      if (error) throw error

      await loadBlocks()
      
      // 🔥 Atualizar viewingBlock se estiver aberto
      if (viewingBlock) {
        const { data: updatedBlock, error } = await supabase
          .from('policy_blocks')
          .select(`
            *,
            policy_subblocks!policy_subblocks_block_id_fkey (
              *,
              policy_contents (*),
              policy_attachments (*)
            )
          `)
          .eq('id', viewingBlock.id)
          .single()
        
        if (!error && updatedBlock) {
          // Reorganizar hierarquia
          const allSubblocks = updatedBlock.policy_subblocks || []
          const level1 = allSubblocks.filter(sb => !sb.parent_subblock_id || sb.level === 1)
          const level2 = allSubblocks.filter(sb => sb.parent_subblock_id && sb.level === 2)
          
          updatedBlock.policy_subblocks = level1.map(parent => ({
            ...parent,
            children: level2.filter(child => child.parent_subblock_id === parent.id)
          }))
          
          setViewingBlock(updatedBlock)

          // 🔥 NOVO: Atualizar viewingSubblock se estiver aberto
          if (viewingSubblock) {
            const updatedSubblock = updatedBlock.policy_subblocks.find(sb => sb.id === viewingSubblock.id)
            if (updatedSubblock) {
              setViewingSubblock(updatedSubblock)
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao deletar sub-sub-bloco:', error)
      alert('Erro ao deletar sub-sub-bloco: ' + error.message)
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

      // 🔥 Fechar modal e atualizar viewingSubblock com dados frescos
      await closeContentModal()
      
      // 🔥 Recarregar blocos para lista principal
      await loadBlocks()

      // 🔥 NOVO: Atualizar viewingSubblock se estiver aberto
      if (viewingSubblock) {
        await refreshViewingSubblock(viewingSubblock.id)
      }
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

      await loadBlocks()
      
      // 🔥 Atualizar viewingSubblock se estiver aberto
      if (viewingSubblock) {
        console.log('🔄 Atualizando sub-bloco após deletar conteúdo...')
        await refreshViewingSubblock(viewingSubblock.id)
        console.log('✅ Sub-bloco atualizado')
      }
    } catch (error) {
      console.error('Erro ao deletar conteúdo:', error)
      alert('Erro ao deletar conteúdo: ' + error.message)
    }
  }

  // Upload de Anexos (MÚLTIPLOS)
  const handleUploadAttachment = async () => {
    console.log('🔵 handleUploadAttachment chamado')
    console.log('📁 uploadFiles:', uploadFiles)
    console.log('📋 selectedSubblock:', selectedSubblock)
    
    if (!uploadFiles || uploadFiles.length === 0 || !selectedSubblock) {
      alert('Selecione pelo menos um arquivo')
      return
    }

    setUploading(true)
    let uploadedCount = 0
    let failedCount = 0
    
    try {
      // Processar cada arquivo
      for (const file of uploadFiles) {
        try {
          // Upload para Supabase Storage
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `${userCompanyId}/${selectedJourney.id}/${selectedSubblock}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('policy-attachments')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          // Obter URL autenticada (bucket é privado)
          const { data: urlData } = await supabase.storage
            .from('policy-attachments')
            .createSignedUrl(filePath, 31536000) // URL válida por 1 ano

          if (!urlData || !urlData.signedUrl) {
            throw new Error('Não foi possível gerar URL do arquivo')
          }

          // Salvar registro no banco
          const { error: dbError } = await supabase
            .from('policy_attachments')
            .insert([{
              subblock_id: selectedSubblock,
              file_name: file.name,
              file_size: file.size,
              file_type: file.type,
              file_url: urlData.signedUrl,
              storage_path: filePath,
              description: uploadDescription.trim(),
              uploaded_by: profile.id
            }])

          if (dbError) throw dbError
          
          uploadedCount++
        } catch (fileError) {
          console.error(`Erro ao fazer upload de ${file.name}:`, fileError)
          failedCount++
        }
      }

      // Mostrar resultado
      if (uploadedCount > 0 && failedCount === 0) {
        alert(`✅ ${uploadedCount} arquivo(s) enviado(s) com sucesso!`)
      } else if (uploadedCount > 0 && failedCount > 0) {
        alert(`⚠️ ${uploadedCount} arquivo(s) enviado(s), ${failedCount} falharam.`)
      } else {
        throw new Error('Falha ao enviar todos os arquivos')
      }

      // 🔥 Fechar modal e atualizar viewingSubblock
      await closeAttachmentModal()
      
      // Recarregar blocos
      await loadBlocks()
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

      await loadBlocks()
      
      // 🔥 Atualizar viewingSubblock se estiver aberto
      if (viewingSubblock) {
        await refreshViewingSubblock(viewingSubblock.id)
      }
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

  // 🔥 NOVO: Toggle para sub-sub-blocos (3º nível)
  const toggleSubSubblock = (subSubblockId) => {
    setExpandedSubSubblocks(prev => ({ ...prev, [subSubblockId]: !prev[subSubblockId] }))
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

  // 🔥 NOVO: Abrir modal para criar/editar sub-sub-bloco (3º nível)
  const openSubSubblockModal = (parentSubblockId, subSubblock = null) => {
    setSelectedParentSubblock(parentSubblockId)
    if (subSubblock) {
      setEditingSubSubblock(subSubblock)
      setSubSubblockForm({
        name: subSubblock.name,
        description: subSubblock.description || '',
        parent_subblock_id: parentSubblockId
      })
    } else {
      setEditingSubSubblock(null)
      setSubSubblockForm({ 
        name: '', 
        description: '', 
        parent_subblock_id: parentSubblockId 
      })
    }
    setShowSubSubblockModal(true)
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

  // 🔥 Fechar modal de conteúdo E atualizar o viewingSubblock
  const closeContentModal = async () => {
    setShowContentModal(false)
    setEditingContent(null)
    setContentForm({ content_type: 'text', content_data: { text: '' } })
    
    // 🔥 Atualizar o sub-bloco visualizado com dados frescos do banco
    if (selectedSubblock && viewingSubblock) {
      console.log('🔄 Atualizando sub-bloco ao fechar modal de conteúdo...')
      
      const { data: updatedSubblock, error } = await supabase
        .from('policy_subblocks')
        .select(`
          *,
          policy_contents (*),
          policy_attachments (*)
        `)
        .eq('id', selectedSubblock)
        .order('order_index', { foreignTable: 'policy_contents', ascending: true })
        .single()
      
      if (!error && updatedSubblock) {
        console.log('✅ Sub-bloco atualizado:', updatedSubblock.policy_contents?.length, 'conteúdos')
        setViewingSubblock(updatedSubblock)
      }
    }
  }

  const openAttachmentModal = (subblockId) => {
    setSelectedSubblock(subblockId)
    setUploadFiles([])
    setUploadDescription('')
    setShowAttachmentModal(true)
  }

  // 🔥 Fechar modal de anexo E atualizar o viewingSubblock
  const closeAttachmentModal = async () => {
    setShowAttachmentModal(false)
    setUploadFiles([])
    setUploadDescription('')
    
    // 🔥 Atualizar o sub-bloco visualizado com dados frescos do banco
    if (selectedSubblock && viewingSubblock) {
      console.log('🔄 Atualizando sub-bloco ao fechar modal de anexo...')
      
      const { data: updatedSubblock, error } = await supabase
        .from('policy_subblocks')
        .select(`
          *,
          policy_contents (*),
          policy_attachments (*)
        `)
        .eq('id', selectedSubblock)
        .order('order_index', { foreignTable: 'policy_contents', ascending: true })
        .single()
      
      if (!error && updatedSubblock) {
        console.log('✅ Sub-bloco atualizado:', updatedSubblock.policy_attachments?.length, 'anexos')
        setViewingSubblock(updatedSubblock)
      }
    }
  }

  // 🔥 NOVO: Funções para abrir modais de visualização
  const openBlockView = (block) => {
    setViewingBlock(block)
    setShowBlockViewModal(true)
  }

  const openSubblockView = (subblock) => {
    setViewingSubblock(subblock)
    setShowSubblockViewModal(true)
  }

  const closeBlockView = () => {
    setShowBlockViewModal(false)
    setViewingBlock(null)
    setSubblockSearchQuery('') // 🔥 Limpa a busca ao fechar
  }

  const closeSubblockView = () => {
    setShowSubblockViewModal(false)
    setViewingSubblock(null)
  }

  // 🔥 NOVO: Função helper para atualizar viewingSubblock com hierarquia completa
  const refreshViewingSubblock = async (subblockId) => {
    if (!viewingBlock) return

    try {
      // Buscar bloco atualizado com hierarquia completa
      const { data: updatedBlock, error } = await supabase
        .from('policy_blocks')
        .select(`
          *,
          policy_subblocks!policy_subblocks_block_id_fkey (
            *,
            policy_contents (*),
            policy_attachments (*)
          )
        `)
        .eq('id', viewingBlock.id)
        .single()
      
      if (!error && updatedBlock) {
        // Reorganizar hierarquia
        const allSubblocks = updatedBlock.policy_subblocks || []
        const level1 = allSubblocks.filter(sb => !sb.parent_subblock_id || sb.level === 1)
        const level2 = allSubblocks.filter(sb => sb.parent_subblock_id && sb.level === 2)
        
        updatedBlock.policy_subblocks = level1.map(parent => ({
          ...parent,
          children: level2.filter(child => child.parent_subblock_id === parent.id)
        }))
        
        setViewingBlock(updatedBlock)

        // Atualizar viewingSubblock
        const updatedSubblock = updatedBlock.policy_subblocks.find(sb => sb.id === subblockId)
        if (updatedSubblock) {
          setViewingSubblock(updatedSubblock)
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar sub-bloco:', error)
    }
  }

  // 🔥 NOVO: Função para obter URL autenticada de anexo
  const getAuthenticatedFileUrl = async (storagePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('policy-attachments')
        .createSignedUrl(storagePath, 3600) // URL válida por 1 hora

      if (error) throw error
      return data.signedUrl
    } catch (error) {
      console.error('Erro ao gerar URL:', error)
      return null
    }
  }

  // 🔥 NOVO: Função para visualizar anexo em nova aba
  const handleViewAttachment = async (attachment) => {
    const url = await getAuthenticatedFileUrl(attachment.storage_path)
    if (url) {
      window.open(url, '_blank')
    } else {
      alert('Erro ao gerar link de visualização')
    }
  }

  // 🔥 NOVO: Função para baixar anexo
  const handleDownloadAttachment = async (attachment) => {
    const url = await getAuthenticatedFileUrl(attachment.storage_path)
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else {
      alert('Erro ao gerar link de download')
    }
  }

  const renderContent = (content) => {
    switch (content.content_type) {
      case 'text':
        return <p className="text-gray-700 whitespace-pre-wrap break-words overflow-wrap-anywhere">{content.content_data.text}</p>
      
      case 'list':
        return (
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {content.content_data.items?.map((item, index) => (
              <li key={index} className="break-words">{item}</li>
            ))}
          </ul>
        )
      
      case 'heading':
        const HeadingTag = `h${content.content_data.level || 3}`
        return React.createElement(HeadingTag, {
          className: `font-bold text-gray-900 break-words ${content.content_data.level === 2 ? 'text-xl' : 'text-lg'}`
        }, content.content_data.text)
      
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {content.content_data.headers?.map((header, index) => (
                    <th key={index} className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-900 break-words">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.content_data.rows?.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 border border-gray-300 text-sm text-gray-700 break-words">
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
    <>
      {/* 🔥 Animações CSS customizadas */}
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      {/* Banner Super Admin */}
      <SuperAdminBanner />
      
      <div className="p-8">
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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#373435] mb-1">
                  Blocos de Políticas
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedJourney.name} • {blocks.length} {blocks.length === 1 ? 'bloco' : 'blocos'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Toggle View Mode */}
                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      viewMode === 'list'
                        ? 'bg-white text-[#373435] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    Lista
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-white text-[#373435] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Grid
                  </button>
                </div>
                
                <button
                  onClick={() => openBlockModal()}
                  className="group flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#EBA500] to-[#d99500] hover:shadow-lg hover:shadow-[#EBA500]/30 text-white rounded-2xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                  Novo Bloco
                </button>
              </div>
            </div>

            {/* 🔥 NOVO: Barra de Busca */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar blocos por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-white/80 backdrop-blur-sm placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista/Grid de Blocos */}
            {(() => {
              // 🔥 Filtrar blocos pela busca
              const filteredBlocks = blocks.filter(block => 
                block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                block.description?.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (blocks.length === 0) {
                return (
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
                );
              }

              if (filteredBlocks.length === 0) {
                return (
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 p-16 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="inline-flex p-5 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl mb-6">
                        <Search className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        Nenhum bloco encontrado
                      </h3>
                      <p className="text-gray-500 mb-8 leading-relaxed">
                        Não encontramos blocos com "{searchQuery}"
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#EBA500] to-[#d99500] hover:shadow-lg hover:shadow-[#EBA500]/30 text-white rounded-2xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <X className="h-5 w-5" />
                        Limpar Busca
                      </button>
                    </div>
                  </div>
                );
              }

              if (viewMode === 'list') {
                return (
                  // VISUALIZAÇÃO EM LISTA
                  <div className="space-y-4">
                    {filteredBlocks.map((block) => (
                  <div key={block.id} className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 overflow-hidden hover:shadow-md transition-all duration-200">
                    {/* Header do Bloco - Clicável */}
                    <div 
                      className="p-6 cursor-pointer transition-colors relative hover:bg-gray-50/50"
                      style={{ borderLeft: `5px solid ${block.color}` }}
                      onClick={() => openBlockView(block)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl flex-shrink-0">
                            <span className="text-3xl">{block.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-0.5 break-words">{block.name}</h3>
                            {block.description && (
                              <p className="text-sm text-gray-500 leading-relaxed break-words">{block.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-400">
                                <Layers className="h-3 w-3 inline mr-1" />
                                {block.policy_subblocks?.length || 0} sub-blocos
                              </span>
                              <span className="text-xs text-gray-400">
                                <FileText className="h-3 w-3 inline mr-1" />
                                {block.policy_subblocks?.reduce((sum, sb) => sum + (sb.policy_contents?.length || 0), 0) || 0} conteúdos
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openSubblockModal(block.id);
                            }}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:scale-105"
                            title="Adicionar Sub-bloco"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openBlockModal(block);
                            }}
                            className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-all hover:scale-105"
                            title="Editar Bloco"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBlock(block.id);
                            }}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-105"
                            title="Deletar Bloco"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
                );
              } else {
                return (
                  // VISUALIZAÇÃO EM GRID
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBlocks.map((block) => {
                  const subblockCount = block.policy_subblocks?.length || 0;
                  const totalContent = block.policy_subblocks?.reduce((sum, sb) => 
                    sum + (sb.policy_contents?.length || 0), 0
                  ) || 0;

                  return (
                    <div
                      key={block.id}
                      className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-2 border-gray-200/50 hover:border-[#EBA500]/30 hover:shadow-xl transition-all duration-300 overflow-hidden"
                      style={{ borderLeftWidth: '6px', borderLeftColor: block.color || '#EBA500' }}
                    >
                      {/* Área clicável para abrir visualização */}
                      <div 
                        className="p-6 cursor-pointer"
                        onClick={() => openBlockView(block)}
                      >
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            {block.icon && (
                              <div className="text-4xl mb-3">{block.icon}</div>
                            )}
                            <h3 className="text-lg font-bold text-[#373435] mb-2 line-clamp-2 break-words">
                              {block.name}
                            </h3>
                          </div>
                        </div>

                        {/* Descrição */}
                        {block.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-words">
                            {block.description}
                          </p>
                        )}

                        {/* Estatísticas */}
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Layers className="h-4 w-4 text-[#EBA500]" />
                            <span className="font-semibold">{subblockCount}</span>
                            <span>sub-blocos</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="h-4 w-4 text-[#EBA500]" />
                            <span className="font-semibold">{totalContent}</span>
                            <span>conteúdos</span>
                          </div>
                        </div>
                      </div>

                      {/* Ações (fora da área clicável) */}
                      <div className="px-6 pb-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openSubblockModal(block.id);
                            }}
                            className="flex-1 px-3 py-2 bg-gradient-to-r from-[#EBA500] to-[#d99500] hover:shadow-lg hover:shadow-[#EBA500]/30 text-white text-sm rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                          >
                            <Plus className="h-4 w-4 inline mr-1" />
                            Sub-bloco
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openBlockModal(block);
                            }}
                            className="p-2 text-gray-600 hover:text-[#EBA500] hover:bg-[#EBA500]/10 rounded-xl transition-all"
                            title="Editar bloco"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBlock(block.id);
                            }}
                            className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Excluir bloco"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
                );
              }
            })()}
          </>
        )}

        {/* 🔥 NOVO: Modal de Visualização do Bloco (mostra sub-blocos) */}
        {showBlockViewModal && viewingBlock && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
              style={{
                animation: 'modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              {/* Header do Modal */}
              <div 
                className="p-8 border-b border-gray-200"
                style={{ borderLeft: `6px solid ${viewingBlock.color}` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-5xl flex-shrink-0">{viewingBlock.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-3xl font-bold text-[#373435] mb-2 break-words">
                        {viewingBlock.name}
                      </h2>
                      {viewingBlock.description && (
                        <p className="text-gray-600 leading-relaxed break-words">
                          {viewingBlock.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        closeBlockView();
                        openSubblockModal(viewingBlock.id);
                      }}
                      className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#EBA500] to-[#d99500] hover:shadow-lg hover:shadow-[#EBA500]/30 text-white rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                      title="Criar novo sub-bloco"
                    >
                      <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                      Novo Sub-bloco
                    </button>
                    <button
                      onClick={closeBlockView}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 🔥 NOVO: Barra de Busca de Sub-blocos */}
              {viewingBlock.policy_subblocks && viewingBlock.policy_subblocks.length > 0 && (
                <div className="px-8 pt-6 pb-2">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar sub-blocos..."
                      value={subblockSearchQuery}
                      onChange={(e) => setSubblockSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-gray-50/50 placeholder:text-gray-400"
                    />
                    {subblockSearchQuery && (
                      <button
                        onClick={() => setSubblockSearchQuery('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Lista de Sub-blocos */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-280px)]">
                {(() => {
                  const filteredSubblocks = viewingBlock.policy_subblocks?.filter(subblock =>
                    subblock.name.toLowerCase().includes(subblockSearchQuery.toLowerCase()) ||
                    subblock.description?.toLowerCase().includes(subblockSearchQuery.toLowerCase())
                  ) || [];

                  if (viewingBlock.policy_subblocks && viewingBlock.policy_subblocks.length > 0) {
                    if (filteredSubblocks.length === 0) {
                      return (
                        <div className="text-center py-16">
                          <div className="inline-flex p-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl mb-6">
                            <Search className="h-16 w-16 text-gray-300" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-700 mb-3">
                            Nenhum sub-bloco encontrado
                          </h3>
                          <p className="text-gray-500 mb-6">
                            Não encontramos sub-blocos com "{subblockSearchQuery}"
                          </p>
                          <button
                            onClick={() => setSubblockSearchQuery('')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#EBA500] to-[#d99500] hover:shadow-lg hover:shadow-[#EBA500]/30 text-white rounded-2xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                          >
                            <X className="h-5 w-5" />
                            Limpar Busca
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredSubblocks.map((subblock) => (
                      <div
                        key={subblock.id}
                        className="group bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border-2 border-gray-200/50 hover:border-[#EBA500]/30 hover:shadow-lg p-6 transition-all duration-200 relative"
                      >
                        {/* Botões de Ação (aparecem no hover) */}
                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openSubblockModal(viewingBlock.id, subblock);
                            }}
                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                            title="Editar sub-bloco"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubblock(subblock.id);
                            }}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                            title="Deletar sub-bloco"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Card clicável para abrir visualização */}
                        <div
                          onClick={() => openSubblockView(subblock)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-bold text-[#373435] flex-1 pr-16 break-words">
                              {subblock.name}
                            </h3>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#EBA500] group-hover:translate-x-1 transition-all flex-shrink-0" />
                          </div>
                          {subblock.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 break-words">
                              {subblock.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 pt-3 border-t border-gray-200/50">
                            <span className="text-xs text-gray-500">
                              <Layers className="h-3 w-3 inline mr-1" />
                              {subblock.children?.length || 0} sub-blocos
                            </span>
                            <span className="text-xs text-gray-500">
                              <FileText className="h-3 w-3 inline mr-1" />
                              {subblock.policy_contents?.length || 0} conteúdos
                            </span>
                            <span className="text-xs text-gray-500">
                              <Paperclip className="h-3 w-3 inline mr-1" />
                              {subblock.policy_attachments?.length || 0} anexos
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                    );
                  } else {
                    return (
                      <div className="text-center py-16">
                        <div className="inline-flex p-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl mb-6">
                          <FolderOpen className="h-16 w-16 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-3">
                          Nenhum sub-bloco criado
                        </h3>
                        <p className="text-gray-500 mb-6">
                          Comece criando um sub-bloco para organizar este bloco
                        </p>
                        <button
                          onClick={() => {
                            closeBlockView();
                            openSubblockModal(viewingBlock.id);
                          }}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#EBA500] to-[#d99500] hover:shadow-lg hover:shadow-[#EBA500]/30 text-white rounded-2xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                        >
                          <Plus className="h-5 w-5" />
                          Criar Sub-bloco
                        </button>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 🔥 NOVO: Modal de Visualização do Sub-bloco (mostra conteúdos e anexos) */}
        {showSubblockViewModal && viewingSubblock && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              style={{
                animation: 'modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              {/* Header do Modal */}
              <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-[#EBA500]/5 to-transparent">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <button
                      onClick={closeSubblockView}
                      className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#EBA500] mb-4 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      Voltar aos sub-blocos
                    </button>
                    <h2 className="text-3xl font-bold text-[#373435] mb-2 break-words">
                      {viewingSubblock.name}
                    </h2>
                    {viewingSubblock.description && (
                      <p className="text-gray-600 leading-relaxed break-words">
                        {viewingSubblock.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDeleteSubblock(viewingSubblock.id)}
                      className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:shadow-red-500/30 text-white rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                      title="Deletar sub-bloco"
                    >
                      <Trash2 className="h-4 w-4" />
                      Deletar
                    </button>
                    <button
                      onClick={closeSubblockView}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Conteúdos e Anexos */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-240px)]">
                <div className="space-y-8">
                  {console.log('🎨 Renderizando modal - Conteúdos:', viewingSubblock.policy_contents?.length || 0)}
                  
                  {/* 🔥 NOVO: Sub-Sub-blocos (3º nível) */}
                  {viewingSubblock.children && viewingSubblock.children.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 rounded-xl">
                            <Layers className="h-5 w-5 text-indigo-600" />
                          </div>
                          <h3 className="text-xl font-bold text-[#373435]">Sub-blocos</h3>
                        </div>
                        <button
                          onClick={() => openSubSubblockModal(viewingSubblock.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 text-white rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar Sub-bloco
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {viewingSubblock.children.map((subSubblock) => (
                          <div
                            key={subSubblock.id}
                            className="group bg-gradient-to-br from-indigo-50 to-white rounded-2xl border-2 border-indigo-200/50 hover:border-indigo-400 hover:shadow-lg p-5 transition-all duration-200"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="p-1.5 bg-indigo-100 rounded-lg">
                                  <Layers className="h-4 w-4 text-indigo-600" />
                                </div>
                                <h4 className="text-base font-bold text-[#373435] break-words">
                                  {subSubblock.name}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openSubSubblockModal(viewingSubblock.id, subSubblock)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                  title="Editar"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSubSubblock(subSubblock.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => toggleSubSubblock(subSubblock.id)}
                                  className="text-gray-400 group-hover:text-indigo-600 transition-all flex-shrink-0"
                                >
                                  {expandedSubSubblocks[subSubblock.id] ? 
                                    <ChevronDown className="h-5 w-5" /> : 
                                    <ChevronRight className="h-5 w-5" />
                                  }
                                </button>
                              </div>
                            </div>
                            
                            {subSubblock.description && (
                              <p className="text-sm text-gray-600 mb-3 ml-7 break-words">
                                {subSubblock.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 ml-7">
                              <span className="text-xs text-gray-500">
                                <FileText className="h-3 w-3 inline mr-1" />
                                {subSubblock.policy_contents?.length || 0} conteúdos
                              </span>
                              <span className="text-xs text-gray-500">
                                <Paperclip className="h-3 w-3 inline mr-1" />
                                {subSubblock.policy_attachments?.length || 0} anexos
                              </span>
                              <button
                                onClick={() => openContentModal(subSubblock.id)}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                              >
                                <Plus className="h-3 w-3 inline mr-1" />
                                Conteúdo
                              </button>
                              <button
                                onClick={() => openAttachmentModal(subSubblock.id)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                              >
                                <Plus className="h-3 w-3 inline mr-1" />
                                Anexo
                              </button>
                            </div>

                            {/* Conteúdos e Anexos do Sub-Subloco (se expandido) */}
                            {expandedSubSubblocks[subSubblock.id] && (
                              <div className="mt-4 ml-7 space-y-4 pl-4 border-l-2 border-indigo-200">
                                {/* Conteúdos */}
                                {subSubblock.policy_contents && subSubblock.policy_contents.length > 0 && (
                                  <div className="space-y-3">
                                    {subSubblock.policy_contents.map((content) => (
                                      <div
                                        key={content.id}
                                        className="bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 transition-all"
                                      >
                                        <div className="flex justify-between items-start mb-3">
                                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-100">
                                            {content.content_type}
                                          </span>
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => openContentModal(subSubblock.id, content)}
                                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                              title="Editar"
                                            >
                                              <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteContent(content.id)}
                                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                              title="Excluir"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                        <div className="prose prose-sm max-w-none text-sm">
                                          {renderContent(content)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Anexos */}
                                {subSubblock.policy_attachments && subSubblock.policy_attachments.length > 0 && (
                                  <div className="space-y-2">
                                    {subSubblock.policy_attachments.map((attachment) => (
                                      <div
                                        key={attachment.id}
                                        className="bg-white rounded-xl p-3 border border-gray-200 hover:border-blue-300 transition-all flex items-center justify-between"
                                      >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                                            <FileIcon className="h-4 w-4 text-blue-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-900 truncate">{attachment.file_name}</p>
                                            {attachment.description && (
                                              <p className="text-xs text-gray-500 truncate">{attachment.description}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                          <button
                                            onClick={() => handleViewAttachment(attachment)}
                                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                            title="Visualizar"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDownloadAttachment(attachment)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Download"
                                          >
                                            <Download className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteAttachment(attachment)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Excluir"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botão para criar sub-sub-bloco se ainda não tiver nenhum (apenas nível 1) - REMOVIDO pois agora tem botão fixo na barra de ações */}
                  
                  {/* Conteúdos - sempre mostrar se existirem */}
                  {viewingSubblock.policy_contents && viewingSubblock.policy_contents.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-xl">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-[#373435]">Conteúdos</h3>
                      </div>
                      <div className="space-y-4">
                        {viewingSubblock.policy_contents.map((content) => (
                          <div
                            key={content.id}
                            className="bg-white rounded-2xl p-6 border-2 border-gray-200/50 hover:border-gray-300 transition-all overflow-hidden"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-100">
                                {content.content_type}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    // 🔥 NÃO fechar o modal do sub-bloco - deixar aberto para ver o resultado
                                    openContentModal(viewingSubblock.id, content);
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteContent(content.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="prose prose-sm max-w-none overflow-hidden break-words">
                              {renderContent(content)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anexos */}
                  {viewingSubblock.policy_attachments && viewingSubblock.policy_attachments.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <Paperclip className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-[#373435]">Anexos</h3>
                      </div>
                      <div className="space-y-3">
                        {viewingSubblock.policy_attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="bg-white rounded-2xl p-5 border-2 border-gray-200/50 hover:border-gray-300 transition-all flex items-center justify-between overflow-hidden"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl flex-shrink-0">
                                <FileIcon className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 mb-1 break-words">{attachment.file_name}</p>
                                <p className="text-sm text-gray-500 break-words">
                                  {formatFileSize(attachment.file_size)} • {formatDate(attachment.uploaded_at)}
                                </p>
                                {attachment.description && (
                                  <p className="text-sm text-gray-600 mt-2 break-words">{attachment.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleViewAttachment(attachment)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                                title="Visualizar"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDownloadAttachment(attachment)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="Download"
                              >
                                <Download className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAttachment(attachment)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Excluir"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {(!viewingSubblock.policy_contents || viewingSubblock.policy_contents.length === 0) &&
                   (!viewingSubblock.policy_attachments || viewingSubblock.policy_attachments.length === 0) &&
                   (!viewingSubblock.children || viewingSubblock.children.length === 0) && (
                    <div className="text-center py-16">
                      <div className="inline-flex p-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl mb-6">
                        <FileText className="h-16 w-16 text-gray-300" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-700 mb-3">
                        Nenhum conteúdo adicionado
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {(!viewingSubblock.level || viewingSubblock.level === 1)
                          ? 'Adicione conteúdos, anexos ou organize em sub-blocos'
                          : 'Adicione conteúdos ou anexos a este sub-bloco'
                        }
                      </p>
                      <div className="flex items-center justify-center gap-3 flex-wrap">
                        <button
                          onClick={() => {
                            // 🔥 NÃO fechar o modal do sub-bloco - deixar aberto para ver o resultado
                            openContentModal(viewingSubblock.id);
                          }}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:shadow-lg hover:shadow-purple-500/30 text-white rounded-2xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                        >
                          <FileText className="h-5 w-5" />
                          Adicionar Conteúdo
                        </button>
                        <button
                          onClick={() => {
                            // 🔥 NÃO fechar o modal do sub-bloco - deixar aberto para ver o resultado
                            openAttachmentModal(viewingSubblock.id);
                          }}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/30 text-white rounded-2xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                        >
                          <Paperclip className="h-5 w-5" />
                          Adicionar Anexo
                        </button>
                        {/* Botão de criar sub-sub-bloco só para nível 1 */}
                        {(!viewingSubblock.level || viewingSubblock.level === 1) && (
                          <button
                            onClick={() => openSubSubblockModal(viewingSubblock.id)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 text-white rounded-2xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                          >
                            <Layers className="h-5 w-5" />
                            Criar Sub-bloco
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 🔥 NOVO: Barra de ações sempre visível (fora do scroll) */}
                <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4 border-t border-gray-200 mt-8">
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => openContentModal(viewingSubblock.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:shadow-lg hover:shadow-purple-500/30 text-white rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Conteúdo
                    </button>
                    <button
                      onClick={() => openAttachmentModal(viewingSubblock.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/30 text-white rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Anexo
                    </button>
                    {/* Botão de criar sub-sub-bloco só para nível 1 */}
                    {(!viewingSubblock.level || viewingSubblock.level === 1) && (
                      <button
                        onClick={() => openSubSubblockModal(viewingSubblock.id)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 text-white rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Sub-bloco
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Bloco - Modernizado */}
        {showBlockModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8"
              style={{
                animation: 'modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8"
              style={{
                animation: 'modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
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

        {/* 🔥 NOVO: Modal de Sub-Sub-bloco (3º nível) */}
        {showSubSubblockModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8"
              style={{
                animation: 'modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 rounded-2xl">
                    <Layers className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#373435]">
                    {editingSubSubblock ? 'Editar Sub-bloco' : 'Novo Sub-bloco'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowSubSubblockModal(false)}
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
                    value={subSubblockForm.name}
                    onChange={(e) => setSubSubblockForm(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={100}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-indigo-500 transition-colors bg-gray-50/50 focus:bg-white"
                    placeholder="Ex: Despesas Fixas"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">
                    Descrição
                  </label>
                  <textarea
                    value={subSubblockForm.description}
                    onChange={(e) => setSubSubblockForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-indigo-500 transition-colors bg-gray-50/50 focus:bg-white resize-none"
                    placeholder="Descrição do sub-bloco..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowSubSubblockModal(false)}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-all disabled:opacity-50 hover:scale-105"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSubSubblock}
                  disabled={saving || !subSubblockForm.name.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center gap-2 hover:scale-105"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingSubSubblock ? 'Atualizar' : 'Criar Sub-bloco'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Conteúdo - Modernizado */}
        {showContentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto"
              style={{
                animation: 'modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
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
                  onClick={closeContentModal}
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8"
              style={{
                animation: 'modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
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
                  onClick={closeAttachmentModal}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">
                    Arquivos * (múltiplos)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#EBA500] hover:bg-[#EBA500]/5 transition-all cursor-pointer">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setUploadFiles(Array.from(e.target.files))}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      <div className="inline-flex p-4 bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10 rounded-2xl mb-4">
                        <Upload className="h-10 w-10 text-[#EBA500]" />
                      </div>
                      {uploadFiles && uploadFiles.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-gray-900 font-bold text-lg mb-3">
                            {uploadFiles.length} arquivo(s) selecionado(s)
                          </p>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {uploadFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-xl">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                </div>
                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                  {formatFileSize(file.size)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-700 font-bold mb-2">
                            Clique para selecionar arquivos
                          </p>
                          <p className="text-sm text-gray-500">
                            PDF, Word, Excel, imagens, etc. (múltiplos arquivos)
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
                  disabled={uploading || !uploadFiles || uploadFiles.length === 0}
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
                      Fazer Upload {uploadFiles && uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
    </>
  )
}
