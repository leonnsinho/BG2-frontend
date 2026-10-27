const HEADER_ROW = 10
const FORMATO_DATA = 'dd/mm/yyyy'
const FORMATO_VALOR = '#,##0.00'
const LARGURAS_COLUNAS = [12, 58, 32, 28, 16, 16]
const EMU_POR_PIXEL = 9525
const BORDA_LEVE = { style: 'thin', color: { argb: 'FFE5E7EB' } }

const arredondar = (v) => Math.round((Number(v) || 0) * 100) / 100

const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '')

// 'YYYY-MM-DD' -> data sem deslocamento de fuso (o ExcelJS grava datas em UTC)
const dataExcel = (iso) => {
  if (!iso) return null
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d))
}

// dados: { linhas, totalEntradas, totalSaidas, saldoInicialPeriodo, saldoFinalPeriodo, categoriaMap, itemMap }
// logoPlataforma / logo (opcionais): { base64, extension: 'png' | 'jpeg' | 'gif', width, height }
// Linha 1: logo da plataforma pequeno e centralizado. Linhas 2-5: logo da empresa centralizado logo abaixo.
// Depois: nome, título e data de geração, centralizados.
export function montarPlanilhaDFCPeriodo({ ExcelJS, empresa, inicio, fim, dados, logo, logoPlataforma }) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('DFC do período')
  ws.columns = LARGURAS_COLUNAS.map(width => ({ width }))

  const ALTURA_LINHA_PT = 24 // 24pt = 32px
  ws.getRow(1).height = ALTURA_LINHA_PT
  for (let r = 2; r <= 5; r++) ws.getRow(r).height = logo?.base64 ? ALTURA_LINHA_PT : 4
  ws.getRow(9).height = 8

  const centralizado = { horizontal: 'center', vertical: 'middle' }

  ws.mergeCells('A6:F6')
  ws.getCell('A6').value = empresa
  ws.getCell('A6').font = { bold: true, size: 14, color: { argb: 'FF1F2937' } }
  ws.getCell('A6').alignment = centralizado

  ws.mergeCells('A7:F7')
  ws.getCell('A7').value = `DFC de ${dataBR(inicio)} até ${dataBR(fim)}`
  ws.getCell('A7').font = { bold: true, size: 12, color: { argb: 'FF444444' } }
  ws.getCell('A7').alignment = centralizado

  ws.mergeCells('A8:F8')
  ws.getCell('A8').value = `Gerado em ${new Date().toLocaleString('pt-BR')}`
  ws.getCell('A8').font = { size: 9, color: { argb: 'FF999999' } }
  ws.getCell('A8').alignment = centralizado

  // Posição em EMU (nativeCol/nativeColOff) porque o ExcelJS calcula frações de coluna de forma imprecisa
  const largurasPx = LARGURAS_COLUNAS.map(w => Math.trunc(w * 7 + 5))
  const larguraTotalPx = largurasPx.reduce((a, b) => a + b, 0)
  const ancoraHorizontalPx = (xPx) => {
    let acumulado = 0
    for (let c = 0; c < largurasPx.length; c++) {
      if (xPx < acumulado + largurasPx[c]) return { nativeCol: c, nativeColOff: Math.round((xPx - acumulado) * EMU_POR_PIXEL) }
      acumulado += largurasPx[c]
    }
    return { nativeCol: largurasPx.length - 1, nativeColOff: 0 }
  }

  const centroPx = larguraTotalPx / 2

  // Logo da plataforma pequeno, centralizado logo acima do logo da empresa
  if (logoPlataforma?.base64) {
    const id = wb.addImage({ base64: logoPlataforma.base64, extension: logoPlataforma.extension })
    ws.addImage(id, {
      tl: {
        ...ancoraHorizontalPx(Math.max(0, centroPx - logoPlataforma.width / 2)),
        nativeRow: 0,
        nativeRowOff: 2 * EMU_POR_PIXEL
      },
      ext: { width: logoPlataforma.width, height: logoPlataforma.height }
    })
  }

  if (logo?.base64) {
    const id = wb.addImage({ base64: logo.base64, extension: logo.extension })
    ws.addImage(id, {
      tl: {
        ...ancoraHorizontalPx(Math.max(0, centroPx - logo.width / 2)),
        nativeRow: 1,
        nativeRowOff: 4 * EMU_POR_PIXEL
      },
      ext: { width: logo.width, height: logo.height }
    })
  }

  const cabecalho = ws.getRow(HEADER_ROW)
  cabecalho.values = ['Data', 'Histórico', 'Categoria', 'Grupo', 'Entrada', 'Saída']
  cabecalho.height = 20
  cabecalho.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
    cell.alignment = { vertical: 'middle', horizontal: cell.col >= 5 ? 'right' : 'left' }
  })

  const { linhas, categoriaMap, itemMap } = dados
  const primeira = HEADER_ROW + 1

  linhas.forEach((l, i) => {
    const row = ws.getRow(primeira + i)
    row.values = [
      dataExcel(l.vencimento),
      l.descricao || '',
      itemMap[l.item_id] || '',
      categoriaMap[l.categoria] || '',
      l.tipo === 'entrada' ? arredondar(l.valor) : null,
      l.tipo === 'saida' ? arredondar(l.valor) : null
    ]
    row.getCell(1).numFmt = FORMATO_DATA
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'top' }
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' }
    row.getCell(3).alignment = { vertical: 'top' }
    row.getCell(4).alignment = { vertical: 'top' }
    row.getCell(5).numFmt = FORMATO_VALOR
    row.getCell(6).numFmt = FORMATO_VALOR
    row.getCell(5).alignment = { vertical: 'top' }
    row.getCell(6).alignment = { vertical: 'top' }
    for (let c = 1; c <= 6; c++) row.getCell(c).border = { bottom: BORDA_LEVE }
  })

  const ultima = primeira + linhas.length - 1
  const linhaTotais = ultima + 1
  const linhaSaldoInicial = linhaTotais + 1
  const linhaSaldoFinal = linhaTotais + 2

  const totalEntradas = arredondar(dados.totalEntradas)
  const totalSaidas = arredondar(dados.totalSaidas)
  const saldoInicial = arredondar(dados.saldoInicialPeriodo)
  const saldoFinal = arredondar(dados.saldoFinalPeriodo)

  const totais = ws.getRow(linhaTotais)
  totais.getCell(1).value = 'Totais'
  totais.getCell(5).value = linhas.length > 0
    ? { formula: `SUM(E${primeira}:E${ultima})`, result: totalEntradas }
    : totalEntradas
  totais.getCell(6).value = linhas.length > 0
    ? { formula: `SUM(F${primeira}:F${ultima})`, result: totalSaidas }
    : totalSaidas

  const saldoIni = ws.getRow(linhaSaldoInicial)
  saldoIni.getCell(1).value = 'Saldo inicial'
  saldoIni.getCell(6).value = saldoInicial

  const saldoFim = ws.getRow(linhaSaldoFinal)
  saldoFim.getCell(1).value = 'Saldo final'
  saldoFim.getCell(6).value = {
    formula: `F${linhaSaldoInicial}+E${linhaTotais}-F${linhaTotais}`,
    result: saldoFinal
  }

  for (const r of [linhaTotais, linhaSaldoInicial, linhaSaldoFinal]) {
    const row = ws.getRow(r)
    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c)
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      cell.border = r === linhaTotais
        ? { bottom: BORDA_LEVE, top: { style: 'thin', color: { argb: 'FF1F2937' } } }
        : { bottom: BORDA_LEVE }
      if (c >= 5) cell.numFmt = FORMATO_VALOR
    }
  }

  ws.views = [{ state: 'frozen', ySplit: HEADER_ROW }]
  if (linhas.length > 0) {
    ws.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: ultima, column: 6 } }
  }

  return wb
}
