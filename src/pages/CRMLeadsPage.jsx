import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Building2, Users, Plus, Edit2, Trash2,
  Save, X, Download, Upload, FileSpreadsheet, Search,
  Globe, MapPin
} from 'lucide-react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import SuperAdminBanner from '../components/SuperAdminBanner'
import toast from '@/lib/toast'

const INP = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/40 focus:border-[#EBA500] bg-white'
const SEL = INP + ' cursor-pointer'

const ORIGENS = ['Indicação', 'Inbound', 'Outbound', 'Site/Blog', 'Redes Sociais', 'Evento', 'Parceiro', 'Outro']
const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
]

const EMPTY = { nome_empresa: '', cnpj: '', cidade: '', estado: '', segmento: '', origem_lead: '', website: '', observacoes: '' }

export default function CRMLeadsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()

  const adminCompanyId = searchParams.get('from') === 'admin' ? searchParams.get('companyId') : null
  const companyId = adminCompanyId || profile?.user_companies?.find(uc => uc.is_active)?.company_id
  const adminSuffix = adminCompanyId ? `?from=admin&companyId=${adminCompanyId}` : ''

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [newContacts, setNewContacts] = useState([{ _key: 1, nome: '', cargo: '', telefone: '', email: '' }])

  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState(null) // { type: 'leads', rows: [] }
  const importRef = useRef(null)

  useEffect(() => {
    if (companyId) loadLeads()
    else setLoading(false)
  }, [companyId])

  const loadLeads = async () => {
    setLoading(true)
    const { data } = await supabase.from('crm_leads').select('*').eq('company_id', companyId).order('nome_empresa')
    setLeads(data || [])
    setLoading(false)
  }

  const openNew = () => {
    setForm(EMPTY)
    setEditing(null)
    setNewContacts([{ _key: Date.now(), nome: '', cargo: '', telefone: '', email: '' }])
    setShowForm(true)
  }
  const openEdit = (l) => {
    setForm({ ...l })
    setEditing(l)
    setNewContacts([])
    setShowForm(true)
  }

  const addNewContact = () =>
    setNewContacts(p => [...p, { _key: Date.now(), nome: '', cargo: '', telefone: '', email: '' }])
  const removeNewContact = (key) =>
    setNewContacts(p => p.filter(c => c._key !== key))
  const updateNewContact = (key, field, value) =>
    setNewContacts(p => p.map(c => c._key === key ? { ...c, [field]: value } : c))

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
      const toInsert = newContacts.filter(c => c.nome.trim())
      if (toInsert.length > 0) {
        await supabase.from('crm_contacts').insert(
          toInsert.map(c => ({
            nome: c.nome.trim(), cargo: c.cargo.trim() || null,
            telefone: c.telefone.trim() || null, email: c.email.trim() || null,
            lead_id: leadId, company_id: companyId, created_by: user?.id,
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

  // ── Import ──
  const parseSpreadsheetFile = async (file) => {
    const isXlsx = /\.(xlsx|xls)$/i.test(file.name)
    if (isXlsx) {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        .slice(1)
        .filter(r => r.some(c => String(c).trim()))
        .map(r => r.map(c => String(c ?? '').trim()))
    } else {
      const text = await file.text()
      const lines = text.trim().split(/\r?\n/)
      const delim = lines[0]?.includes(';') ? ';' : ','
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
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImporting(true)
    try {
      const rows = await parseSpreadsheetFile(file)
      const preview = rows
        .filter(r => r[0]?.trim())
        .map(([nomeEmpresa = '', cnpj = '', cidade = '', estado = '', nomeContato = '', cargo = '', telefone = '', email = '']) => ({
          nomeEmpresa: nomeEmpresa.trim(), cnpj: cnpj.trim(), cidade: cidade.trim(), estado: estado.trim(),
          nomeContato: nomeContato.trim(), cargo: cargo.trim(),
          telefone: telefone.trim(), email: email.trim(),
        }))
      if (!preview.length) { toast.error('Nenhum lead válido encontrado'); return }
      setImportPreview({ rows: preview })
    } catch (err) { toast.error('Erro ao processar arquivo: ' + err.message) }
    finally { setImporting(false) }
  }

  const confirmImport = async () => {
    if (!importPreview) return
    setImporting(true)
    try {
      let leadsInserted = 0, contactsInserted = 0, errors = 0
      for (const r of importPreview.rows) {
        const { data: leadData, error: le } = await supabase
          .from('crm_leads')
          .insert([{ nome_empresa: r.nomeEmpresa, cnpj: r.cnpj || null, cidade: r.cidade || null, estado: r.estado || null, company_id: companyId, created_by: user?.id }])
          .select('id').single()
        if (le) { errors++; continue }
        leadsInserted++
        if (r.nomeContato) {
          const { error: ce } = await supabase.from('crm_contacts').insert([{
            nome: r.nomeContato, cargo: r.cargo || null,
            telefone: r.telefone || null, email: r.email || null,
            lead_id: leadData.id, company_id: companyId, created_by: user?.id,
          }])
          if (!ce) contactsInserted++
        }
      }
      toast.success(
        `${leadsInserted} lead${leadsInserted !== 1 ? 's' : ''} importado${leadsInserted !== 1 ? 's' : ''}` +
        (contactsInserted ? `, ${contactsInserted} contato${contactsInserted !== 1 ? 's' : ''}` : '') +
        (errors ? ` (${errors} erro${errors !== 1 ? 's' : ''})` : '')
      )
      setImportPreview(null)
      loadLeads()
    } catch (err) { toast.error('Erro na importação: ' + err.message) }
    finally { setImporting(false) }
  }

  const downloadTemplateXlsx = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['nome_empresa', 'cnpj', 'cidade', 'estado', 'nome_contato', 'cargo', 'telefone', 'email'],
      ['Acme Ltda', '00.000.000/0000-00', 'São Paulo', 'SP', 'João Silva', 'Diretor', '(11) 9 9999-8888', 'joao@acme.com'],
    ])
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 25 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')
    XLSX.writeFile(wb, 'modelo_importacao_leads.xlsx')
  }

  const downloadTemplateCsv = () => {
    const csv = 'nome_empresa,cnpj,cidade,estado,nome_contato,cargo,telefone,email\nAcme Ltda,00.000.000/0000-00,São Paulo,SP,João Silva,Diretor,(11) 9 9999-8888,joao@acme.com'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'modelo_importacao_leads.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = search.trim()
    ? leads.filter(l =>
        (l.nome_empresa || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.segmento || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.cidade || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.estado || '').toLowerCase().includes(search.toLowerCase())
      )
    : leads

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <SuperAdminBanner />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Breadcrumb ── */}
        <button
          onClick={() => navigate('/crm' + adminSuffix)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao CRM
        </button>

        {/* ── Header card ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50/60 dark:from-blue-900/20 to-transparent">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Leads / Empresas</h1>
                  <p className="text-xs text-gray-400 mt-0.5">{leads.length} lead{leads.length !== 1 ? 's' : ''} cadastrado{leads.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <input ref={importRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportFile} />
                <button
                  onClick={() => importRef.current?.click()}
                  disabled={importing}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors disabled:opacity-60"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Importar planilha
                </button>
                <button onClick={downloadTemplateXlsx} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors">
                  <Download className="h-3.5 w-3.5" /> Modelo .xlsx
                </button>
                <button onClick={downloadTemplateCsv} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors">
                  <Download className="h-3.5 w-3.5" /> Modelo .csv
                </button>
                <button
                  onClick={() => navigate('/crm/contatos' + adminSuffix)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors"
                >
                  <Users className="h-3.5 w-3.5" /> Ver Contatos
                </button>
                {!showForm && (
                  <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Novo Lead
                  </button>
                )}
              </div>
            </div>

            {/* Search bar */}
            {!showForm && (
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] bg-white"
                  placeholder="Buscar por empresa, segmento, cidade ou estado..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="px-6 py-5">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EBA500]" />
              </div>
            ) : showForm ? (
              /* ── Form ── */
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <ArrowLeft className="h-4 w-4 text-gray-500" />
                  </button>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{editing ? 'Editar Lead' : 'Novo Lead'}</h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nome da Empresa *</label>
                  <input className={INP} value={form.nome_empresa} onChange={e => setForm(p => ({ ...p, nome_empresa: e.target.value }))} placeholder="Acme Corp" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">CNPJ <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input className={INP} value={form.cnpj || ''} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cidade</label>
                    <input className={INP} value={form.cidade || ''} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} placeholder="São Paulo" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Estado</label>
                    <select className={SEL} value={form.estado || ''} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}>
                      <option value="">Selecione...</option>
                      {ESTADOS_BR.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Segmento</label>
                    <input className={INP} value={form.segmento || ''} onChange={e => setForm(p => ({ ...p, segmento: e.target.value }))} placeholder="Tecnologia, Saúde..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Origem</label>
                    <select className={SEL} value={form.origem_lead || ''} onChange={e => setForm(p => ({ ...p, origem_lead: e.target.value }))}>
                      <option value="">Selecione...</option>
                      {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Website</label>
                    <input className={INP} value={form.website || ''} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Observações</label>
                  <textarea className={INP + ' resize-none'} rows={3} value={form.observacoes || ''} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} placeholder="Notas sobre este lead..." />
                </div>

                {/* ── Inline contacts (só no cadastro novo) ── */}
                {!editing && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-purple-400" /> Contatos
                      </p>
                      <button type="button" onClick={addNewContact} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold">
                        <Plus className="h-3.5 w-3.5" /> Adicionar contato
                      </button>
                    </div>
                    <div className="space-y-2">
                      {newContacts.map((c, idx) => (
                        <div key={c._key} className="relative p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-700/40 rounded-xl">
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
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl disabled:opacity-60">
                    {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save className="h-4 w-4" />} Salvar
                  </button>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              /* ── Empty ── */
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <Building2 className="h-12 w-12 text-gray-200" />
                <p className="text-base font-semibold text-gray-600 dark:text-gray-300">
                  {search ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado ainda'}
                </p>
                {!search && (
                  <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl">
                    <Plus className="h-4 w-4" /> Adicionar primeiro lead
                  </button>
                )}
              </div>
            ) : (
              /* ── List ── */
              <div className="space-y-2">
                {filtered.map(l => (
                  <div
                    key={l.id}
                    className="flex items-center gap-3 p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 group transition-colors cursor-pointer"
                    onClick={() => navigate(`/crm/lead/${l.id}` + adminSuffix)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-sm font-bold text-blue-600">
                      {l.nome_empresa.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{l.nome_empresa}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {[l.segmento, l.cidade && l.estado ? `${l.cidade} · ${l.estado}` : (l.cidade || l.estado), l.origem_lead].filter(Boolean).join(' · ') || 'Sem detalhes'}
                      </p>
                      {l.website && (
                        <p className="text-xs text-blue-400 truncate mt-0.5">{l.website}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(l) }}
                        className="p-1.5 hover:bg-gray-200 rounded-lg" title="Editar"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(l.id) }}
                        className="p-1.5 hover:bg-red-50 rounded-lg" title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Import Preview Modal ── */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Confirmar importação de leads</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {importPreview.rows.length} lead{importPreview.rows.length !== 1 ? 's' : ''} encontrado{importPreview.rows.length !== 1 ? 's' : ''}. Revise antes de confirmar.
                </p>
              </div>
              <button onClick={() => setImportPreview(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-4">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    {['Empresa', 'CNPJ', 'Cidade', 'UF', 'Contato', 'Cargo', 'Telefone', 'E-mail'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.rows.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-700/50'}>
                      <td className="px-3 py-2 border border-gray-100 dark:border-gray-600 font-medium text-gray-800 dark:text-gray-100">{r.nomeEmpresa}</td>
                      <td className="px-3 py-2 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300">{r.cnpj || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300">{r.cidade || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300">{r.estado || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300">{r.nomeContato || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300">{r.cargo || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300">{r.telefone || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300">{r.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setImportPreview(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors">Cancelar</button>
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
    </div>
  )
}
