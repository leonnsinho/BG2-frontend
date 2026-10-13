import JSZip from 'jszip'

const BUCKET = 'dfc-documentos'
const LIMITE_BYTES = 250 * 1024 * 1024
const CONCORRENCIA = 4
const LOTE_IDS = 100

const CARACTERES_INVALIDOS = '\\/:*?"<>|'

const limparNome = (texto, max) =>
  [...String(texto ?? '')]
    .map(c => (c.charCodeAt(0) < 32 || CARACTERES_INVALIDOS.includes(c) ? ' ' : c))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim()

// Cada lançamento: { id, vencimento, descricao }. Baixa todos os anexos deles e entrega um .zip.
// tabelaDocumentos/colunaLancamento: dfc_entradas_documentos/entrada_id ou dfc_saidas_documentos/saida_id
export async function baixarAnexosZip({
  supabase,
  lancamentos,
  tabelaDocumentos,
  colunaLancamento,
  nomeZip,
  onProgress
}) {
  const porId = new Map(lancamentos.map(l => [l.id, l]))
  const ids = [...porId.keys()]

  const documentos = []
  for (let i = 0; i < ids.length; i += LOTE_IDS) {
    const lote = ids.slice(i, i + LOTE_IDS)
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from(tabelaDocumentos)
        .select(`id, ${colunaLancamento}, nome_original, storage_path, tamanho`)
        .in(colunaLancamento, lote)
        .order('id', { ascending: true })
        .range(from, from + 999)
      if (error) throw error
      documentos.push(...(data || []))
      if (!data || data.length < 1000) break
    }
  }

  if (documentos.length === 0) {
    return { vazio: true }
  }

  const totalBytes = documentos.reduce((s, d) => s + (d.tamanho || 0), 0)
  if (totalBytes > LIMITE_BYTES) {
    return { grande: true, totalBytes, total: documentos.length }
  }

  documentos.sort((a, b) => {
    const la = porId.get(a[colunaLancamento])?.vencimento || ''
    const lb = porId.get(b[colunaLancamento])?.vencimento || ''
    return la.localeCompare(lb) || (a.id < b.id ? -1 : 1)
  })

  const zip = new JSZip()
  const usados = new Set()
  let feitos = 0
  let falhas = 0

  const baixarUm = async (doc) => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).download(doc.storage_path)
      if (error) throw error

      const lanc = porId.get(doc[colunaLancamento])
      const base = `${lanc?.vencimento || 'sem-data'} - ${limparNome(lanc?.descricao, 60) || 'lancamento'} - ${limparNome(doc.nome_original, 80) || 'arquivo'}`
      let nome = base
      for (let n = 2; usados.has(nome.toLowerCase()); n++) {
        const ponto = base.lastIndexOf('.')
        nome = ponto > 0 ? `${base.slice(0, ponto)} (${n})${base.slice(ponto)}` : `${base} (${n})`
      }
      usados.add(nome.toLowerCase())
      zip.file(nome, data)
    } catch (erro) {
      console.error('Falha ao baixar anexo', doc.storage_path, erro)
      falhas += 1
    } finally {
      feitos += 1
      onProgress?.(feitos, documentos.length)
    }
  }

  let proximo = 0
  const trabalhadores = Array.from({ length: Math.min(CONCORRENCIA, documentos.length) }, async () => {
    while (proximo < documentos.length) {
      const doc = documentos[proximo++]
      await baixarUm(doc)
    }
  })
  await Promise.all(trabalhadores)

  if (falhas === documentos.length) {
    throw new Error('Nenhum anexo pôde ser baixado')
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeZip
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)

  return { baixados: documentos.length - falhas, falhas }
}
