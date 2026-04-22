import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Users, Building2, Plus, Edit2, Trash2,
  Save, X, Download, Upload, FileSpreadsheet, Search
} from 'lucide-react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import SuperAdminBanner from '../components/SuperAdminBanner'
import toast from '@/lib/toast'

const INP = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/40 focus:border-[#EBA500] bg-white'
const SEL = INP + ' cursor-pointer'

const EMPTY = { nome: '', cargo: '', email: '', telefone: '', lead_id: '', observacoes: '' }

export default function CRMContactsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()

  const adminCompanyId = searchParams.get('from') === 'admin' ? searchParams.get('companyId') : null
  const companyId = adminCompanyId || profile?.user_companies?.find(uc => uc.is_active)?.company_id
  const adminSuffix = adminCompanyId ? `?from=admin&companyId=${adminCompanyId}` : ''

  const [contacts, setContacts] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState(null)
  const importRef = useRef(null)

  useEffect(() => {
    if (companyId) loadAll()
    else setLoading(false)
  }, [companyId])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from('crm_contacts').select('*').eq('company_id', companyId).order('nome'),
      supabase.from('crm_leads').select('id, nome_empresa').eq('company_id', companyId).order('nome_empresa'),
    ])
    const leadsArr = l || []
    setLeads(leadsArr)
    setContacts((c || []).map(contact => ({
      ...contact,
      crm_leads: leadsArr.find(lead => lead.id === contact.lead_id)
        ? { nome_empresa: leadsArr.find(lead => lead.id === contact.lead_id).nome_empresa }
        : null,
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
      if (editing) {
        const { error } = await supabase.from('crm_contacts').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        payload.created_by = user?.id
        const { error } = await supabase.from('crm_contacts').insert([payload])
        if (error) throw error
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

  // ── Import ──
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImporting(true)
    try {
      const isXlsx = /\.(xlsx|xls)$/i.test(file.name)
      let rows
      if (isXlsx) {
        const buffer = await file.arrayBuffer()
        const wb = XLSX.read(buffer, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
          .slice(1)
          .filter(r => r.some(c => String(c).trim()))
          .map(r => r.map(c => String(c ?? '').trim()))
      } else {
        const text = await file.text()
        rows = text.split('\n').slice(1).filter(l => l.trim())
          .map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')))
      }
      const preview = rows
        .filter(r => r[0]?.trim())
        .map(([nome = '', cargo = '', email = '', telefone = '', empresa = '', observacoes = '']) => ({
          nome: nome.trim(), cargo: cargo.trim(), email: email.trim(),
          telefone: telefone.trim(), empresa: empresa.trim(), observacoes: observacoes.trim(),
        }))
      if (!preview.length) { toast.error('Nenhum contato válido encontrado'); return }
      setImportPreview({ rows: preview })
    } catch (err) { toast.error('Erro ao processar arquivo: ' + err.message) }
    finally { setImporting(false) }
  }

  const confirmImport = async () => {
    if (!importPreview) return
    setImporting(true)
    try {
      let inserted = 0, errors = 0
      for (const r of importPreview.rows) {
        const leadMatch = r.empresa ? leads.find(l => l.nome_empresa.toLowerCase() === r.empresa.toLowerCase()) : null
        const { error } = await supabase.from('crm_contacts').insert([{
          nome: r.nome, cargo: r.cargo || null, email: r.email || null,
          telefone: r.telefone || null, observacoes: r.observacoes || null,
          lead_id: leadMatch?.id || null, company_id: companyId, created_by: user?.id,
        }])
        if (error) errors++; else inserted++
      }
      toast.success(
        `${inserted} contato${inserted !== 1 ? 's' : ''} importado${inserted !== 1 ? 's' : ''}` +
        (errors ? ` (${errors} erro${errors !== 1 ? 's' : ''})` : '')
      )
      setImportPreview(null)
      loadAll()
    } catch (err) { toast.error('Erro na importação: ' + err.message) }
    finally { setImporting(false) }
  }

  const downloadTemplateXlsx = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['nome', 'cargo', 'email', 'telefone', 'empresa', 'observacoes'],
      ['João Silva', 'Diretor Comercial', 'joao@empresa.com', '(11) 99999-9999', 'Acme Corp', ''],
      ['Maria Souza', 'Gerente de TI', 'maria@tech.com', '(21) 98888-7777', 'Tech Ltda', ''],
    ])
    ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 16 }, { wch: 20 }, { wch: 20 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contatos')
    XLSX.writeFile(wb, 'modelo_importacao_contatos.xlsx')
  }

  const downloadTemplateCsv = () => {
    const csv = 'nome,cargo,email,telefone,empresa,observacoes\nJoão Silva,Diretor Comercial,joao@empresa.com,(11) 99999-9999,Acme Corp,\nMaria Souza,Gerente de TI,maria@tech.com,(21) 98888-7777,Tech Ltda,'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'modelo_importacao_contatos.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = search.trim()
    ? contacts.filter(c =>
        (c.nome || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.cargo || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.crm_leads?.nome_empresa || '').toLowerCase().includes(search.toLowerCase())
      )
    : contacts

  return (
    <div className="min-h-screen bg-white">
      <SuperAdminBanner />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Breadcrumb / back ── */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/crm' + adminSuffix)}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao CRM
          </button>
        </div>

        {/* ── Header card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/60 to-transparent">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Contatos</h1>
                  <p className="text-xs text-gray-400 mt-0.5">{contacts.length} contato{contacts.length !== 1 ? 's' : ''} cadastrado{contacts.length !== 1 ? 's' : ''}</p>
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
                  onClick={() => navigate('/crm/leads' + adminSuffix)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
                >
                  <Building2 className="h-3.5 w-3.5" /> Ver Leads
                </button>
                {!showForm && (
                  <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Novo Contato
                  </button>
                )}
              </div>
            </div>

            {/* Search bar */}
            {!showForm && (
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] bg-white"
                  placeholder="Buscar por nome, cargo, e-mail ou empresa..."
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
                  <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="h-4 w-4 text-gray-500" />
                  </button>
                  <h3 className="text-sm font-bold text-gray-700">{editing ? 'Editar Contato' : 'Novo Contato'}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                    <input className={INP} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="João Silva" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                    <input className={INP} value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} placeholder="Diretor Comercial" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Empresa (Lead)</label>
                    <select className={SEL} value={form.lead_id} onChange={e => setForm(p => ({ ...p, lead_id: e.target.value }))}>
                      <option value="">Sem vínculo</option>
                      {leads.map(l => <option key={l.id} value={l.id}>{l.nome_empresa}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                    <input type="email" className={INP} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="joao@empresa.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                    <input type="tel" className={INP} value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(11) 99999-9999" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                    <textarea
                      className={INP + ' resize-none'}
                      rows={3}
                      value={form.observacoes}
                      onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                      placeholder="Notas sobre este contato..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl disabled:opacity-60">
                    {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save className="h-4 w-4" />} Salvar
                  </button>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              /* ── Empty ── */
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <Users className="h-12 w-12 text-gray-200" />
                <p className="text-base font-semibold text-gray-600">
                  {search ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado ainda'}
                </p>
                {!search && (
                  <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl">
                    <Plus className="h-4 w-4" /> Adicionar primeiro contato
                  </button>
                )}
              </div>
            ) : (
              /* ── List ── */
              <div className="space-y-2">
                {filtered.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 group transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 text-sm font-bold text-purple-600">
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {c.nome}
                        {c.cargo && <span className="font-normal text-gray-500"> · {c.cargo}</span>}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {[c.crm_leads?.nome_empresa, c.email, c.telefone].filter(Boolean).join(' · ') || 'Sem detalhes'}
                      </p>
                      {c.observacoes && (
                        <p className="text-xs text-gray-400 truncate mt-0.5 italic">{c.observacoes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-200 rounded-lg" title="Editar">
                        <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Remover">
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Confirmar importação de contatos</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {importPreview.rows.length} contato{importPreview.rows.length !== 1 ? 's' : ''} encontrado{importPreview.rows.length !== 1 ? 's' : ''}. Revise antes de confirmar.
                </p>
              </div>
              <button onClick={() => setImportPreview(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-4">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {['Nome', 'Cargo', 'E-mail', 'Telefone', 'Empresa'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.rows.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-3 py-2 border border-gray-100 font-medium text-gray-800">{r.nome}</td>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.cargo || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.email || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.telefone || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 text-gray-600">{r.empresa || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setImportPreview(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
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
