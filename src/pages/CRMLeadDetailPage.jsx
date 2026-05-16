import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, User, Phone, Mail, MapPin, Tag,
  Globe, Plus, Edit2, Trash2, Save, X, ExternalLink,
  Briefcase, MessageSquare, DollarSign, ChevronRight, Search, Package
} from 'lucide-react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from '@/lib/toast'

const ORIGENS = ['Indicação', 'Inbound', 'Outbound', 'Site/Blog', 'Redes Sociais', 'Evento', 'Parceiro', 'Outro']
const INP = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/40 focus:border-[#EBA500] bg-white'
const SEL = INP + ' cursor-pointer'

const STATUS_COLORS = {
  ativo:   'bg-blue-100 text-blue-700',
  ganho:   'bg-green-100 text-green-700',
  perdido: 'bg-red-100 text-red-700',
}

function fmtMoney(v) {
  if (!v) return '—'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CRMLeadDetailPage() {
  const { leadId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [lead, setLead] = useState(null)
  const [contacts, setContacts] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [cardSearch, setCardSearch] = useState('')

  // ── edit lead inline ──
  const [editingLead, setEditingLead] = useState(false)
  const [leadForm, setLeadForm] = useState({})
  const [savingLead, setSavingLead] = useState(false)

  // ── contact form ──
  const [showContactForm, setShowContactForm] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const EMPTY_C = { nome: '', cargo: '', email: '', telefone: '', observacoes: '' }
  const [contactForm, setContactForm] = useState(EMPTY_C)
  const [savingContact, setSavingContact] = useState(false)

  const companyId = profile?.user_companies?.find(uc => uc.is_active)?.company_id

  useEffect(() => { loadAll() }, [leadId])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [{ data: l }, { data: c }] = await Promise.all([
        supabase.from('crm_leads').select('*').eq('id', leadId).single(),
        supabase.from('crm_contacts').select('*').eq('lead_id', leadId).order('nome'),
      ])
      if (!l) { toast.error('Lead não encontrado'); navigate('/crm'); return }
      setLead(l)
      setLeadForm({ ...l })
      setContacts(c || [])

      // RLS exige: boards filtrado por company_id, columns por board_id, cards por column_id
      const { data: boards } = await supabase
        .from('crm_boards')
        .select('id, title')
        .eq('company_id', l.company_id)

      const boardList = boards || []
      const colMap = {}  // colId -> { title, board }
      
      if (boardList.length > 0) {
        await Promise.all(boardList.map(async (board) => {
          const { data: cols } = await supabase
            .from('crm_columns')
            .select('id, name')
            .eq('board_id', board.id)
          ;(cols || []).forEach(col => { colMap[col.id] = { title: col.name, board } })
        }))
      }

      const validColIds = Object.keys(colMap)
      let allCards = []
      if (validColIds.length > 0) {
        const { data: cardsData, error: cardsError } = await supabase
          .from('crm_cards')
          .select('*')
          .in('column_id', validColIds)
          .order('created_at', { ascending: false })
        if (cardsError) console.error('Erro ao buscar cards:', cardsError)
        allCards = (cardsData || []).map(card => ({
          ...card,
          crm_columns: colMap[card.column_id] || null,
          crm_boards: colMap[card.column_id]?.board || null,
        }))
      }

      const leadNome = l.nome_empresa?.trim().toLowerCase()
      const filtered = allCards.filter(card =>
        card.lead_id === leadId ||
        (leadNome && card.nome_empresa?.trim().toLowerCase() === leadNome)
      )
      setCards(filtered)
    } catch (e) {
      toast.error('Erro ao carregar lead')
    } finally {
      setLoading(false)
    }
  }

  // ── lead edit ──
  const saveLead = async () => {
    if (!leadForm.nome_empresa?.trim()) { toast.error('Nome da empresa obrigatório'); return }
    setSavingLead(true)
    try {
      const { error } = await supabase.from('crm_leads').update({ ...leadForm, updated_at: new Date().toISOString() }).eq('id', leadId)
      if (error) throw error
      setLead({ ...leadForm })
      setEditingLead(false)
      toast.success('Lead atualizado!')
    } catch (e) { toast.error('Erro: ' + e.message) }
    finally { setSavingLead(false) }
  }

  // ── contacts ──
  const openNewContact = () => { setContactForm(EMPTY_C); setEditingContact(null); setShowContactForm(true) }
  const openEditContact = (c) => { setContactForm({ ...c }); setEditingContact(c); setShowContactForm(true) }

  const saveContact = async () => {
    if (!contactForm.nome?.trim()) { toast.error('Nome obrigatório'); return }
    setSavingContact(true)
    try {
      const payload = { ...contactForm, lead_id: leadId, company_id: companyId, updated_at: new Date().toISOString() }
      if (editingContact) {
        const { error } = await supabase.from('crm_contacts').update(payload).eq('id', editingContact.id)
        if (error) throw error
        setContacts(p => p.map(c => c.id === editingContact.id ? { ...c, ...payload } : c))
      } else {
        const { data, error } = await supabase.from('crm_contacts').insert([{ ...payload, created_by: profile?.id }]).select().single()
        if (error) throw error
        setContacts(p => [...p, data])
      }
      toast.success(editingContact ? 'Contato atualizado!' : 'Contato adicionado!')
      setShowContactForm(false)
    } catch (e) { toast.error('Erro: ' + e.message) }
    finally { setSavingContact(false) }
  }

  const deleteContact = async (id) => {
    await supabase.from('crm_contacts').delete().eq('id', id)
    setContacts(p => p.filter(c => c.id !== id))
    toast.success('Contato removido')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full py-32">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EBA500]" />
    </div>
  )

  if (!lead) return null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate('/crm')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao CRM
      </button>

      {/* ── Lead card ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-[#EBA500]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBA500]/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-[#EBA500]" />
            </div>
            {editingLead ? (
              <input
                className="text-lg font-bold text-gray-900 dark:text-white border-b-2 border-[#EBA500] bg-transparent outline-none px-1"
                value={leadForm.nome_empresa}
                onChange={e => setLeadForm(p => ({ ...p, nome_empresa: e.target.value }))}
                autoFocus
              />
            ) : (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{lead.nome_empresa}</h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editingLead ? (
              <>
                <button onClick={() => setEditingLead(false)} className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                <button onClick={saveLead} disabled={savingLead} className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl disabled:opacity-60">
                  {savingLead ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" /> : <Save className="h-3.5 w-3.5" />} Salvar
                </button>
              </>
            ) : (
              <button onClick={() => setEditingLead(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">
                <Edit2 className="h-3.5 w-3.5" /> Editar
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-5">
          {editingLead ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cidade</label>
                <input className={INP} value={leadForm.cidade || ''} onChange={e => setLeadForm(p => ({ ...p, cidade: e.target.value }))} placeholder="São Paulo" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Estado</label>
                <input className={INP} value={leadForm.estado || ''} onChange={e => setLeadForm(p => ({ ...p, estado: e.target.value }))} placeholder="SP" maxLength={2} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Segmento</label>
                <input className={INP} value={leadForm.segmento || ''} onChange={e => setLeadForm(p => ({ ...p, segmento: e.target.value }))} placeholder="Tecnologia, Saúde..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Origem</label>
                <select className={SEL} value={leadForm.origem_lead || ''} onChange={e => setLeadForm(p => ({ ...p, origem_lead: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Website</label>
                <input className={INP} value={leadForm.website || ''} onChange={e => setLeadForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="col-span-full">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Observações</label>
                <textarea className={INP + ' resize-none'} rows={3} value={leadForm.observacoes || ''} onChange={e => setLeadForm(p => ({ ...p, observacoes: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoItem icon={<MapPin className="h-4 w-4 text-gray-400" />} label="Cidade" value={lead.cidade} />
              <InfoItem icon={<MapPin className="h-4 w-4 text-gray-400" />} label="Estado" value={lead.estado} />
              <InfoItem icon={<Tag className="h-4 w-4 text-gray-400" />} label="Segmento" value={lead.segmento} />
              <InfoItem icon={<Briefcase className="h-4 w-4 text-gray-400" />} label="Origem" value={lead.origem_lead} />
              <InfoItem
                icon={<Globe className="h-4 w-4 text-gray-400" />}
                label="Website"
                value={lead.website ? (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                    {lead.website.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              />
              {lead.observacoes && (
                <div className="col-span-full pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Observações</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{lead.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Contacts ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <User className="h-4 w-4 text-purple-500" /> Contatos ({contacts.length})
          </h2>
          {!showContactForm && (
            <button onClick={openNewContact} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors">
              <Plus className="h-3.5 w-3.5" /> Novo Contato
            </button>
          )}
        </div>

        <div className="px-6 py-4">
          {showContactForm && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{editingContact ? 'Editar contato' : 'Novo contato'}</p>
                <button onClick={() => setShowContactForm(false)}><X className="h-4 w-4 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nome *</label>
                  <input className={INP} value={contactForm.nome} onChange={e => setContactForm(p => ({ ...p, nome: e.target.value }))} placeholder="João Silva" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cargo</label>
                  <input className={INP} value={contactForm.cargo} onChange={e => setContactForm(p => ({ ...p, cargo: e.target.value }))} placeholder="Diretor Comercial" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">E-mail</label>
                  <input type="email" className={INP} value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} placeholder="joao@empresa.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Telefone</label>
                  <input type="tel" className={INP} value={contactForm.telefone} onChange={e => setContactForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(11) 99999-9999" />
                </div>
                <div className="col-span-full">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Observações</label>
                  <textarea className={INP + ' resize-none'} rows={2} value={contactForm.observacoes} onChange={e => setContactForm(p => ({ ...p, observacoes: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowContactForm(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
                <button onClick={saveContact} disabled={savingContact} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl disabled:opacity-60">
                  {savingContact ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" /> : <Save className="h-3.5 w-3.5" />} Salvar
                </button>
              </div>
            </div>
          )}

          {contacts.length === 0 && !showContactForm ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <User className="h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">Nenhum contato associado.</p>
              <button onClick={openNewContact} className="text-xs text-[#EBA500] hover:underline">Adicionar contato</button>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 group">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 text-sm font-bold text-purple-600">
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{c.nome}{c.cargo ? <span className="font-normal text-gray-500 dark:text-gray-400"> · {c.cargo}</span> : ''}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {c.email && <a href={`mailto:${c.email}`} className="text-xs text-blue-500 hover:underline flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</a>}
                      {c.telefone && <a href={`tel:${c.telefone}`} className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefone}</a>}
                    </div>
                    {c.observacoes && <p className="text-xs text-gray-400 mt-0.5 truncate">{c.observacoes}</p>}
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
      </div>

      {/* ── Negociações vinculadas ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" /> Negociações no Pipeline ({cards.length})
          </h2>
          <button onClick={() => navigate('/crm')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#EBA500] transition-colors">
            Ver pipelines <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Filtros */}
        {cards.length > 0 && (
          <div className="px-6 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={cardSearch}
                onChange={e => setCardSearch(e.target.value)}
                placeholder="Filtrar por empresa, contato ou produto..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/40 focus:border-[#EBA500] bg-gray-50"
              />
              {cardSearch && (
                <button onClick={() => setCardSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="px-6 py-4">
          {(() => {
            const q = cardSearch.trim().toLowerCase()
            const filtered = q
              ? cards.filter(card =>
                  card.nome_empresa?.toLowerCase().includes(q) ||
                  card.nome_contato?.toLowerCase().includes(q) ||
                  card.segmento?.toLowerCase().includes(q) ||
                  card.crm_boards?.title?.toLowerCase().includes(q) ||
                  card.crm_columns?.title?.toLowerCase().includes(q)
                )
              : cards
            if (filtered.length === 0) return (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <DollarSign className="h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">{q ? 'Nenhum resultado para esta busca.' : 'Nenhuma negociação vinculada a esta empresa.'}</p>
              </div>
            )
            return (
              <div className="space-y-2">
                {filtered.map(card => (
                  <div key={card.id} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{card.nome_empresa || card.nome_contato || '—'}</p>
                        {card.status && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[card.status] || 'bg-gray-100 text-gray-600'}`}>
                            {card.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {card.crm_boards?.title && <span className="text-xs font-medium text-[#EBA500]">Pipeline: {card.crm_boards.title}</span>}
                        {card.crm_columns?.title && <span className="text-xs text-gray-400">→ {card.crm_columns.title}</span>}
                        {card.nome_contato && <span className="text-xs text-gray-500 flex items-center gap-1"><User className="h-3 w-3" />{card.nome_contato}</span>}
                        {card.valor_oportunidade && <span className="text-xs text-green-600 font-medium">{fmtMoney(card.valor_oportunidade)}</span>}
                      </div>
                    </div>
                    {card.crm_boards?.id && (
                      <button
                        onClick={() => navigate('/crm', { state: { boardId: card.crm_boards.id, cardId: card.id } })}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#EBA500] border border-[#EBA500]/30 rounded-lg hover:bg-amber-50 transition-colors"
                      >
                        Ver <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </div>

    </div>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 flex items-center gap-1 mb-0.5">{icon}{label}</p>
      {typeof value === 'string' || value === undefined || value === null ? (
        <p className="text-sm text-gray-800">{value || <span className="text-gray-300">—</span>}</p>
      ) : (
        <div className="text-sm text-gray-800">{value}</div>
      )}
    </div>
  )
}
