import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, X, Save, GripVertical, Building2, BookOpen, Target, Eye, Heart } from 'lucide-react'
import { cn } from '../utils/cn'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import SuperAdminBanner from '../components/SuperAdminBanner'
import { businessModelService } from '../services/businessModelService'
import toast from '@/lib/toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Configuração das seções do modelo de negócio
const SECTIONS = [
  { id: 'partners', title: 'Parceiros-chave', color: 'bg-[#FEF3E2]', textColor: 'text-[#EBA500]', borderColor: 'border-[#EBA500]' },
  { id: 'activities', title: 'Atividades-chave', color: 'bg-[#FEF3E2]', textColor: 'text-[#EBA500]', borderColor: 'border-[#EBA500]' },
  { id: 'resources', title: 'Recursos', color: 'bg-[#FEF3E2]', textColor: 'text-[#EBA500]', borderColor: 'border-[#EBA500]' },
  { id: 'value', title: 'Proposta de valor', color: 'bg-[#FEF3E2]', textColor: 'text-[#EBA500]', borderColor: 'border-[#EBA500]' },
  { id: 'relationship', title: 'Relacionamento', color: 'bg-[#FEF3E2]', textColor: 'text-[#EBA500]', borderColor: 'border-[#EBA500]' },
  { id: 'channels', title: 'Canais', color: 'bg-[#FEF3E2]', textColor: 'text-[#EBA500]', borderColor: 'border-[#EBA500]' },
  { id: 'audience', title: 'Público', color: 'bg-[#FEF3E2]', textColor: 'text-[#EBA500]', borderColor: 'border-[#EBA500]' },
  { id: 'costs', title: 'Despesas', color: 'bg-[#FEF3E2]', textColor: 'text-[#EBA500]', borderColor: 'border-[#EBA500]' },
  { id: 'revenue', title: 'Fontes de receita', color: 'bg-[#FEF3E2]', textColor: 'text-[#EBA500]', borderColor: 'border-[#EBA500]' }
]

// Componente de cartão individual com drag and drop
function SortableCard({ card, sectionId, onEdit, onDelete, isEditing, onStartEdit, onFinishEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [text, setText] = useState(card.text)
  const [isHovered, setIsHovered] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setText(card.text)
  }, [card.text])

  const handleSave = async () => {
    // Se o texto estiver vazio E o cartão original também estava vazio, apenas fecha o editor
    if (text.trim() === '' && card.text === '') {
      onFinishEdit()
      return
    }
    
    // Se o texto ficou vazio mas o cartão tinha conteúdo antes, deleta
    if (text.trim() === '' && card.text !== '') {
      onDelete(sectionId, card.id)
      return
    }
    
    // Se o texto mudou, salva
    if (text !== card.text) {
      setIsSaving(true)
      await onEdit(sectionId, card.id, text)
      setTimeout(() => setIsSaving(false), 500)
    }
    onFinishEdit()
  }

  const handleBlur = () => {
    handleSave()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setText(card.text)
      onFinishEdit()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group bg-white dark:bg-gray-800 rounded-lg border-2 dark:border-gray-600 transition-all duration-200",
        isEditing ? "ring-2 ring-primary-500 shadow-lg" : "shadow-sm hover:shadow-md",
        "min-h-[60px] p-3"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Conteúdo do cartão */}
      {isEditing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full resize-none border-none outline-none bg-transparent text-sm leading-relaxed text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          rows={3}
          placeholder="Digite aqui..."
        />
      ) : (
        <div className="flex items-start gap-2">
          {/* Handle de drag invisível mas funcional */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0 opacity-0 group-hover:opacity-30 transition-opacity"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          
          <p
            onClick={onStartEdit}
            className="text-sm leading-relaxed cursor-pointer whitespace-pre-wrap break-words flex-1 min-w-0 text-gray-800 dark:text-gray-200"
            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
          >
            {card.text}
          </p>
        </div>
      )}

      {/* Botão deletar (só aparece no hover) */}
      {!isEditing && isHovered && (
        <button
          onClick={() => onDelete(sectionId, card.id)}
          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Indicador de salvamento */}
      {isSaving && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-green-600">
          <Save className="h-3 w-3" />
          <span>Salvo ✓</span>
        </div>
      )}
    </div>
  )
}

// Componente de seção do modelo
function Section({ section, cards, onAddCard, onEditCard, onDeleteCard, editingCardId, setEditingCardId, onReorder }) {
  const sectionCards = cards[section.id] || []

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddCard = async () => {
    const tempCardId = Date.now().toString()
    setEditingCardId(tempCardId)
    await onAddCard(section.id, tempCardId, setEditingCardId)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sectionCards.findIndex(card => card.id === active.id)
      const newIndex = sectionCards.findIndex(card => card.id === over.id)

      onReorder(section.id, oldIndex, newIndex)
    }
  }

  return (
    <div className={cn(
      "border-2 shadow-lg transition-all duration-300 hover:shadow-xl h-full flex flex-col dark:bg-gray-800 dark:border-gray-600",
      section.color,
      section.borderColor
    )}>
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between p-4 border-b-2 border-opacity-20 flex-shrink-0">
        <h3 className={cn("font-bold text-sm sm:text-base", section.textColor)}>
          {section.title}
        </h3>
        <button
          onClick={handleAddCard}
          className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 bg-[#EBA500] text-white hover:bg-[#d99500] hover:shadow-md"
          title="Adicionar item"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Área de conteúdo */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        {sectionCards.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">
            Clique no + para adicionar
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sectionCards.map(card => card.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sectionCards.map((card) => (
                  <SortableCard
                    key={card.id}
                    card={card}
                    sectionId={section.id}
                    onEdit={onEditCard}
                    onDelete={onDeleteCard}
                    isEditing={editingCardId === card.id}
                    onStartEdit={() => setEditingCardId(card.id)}
                    onFinishEdit={() => setEditingCardId(null)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

// Skeleton loader
function SectionSkeleton() {
  return (
    <div className="rounded-xl border-2 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 animate-pulse">
      <div className="p-4 border-b-2 border-gray-200 dark:border-gray-700">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  )
}

export default function BusinessModelPage() {
  const { user, profile } = useAuth()
  const [searchParams] = useSearchParams()
  const isSuperAdmin = () => profile?.role === 'super_admin'
  const [cards, setCards] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingCardId, setEditingCardId] = useState(null)
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    () => searchParams.get('companyId') || searchParams.get('company') || null
  )
  const [purposes, setPurposes] = useState({ missao: '', visao: '', valores: '' })
  const [savingPurposes, setSavingPurposes] = useState({})

  // Super admin: usa empresa selecionada no seletor / URL param
  // Outros usuários: usa empresa do próprio perfil
  const companyId = isSuperAdmin()
    ? selectedCompanyId
    : (profile?.company_id || profile?.user_companies?.[0]?.company_id)


  // Carrega lista de empresas para o seletor (só super admin)
  useEffect(() => {
    if (!isSuperAdmin()) return
    const loadCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')
      if (!error && data) setCompanies(data)
    }
    loadCompanies()
  }, [profile])

  // Carrega os cartões do banco de dados
  useEffect(() => {
    const loadData = async () => {
      if (!companyId) {
        console.log('⚠️ Aguardando company_id...', { 
          profile,
          company_id: profile?.company_id,
          user_companies: profile?.user_companies
        })
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        console.log('📋 Carregando modelo de negócio para empresa:', companyId)
        
        const cardsBySection = await businessModelService.getCardsByCompany(companyId)
        console.log('✅ Cartões carregados:', cardsBySection)
        
        setCards(cardsBySection)
        setError(null)
      } catch (error) {
        console.error('❌ Erro ao carregar modelo de negócio:', error)
        setError('Erro ao carregar modelo de negócio')
        toast.error('Erro ao carregar modelo de negócio')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [companyId, profile])

  const handleAddCard = async (sectionId, tempCardId, setEditingCallback) => {
    if (!companyId || !user) return

    // Adiciona cartão temporário no estado
    setCards(prev => ({
      ...prev,
      [sectionId]: [
        ...(prev[sectionId] || []),
        { id: tempCardId, text: '', isTemp: true }
      ]
    }))

    try {
      // Cria no banco de dados
      const newCard = await businessModelService.createCard(
        companyId,
        sectionId,
        '',
        user.id
      )

      // Substitui o cartão temporário pelo real
      setCards(prev => ({
        ...prev,
        [sectionId]: prev[sectionId].map(card =>
          card.id === tempCardId ? { ...newCard, isTemp: false } : card
        )
      }))

      // Atualiza o ID de edição para o ID real do cartão
      setEditingCallback(newCard.id)
      
      console.log('✅ Cartão criado:', newCard)
    } catch (error) {
      console.error('❌ Erro ao criar cartão:', error)
      toast.error('Erro ao criar cartão')
      
      // Remove cartão temporário em caso de erro
      setCards(prev => ({
        ...prev,
        [sectionId]: prev[sectionId].filter(card => card.id !== tempCardId)
      }))
      
      // Limpa o estado de edição
      setEditingCallback(null)
    }
  }

  const handleEditCard = async (sectionId, cardId, newText) => {
    if (!user) return

    // Atualiza no estado local primeiro (otimistic update)
    setCards(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].map(card =>
        card.id === cardId ? { ...card, text: newText } : card
      )
    }))

    try {
      // Salva no banco de dados
      await businessModelService.updateCard(cardId, newText, user.id)
      console.log('✅ Cartão atualizado:', cardId)
    } catch (error) {
      console.error('❌ Erro ao atualizar cartão:', error)
      toast.error('Erro ao salvar alterações')
      
      // Recarrega os dados em caso de erro
      if (companyId) {
        const cardsBySection = await businessModelService.getCardsByCompany(companyId)
        setCards(cardsBySection)
      }
    }
  }

  const handleDeleteCard = async (sectionId, cardId) => {
    // Remove do estado local primeiro
    setCards(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].filter(card => card.id !== cardId)
    }))

    try {
      // Deleta do banco de dados
      await businessModelService.deleteCard(cardId)
      console.log('✅ Cartão deletado:', cardId)
      toast.success('Cartão removido')
    } catch (error) {
      console.error('❌ Erro ao deletar cartão:', error)
      toast.error('Erro ao remover cartão')
      
      // Recarrega os dados em caso de erro
      if (companyId) {
        const cardsBySection = await businessModelService.getCardsByCompany(companyId)
        setCards(cardsBySection)
      }
    }
  }

  const handleReorder = async (sectionId, oldIndex, newIndex) => {
    const sectionCards = cards[sectionId]
    
    // Reordena no estado local
    const newOrder = arrayMove(sectionCards, oldIndex, newIndex)
    
    setCards(prev => ({
      ...prev,
      [sectionId]: newOrder
    }))

    try {
      // Atualiza as posições no banco de dados
      const updates = newOrder.map((card, index) => ({
        id: card.id,
        position: index
      }))

      await businessModelService.reorderCards(companyId, sectionId, updates)
      console.log('✅ Cartões reordenados')
    } catch (error) {
      console.error('❌ Erro ao reordenar cartões:', error)
      toast.error('Erro ao reordenar cartões')
      
      // Recarrega os dados em caso de erro
      if (companyId) {
        const cardsBySection = await businessModelService.getCardsByCompany(companyId)
        setCards(cardsBySection)
      }
    }
  }

  // Carrega propósitos institucionais
  useEffect(() => {
    if (!companyId) return
    businessModelService.getPurposes(companyId)
      .then(data => setPurposes(data))
      .catch(err => console.error('❌ Erro ao carregar propósitos:', err))
  }, [companyId])

  const handlePurposeBlur = async (field, value) => {
    if (!companyId) return
    setSavingPurposes(prev => ({ ...prev, [field]: true }))
    try {
      await businessModelService.savePurpose(companyId, field, value)
      toast.success('Salvo!')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setSavingPurposes(prev => ({ ...prev, [field]: false }))
    }
  }

  // Verifica se o usuário tem permissão
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Carregando perfil do usuário...</p>
        </div>
      </div>
    )
  }

  if (!companyId) {
    // Super admin sem empresa selecionada: mostra seletor
    if (isSuperAdmin()) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
          <SuperAdminBanner />
          <div className="max-w-[1600px] mx-auto">
            <div className="mb-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-500 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Visualizando modelo de negócio de:</label>
                  <select
                    value={selectedCompanyId || ''}
                    onChange={(e) => setSelectedCompanyId(e.target.value || null)}
                    className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent"
                  >
                    <option value="">Selecione uma empresa...</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              Selecione uma empresa para visualizar o modelo de negócio
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Você não está associado a nenhuma empresa.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#EBA500] text-white rounded-lg hover:bg-[#d99500]"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
          </div>
          
          {/* Grid de skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <SectionSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Banner super admin */}
      <SuperAdminBanner />

      <div className="max-w-[1600px] mx-auto">
        {/* Seletor de empresa — apenas super admin */}
        {isSuperAdmin() && (
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Visualizando modelo de negócio de:</label>
                <select
                  value={selectedCompanyId || ''}
                  onChange={(e) => setSelectedCompanyId(e.target.value || null)}
                  className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent"
                >
                  <option value="">Selecione uma empresa...</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Modelo de Negócio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Construa e visualize seu modelo de negócio de forma colaborativa
          </p>
        </div>

        {/* Propósitos Institucionais */}
        <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {/* Header do bloco */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="p-2 bg-[#FEF3E2] dark:bg-[#EBA500]/20 rounded-lg">
              <BookOpen className="h-4 w-4 text-[#EBA500]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Propósitos Institucionais</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Defina a essência da organização</p>
            </div>
          </div>

          {/* Campos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
            {/* Missão */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-[#EBA500]" />
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Missão</label>
                {savingPurposes.missao && <span className="text-xs text-gray-400 ml-auto">Salvando...</span>}
              </div>
              <textarea
                value={purposes.missao}
                onChange={(e) => setPurposes(prev => ({ ...prev, missao: e.target.value }))}
                onBlur={(e) => handlePurposeBlur('missao', e.target.value)}
                placeholder="Por que existimos? Qual é o propósito da nossa organização?"
                rows={4}
                className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              />
            </div>

            {/* Visão */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-[#EBA500]" />
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Visão</label>
                {savingPurposes.visao && <span className="text-xs text-gray-400 ml-auto">Salvando...</span>}
              </div>
              <textarea
                value={purposes.visao}
                onChange={(e) => setPurposes(prev => ({ ...prev, visao: e.target.value }))}
                onBlur={(e) => handlePurposeBlur('visao', e.target.value)}
                placeholder="Onde queremos chegar? Qual é o nosso futuro desejado?"
                rows={4}
                className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              />
            </div>

            {/* Valores */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-[#EBA500]" />
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Valores</label>
                {savingPurposes.valores && <span className="text-xs text-gray-400 ml-auto">Salvando...</span>}
              </div>
              <textarea
                value={purposes.valores}
                onChange={(e) => setPurposes(prev => ({ ...prev, valores: e.target.value }))}
                onBlur={(e) => handlePurposeBlur('valores', e.target.value)}
                placeholder="Quais princípios guiam nossas decisões e comportamentos?"
                rows={4}
                className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Grid do Modelo de Negócio */}
        <div className="grid grid-cols-1 gap-2 lg:gap-3">
          {/* Linha Superior - Desktop: 5 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3">
            {/* Parceiros-chave - Ocupa 2 linhas de altura no desktop */}
            <div className="lg:row-span-2">
              <Section
                section={SECTIONS[0]}
                cards={cards}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onReorder={handleReorder}
                editingCardId={editingCardId}
                setEditingCardId={setEditingCardId}
              />
            </div>

            {/* Atividades-chave */}
            <div>
              <Section
                section={SECTIONS[1]}
                cards={cards}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onReorder={handleReorder}
                editingCardId={editingCardId}
                setEditingCardId={setEditingCardId}
              />
            </div>

            {/* Proposta de valor - Ocupa 2 linhas de altura no desktop */}
            <div className="lg:row-span-2">
              <Section
                section={SECTIONS[3]}
                cards={cards}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onReorder={handleReorder}
                editingCardId={editingCardId}
                setEditingCardId={setEditingCardId}
              />
            </div>

            {/* Relacionamento */}
            <div>
              <Section
                section={SECTIONS[4]}
                cards={cards}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onReorder={handleReorder}
                editingCardId={editingCardId}
                setEditingCardId={setEditingCardId}
              />
            </div>

            {/* Público - Ocupa 2 linhas de altura no desktop */}
            <div className="lg:row-span-2">
              <Section
                section={SECTIONS[6]}
                cards={cards}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onReorder={handleReorder}
                editingCardId={editingCardId}
                setEditingCardId={setEditingCardId}
              />
            </div>

            {/* Recursos */}
            <div>
              <Section
                section={SECTIONS[2]}
                cards={cards}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onReorder={handleReorder}
                editingCardId={editingCardId}
                setEditingCardId={setEditingCardId}
              />
            </div>

            {/* Canais */}
            <div>
              <Section
                section={SECTIONS[5]}
                cards={cards}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onReorder={handleReorder}
                editingCardId={editingCardId}
                setEditingCardId={setEditingCardId}
              />
            </div>
          </div>

          {/* Linha Inferior - 2 colunas grandes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
            {/* Despesas */}
            <Section
              section={SECTIONS[7]}
              cards={cards}
              onAddCard={handleAddCard}
              onEditCard={handleEditCard}
              onDeleteCard={handleDeleteCard}
              onReorder={handleReorder}
              editingCardId={editingCardId}
              setEditingCardId={setEditingCardId}
            />

            {/* Fontes de receita */}
            <Section
              section={SECTIONS[8]}
              cards={cards}
              onAddCard={handleAddCard}
              onEditCard={handleEditCard}
              onDeleteCard={handleDeleteCard}
              onReorder={handleReorder}
              editingCardId={editingCardId}
              setEditingCardId={setEditingCardId}
            />
          </div>
        </div>
      </div>

      {/* Estilos customizados para scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  )
}
