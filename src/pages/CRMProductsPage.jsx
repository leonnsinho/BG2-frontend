import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Package, Plus, Edit2, Trash2,
  Save, X, Download, Upload, FileSpreadsheet, Search
} from 'lucide-react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import SuperAdminBanner from '../components/SuperAdminBanner'
import toast from '@/lib/toast'

const INP = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/40 focus:border-[#EBA500] bg-white'

const EMPTY = { nome: '', descricao: '', valor: '', unidade: '' }

const fmtMoney = (v) => {
  if (!v && v !== 0) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function CRMProductsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()

  const adminCompanyId = searchParams.get('from') === 'admin' ? searchParams.get('companyId') : null
  const companyId = adminCompanyId || profile?.user_companies?.find(uc => uc.is_active)?.company_id
  const adminSuffix = adminCompanyId ? `?from=admin&companyId=${adminCompanyId}` : ''

  const [products, setProducts] = useState([])
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
    if (companyId) loadProducts()
    else setLoading(false)
  }, [companyId])

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
        nome: form.nome,
        descricao: form.descricao || null,
        valor: form.valor !== '' ? parseFloat(String(form.valor).replace(',', '.')) || null : null,
        unidade: form.unidade || null,
        company_id: companyId,
        updated_at: new Date().toISOString(),
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

  // ── Import ──
  const parseFile = async (file) => {
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
      return text.split('\n').slice(1).filter(l => l.trim())
        .map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')))
    }
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImporting(true)
    try {
      const rows = await parseFile(file)
      const preview = rows
        .filter(r => r[0]?.trim())
        .map(([nome = '', descricao = '', valor = '', unidade = '']) => ({
          nome: nome.trim(), descricao: descricao.trim(),
          valor: valor.trim(), unidade: unidade.trim(),
        }))
      if (!preview.length) { toast.error('Nenhum produto válido encontrado'); return }
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
        const valor = r.valor ? parseFloat(r.valor.replace(',', '.')) || null : null
        const { error } = await supabase.from('crm_products').insert([{
          nome: r.nome, descricao: r.descricao || null,
          valor, unidade: r.unidade || null,
          company_id: companyId, created_by: user?.id,
        }])
        if (error) errors++; else inserted++
      }
      toast.success(
        `${inserted} produto${inserted !== 1 ? 's' : ''} importado${inserted !== 1 ? 's' : ''}` +
        (errors ? ` (${errors} erro${errors !== 1 ? 's' : ''})` : '')
      )
      setImportPreview(null)
      loadProducts()
    } catch (err) { toast.error('Erro na importação: ' + err.message) }
    finally { setImporting(false) }
  }

  const downloadTemplateXlsx = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['nome', 'descricao', 'valor', 'unidade'],
      ['Consultoria Mensal', 'Consultoria estratégica mensal', '2500.00', 'por mês'],
      ['Licença Software', 'Licença anual do sistema', '1200.00', 'por ano'],
    ])
    ws['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 12 }, { wch: 15 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos')
    XLSX.writeFile(wb, 'modelo_importacao_produtos.xlsx')
  }

  const downloadTemplateCsv = () => {
    const csv = 'nome,descricao,valor,unidade\nConsultoria Mensal,Consultoria estratégica mensal,2500.00,por mês\nLicença Software,Licença anual do sistema,1200.00,por ano'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'modelo_importacao_produtos.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = search.trim()
    ? products.filter(p =>
        (p.nome || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.descricao || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.unidade || '').toLowerCase().includes(search.toLowerCase())
      )
    : products

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
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-emerald-50/60 dark:from-emerald-900/20 to-transparent">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Produtos / Serviços</h1>
                  <p className="text-xs text-gray-400 mt-0.5">{products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}</p>
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
                {!showForm && (
                  <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Novo Produto
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
                  placeholder="Buscar por nome, descrição ou unidade..."
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
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{editing ? 'Editar Produto' : 'Novo Produto'}</h3>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nome *</label>
                  <input className={INP} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Consultoria Mensal" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descrição</label>
                  <textarea
                    className={INP + ' resize-none'}
                    rows={3}
                    value={form.descricao}
                    onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                    placeholder="Detalhes do produto ou serviço..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valor (R$)</label>
                    <input
                      type="number" min="0" step="0.01"
                      className={INP}
                      value={form.valor}
                      onChange={e => setForm(p => ({ ...p, valor: e.target.value }))}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Unidade</label>
                    <input
                      className={INP}
                      value={form.unidade}
                      onChange={e => setForm(p => ({ ...p, unidade: e.target.value }))}
                      placeholder="por mês, por licença..."
                    />
                  </div>
                </div>
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
                <Package className="h-12 w-12 text-gray-200" />
                <p className="text-base font-semibold text-gray-600 dark:text-gray-300">
                  {search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado ainda'}
                </p>
                {!search && (
                  <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl">
                    <Plus className="h-4 w-4" /> Adicionar primeiro produto
                  </button>
                )}
              </div>
            ) : (
              /* ── List ── */
              <div className="space-y-2">
                {filtered.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 group transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{p.nome}</p>
                      {p.descricao && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{p.descricao}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.valor ? fmtMoney(p.valor) + (p.unidade ? ' · ' + p.unidade : '') : 'Sem valor definido'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-200 rounded-lg" title="Editar">
                        <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Remover">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Confirmar importação de produtos</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {importPreview.rows.length} produto{importPreview.rows.length !== 1 ? 's' : ''} encontrado{importPreview.rows.length !== 1 ? 's' : ''}. Revise antes de confirmar.
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
                    {['Nome', 'Descrição', 'Valor', 'Unidade'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.rows.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-700/50'}>
                      <td className="px-3 py-2 border border-gray-100 dark:border-gray-600 font-medium text-gray-800 dark:text-gray-100">{r.nome}</td>
                      <td className="px-3 py-2 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300">{r.descricao || '—'}</td>
                      <td className="px-3 py-2 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                        {r.valor ? fmtMoney(parseFloat(r.valor.replace(',', '.')) || 0) : '—'}
                      </td>
                      <td className="px-3 py-2 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300">{r.unidade || '—'}</td>
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
