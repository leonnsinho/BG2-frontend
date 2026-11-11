const centavos = (v) => Math.round(v * 100)

// total: valor total; n: nº de parcelas; editados: { [indice]: texto digitado pelo usuário }
// As parcelas editadas ficam fixas; o que sobra do total é dividido entre as demais.
export function calcularValoresParcelas(total, n, editados = {}) {
  const totalC = centavos(Number.isFinite(total) ? total : 0)
  const fixos = {}
  for (const [i, texto] of Object.entries(editados)) {
    const idx = Number(i)
    if (idx >= n) continue
    const num = parseFloat(String(texto).replace(/\./g, '').replace(',', '.'))
    const bruto = Number.isNaN(num) ? parseFloat(String(texto).replace(',', '.')) : num
    if (!Number.isNaN(bruto) && bruto >= 0) fixos[idx] = centavos(bruto)
  }
  const livres = Array.from({ length: n }, (_, i) => i).filter(i => !(i in fixos))
  const somaFixos = Object.values(fixos).reduce((a, b) => a + b, 0)
  const resto = totalC - somaFixos
  const valores = Array(n).fill(0)
  Object.entries(fixos).forEach(([i, c]) => { valores[i] = c })
  if (livres.length > 0 && resto >= 0) {
    const base = Math.floor(resto / livres.length)
    livres.forEach((i, k) => { valores[i] = base + (k === livres.length - 1 ? resto - base * livres.length : 0) })
  }
  const somaC = valores.reduce((a, b) => a + b, 0)
  return { valores: valores.map(c => c / 100), diferenca: (totalC - somaC) / 100, ok: totalC === somaC && resto >= 0 }
}

export const textoValor = (v) => v.toFixed(2).replace('.', ',')

// "2x de R$ 750,00" quando iguais; "Parcelado em 10x" quando os valores são diferentes
export function descreverParcelas(valores, formatar) {
  if (!valores.length) return ''
  const iguais = valores.every(v => Math.round(v * 100) === Math.round(valores[0] * 100))
  return iguais ? `${valores.length}x de ${formatar(valores[0])}` : `Parcelado em ${valores.length}x`
}
