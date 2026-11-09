import React, { useEffect, useState } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import { supabase } from '../services/supabase'
import { tipoVisualizavel } from '../utils/tipoDocumento'

const BUCKET = 'dfc-documentos'

export default function VisualizadorDocumento({ documento, onClose }) {
  const [url, setUrl] = useState(null)
  const [erro, setErro] = useState(false)
  const tipo = tipoVisualizavel(documento)

  useEffect(() => {
    let urlCriada = null
    let cancelado = false
    ;(async () => {
      try {
        const { data, error } = await supabase.storage.from(BUCKET).download(documento.storage_path)
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
      if (urlCriada) URL.revokeObjectURL(urlCriada)
    }
  }, [documento.storage_path, tipo])

  useEffect(() => {
    const aoTeclar = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onClose])

  const baixar = () => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = documento.nome_original
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-900 text-white" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium truncate">{documento.nome_original}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" onClick={baixar} disabled={!url} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40">
            <Download className="h-4 w-4" /> Baixar
          </button>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-1.5 rounded-lg hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {erro ? (
          <p className="text-white text-sm">Não foi possível abrir o documento. Tente baixar.</p>
        ) : !url ? (
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        ) : tipo === 'pdf' ? (
          <iframe src={url} title={documento.nome_original} className="w-full h-full bg-white rounded-lg" />
        ) : (
          <img src={url} alt={documento.nome_original} className="max-w-full max-h-full object-contain rounded-lg" />
        )}
      </div>
    </div>
  )
}
