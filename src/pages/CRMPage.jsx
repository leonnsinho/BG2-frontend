import { useState, useEffect, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  rectIntersection,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, X, GripVertical, Edit2, Trash2, Save, Upload,
  Building2, User, Phone, Mail, MapPin, Tag, DollarSign,
  MessageSquare, Paperclip, ChevronDown, Check, AlertCircle,
  Kanban, Search, Filter, MoreHorizontal, Download, ArrowLeft, LayoutGrid,
  Users, Package, Import, ChevronRight, Globe, Briefcase, ArrowUpRight, FileSpreadsheet
} from 'lucide-react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import SuperAdminBanner from '../components/SuperAdminBanner'
import EmojiIconPicker from '../components/EmojiIconPicker'
import { renderIcon } from '../utils/iconRenderer'
import toast from 'react-hot-toast'

// ─── constants ────────────────────────────────────────────────────────────────
const ORIGENS = ['Indicação', 'Inbound', 'Outbound', 'Site/Blog', 'Redes Sociais', 'Evento', 'Parceiro', 'Outro']
const STATUS_OPTIONS = [
  { value: 'ativo',   label: 'Ativo',   color: 'bg-blue-100 text-blue-700' },
  { value: 'ganho',   label: 'Ganho',   color: 'bg-green-100 text-green-700' },
  { value: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-700' },
]

const EMPTY_CARD = {
  nome_empresa: '', nome_contato: '', cargo_contato: '',
  email_contato: '', telefone_contato: '', origem_lead: '',
  cidade_estado: '', segmento: '', observacoes: '',
  valor_oportunidade: '', status: 'ativo',
  lead_id: null, contact_id: null,
}

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
]

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtMoney = (v) => {
  if (!v && v !== 0) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

// ─── ImportOrCreatePicker ─────────────────────────────────────────────────────
// Generic component: shows a list of existing items + button to create new inline
function ImportOrCreatePicker({ title, Icon, colorClass, items, selected, onSelect, onCreateClick, renderItem, renderSelected, placeholder }) {
  const [open, setOpen] = useState(false)

  if (selected) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colorClass} bg-opacity-10`}>
        <Icon className="h-4 w-4 shrink-0" />
        <div className="flex-1 min-w-0 text-sm">{renderSelected(selected)}</div>
        <button onClick={() => onSelect(null)} className="text-gray-400 hover:text-red-400 transition-colors shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed text-sm transition-all ${open ? 'border-[#EBA500] bg-amber-50/40' : 'border-gray-200 hover:border-gray-300 text-gray-500'}`}
        >
          <Import className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left text-xs">{placeholder}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
        </button>
        <button
          type="button"
          onClick={onCreateClick}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#EBA500] hover:bg-amber-50/40 text-xs text-gray-500 hover:text-[#EBA500] transition-all shrink-0"
          title={`Criar ${title}`}
        >
          <Plus className="h-3.5 w-3.5" /> Criar
        </button>
      </div>
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-3">Nenhum {title.toLowerCase()} cadastrado.</p>
          ) : (
            items.map(item => (
              <button key={item.id} type="button" onClick={() => { onSelect(item); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors">
                <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-700 truncate">{renderItem(item)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── CardModal ────────────────────────────────────────────────────────────────
function CardModal({ card, columnId, companyId, columns, onClose, onSaved, onDeleted }) {
  const { user } = useAuth()
  const [form, setForm] = useState(card ? { ...card } : { ...EMPTY_CARD, column_id: columnId })
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef()
  const isNew = !card?.id

  // observations (multi-card history)
  const [observations, setObservations] = useState(() => {
    const raw = card?.observacoes
    if (!raw) return []
    try { const p = JSON.parse(raw); if (Array.isArray(p)) return p } catch {}
    return [{ id: crypto.randomUUID(), text: raw, created_at: new Date().toISOString() }]
  })
  const [newObsText, setNewObsText] = useState('')

  const addObservation = () => {
    if (!newObsText.trim()) return
    setObservations(prev => [...prev, { id: crypto.randomUUID(), text: newObsText.trim(), created_at: new Date().toISOString() }])
    setNewObsText('')
  }
  const removeObservation = (id) => setObservations(prev => prev.filter(o => o.id !== id))

  // entity data
  const [leads, setLeads] = useState([])
  const [products, setProducts] = useState([])
  const [contacts, setContacts] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [selectedContact, setSelectedContact] = useState(null)
  const [lineItems, setLineItems] = useState([]) // { lineId, dbId, product_id, product, nome_produto, valor_unitario, quantidade, desconto_percentual, valor_linha }

  // create-inline sub-modal
  const [createMode, setCreateMode] = useState(null) // 'lead' | 'product' | 'contact'
  const [createForm, setCreateForm] = useState({})
  const [createSaving, setCreateSaving] = useState(false)

  useEffect(() => {
    loadEntities()
    if (card?.id) {
      loadAttachments(card.id)
      loadLineItems(card.id)
    }
  }, [])

  const loadEntities = async () => {
    const [{ data: ls }, { data: ps }, { data: cs }] = await Promise.all([
      supabase.from('crm_leads').select('*').eq('company_id', companyId).order('nome_empresa'),
      supabase.from('crm_products').select('*').eq('company_id', companyId).order('nome'),
      supabase.from('crm_contacts').select('*, crm_leads(nome_empresa)').eq('company_id', companyId).order('nome'),
    ])
    const lList = ls || [], pList = ps || [], cList = cs || []
    setLeads(lList)
    setProducts(pList)
    setContacts(cList)
    // pre-select if editing
    if (card?.lead_id)    setSelectedLead(lList.find(x => x.id === card.lead_id) || null)
    if (card?.contact_id) setSelectedContact(cList.find(x => x.id === card.contact_id) || null)
  }

  const loadAttachments = async (cardId) => {
    const { data } = await supabase.from('crm_card_attachments').select('*').eq('card_id', cardId).order('created_at')
    setAttachments(data || [])
  }

  // Apply selected lead data to form
  const pickLead = (lead) => {
    setSelectedLead(lead)
    if (lead) {
      setForm(p => ({
        ...p,
        lead_id: lead.id,
        nome_empresa: lead.nome_empresa || p.nome_empresa,
        cidade_estado: lead.cidade ? [lead.cidade, lead.estado].filter(Boolean).join(' / ') : (lead.cidade_estado || p.cidade_estado),
        segmento: lead.segmento || p.segmento,
        origem_lead: lead.origem_lead || p.origem_lead,
      }))
    } else {
      setForm(p => ({ ...p, lead_id: null }))
    }
  }

  const loadLineItems = async (cardId) => {
    const { data } = await supabase
      .from('crm_card_products')
      .select('*, crm_products(*)')
      .eq('card_id', cardId)
      .order('created_at')
    if (data) {
      setLineItems(data.map(row => ({
        lineId: row.id,
        dbId: row.id,
        product_id: row.product_id,
        product: row.crm_products || null,
        nome_produto: row.nome_produto,
        valor_unitario: row.valor_unitario ?? '',
        quantidade: row.quantidade,
        desconto_percentual: row.desconto_percentual ?? '',
        valor_linha: row.valor_linha ?? '',
      })))
    }
  }

  const calcLinha = (vu, qty, disc) => {
    const base = parseFloat(vu) || 0
    if (!base) return ''
    return (base * (parseInt(qty) || 1) * (1 - (parseFloat(disc) || 0) / 100)).toFixed(2)
  }

  const addLineItem = (product) => {
    const vu = product?.valor ?? ''
    setLineItems(prev => [...prev, {
      lineId: crypto.randomUUID(),
      dbId: null,
      product_id: product?.id || null,
      product: product || null,
      nome_produto: product?.nome || '',
      valor_unitario: vu,
      quantidade: 1,
      desconto_percentual: '',
      valor_linha: vu !== '' ? parseFloat(vu).toFixed(2) : '',
    }])
  }

  const removeLineItem = (lineId) => setLineItems(prev => prev.filter(li => li.lineId !== lineId))

  const updateLineItem = (lineId, field, value) => {
    setLineItems(prev => prev.map(li => {
      if (li.lineId !== lineId) return li
      const updated = { ...li, [field]: value }
      updated.valor_linha = calcLinha(updated.valor_unitario, updated.quantidade, updated.desconto_percentual)
      return updated
    }))
  }

  const pickContact = (contact) => {
    setSelectedContact(contact)
    if (contact) {
      setForm(p => ({
        ...p,
        contact_id: contact.id,
        nome_contato: contact.nome || p.nome_contato,
        cargo_contato: contact.cargo || p.cargo_contato,
        email_contato: contact.email || p.email_contato,
        telefone_contato: contact.telefone || p.telefone_contato,
      }))
    } else {
      setForm(p => ({ ...p, contact_id: null }))
    }
  }

  // Inline create helpers
  const openCreate = (mode) => {
    setCreateForm(
      mode === 'lead' ? { nome_empresa: '', cidade: '', estado: '', segmento: '', origem_lead: '' } :
      mode === 'product' ? { nome: '', valor: '', unidade: '', descricao: '' } :
      { nome: '', cargo: '', email: '', telefone: '', lead_id: selectedLead?.id || '' }
    )
    setCreateMode(mode)
  }

  const handleInlineCreate = async () => {
    setCreateSaving(true)
    try {
      if (createMode === 'lead') {
        if (!createForm.nome_empresa?.trim()) { toast.error('Nome da empresa obrigatório'); return }
        const { data, error } = await supabase.from('crm_leads').insert([{
          ...createForm, company_id: companyId, created_by: user?.id
        }]).select().single()
        if (error) throw error
        const updated = [...leads, data]
        setLeads(updated)
        pickLead(data)
      } else if (createMode === 'product') {
        if (!createForm.nome?.trim()) { toast.error('Nome do produto obrigatório'); return }
        const { data, error } = await supabase.from('crm_products').insert([{
          ...createForm,
          valor: createForm.valor !== '' ? parseFloat(String(createForm.valor).replace(',', '.')) || null : null,
          company_id: companyId, created_by: user?.id
        }]).select().single()
        if (error) throw error
        const updated = [...products, data]
        setProducts(updated)
        addLineItem(data)
      } else if (createMode === 'contact') {
        if (!createForm.nome?.trim()) { toast.error('Nome do contato obrigatório'); return }
        const { data, error } = await supabase.from('crm_contacts').insert([{
          ...createForm, lead_id: createForm.lead_id || null,
          company_id: companyId, created_by: user?.id
        }]).select('*, crm_leads(nome_empresa)').single()
        if (error) throw error
        const updated = [...contacts, data]
        setContacts(updated)
        pickContact(data)
      }
      toast.success('Criado com sucesso!')
      setCreateMode(null)
    } catch (e) { toast.error('Erro: ' + e.message) }
    finally { setCreateSaving(false) }
  }

  const handleSave = async () => {
    if (!form.nome_empresa?.trim() && !form.nome_contato?.trim()) {
      toast.error('Informe ao menos o nome da empresa ou do contato')
      return
    }
    setLoading(true)
    try {
      const totalItems = lineItems.reduce((s, li) => s + (parseFloat(li.valor_linha) || 0), 0)
      const valorOp = lineItems.length > 0
        ? (totalItems || null)
        : (form.valor_oportunidade !== '' ? parseFloat(String(form.valor_oportunidade).replace(/[^\d.,]/g, '').replace(',', '.')) || null : null)

      const payload = {
        company_id: companyId,
        column_id: form.column_id || columnId,
        nome_empresa: form.nome_empresa?.trim() || null,
        nome_contato: form.nome_contato?.trim() || null,
        cargo_contato: form.cargo_contato?.trim() || null,
        email_contato: form.email_contato?.trim() || null,
        telefone_contato: form.telefone_contato?.trim() || null,
        origem_lead: form.origem_lead || null,
        cidade_estado: form.cidade_estado?.trim() || null,
        segmento: form.segmento?.trim() || null,
        observacoes: observations.length > 0 ? JSON.stringify(observations) : null,
        valor_oportunidade: valorOp,
        status: form.status || 'ativo',
        lead_id: form.lead_id || null,
        contact_id: form.contact_id || null,
        updated_at: new Date().toISOString(),
      }
      let saved
      if (isNew) {
        payload.created_by = user?.id
        payload.position = 9999
        const { data, error } = await supabase.from('crm_cards').insert([payload]).select().single()
        if (error) throw error
        saved = data
      } else {
        const { data, error } = await supabase.from('crm_cards').update(payload).eq('id', card.id).select().single()
        if (error) throw error
        saved = data
      }
      // Save line items
      const cardId = saved.id
      await supabase.from('crm_card_products').delete().eq('card_id', cardId)
      if (lineItems.length > 0) {
        const rows = lineItems.map(li => ({
          card_id: cardId,
          company_id: companyId,
          product_id: li.product_id || null,
          nome_produto: li.nome_produto || '',
          valor_unitario: li.valor_unitario !== '' ? parseFloat(li.valor_unitario) || null : null,
          quantidade: parseInt(li.quantidade) || 1,
          desconto_percentual: li.desconto_percentual !== '' && li.desconto_percentual != null ? parseFloat(li.desconto_percentual) || null : null,
          valor_linha: li.valor_linha !== '' ? parseFloat(li.valor_linha) || null : null,
        }))
        const { error: liErr } = await supabase.from('crm_card_products').insert(rows)
        if (liErr) throw liErr
      }
      toast.success(isNew ? 'Card criado!' : 'Card atualizado!')
      onSaved(saved, isNew)
    } catch (e) {
      toast.error('Erro ao salvar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await supabase.from('crm_cards').delete().eq('id', card.id)
      toast.success('Card excluído')
      onDeleted(card.id)
    } catch (e) {
      toast.error('Erro ao excluir')
    } finally {
      setDeleting(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Máximo 10MB'); return }
    if (!card?.id) { toast.error('Salve o card primeiro para adicionar anexos'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${companyId}/${card.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('crm-attachments').upload(path, file, { upsert: false })
      if (upErr) throw upErr
      const { data, error } = await supabase.from('crm_card_attachments').insert([{
        card_id: card.id, company_id: companyId,
        file_name: file.name, file_path: path,
        file_size: file.size, mime_type: file.type,
        uploaded_by: user?.id,
      }]).select().single()
      if (error) throw error
      setAttachments(p => [...p, data])
      toast.success('Anexo enviado!')
    } catch (e) {
      toast.error('Erro no upload: ' + e.message)
    } finally {
      setUploading(false)
      fileRef.current.value = ''
    }
  }

  const handleDeleteAttachment = async (att) => {
    await supabase.storage.from('crm-attachments').remove([att.file_path])
    await supabase.from('crm_card_attachments').delete().eq('id', att.id)
    setAttachments(p => p.filter(a => a.id !== att.id))
    toast.success('Anexo removido')
  }

  const handleDownload = async (att) => {
    const { data } = await supabase.storage.from('crm-attachments').createSignedUrl(att.file_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const statusInfo = STATUS_OPTIONS.find(s => s.value === form.status) || STATUS_OPTIONS[0]

  // ── Inline create sub-form ───────────────────────────────────────────────
  if (createMode) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setCreateMode(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center gap-2 mb-5">
            <button onClick={() => setCreateMode(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-4 w-4 text-gray-500" /></button>
            <h3 className="text-sm font-bold text-gray-800">
              {createMode === 'lead' ? 'Criar novo Lead' : createMode === 'product' ? 'Criar novo Produto' : 'Criar novo Contato'}
            </h3>
          </div>

          {createMode === 'lead' && (
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Nome da Empresa *</label><input className={INP} value={createForm.nome_empresa} onChange={e => setCreateForm(p=>({...p,nome_empresa:e.target.value}))} placeholder="Acme Corp" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label><input className={INP} value={createForm.cidade} onChange={e => setCreateForm(p=>({...p,cidade:e.target.value}))} placeholder="São Paulo" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Estado</label><select className={SEL} value={createForm.estado} onChange={e => setCreateForm(p=>({...p,estado:e.target.value}))}><option value="">Selecione...</option>{ESTADOS_BR.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Segmento</label><input className={INP} value={createForm.segmento} onChange={e => setCreateForm(p=>({...p,segmento:e.target.value}))} placeholder="Tecnologia" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Origem</label>
                <select className={SEL} value={createForm.origem_lead} onChange={e => setCreateForm(p=>({...p,origem_lead:e.target.value}))}>
                  <option value="">Selecione...</option>{ORIGENS.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          )}

          {createMode === 'product' && (
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label><input className={INP} value={createForm.nome} onChange={e => setCreateForm(p=>({...p,nome:e.target.value}))} placeholder="Ex: Consultoria" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label><textarea className={INP+' resize-none'} rows={2} value={createForm.descricao} onChange={e => setCreateForm(p=>({...p,descricao:e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label><input type="number" className={INP} value={createForm.valor} onChange={e => setCreateForm(p=>({...p,valor:e.target.value}))} placeholder="0,00" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label><input className={INP} value={createForm.unidade} onChange={e => setCreateForm(p=>({...p,unidade:e.target.value}))} placeholder="por mês" /></div>
              </div>
            </div>
          )}

          {createMode === 'contact' && (
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label><input className={INP} value={createForm.nome} onChange={e => setCreateForm(p=>({...p,nome:e.target.value}))} placeholder="João Silva" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label><input className={INP} value={createForm.cargo} onChange={e => setCreateForm(p=>({...p,cargo:e.target.value}))} placeholder="Diretor" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
                  <select className={SEL} value={createForm.lead_id} onChange={e => setCreateForm(p=>({...p,lead_id:e.target.value}))}>
                    <option value="">Sem vínculo</option>{leads.map(l=><option key={l.id} value={l.id}>{l.nome_empresa}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label><input type="email" className={INP} value={createForm.email} onChange={e => setCreateForm(p=>({...p,email:e.target.value}))} placeholder="joao@..." /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label><input type="tel" className={INP} value={createForm.telefone} onChange={e => setCreateForm(p=>({...p,telefone:e.target.value}))} placeholder="(11) 99..." /></div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setCreateMode(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
            <button onClick={handleInlineCreate} disabled={createSaving} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl disabled:opacity-60">
              {createSaving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save className="h-4 w-4" />} Criar e vincular
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Kanban className="h-4 w-4 text-[#EBA500]" />
            {isNew ? 'Novo Card' : 'Editar Card'}
          </h2>
          <div className="flex items-center gap-2">
            {!isNew && (
              <button onClick={() => setConfirmDelete(true)} disabled={deleting}
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Coluna (mover card) */}
          {!isNew && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Coluna</label>
              <select value={form.column_id} onChange={e => setForm(p => ({ ...p, column_id: e.target.value }))} className={SEL}>
                {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-16 shrink-0">Status</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(s => (
                <button key={s.value} onClick={() => setForm(p => ({ ...p, status: s.value }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-all ${form.status === s.value ? s.color + ' border-current' : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-200'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* LEAD */}
          <section>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Lead / Empresa
            </h4>
            <ImportOrCreatePicker
              title="Lead"
              Icon={Building2}
              colorClass="border-blue-200 text-blue-700"
              items={leads}
              selected={selectedLead}
              onSelect={pickLead}
              onCreateClick={() => openCreate('lead')}
              renderItem={l => l.nome_empresa + (l.segmento ? ` · ${l.segmento}` : '')}
              renderSelected={l => <><span className="font-semibold">{l.nome_empresa}</span>{l.segmento && <span className="text-xs text-gray-400 ml-1">· {l.segmento}</span>}</>}
              placeholder="Importar lead existente..."
            />
            {/* Editable fields — prefilled from lead but editable */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome da Empresa</label>
                <input className={INP} value={form.nome_empresa} onChange={e => setForm(p => ({...p, nome_empresa: e.target.value}))} placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cidade / Estado</label>
                <input className={INP} value={form.cidade_estado} onChange={e => setForm(p => ({...p, cidade_estado: e.target.value}))} placeholder="São Paulo / SP" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Segmento</label>
                <input className={INP} value={form.segmento} onChange={e => setForm(p => ({...p, segmento: e.target.value}))} placeholder="Tecnologia, Saúde..." />
              </div>
            </div>
          </section>

          {/* CONTATO */}
          <section>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Contato
            </h4>
            <ImportOrCreatePicker
              title="Contato"
              Icon={User}
              colorClass="border-purple-200 text-purple-700"
              items={selectedLead ? contacts.filter(c => c.lead_id === selectedLead.id) : contacts}
              selected={selectedContact}
              onSelect={pickContact}
              onCreateClick={() => openCreate('contact')}
              renderItem={c => c.nome + (c.cargo ? ` · ${c.cargo}` : '') + (c.crm_leads?.nome_empresa ? ` (${c.crm_leads.nome_empresa})` : '')}
              renderSelected={c => <><span className="font-semibold">{c.nome}</span>{c.cargo && <span className="text-xs text-gray-400 ml-1">· {c.cargo}</span>}</>}
              placeholder={selectedLead ? `Contatos de ${selectedLead.nome_empresa}...` : 'Importar contato existente...'}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Contato</label>
                <input className={INP} value={form.nome_contato} onChange={e => setForm(p => ({...p, nome_contato: e.target.value}))} placeholder="João Silva" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                <input className={INP} value={form.cargo_contato} onChange={e => setForm(p => ({...p, cargo_contato: e.target.value}))} placeholder="Diretor Comercial" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                <input type="email" className={INP} value={form.email_contato} onChange={e => setForm(p => ({...p, email_contato: e.target.value}))} placeholder="joao@empresa.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                <input type="tel" className={INP} value={form.telefone_contato} onChange={e => setForm(p => ({...p, telefone_contato: e.target.value}))} placeholder="(11) 99999-9999" />
              </div>
            </div>
          </section>

          {/* PRODUTO / OPORTUNIDADE */}
          <section>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Oportunidade / Produtos
            </h4>

            {/* Line items */}
            {lineItems.length > 0 && (
              <div className="space-y-2 mb-3">
                {lineItems.map(li => (
                  <div key={li.lineId} className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Package className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-semibold text-gray-800 truncate">{li.nome_produto || '—'}</span>
                        {li.valor_unitario !== '' && li.valor_unitario !== null && (
                          <span className="text-[10px] text-gray-400 shrink-0"> · {fmtMoney(li.valor_unitario)}/un.</span>
                        )}
                      </div>
                      <button type="button" onClick={() => removeLineItem(li.lineId)}
                        className="shrink-0 p-1 hover:bg-red-100 rounded-lg transition-colors">
                        <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                    {/* Fields */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1">Qtd.</label>
                        <input type="number" min="1" step="1"
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:border-emerald-400 focus:outline-none bg-white"
                          value={li.quantidade}
                          onChange={e => updateLineItem(li.lineId, 'quantidade', Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1">Desconto %</label>
                        <input type="number" min="0" max="100" step="0.01" placeholder="0"
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:border-emerald-400 focus:outline-none bg-white"
                          value={li.desconto_percentual}
                          onChange={e => updateLineItem(li.lineId, 'desconto_percentual', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1">Valor (R$)</label>
                        <input type="number" min="0" step="0.01" placeholder="0,00"
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-emerald-200 focus:border-emerald-400 focus:outline-none bg-white font-semibold text-emerald-700"
                          value={li.valor_linha}
                          onChange={e => setLineItems(prev => prev.map(x => x.lineId === li.lineId ? { ...x, valor_linha: e.target.value } : x))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Picker — sempre visível para adicionar mais */}
            <ImportOrCreatePicker
              title="Produto"
              Icon={Package}
              colorClass="border-emerald-200 text-emerald-700"
              items={products}
              selected={null}
              onSelect={p => { if (p) addLineItem(p) }}
              onCreateClick={() => openCreate('product')}
              renderItem={p => p.nome + (p.valor ? ` · ${fmtMoney(p.valor)}` : '')}
              renderSelected={() => null}
              placeholder="Adicionar produto..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Origem do Lead</label>
                <select className={SEL} value={form.origem_lead} onChange={e => setForm(p => ({...p, origem_lead: e.target.value}))}>
                  <option value="">Selecione...</option>
                  {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {lineItems.length > 0 ? 'Total dos Produtos' : 'Valor da Oportunidade (R$)'}
                </label>
                {lineItems.length > 0 ? (
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700">
                    {fmtMoney(lineItems.reduce((s, li) => s + (parseFloat(li.valor_linha) || 0), 0))}
                  </div>
                ) : (
                  <input type="number" min="0" step="0.01" className={INP} value={form.valor_oportunidade}
                    onChange={e => setForm(p => ({...p, valor_oportunidade: e.target.value}))} placeholder="0,00" />
                )}
              </div>
            </div>
          </section>

          {/* Observações */}
          <section>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Histórico / Observações
            </h4>
            {observations.length > 0 && (
              <div className="space-y-2 mb-3">
                {observations.map(obs => (
                  <div key={obs.id} className="flex gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">{obs.text}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(obs.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeObservation(obs.id)} className="shrink-0 p-1 hover:bg-red-50 rounded-lg transition-colors self-start">
                      <X className="h-3.5 w-3.5 text-gray-300 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                className={INP + ' resize-none flex-1'}
                rows={2}
                value={newObsText}
                onChange={e => setNewObsText(e.target.value)}
                placeholder="Adicionar observação..."
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addObservation() }}
              />
              <button
                type="button"
                onClick={addObservation}
                disabled={!newObsText.trim()}
                className="shrink-0 self-end px-3 py-2 bg-[#EBA500] hover:bg-[#d99500] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors"
                title="Adicionar (Ctrl+Enter)"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Ctrl+Enter para adicionar rapidamente</p>
          </section>

          {/* Anexos */}
          <section>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5" /> Anexos
            </h4>
            {isNew && <p className="text-xs text-gray-400 mb-2">Salve o card primeiro para adicionar anexos.</p>}
            <div className="space-y-2">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
                  <Paperclip className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-700 flex-1 truncate">{att.file_name}</span>
                  <span className="text-xs text-gray-400">{att.file_size ? (att.file_size / 1024).toFixed(0) + ' KB' : ''}</span>
                  <button onClick={() => handleDownload(att)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                    <Download className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                  <button onClick={() => handleDeleteAttachment(att)} className="p-1 hover:bg-red-50 rounded-lg transition-colors">
                    <X className="h-3.5 w-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
            {!isNew && (
              <label className={`mt-2 flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#EBA500]/50 hover:bg-amber-50/30 transition-all text-xs text-gray-400 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="h-3.5 w-3.5" />
                {uploading ? 'Enviando...' : 'Clique para anexar arquivo (máx. 10MB)'}
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors disabled:opacity-60">
            {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Salvando...</> : <><Save className="h-4 w-4" />Salvar</>}
          </button>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmModal
          title={`Excluir card${card?.nome_empresa ? ` "${card.nome_empresa}"` : ''}`}
          message="Esta ação não pode ser desfeita. O card e todos os seus anexos serão removidos permanentemente."
          onConfirm={() => { setConfirmDelete(false); handleDelete() }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}

// ─── KanbanCard (draggable) ───────────────────────────────────────────────
function KanbanCard({ card, onEdit, isDragOverlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id, data: { type: 'card', card } })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }
  const statusInfo = STATUS_OPTIONS.find(s => s.value === card.status) || STATUS_OPTIONS[0]

  if (isDragOverlay) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-2xl p-3 rotate-1 scale-105 cursor-grabbing">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            {card.nome_empresa && <p className="text-xs font-bold text-gray-800 truncate">{card.nome_empresa}</p>}
            {card.nome_contato && <p className="text-xs text-gray-500 truncate">{card.nome_contato}{card.cargo_contato ? ` · ${card.cargo_contato}` : ''}</p>}
          </div>
          <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>
        {card.valor_oportunidade && <p className="text-xs font-semibold text-emerald-600">{fmtMoney(card.valor_oportunidade)}</p>}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(card)}
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-[#EBA500]/30 transition-all select-none ${isDragging ? 'opacity-30' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          {card.nome_empresa && <p className="text-xs font-bold text-gray-800 truncate">{card.nome_empresa}</p>}
          {card.nome_contato && <p className="text-xs text-gray-500 truncate">{card.nome_contato}{card.cargo_contato ? ` · ${card.cargo_contato}` : ''}</p>}
        </div>
        <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
      </div>
      {(card.segmento || card.cidade_estado) && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {card.segmento && <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">{card.segmento}</span>}
          {card.cidade_estado && <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{card.cidade_estado}</span>}
        </div>
      )}
      {card.valor_oportunidade && (
        <p className="text-xs font-semibold text-emerald-600">{fmtMoney(card.valor_oportunidade)}</p>
      )}
      {card.origem_lead && (
        <p className="text-[10px] text-gray-400 mt-1">Origem: {card.origem_lead}</p>
      )}
    </div>
  )
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────
function KanbanColumn({ column, cards, onAddCard, onEditCard, onEditColumn, onDeleteColumn, activeCardId }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column', columnId: column.id } })
  const { attributes, listeners, setNodeRef: setColRef, transform, transition, isDragging } = useSortable({
    id: `col-${column.id}`, data: { type: 'column', column },
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  const cardIds = cards.map(c => c.id)
  const totalValue = cards.reduce((s, c) => s + (parseFloat(c.valor_oportunidade) || 0), 0)

  return (
    <div ref={setColRef} style={style} className="flex flex-col w-72 shrink-0 group/col h-full">
      {/* Column card wrapper */}
      <div className={`flex flex-col min-h-0 h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-shadow ${isDragging ? 'shadow-xl' : 'hover:shadow-md'}`}>

        {/* Colored top stripe */}
        <div className="h-1 w-full shrink-0" style={{ background: column.color }} />

        {/* Column header */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <div {...listeners} {...attributes} className="cursor-grab p-1 -ml-1 opacity-0 group-hover/col:opacity-40 transition-all">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: column.color }} />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-gray-700 break-words block">{column.name}</span>
            {totalValue > 0 && <span className="text-[10px] text-emerald-600 font-medium">{fmtMoney(totalValue)}</span>}
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: column.color + '20', color: column.color }}>{cards.length}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover/col:opacity-100 transition-all">
            <button onClick={() => onEditColumn(column)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <Edit2 className="h-3.5 w-3.5 text-gray-400" />
            </button>
            <button onClick={() => onDeleteColumn(column.id)} className="p-1 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-gray-100" />

        {/* Cards drop area */}
        <div ref={setNodeRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className={`flex-1 min-h-0 overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden transition-colors ${isOver ? 'bg-[#EBA500]/5' : 'bg-transparent'}`}
        >
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {cards.map(card => (
                <KanbanCard key={card.id} card={card} onEdit={onEditCard} />
              ))}
            </div>
          </SortableContext>
          <button
            onClick={() => onAddCard(column.id)}
            className="mt-2 w-full flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-[#EBA500] hover:bg-[#EBA500]/5 rounded-xl transition-colors border-2 border-dashed border-transparent hover:border-[#EBA500]/20"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar card
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── ColumnModal ──────────────────────────────────────────────────────────────
function ColumnModal({ column, onClose, onSaved }) {
  const [name, setName] = useState(column?.name || '')
  const [color, setColor] = useState(column?.color || '#3b82f6')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    try {
      onSaved({ ...column, name: name.trim(), color })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">{column?.id ? 'Editar Coluna' : 'Nova Coluna'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
            <input autoFocus className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500]"
              value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Prospecção, Proposta..." onKeyDown={e => e.key === 'Enter' && handleSave()} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Cor</label>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-gray-200 cursor-pointer p-1"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors disabled:opacity-60">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ConfirmModal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel = 'Excluir', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 shrink-0">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── helpers ────────────────────────────────────────────────────────────────
const INP = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all'
const SEL = INP + ' bg-white'

// ─── LeadsModal ───────────────────────────────────────────────────────────────
function LeadsModal({ companyId, onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  // leads
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const EMPTY = { nome_empresa: '', cidade: '', estado: '', segmento: '', origem_lead: '', website: '', observacoes: '' }
  const [form, setForm] = useState(EMPTY)

  // contacts (expandable panel)
  const [contactsOpen, setContactsOpen] = useState(false)
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [savingContact, setSavingContact] = useState(false)
  const EMPTY_C = { nome: '', cargo: '', email: '', telefone: '', lead_id: '', observacoes: '' }
  const [contactForm, setContactForm] = useState(EMPTY_C)
  const [newContacts, setNewContacts] = useState([{ _key: 1, nome: '', cargo: '', telefone: '', email: '' }])
  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState(null) // { type: 'leads'|'contacts', rows: [] }
  const importLeadsCsvRef = useRef(null)
  const importContactsCsvRef = useRef(null)

  useEffect(() => { loadLeads() }, [])

  const loadLeads = async () => {
    setLoading(true)
    const { data } = await supabase.from('crm_leads').select('*').eq('company_id', companyId).order('nome_empresa')
    setLeads(data || [])
    setLoading(false)
  }

  const toggleContacts = async () => {
    if (!contactsOpen) {
      setContactsLoading(true)
      const { data } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('company_id', companyId)
        .order('nome')
      setContacts((data || []).map(c => ({
        ...c,
        crm_leads: leads.find(l => l.id === c.lead_id) ? { nome_empresa: leads.find(l => l.id === c.lead_id).nome_empresa } : null
      })))
      setContactsLoading(false)
    }
    setContactsOpen(o => !o)
    setShowContactForm(false)
  }

  const openNew = () => { setForm(EMPTY); setEditing(null); setNewContacts([{ _key: Date.now(), nome: '', cargo: '', telefone: '', email: '' }]); setShowForm(true) }
  const openEdit = (l) => { setForm({ ...l }); setEditing(l); setNewContacts([]); setShowForm(true) }

  const addNewContact = () => setNewContacts(p => [...p, { _key: Date.now(), nome: '', cargo: '', telefone: '', email: '' }])
  const removeNewContact = (key) => setNewContacts(p => p.filter(c => c._key !== key))
  const updateNewContact = (key, field, value) => setNewContacts(p => p.map(c => c._key === key ? { ...c, [field]: value } : c))

  const handleSave = async () => {
    if (!form.nome_empresa?.trim()) { toast.error('Nome da empresa obrigatório'); return }
    setSaving(true)
    try {
      const payload = { ...form, company_id: companyId, updated_at: new Date().toISOString() }
      let leadId = editing?.id
      if (editing) {
        const { error } = await supabase.from('crm_leads').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        payload.created_by = user?.id
        const { data: inserted, error } = await supabase.from('crm_leads').insert([payload]).select('id').single()
        if (error) throw error
        leadId = inserted.id
      }
      // insert inline new contacts
      const toInsert = newContacts.filter(c => c.nome.trim())
      if (toInsert.length > 0) {
        await supabase.from('crm_contacts').insert(
          toInsert.map(c => ({
            nome: c.nome.trim(),
            cargo: c.cargo.trim() || null,
            telefone: c.telefone.trim() || null,
            email: c.email.trim() || null,
            lead_id: leadId,
            company_id: companyId,
            created_by: user?.id,
          }))
        )
      }
      toast.success(editing ? 'Lead atualizado!' : 'Lead cadastrado!')
      setShowForm(false)
      loadLeads()
    } catch (e) { toast.error('Erro: ' + e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    await supabase.from('crm_leads').delete().eq('id', id)
    setLeads(p => p.filter(l => l.id !== id))
    toast.success('Lead removido')
  }

  const openNewContact = () => { setContactForm(EMPTY_C); setEditingContact(null); setShowContactForm(true) }
  const openEditContact = (c) => { 
    const { crm_leads, ...rest } = c
    setContactForm({ ...rest, lead_id: rest.lead_id || '' })
    setEditingContact(c)
    setShowContactForm(true)
  }

  const saveContact = async () => {
    if (!contactForm.nome?.trim()) { toast.error('Nome obrigatório'); return }
    setSavingContact(true)
    try {
      const { crm_leads: _ignored, _key, ...cleanForm } = contactForm
      const payload = { ...cleanForm, lead_id: cleanForm.lead_id || null, company_id: companyId, updated_at: new Date().toISOString() }
      console.log('[saveContact] payload enviado:', payload)
      if (editingContact) {
        const { error } = await supabase.from('crm_contacts').update(payload).eq('id', editingContact.id)
        if (error) { console.error('[saveContact] update error:', error); throw error }
        setContacts(p => p.map(c => c.id === editingContact.id ? { ...c, ...payload, crm_leads: leads.find(l => l.id === payload.lead_id) ? { nome_empresa: leads.find(l => l.id === payload.lead_id).nome_empresa } : null } : c))
      } else {
        const { data, error } = await supabase.from('crm_contacts').insert([{ ...payload, created_by: user?.id }]).select('*').single()
        if (error) { console.error('[saveContact] insert error:', error); throw error }
        const lead = leads.find(l => l.id === data.lead_id)
        setContacts(p => [...p, { ...data, crm_leads: lead ? { nome_empresa: lead.nome_empresa } : null }])
      }
      toast.success(editingContact ? 'Contato atualizado!' : 'Contato cadastrado!')
      setShowContactForm(false)
    } catch (e) { toast.error('Erro: ' + e.message) }
    finally { setSavingContact(false) }
  }

  const deleteContact = async (id) => {
    await supabase.from('crm_contacts').delete().eq('id', id)
    setContacts(p => p.filter(c => c.id !== id))
    toast.success('Contato removido')
  }

  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) return []
    const header = lines[0]
    const delim = header.includes(';') ? ';' : ','
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const cols = []
      let cur = '', inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') { inQuotes = !inQuotes }
        else if (ch === delim && !inQuotes) { cols.push(cur.trim()); cur = '' }
        else { cur += ch }
      }
      cols.push(cur.trim())
      return cols
    })
  }

  // Unifica leitura de CSV e XLSX — retorna array de arrays (sem header)
  const parseSpreadsheetFile = async (file) => {
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
    if (isXlsx) {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      // Remove header row (first row) and return rest as string arrays
      return data.slice(1).filter(row => row.some(cell => String(cell).trim())).map(row =>
        row.map(cell => String(cell ?? '').trim())
      )
    } else {
      const text = await file.text()
      return parseCSV(text)
    }
  }

  const handleImportLeadsCSV = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImporting(true)
    try {
      const rows = await parseSpreadsheetFile(file)
      if (rows.length === 0) { toast.error('Nenhuma linha encontrada no arquivo'); return }
      const preview = rows
        .filter(row => row[0]?.trim())
        .map(([nomeEmpresa = '', cidade = '', estado = '', nomeContato = '', cargo = '', telefone = '', email = '']) => ({
          nomeEmpresa: nomeEmpresa.trim(), cidade: cidade.trim(), estado: estado.trim(),
          nomeContato: nomeContato.trim(), cargo: cargo.trim(), telefone: telefone.trim(), email: email.trim()
        }))
      if (preview.length === 0) { toast.error('Nenhum lead válido encontrado'); return }
      setImportPreview({ type: 'leads', rows: preview })
    } catch (err) { toast.error('Erro ao processar arquivo: ' + err.message) }
    finally { setImporting(false) }
  }

  const downloadLeadsTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['nome_empresa', 'cidade', 'estado', 'nome_contato', 'cargo', 'telefone', 'email'],
      ['Acme Ltda', 'São Paulo', 'SP', 'João Silva', 'Diretor', '(11) 9 9999-8888', 'joao@acme.com'],
    ])
    ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 25 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')
    XLSX.writeFile(wb, 'modelo_importacao_leads.xlsx')
  }

  const downloadLeadsTemplateCsv = () => {
    const csv = 'nome_empresa,cidade,estado,nome_contato,cargo,telefone,email\nAcme Ltda,São Paulo,SP,João Silva,Diretor,(11) 9 9999-8888,joao@acme.com'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'modelo_importacao_leads.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const downloadContactsTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['nome_empresa', '', '', 'nome_contato', 'cargo', 'telefone', 'email'],
      ['Acme Ltda', '', '', 'João Silva', 'Diretor', '(11) 9 9999-8888', 'joao@acme.com'],
    ])
    ws['!cols'] = [{ wch: 25 }, { wch: 5 }, { wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 25 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contatos')
    XLSX.writeFile(wb, 'modelo_importacao_contatos.xlsx')
  }

  const downloadContactsTemplateCsv = () => {
    const csv = 'nome_empresa,col2,col3,nome_contato,cargo,telefone,email\nAcme Ltda,,,João Silva,Diretor,(11) 9 9999-8888,joao@acme.com'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'modelo_importacao_contatos.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportContactsCSV = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImporting(true)
    try {
      const rows = await parseSpreadsheetFile(file)
      if (rows.length === 0) { toast.error('Nenhuma linha encontrada no arquivo'); return }
      const preview = rows
        .filter(row => row[3]?.trim())
        .map(([nomeEmpresa = '', , , nomeContato = '', cargo = '', telefone = '', email = '']) => ({
          nomeEmpresa: nomeEmpresa.trim(), nomeContato: nomeContato.trim(),
          cargo: cargo.trim(), telefone: telefone.trim(), email: email.trim()
        }))
      if (preview.length === 0) { toast.error('Nenhum contato válido encontrado'); return }
      setImportPreview({ type: 'contacts', rows: preview })
    } catch (err) { toast.error('Erro ao processar arquivo: ' + err.message) }
    finally { setImporting(false) }
  }

  const confirmImport = async () => {
    if (!importPreview) return
    setImporting(true)
    try {
      if (importPreview.type === 'leads') {
        let leadsInserted = 0, contactsInserted = 0, errors = 0
        for (const r of importPreview.rows) {
          const { data: leadData, error: leadError } = await supabase
            .from('crm_leads')
            .insert([{ nome_empresa: r.nomeEmpresa, cidade: r.cidade || null, estado: r.estado || null, company_id: companyId, created_by: user?.id }])
            .select('id').single()
          if (leadError) { errors++; continue }
          leadsInserted++
          if (r.nomeContato) {
            const { error: ce } = await supabase.from('crm_contacts').insert([{
              nome: r.nomeContato, cargo: r.cargo || null,
              telefone: r.telefone || null, email: r.email || null,
              lead_id: leadData.id, company_id: companyId, created_by: user?.id
            }])
            if (!ce) contactsInserted++
          }
        }
        const msg = `${leadsInserted} lead${leadsInserted !== 1 ? 's' : ''} importado${leadsInserted !== 1 ? 's' : ''}` +
          (contactsInserted ? `, ${contactsInserted} contato${contactsInserted !== 1 ? 's' : ''}` : '') +
          (errors ? ` (${errors} erro${errors !== 1 ? 's' : ''})` : '')
        toast.success(msg)
        loadLeads()
      } else {
        const { data: allLeads } = await supabase.from('crm_leads').select('id, nome_empresa').eq('company_id', companyId)
        const leadsMap = {}
        ;(allLeads || []).forEach(l => { leadsMap[l.nome_empresa.toLowerCase().trim()] = l.id })
        let inserted = 0, errors = 0
        for (const r of importPreview.rows) {
          const leadId = r.nomeEmpresa ? (leadsMap[r.nomeEmpresa.toLowerCase()] || null) : null
          const { error } = await supabase.from('crm_contacts').insert([{
            nome: r.nomeContato, cargo: r.cargo || null,
            telefone: r.telefone || null, email: r.email || null,
            lead_id: leadId, company_id: companyId, created_by: user?.id
          }])
          if (error) errors++; else inserted++
        }
        const msg = `${inserted} contato${inserted !== 1 ? 's' : ''} importado${inserted !== 1 ? 's' : ''}` +
          (errors ? ` (${errors} erro${errors !== 1 ? 's' : ''})` : '')
        toast.success(msg)
        if (contactsOpen) {
          const { data } = await supabase.from('crm_contacts').select('*').eq('company_id', companyId).order('nome')
          setContacts((data || []).map(c => ({
            ...c,
            crm_leads: leads.find(l => l.id === c.lead_id) ? { nome_empresa: leads.find(l => l.id === c.lead_id).nome_empresa } : null
          })))
        }
      }
      setImportPreview(null)
    } catch (err) { toast.error('Erro ao importar: ' + err.message) }
    finally { setImporting(false) }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#EBA500]" /> Leads / Empresas
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="h-5 w-5 text-gray-500" /></button>
          </div>
          {/* hidden file inputs */}
          <input ref={importLeadsCsvRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportLeadsCSV} />
          <input ref={importContactsCsvRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportContactsCSV} />
          <div className="flex flex-wrap items-center gap-2">
            {contactsOpen ? (
              <>
                <button onClick={() => importContactsCsvRef.current?.click()} disabled={importing} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors disabled:opacity-60" title="Importar contatos de planilha CSV ou Excel">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Importar planilha
                </button>
                <button onClick={downloadContactsTemplate} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors" title="Baixar modelo Excel de contatos">
                  <Download className="h-3.5 w-3.5" /> Modelo .xlsx
                </button>
                <button onClick={downloadContactsTemplateCsv} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors" title="Baixar modelo CSV de contatos">
                  <Download className="h-3.5 w-3.5" /> Modelo .csv
                </button>
                <button onClick={openNewContact} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Novo Contato
                </button>
                <button onClick={toggleContacts} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  <ChevronDown className="h-3.5 w-3.5" /> Ocultar Contatos
                </button>
              </>
            ) : (
              <>
                <button onClick={() => importLeadsCsvRef.current?.click()} disabled={importing} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors disabled:opacity-60" title="Importar leads de planilha CSV ou Excel">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Importar planilha
                </button>
                <button onClick={downloadLeadsTemplate} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors" title="Baixar modelo Excel de leads">
                  <Download className="h-3.5 w-3.5" /> Modelo .xlsx
                </button>
                <button onClick={downloadLeadsTemplateCsv} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors" title="Baixar modelo CSV de leads">
                  <Download className="h-3.5 w-3.5" /> Modelo .csv
                </button>
                <button onClick={toggleContacts} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors">
                  <Users className="h-3.5 w-3.5" /> Ver Contatos
                </button>
                <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Novo Lead
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* ── Leads section ── */}
          {!contactsOpen && (
            loading ? (
              <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EBA500]" /></div>
            ) : showForm ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-4 w-4 text-gray-500" /></button>
                  <h3 className="text-sm font-bold text-gray-700">{editing ? 'Editar Lead' : 'Novo Lead'}</h3>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome da Empresa *</label>
                  <input className={INP} value={form.nome_empresa} onChange={e => setForm(p => ({...p, nome_empresa: e.target.value}))} placeholder="Acme Corp" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                    <input className={INP} value={form.cidade || ''} onChange={e => setForm(p => ({...p, cidade: e.target.value}))} placeholder="São Paulo" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                    <select className={SEL} value={form.estado || ''} onChange={e => setForm(p => ({...p, estado: e.target.value}))}>
                      <option value="">Selecione...</option>
                      {ESTADOS_BR.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Segmento</label>
                    <input className={INP} value={form.segmento} onChange={e => setForm(p => ({...p, segmento: e.target.value}))} placeholder="Tecnologia, Saúde..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Origem</label>
                    <select className={SEL} value={form.origem_lead} onChange={e => setForm(p => ({...p, origem_lead: e.target.value}))}>
                      <option value="">Selecione...</option>
                      {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                    <input className={INP} value={form.website} onChange={e => setForm(p => ({...p, website: e.target.value}))} placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                  <textarea className={INP + ' resize-none'} rows={3} value={form.observacoes} onChange={e => setForm(p => ({...p, observacoes: e.target.value}))} placeholder="Notas sobre este lead..." />
                </div>

                {/* ── Inline contacts ── */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-purple-400" /> Contatos</p>
                    <button type="button" onClick={addNewContact} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold">
                      <Plus className="h-3.5 w-3.5" /> Adicionar contato
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newContacts.map((c, idx) => (
                      <div key={c._key} className="relative p-3 bg-purple-50 border border-purple-100 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-purple-600">Contato {idx + 1}</span>
                          {newContacts.length > 1 && (
                            <button type="button" onClick={() => removeNewContact(c._key)} className="p-0.5 hover:bg-purple-100 rounded text-purple-300 hover:text-red-400">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <input className={INP} value={c.nome} onChange={e => updateNewContact(c._key, 'nome', e.target.value)} placeholder="Nome *" />
                          </div>
                          <input className={INP} value={c.cargo} onChange={e => updateNewContact(c._key, 'cargo', e.target.value)} placeholder="Cargo" />
                          <input type="tel" className={INP} value={c.telefone} onChange={e => updateNewContact(c._key, 'telefone', e.target.value)} placeholder="Telefone" />
                          <input type="email" className={INP + ' col-span-2'} value={c.email} onChange={e => updateNewContact(c._key, 'email', e.target.value)} placeholder="E-mail" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl disabled:opacity-60">
                    {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save className="h-4 w-4" />} Salvar
                  </button>
                </div>
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Building2 className="h-10 w-10 text-gray-200" />
                <p className="text-sm text-gray-500">Nenhum lead cadastrado ainda.</p>
                <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl"><Plus className="h-4 w-4" /> Adicionar lead</button>
              </div>
            ) : (
              <div className="space-y-2">
                {leads.map(l => (
                  <div key={l.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 group cursor-pointer" onClick={() => { onClose(); navigate(`/crm/lead/${l.id}`) }}>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{l.nome_empresa}</p>
                      <p className="text-xs text-gray-400 truncate">{[l.segmento, l.cidade, l.estado].filter(Boolean).join(' · ') || 'Sem detalhes'}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(l) }} className="p-1.5 hover:bg-gray-200 rounded-lg"><Edit2 className="h-3.5 w-3.5 text-gray-500" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(l.id) }} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Contacts expanded section ── */}
          {contactsOpen && (
            <div className="space-y-3">
              {/* New contact form */}
              {showContactForm && (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">{editingContact ? 'Editar contato' : 'Novo contato'}</p>
                    <button onClick={() => setShowContactForm(false)}><X className="h-4 w-4 text-gray-400 hover:text-gray-600" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                      <input className={INP} value={contactForm.nome} onChange={e => setContactForm(p => ({...p, nome: e.target.value}))} placeholder="João Silva" autoFocus />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                      <input className={INP} value={contactForm.cargo} onChange={e => setContactForm(p => ({...p, cargo: e.target.value}))} placeholder="Diretor Comercial" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Empresa (Lead)</label>
                      <select className={SEL} value={contactForm.lead_id} onChange={e => setContactForm(p => ({...p, lead_id: e.target.value}))}>
                        <option value="">Sem vínculo</option>
                        {leads.map(l => <option key={l.id} value={l.id}>{l.nome_empresa}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                      <input type="email" className={INP} value={contactForm.email} onChange={e => setContactForm(p => ({...p, email: e.target.value}))} placeholder="joao@empresa.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                      <input type="tel" className={INP} value={contactForm.telefone} onChange={e => setContactForm(p => ({...p, telefone: e.target.value}))} placeholder="(11) 99999-9999" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                      <textarea className={INP + ' resize-none'} rows={2} value={contactForm.observacoes} onChange={e => setContactForm(p => ({...p, observacoes: e.target.value}))} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowContactForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                    <button onClick={saveContact} disabled={savingContact} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-60">
                      {savingContact ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" /> : <Save className="h-3.5 w-3.5" />} Salvar
                    </button>
                  </div>
                </div>
              )}

              {/* Contacts list */}
              {contactsLoading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" /></div>
              ) : contacts.length === 0 && !showContactForm ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Users className="h-10 w-10 text-gray-200" />
                  <p className="text-sm text-gray-500">Nenhum contato cadastrado ainda.</p>
                  <button onClick={openNewContact} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl"><Plus className="h-4 w-4" /> Adicionar contato</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 group">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 text-sm font-bold text-purple-600">
                        {c.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{c.nome}{c.cargo ? <span className="font-normal text-gray-500"> · {c.cargo}</span> : ''}</p>
                        <p className="text-xs text-gray-400 truncate">{c.crm_leads?.nome_empresa || 'Sem empresa'}{c.email ? ' · ' + c.email : ''}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditContact(c)} className="p-1.5 hover:bg-gray-200 rounded-lg"><Edit2 className="h-3.5 w-3.5 text-gray-500" /></button>
                        <button onClick={() => deleteContact(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ── Import Preview Modal ── */}
    {importPreview && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Confirmar importação de {importPreview.type === 'leads' ? 'leads' : 'contatos'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {importPreview.rows.length} {importPreview.type === 'leads'
                  ? `lead${importPreview.rows.length !== 1 ? 's' : ''}`
                  : `contato${importPreview.rows.length !== 1 ? 's' : ''}`
                } encontrado{importPreview.rows.length !== 1 ? 's' : ''}. Revise antes de confirmar.
              </p>
            </div>
            <button onClick={() => setImportPreview(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-auto px-6 py-4">
            {importPreview.type === 'leads' ? (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Empresa</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Cidade</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">UF</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Contato</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Cargo</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Telefone</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">E-mail</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.rows.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-3 py-2 border border-gray-100 font-medium text-gray-800">{r.nomeEmpresa}</td>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.cidade || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.estado || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.nomeContato || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.cargo || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.telefone || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Empresa (lead)</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Contato</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Cargo</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Telefone</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">E-mail</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.rows.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.nomeEmpresa || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 font-medium text-gray-800">{r.nomeContato}</td>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.cargo || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.telefone || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button onClick={() => setImportPreview(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Cancelar
            </button>
            <button onClick={confirmImport} disabled={importing} className="px-5 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2">
              {importing
                ? <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                : <Upload className="h-3.5 w-3.5" />
              }
              Confirmar importação
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

// ─── ProductsModal ────────────────────────────────────────────────────────────
function ProductsModal({ companyId, onClose }) {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const EMPTY = { nome: '', descricao: '', valor: '', unidade: '' }
  const [form, setForm] = useState(EMPTY)

  useEffect(() => { loadProducts() }, [])

  const loadProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('crm_products').select('*').eq('company_id', companyId).order('nome')
    setProducts(data || [])
    setLoading(false)
  }

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true) }
  const openEdit = (p) => { setForm({ ...p, valor: p.valor ?? '' }); setEditing(p); setShowForm(true) }

  const handleSave = async () => {
    if (!form.nome?.trim()) { toast.error('Nome do produto obrigatório'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        valor: form.valor !== '' ? parseFloat(String(form.valor).replace(',', '.')) || null : null,
        company_id: companyId,
        updated_at: new Date().toISOString()
      }
      if (editing) {
        const { error } = await supabase.from('crm_products').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        payload.created_by = user?.id
        const { error } = await supabase.from('crm_products').insert([payload])
        if (error) throw error
      }
      toast.success(editing ? 'Produto atualizado!' : 'Produto cadastrado!')
      setShowForm(false)
      loadProducts()
    } catch (e) { toast.error('Erro: ' + e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    await supabase.from('crm_products').delete().eq('id', id)
    setProducts(p => p.filter(x => x.id !== id))
    toast.success('Produto removido')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Package className="h-4 w-4 text-[#EBA500]" /> Produtos / Serviços
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors">
              <Plus className="h-3.5 w-3.5" /> Novo Produto
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="h-5 w-5 text-gray-500" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EBA500]" /></div>
          ) : showForm ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-4 w-4 text-gray-500" /></button>
                <h3 className="text-sm font-bold text-gray-700">{editing ? 'Editar Produto' : 'Novo Produto'}</h3>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                <input className={INP} value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))} placeholder="Ex: Consultoria Mensal" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                <textarea className={INP + ' resize-none'} rows={2} value={form.descricao} onChange={e => setForm(p => ({...p, descricao: e.target.value}))} placeholder="Detalhes do produto ou serviço..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
                  <input type="number" min="0" step="0.01" className={INP} value={form.valor} onChange={e => setForm(p => ({...p, valor: e.target.value}))} placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label>
                  <input className={INP} value={form.unidade} onChange={e => setForm(p => ({...p, unidade: e.target.value}))} placeholder="por mês, por licença..." />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl disabled:opacity-60">
                  {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save className="h-4 w-4" />} Salvar
                </button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Package className="h-10 w-10 text-gray-200" />
              <p className="text-sm text-gray-500">Nenhum produto cadastrado ainda.</p>
              <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl"><Plus className="h-4 w-4" /> Adicionar produto</button>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 group">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.nome}</p>
                    <p className="text-xs text-gray-400 truncate">{p.valor ? fmtMoney(p.valor) + (p.unidade ? ' · ' + p.unidade : '') : 'Sem valor definido'}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-200 rounded-lg"><Edit2 className="h-3.5 w-3.5 text-gray-500" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ContactsModal ────────────────────────────────────────────────────────────
function ContactsModal({ companyId, onClose }) {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const EMPTY = { nome: '', cargo: '', email: '', telefone: '', lead_id: '', observacoes: '' }
  const [form, setForm] = useState(EMPTY)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from('crm_contacts').select('*').eq('company_id', companyId).order('nome'),
      supabase.from('crm_leads').select('id, nome_empresa').eq('company_id', companyId).order('nome_empresa')
    ])
    const leadsArr = l || []
    setLeads(leadsArr)
    setContacts((c || []).map(contact => ({
      ...contact,
      crm_leads: leadsArr.find(lead => lead.id === contact.lead_id)
        ? { nome_empresa: leadsArr.find(lead => lead.id === contact.lead_id).nome_empresa }
        : null
    })))
    setLoading(false)
  }

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true) }
  const openEdit = (c) => { 
    const { crm_leads, ...rest } = c
    setForm({ ...rest, lead_id: rest.lead_id || '' })
    setEditing(c)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.nome?.trim()) { toast.error('Nome do contato obrigatório'); return }
    setSaving(true)
    try {
      const { crm_leads: _ignored, ...cleanForm } = form
      const payload = { ...cleanForm, lead_id: cleanForm.lead_id || null, company_id: companyId, updated_at: new Date().toISOString() }
      console.log('[ContactsModal handleSave] payload:', payload)
      if (editing) {
        const { error } = await supabase.from('crm_contacts').update(payload).eq('id', editing.id)
        if (error) { console.error('[ContactsModal handleSave] update error:', error); throw error }
      } else {
        payload.created_by = user?.id
        const { error } = await supabase.from('crm_contacts').insert([payload])
        if (error) { console.error('[ContactsModal handleSave] insert error:', error); throw error }
      }
      toast.success(editing ? 'Contato atualizado!' : 'Contato cadastrado!')
      setShowForm(false)
      loadAll()
    } catch (e) { toast.error('Erro: ' + e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    await supabase.from('crm_contacts').delete().eq('id', id)
    setContacts(p => p.filter(c => c.id !== id))
    toast.success('Contato removido')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#EBA500]" /> Contatos
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors">
              <Plus className="h-3.5 w-3.5" /> Novo Contato
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="h-5 w-5 text-gray-500" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EBA500]" /></div>
          ) : showForm ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-4 w-4 text-gray-500" /></button>
                <h3 className="text-sm font-bold text-gray-700">{editing ? 'Editar Contato' : 'Novo Contato'}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                  <input className={INP} value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))} placeholder="João Silva" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                  <input className={INP} value={form.cargo} onChange={e => setForm(p => ({...p, cargo: e.target.value}))} placeholder="Diretor Comercial" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Empresa (Lead)</label>
                  <select className={SEL} value={form.lead_id} onChange={e => setForm(p => ({...p, lead_id: e.target.value}))}>
                    <option value="">Sem vínculo</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.nome_empresa}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                  <input type="email" className={INP} value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="joao@empresa.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                  <input type="tel" className={INP} value={form.telefone} onChange={e => setForm(p => ({...p, telefone: e.target.value}))} placeholder="(11) 99999-9999" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                  <textarea className={INP + ' resize-none'} rows={2} value={form.observacoes} onChange={e => setForm(p => ({...p, observacoes: e.target.value}))} placeholder="Notas sobre este contato..." />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl disabled:opacity-60">
                  {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save className="h-4 w-4" />} Salvar
                </button>
              </div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Users className="h-10 w-10 text-gray-200" />
              <p className="text-sm text-gray-500">Nenhum contato cadastrado ainda.</p>
              <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl"><Plus className="h-4 w-4" /> Adicionar contato</button>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 group">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.nome}{c.cargo ? ` · ${c.cargo}` : ''}</p>
                    <p className="text-xs text-gray-400 truncate">{c.crm_leads?.nome_empresa || 'Sem empresa'}{c.email ? ' · ' + c.email : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-200 rounded-lg"><Edit2 className="h-3.5 w-3.5 text-gray-500" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CRMPage() {
  const { profile } = useAuth()

  // ── entity modals ────────────────────────────────────────────────────────
  const [showLeadsModal, setShowLeadsModal] = useState(false)
  const [showProductsModal, setShowProductsModal] = useState(false)
  const [showContactsModal, setShowContactsModal] = useState(false)

  // ── boards list ──────────────────────────────────────────────────────────
  const [boards, setBoards] = useState([])
  const [boardsLoading, setBoardsLoading] = useState(true)
  const [selectedBoard, setSelectedBoard] = useState(null)
  const [newBoardModal, setNewBoardModal] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [newBoardIcon, setNewBoardIcon] = useState('🎯')
  const [showIconPicker, setShowIconPicker] = useState(false)

  // ── board detail ─────────────────────────────────────────────────────────
  const [columns, setColumns] = useState([])
  const [cards, setCards] = useState({}) // { columnId: Card[] }
  const [loading, setLoading] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const [cardModal, setCardModal] = useState(null)   // null | { card?: Card, columnId: string }
  const [columnModal, setColumnModal] = useState(null) // null | column object
  const boardScrollRef = useRef(null)

  const [activeCard, setActiveCard] = useState(null)
  const [activeColumn, setActiveColumn] = useState(null)
  const [search, setSearch] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null) // { title, message, onConfirm }

  const [searchParams] = useSearchParams()
  const adminCompanyId = searchParams.get('from') === 'admin' ? searchParams.get('companyId') : null
  const companyId = adminCompanyId || profile?.user_companies?.find(uc => uc.is_active)?.company_id
  const location = useLocation()
  const navigate = useNavigate()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (companyId) loadBoards()
  }, [companyId])

  // Auto-abrir board se navegamos de outra página com state.boardId
  useEffect(() => {
    const boardId = location.state?.boardId
    if (boardId && boards.length > 0 && !selectedBoard) {
      const target = boards.find(b => b.id === boardId)
      if (target) openBoard(target)
    }
  }, [boards, location.state])

  const loadBoards = async () => {
    setBoardsLoading(true)
    try {
      const { data, error } = await supabase
        .from('crm_boards')
        .select('*')
        .eq('company_id', companyId)
        .order('position')
      if (error) throw error
      setBoards(data || [])
    } catch (e) {
      toast.error('Erro ao carregar pipelines')
    } finally {
      setBoardsLoading(false)
    }
  }

  const openBoard = async (board) => {
    setSelectedBoard(board)
    setSearch('')
    setLoading(true)
    setColumns([])
    setCards({})
    try {
      const colRes = await supabase
        .from('crm_columns')
        .select('*')
        .eq('board_id', board.id)
        .order('position')
      if (colRes.error) throw colRes.error
      const cols = colRes.data || []
      setColumns(cols)
      const colIds = cols.map(c => c.id)
      let cardData = []
      if (colIds.length > 0) {
        const cardRes = await supabase
          .from('crm_cards')
          .select('*')
          .in('column_id', colIds)
          .order('position')
        if (cardRes.error) throw cardRes.error
        cardData = cardRes.data || []
      }
      const grouped = {}
      cols.forEach(c => { grouped[c.id] = [] })
      cardData.forEach(card => {
        if (grouped[card.column_id]) grouped[card.column_id].push(card)
        else grouped[card.column_id] = [card]
      })
      setCards(grouped)
    } catch (e) {
      toast.error('Erro ao carregar pipeline')
    } finally {
      setLoading(false)
    }
  }

  const backToList = () => {
    setSelectedBoard(null)
    setColumns([])
    setCards({})
    setSearch('')
    setEditingTitle(false)
  }

  const createBoard = async () => {
    const title = newBoardTitle.trim()
    if (!title) return
    const { data, error } = await supabase
      .from('crm_boards')
      .insert([{ company_id: companyId, title, icon: newBoardIcon || '🎯', position: boards.length }])
      .select()
      .single()
    if (error) { toast.error('Erro ao criar pipeline'); return }
    const updated = [...boards, data]
    setBoards(updated)
    setNewBoardModal(false)
    setNewBoardTitle('')
    setNewBoardIcon('🎯')
    openBoard(data)
  }

  const handleDeleteBoard = (board) => {
    setConfirmDialog({
      title: `Excluir pipeline "${board.title}"`,
      message: 'Todas as colunas e leads deste pipeline serão excluídos permanentemente.',
      onConfirm: async () => {
        setConfirmDialog(null)
        await supabase.from('crm_boards').delete().eq('id', board.id)
        setBoards(p => p.filter(b => b.id !== board.id))
        toast.success('Pipeline excluído')
      },
    })
  }

  const handleSaveTitle = async () => {
    const trimmed = titleDraft.trim()
    if (!trimmed) { setEditingTitle(false); return }
    const { data, error } = await supabase
      .from('crm_boards')
      .update({ title: trimmed, updated_at: new Date().toISOString() })
      .eq('id', selectedBoard.id)
      .select()
      .single()
    if (!error && data) {
      setSelectedBoard(data)
      setBoards(p => p.map(b => b.id === data.id ? data : b))
    }
    setEditingTitle(false)
  }

  // ── Column CRUD ────────────────────────────────────────────────────────────
  const handleSaveColumn = async (col) => {
    try {
      if (col.id) {
        const { data, error } = await supabase.from('crm_columns').update({
          name: col.name, color: col.color, updated_at: new Date().toISOString()
        }).eq('id', col.id).select().single()
        if (error) throw error
        setColumns(p => p.map(c => c.id === data.id ? data : c))
      } else {
        const position = columns.length
        const { data, error } = await supabase.from('crm_columns').insert([{
          company_id: companyId, board_id: selectedBoard.id, name: col.name, color: col.color, position
        }]).select().single()
        if (error) throw error
        setColumns(p => [...p, data])
        setCards(p => ({ ...p, [data.id]: [] }))
      }
      setColumnModal(null)
      toast.success('Coluna salva!')
    } catch (e) {
      toast.error('Erro: ' + e.message)
    }
  }

  const handleDeleteColumn = (colId) => {
    const count = (cards[colId] || []).length
    const col = columns.find(c => c.id === colId)
    setConfirmDialog({
      title: `Excluir coluna "${col?.name || ''}"`,
      message: count
        ? `Esta coluna contém ${count} card${count > 1 ? 's' : ''}. Todos serão excluídos permanentemente.`
        : 'Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await supabase.from('crm_columns').delete().eq('id', colId)
          setColumns(p => p.filter(c => c.id !== colId))
          setCards(p => { const n = { ...p }; delete n[colId]; return n })
          toast.success('Coluna excluída')
        } catch (e) {
          toast.error('Erro ao excluir')
        }
      },
    })
  }

  // ── Card CRUD ──────────────────────────────────────────────────────────────
  const handleCardSaved = (saved, isNew) => {
    setCards(prev => {
      const updated = { ...prev }
      // Remove from old column if moved
      if (!isNew) {
        Object.keys(updated).forEach(cid => {
          updated[cid] = updated[cid].filter(c => c.id !== saved.id)
        })
      }
      const col = saved.column_id
      updated[col] = isNew
        ? [...(updated[col] || []), saved]
        : [...(updated[col] || []), saved]
      return updated
    })
    setCardModal(null)
  }

  const handleCardDeleted = (cardId) => {
    setCards(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(cid => { updated[cid] = updated[cid].filter(c => c.id !== cardId) })
      return updated
    })
    setCardModal(null)
  }

  // ── DnD ───────────────────────────────────────────────────────────────────
  const onDragStart = (event) => {
    const { active } = event
    if (active.data.current?.type === 'card') {
      setActiveCard(active.data.current.card)
      setActiveColumn(null)
    } else if (active.data.current?.type === 'column') {
      setActiveColumn(active.data.current.column)
      setActiveCard(null)
    }
  }

  const onDragOver = (event) => {
    const { active, over } = event
    if (!over) return
    if (active.data.current?.type !== 'card') return

    const activeColId = Object.keys(cards).find(cid => cards[cid].some(c => c.id === active.id))
    let overColId

    if (over.data.current?.type === 'column') {
      overColId = over.data.current.columnId
    } else if (over.data.current?.type === 'card') {
      overColId = Object.keys(cards).find(cid => cards[cid].some(c => c.id === over.id))
    } else {
      overColId = over.id
    }

    if (!activeColId || !overColId) return

    if (activeColId === overColId) {
      // Reorder within same column
      setCards(prev => {
        const colCards = [...(prev[activeColId] || [])]
        const oldIdx = colCards.findIndex(c => c.id === active.id)
        const newIdx = colCards.findIndex(c => c.id === over.id)
        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return prev
        return { ...prev, [activeColId]: arrayMove(colCards, oldIdx, newIdx) }
      })
      return
    }

    // Move between columns
    setCards(prev => {
      const srcCards = [...(prev[activeColId] || [])]
      const dstCards = [...(prev[overColId] || [])]
      const cardIdx = srcCards.findIndex(c => c.id === active.id)
      if (cardIdx === -1) return prev
      const [moved] = srcCards.splice(cardIdx, 1)
      const overIdx = dstCards.findIndex(c => c.id === over.id)
      if (overIdx === -1) dstCards.push(moved)
      else dstCards.splice(overIdx, 0, moved)
      return { ...prev, [activeColId]: srcCards, [overColId]: dstCards }
    })
  }

  const onDragEnd = async (event) => {
    const { active, over } = event
    setActiveCard(null)
    setActiveColumn(null)
    if (!over) return

    // ── column reorder ───────────────────────────────────────────────────────
    if (active.data.current?.type === 'column') {
      const activeId = active.id.replace('col-', '')
      const overId   = over.id.replace('col-', '')
      const oldIdx = columns.findIndex(c => c.id === activeId)
      const newIdx = columns.findIndex(c => c.id === overId)
      if (oldIdx !== newIdx) {
        const reordered = arrayMove(columns, oldIdx, newIdx)
        setColumns(reordered)
        await Promise.all(reordered.map((c, i) =>
          supabase.from('crm_columns').update({ position: i }).eq('id', c.id)
        ))
      }
      return
    }

    // ── card drop ────────────────────────────────────────────────────────────
    if (active.data.current?.type !== 'card') return

    const activeCardItem = Object.values(cards).flat().find(c => c.id === active.id)
    if (!activeCardItem) return

    let targetColId = over.data.current?.type === 'column'
      ? over.data.current.columnId
      : Object.keys(cards).find(cid => cards[cid].some(c => c.id === over.id))

    if (!targetColId) targetColId = over.id

    const finalCards = { ...cards }
    // Persist new order + column
    const targetList = [...(finalCards[targetColId] || [])]

    const updates = []
    targetList.forEach((c, i) => {
      if (c.id === active.id && c.column_id !== targetColId) {
        updates.push(supabase.from('crm_cards').update({ column_id: targetColId, position: i, updated_at: new Date().toISOString() }).eq('id', c.id))
      } else {
        updates.push(supabase.from('crm_cards').update({ position: i }).eq('id', c.id))
      }
    })
    await Promise.all(updates)

    // Also reorder other columns that were touched during dragOver
    const allColIds = Object.keys(finalCards)
    for (const cid of allColIds) {
      if (cid === targetColId) continue
      const list = finalCards[cid] || []
      await Promise.all(list.map((c, i) => supabase.from('crm_cards').update({ position: i }).eq('id', c.id)))
    }
  }

  // ── Filtered view ─────────────────────────────────────────────────────────
  const filteredCards = useCallback((colId) => {
    const list = cards[colId] || []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(c =>
      (c.nome_empresa || '').toLowerCase().includes(q) ||
      (c.nome_contato || '').toLowerCase().includes(q) ||
      (c.segmento || '').toLowerCase().includes(q) ||
      (c.cidade || '').toLowerCase().includes(q) ||
      (c.estado || '').toLowerCase().includes(q)
    )
  }, [cards, search])

  const colIds = columns.map(c => `col-${c.id}`)
  const totalCards = Object.values(cards).flat().length
  const totalValue = Object.values(cards).flat().reduce((s, c) => s + (parseFloat(c.valor_oportunidade) || 0), 0)

  if (boardsLoading) return (
    <div className="min-h-screen flex flex-col">
      <SuperAdminBanner />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EBA500]" />
      </div>
    </div>
  )

  // ── Boards list view ───────────────────────────────────────────────────────
  if (!selectedBoard) return (
    <div className="min-h-screen bg-white">
      <SuperAdminBanner />
      <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow">
            <Kanban className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">CRM</h1>
            <p className="text-xs text-gray-400">{boards.length} pipeline{boards.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLeadsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
          >
            <Building2 className="h-4 w-4" /> Leads
          </button>
          <button
            onClick={() => setShowProductsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
          >
            <Package className="h-4 w-4" /> Produtos
          </button>
          <button
            onClick={() => { setNewBoardTitle(''); setNewBoardModal(true) }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Novo Pipeline
          </button>
        </div>
      </div>

      {/* Grid de boards */}
      {boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <LayoutGrid className="h-8 w-8 text-blue-300" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-700">Nenhum pipeline criado</p>
            <p className="text-sm text-gray-400 mt-1">Crie seu primeiro pipeline de vendas para organizar seus leads</p>
          </div>
          <button
            onClick={() => { setNewBoardTitle(''); setNewBoardModal(true) }}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors"
          >
            <Plus className="h-4 w-4" /> Criar primeiro pipeline
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map(board => (
            <div key={board.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm text-lg">
                    {renderIcon(board.icon || '🎯', 'h-5 w-5 text-white')}
                  </div>
                  <button
                    onClick={() => handleDeleteBoard(board)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50"
                    title="Excluir pipeline"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-gray-800 text-base leading-snug">{board.title}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Criado em {new Date(board.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="px-5 pb-5">
                <button
                  onClick={() => openBoard(board)}
                  className="w-full py-2 text-sm font-semibold text-[#EBA500] border border-[#EBA500]/40 rounded-xl hover:bg-[#EBA500] hover:text-white transition-colors"
                >
                  Abrir pipeline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Novo Pipeline */}
      {newBoardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Novo Pipeline</h2>

            {/* Seletor de ícone */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ícone</label>
              <button
                type="button"
                onClick={() => setShowIconPicker(true)}
                className="w-14 h-14 rounded-2xl border-2 border-gray-200 hover:border-[#EBA500] flex items-center justify-center text-2xl transition-colors"
                title="Escolher ícone"
              >
                {renderIcon(newBoardIcon || '🎯', 'h-8 w-8 text-gray-700')}
              </button>
            </div>

            <input
              autoFocus
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] mb-4"
              placeholder="Ex: Vendas B2B, Prospecção 2026..."
              value={newBoardTitle}
              onChange={e => setNewBoardTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createBoard(); if (e.key === 'Escape') setNewBoardModal(false) }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setNewBoardModal(false)}
                className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={createBoard}
                disabled={!newBoardTitle.trim()}
                className="flex-1 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors disabled:opacity-40"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {showIconPicker && (
        <EmojiIconPicker
          value={newBoardIcon}
          onChange={(icon) => { setNewBoardIcon(icon); setShowIconPicker(false) }}
          onClose={() => setShowIconPicker(false)}
        />
      )}

      {showLeadsModal && <LeadsModal companyId={companyId} onClose={() => setShowLeadsModal(false)} />}
      {showProductsModal && <ProductsModal companyId={companyId} onClose={() => setShowProductsModal(false)} />}

      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant="danger"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      </div>
    </div>
  )

  // ── Board detail view ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      <SuperAdminBanner />
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 mr-auto">
            <button
              onClick={backToList}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Voltar para pipelines"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow text-lg">
              {renderIcon(selectedBoard?.icon || '🎯', 'h-5 w-5 text-white')}
            </div>
            <div>
              {editingTitle ? (
                <input
                  className="text-lg font-bold text-gray-800 bg-transparent border-b-2 border-[#EBA500] outline-none w-full min-w-[160px] max-w-xs"
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
                  placeholder="Nome do pipeline..."
                  autoFocus
                />
              ) : (
                <h1
                  className="text-lg font-bold cursor-pointer transition-colors group flex items-center gap-1.5 text-gray-800 hover:text-[#EBA500]"
                  onClick={() => { setTitleDraft(selectedBoard?.title || ''); setEditingTitle(true) }}
                  title="Clique para editar o título"
                >
                  {selectedBoard?.title}
                  <Edit2 className="h-3.5 w-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                </h1>
              )}
              <p className="text-xs text-gray-400">{totalCards} leads · {fmtMoney(totalValue)} em oportunidades</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] w-48"
              placeholder="Buscar lead..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={() => setColumnModal({})}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Nova Coluna
          </button>
        </div>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EBA500]" />
        </div>
      ) : columns.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Kanban className="h-8 w-8 text-blue-300" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-700">Seu pipeline está vazio</p>
            <p className="text-sm text-gray-400 mt-1">Comece criando colunas para organizar seus leads</p>
          </div>
          <button onClick={() => setColumnModal({})}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors">
            <Plus className="h-4 w-4" /> Criar primeira coluna
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="relative flex-1 overflow-hidden">
            {/* Left scroll arrow */}
            <button
              onClick={() => boardScrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white shadow-md border border-gray-200 rounded-full text-gray-500 hover:text-[#EBA500] transition-all opacity-70 hover:opacity-100"
              title="Rolar para esquerda"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
            {/* Right scroll arrow */}
            <button
              onClick={() => boardScrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white shadow-md border border-gray-200 rounded-full text-gray-500 hover:text-[#EBA500] transition-all opacity-70 hover:opacity-100"
              title="Rolar para direita"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div ref={boardScrollRef} className="flex-1 overflow-x-auto overflow-y-hidden h-full kanban-scroll">
            <div className="flex gap-4 p-4 h-full">
              <SortableContext items={colIds} strategy={horizontalListSortingStrategy}>
                {columns.map(col => (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    cards={filteredCards(col.id)}
                    onAddCard={(colId) => setCardModal({ columnId: colId })}
                    onEditCard={(card) => setCardModal({ card, columnId: card.column_id })}
                    onEditColumn={(col) => setColumnModal(col)}
                    onDeleteColumn={handleDeleteColumn}
                    activeCardId={activeCard?.id}
                  />
                ))}
              </SortableContext>

              {/* Add column shortcut */}
              <button
                onClick={() => setColumnModal({})}
                className="shrink-0 w-72 h-20 flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#EBA500]/50 hover:text-[#EBA500] hover:bg-amber-50/30 transition-all text-sm font-medium"
              >
                <Plus className="h-5 w-5" /> Adicionar coluna
              </button>
            </div>
            </div>
          </div>

          <DragOverlay>
            {activeCard && <KanbanCard card={activeCard} onEdit={() => {}} isDragOverlay />}
            {activeColumn && (
              <div className="w-72 bg-white rounded-2xl border-2 border-[#EBA500]/50 shadow-2xl p-3 opacity-90">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: activeColumn.color }} />
                  <span className="text-sm font-bold text-gray-700">{activeColumn.name}</span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modals */}
      {columnModal !== null && (
        <ColumnModal
          column={columnModal?.id ? columnModal : null}
          onClose={() => setColumnModal(null)}
          onSaved={handleSaveColumn}
        />
      )}
      {cardModal !== null && (
        <CardModal
          card={cardModal.card}
          columnId={cardModal.columnId}
          companyId={companyId}
          columns={columns}
          onClose={() => setCardModal(null)}
          onSaved={handleCardSaved}
          onDeleted={handleCardDeleted}
        />
      )}
      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}
