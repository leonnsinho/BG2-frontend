import { useRef, useCallback } from 'react'

/**
 * Permite "arrastar para rolar" horizontalmente com o mouse
 * (mantendo o botão pressionado) em um container com overflow-x.
 *
 * Uso:
 *   const dragProps = useDragToScroll()
 *   <div {...dragProps} ref={ref} className="overflow-x-auto">
 *
 * O onScroll original do container pode ser mantido separadamente.
 * Funciona apenas com mouse — em telas touch o scroll nativo continua intacto.
 */
export default function useDragToScroll() {
  const stateRef = useRef({
    isDown: false,
    isDragging: false,
    justDragged: false,
    startX: 0,
    startScrollLeft: 0,
  })

  const endDrag = useCallback((el) => {
    const s = stateRef.current
    if (s.isDragging) s.justDragged = true
    s.isDown = false
    s.isDragging = false
    if (el) {
      el.style.cursor = ''
      el.style.userSelect = ''
    }
  }, [])

  const onPointerDown = useCallback((e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const s = stateRef.current
    s.isDown = true
    s.isDragging = false
    s.justDragged = false
    s.startX = e.clientX
    s.startScrollLeft = e.currentTarget.scrollLeft
  }, [])

  const onPointerMove = useCallback((e) => {
    const s = stateRef.current
    if (e.pointerType !== 'mouse') return
    if (!(e.buttons & 1)) {
      endDrag(e.currentTarget)
      return
    }
    if (!s.isDown) return

    const dx = e.clientX - s.startX
    // Pequeno limiar para diferenciar clique de arraste
    if (!s.isDragging && Math.abs(dx) < 4) return

    if (!s.isDragging) {
      s.isDragging = true
      e.currentTarget.style.cursor = 'grabbing'
      e.currentTarget.style.userSelect = 'none'
      try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch {}
    }

    e.currentTarget.scrollLeft = s.startScrollLeft - dx
  }, [endDrag])

  const onPointerUp = useCallback((e) => {
    endDrag(e.currentTarget)
    try { e.currentTarget?.releasePointerCapture?.(e.pointerId) } catch {}
  }, [endDrag])

  // Suprime o clique disparado logo após um arraste (evita acionar botões sem querer)
  const onClickCapture = useCallback((e) => {
    if (stateRef.current.justDragged) {
      e.stopPropagation()
      e.preventDefault()
      stateRef.current.justDragged = false
    }
  }, [])

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onClickCapture,
    // Impede o drag nativo de imagens (avatares) dentro da tabela
    onDragStartCapture: (e) => e.preventDefault(),
  }
}
