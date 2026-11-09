export function tipoVisualizavel(doc) {
  const nome = (doc?.nome_original || '').toLowerCase()
  const tipo = (doc?.tipo_arquivo || '').toLowerCase()
  if (tipo === 'application/pdf' || nome.endsWith('.pdf')) return 'pdf'
  if (tipo.startsWith('image/') && tipo !== 'image/svg+xml') return 'imagem'
  if (/\.(jpe?g|png|gif|webp|bmp)$/.test(nome)) return 'imagem'
  return null
}
