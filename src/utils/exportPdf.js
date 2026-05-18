import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Exporta uma tabela para PDF com cabeçalho padronizado.
 *
 * @param {object} opts
 * @param {string}   opts.title        - Título do relatório
 * @param {string}   [opts.subtitle]   - Subtítulo / período / filtros aplicados
 * @param {string[][]} opts.head       - Array de cabeçalhos (array de strings)
 * @param {string[][]} opts.body       - Array de linhas (array de strings)
 * @param {string}   [opts.filename]   - Nome do arquivo sem extensão
 * @param {object[]} [opts.stats]      - [{label, value}] resumo antes da tabela
 */
export function exportTableToPdf({ title, subtitle, head, body, filename = 'relatorio', stats = [] }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 32
  let cursorY = 36

  // ── Faixa de cabeçalho ──────────────────────────────────────────────────────
  doc.setFillColor(30, 41, 59)            // slate-800
  doc.rect(0, 0, pageWidth, 54, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin, 24)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)         // slate-400
  const now = new Date().toLocaleString('pt-BR')
  doc.text(`Exportado em: ${now}`, margin, 40)

  if (subtitle) {
    doc.text(subtitle, pageWidth - margin, 40, { align: 'right' })
  }

  cursorY = 70

  // ── Cards de resumo (stats) ─────────────────────────────────────────────────
  if (stats.length > 0) {
    const cardW = (pageWidth - margin * 2 - (stats.length - 1) * 10) / stats.length
    stats.forEach((s, i) => {
      const x = margin + i * (cardW + 10)
      doc.setFillColor(248, 250, 252)     // gray-50
      doc.setDrawColor(226, 232, 240)     // gray-200
      doc.roundedRect(x, cursorY, cardW, 38, 4, 4, 'FD')

      doc.setTextColor(100, 116, 139)     // gray-500
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.text(String(s.label), x + 10, cursorY + 13)

      doc.setTextColor(15, 23, 42)        // gray-900
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(String(s.value), x + 10, cursorY + 30)
    })
    cursorY += 52
  }

  // ── Tabela ───────────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: cursorY,
    head: [head],
    body,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      cellPadding: { top: 5, bottom: 5, left: 7, right: 7 },
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    didDrawPage: (data) => {
      // Rodapé com numeração de página
      const pageCount = doc.internal.getNumberOfPages()
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 14,
        { align: 'right' }
      )
      doc.text('Partimap — Relatório administrativo', margin, doc.internal.pageSize.getHeight() - 14)
    },
  })

  doc.save(`${filename}.pdf`)
}
