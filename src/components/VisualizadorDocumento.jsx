import React, { useEffect, useState } from 'react'
import { X, Download, Loader2, ExternalLink, FileText } from 'lucide-react'
import { supabase } from '../services/supabase'
import { tipoVisualizavel } from '../utils/tipoDocumento'

// Celulares e tablets não exibem PDF dentro da página (iframe) de forma confiável
const ehDispositivoMovel = () =>
  typeof navigator !== 'undefined' &&
  (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.matchMedia('(max-width: 1024px)').matches))

// documento: { nome_original, storage_path, tipo_arquivo }
export default function VisualizadorDocumento({ documento, onClose, bucket = 'dfc-documentos' }) {
  const [url, setUrl] = useState(null)
  const [erro, setErro] = useState(false)
  const tipo = tipoVisualizavel(documento)
  const movel = ehDispositivoMovel()

  useEffect(() => {
    let urlCriada = null
    let cancelado = false
    ;(async () => {
      try {
        const { data, error } = await supabase.storage.from(bucket).download(documento.storage_path)
        if (error) throw error
        const blob = tipo === 'pdf' ? new Blob([data], { type: 'application/pdf' }) : data
        urlCriada = URL.createObjectURL(blob)
        if (!cancelado) setUrl(urlCriada)
      } catch (e) {
        console.error('Erro ao carregar documento para visualização:', e)
        if (!cancelado) setErro(true)
      }
    })()
    return () => {
      cancelado = true
      if (urlCriada) setTimeout(() => URL.revokeObjectURL(urlCriada), 1000)
    }
  }, [documento.storage_path, tipo, bucket])

  useEffect(() => {
    const aoTeclar = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onClose])

  // Links de verdade (não botões com script): é o que iOS e Android aceitam sem bloquear
  const botao = 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium'

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 flex flex-col" onClick={onClose}>
      <div
        className="flex items-center justify-between gap-2 pl-4 pr-2 py-2 bg-gray-900 text-white"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium truncate">{documento.nome_original}</p>
        <div className="flex items-center gap-1 flex-shrink-0">
          {url && (
            <a href={url} download={documento.nome_original} className={`${botao} bg-white/10 hover:bg-white/20`} aria-label="Baixar">
              <Download className="h-5 w-5" /> <span className="hidden sm:inline">Baixar</span>
            </a>
          )}
          <button type="button" onClick={onClose} aria-label="Fechar" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl hover:bg-white/20">
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-4" onClick={(e) => e.stopPropagation()}>
        {erro ? (
          <p className="text-white text-sm text-center px-6">Não foi possível abrir o documento. Tente novamente em instantes.</p>
        ) : !url ? (
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        ) : tipo === 'pdf' && movel ? (
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center space-y-4">
            <FileText className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-sm text-gray-700 break-words">{documento.nome_original}</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className={`${botao} w-full bg-blue-600 text-white`}>
              <ExternalLink className="h-5 w-5" /> Abrir PDF
            </a>
            <a href={url} download={documento.nome_original} className={`${botao} w-full bg-gray-100 text-gray-800`}>
              <Download className="h-5 w-5" /> Baixar
            </a>
          </div>
        ) : tipo === 'pdf' ? (
          <iframe src={url} title={documento.nome_original} className="w-full h-full bg-white rounded-lg" />
        ) : tipo === 'imagem' ? (
          <img src={url} alt={documento.nome_original} style={{ touchAction: 'pinch-zoom' }} className="max-w-full max-h-full object-contain rounded-lg" />
        ) : (
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center space-y-4">
            <FileText className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-700 break-words">{documento.nome_original}</p>
            <a href={url} download={documento.nome_original} className={`${botao} w-full bg-blue-600 text-white`}>
              <Download className="h-5 w-5" /> Baixar
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
