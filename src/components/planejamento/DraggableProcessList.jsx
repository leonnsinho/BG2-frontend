import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Sparkles } from 'lucide-react'

// ========== Componente de Processo Individual (Draggable) ==========
const SortableProcessCard = ({ 
  processo, 
  index, 
  hasCustomOrder,
  children,
  cores
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: processo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative
        ${isDragging ? 'z-50 shadow-2xl' : ''}
      `}
    >
      {/* Badge de Ordenação */}
      <div className="absolute -top-2 -left-2 z-10">
        {hasCustomOrder ? (
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
            <Sparkles className="h-3 w-3" />
          </div>
        ) : (
          <div className={`${cores.iconBg} text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white`}>
            <span className="font-bold text-xs">#{index + 1}</span>
          </div>
        )}
      </div>

      {/* Handle de Drag - Área de clique em todo o ícone */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-50 opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg hover:shadow-xl border border-[#373435]/10 hover:border-[#EBA500]/50 transition-all duration-200 cursor-grab active:cursor-grabbing outline-none focus:outline-none"
        style={{ touchAction: 'none' }}
        title="Arrastar para reordenar"
        type="button"
      >
        <GripVertical className="h-4 w-4 text-[#373435]/60 block" />
      </button>

      {/* Conteúdo do Card (passado como children) */}
      {children}
    </div>
  )
}

// ========== Componente Principal (Lista Draggable) ==========
const DraggableProcessList = ({ 
  processos, 
  onReorder, 
  cores,
  renderProcessCard 
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // 1px de movimento antes de iniciar drag (bem sensível)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms de press antes de iniciar drag (evita conflito com scroll)
        tolerance: 5, // 5px de tolerância
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = processos.findIndex(p => p.id === active.id)
    const newIndex = processos.findIndex(p => p.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newProcessos = arrayMove(processos, oldIndex, newIndex)
      
      // Callback com nova ordem
      onReorder(newProcessos)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={processos.map(p => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid gap-4 sm:gap-5 lg:gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {processos.map((processo, index) => (
            <SortableProcessCard
              key={processo.id}
              processo={processo}
              index={index}
              hasCustomOrder={processo.strategic_priority_order != null}
              cores={cores}
            >
              {renderProcessCard(processo, index, processos.length)}
            </SortableProcessCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default DraggableProcessList
