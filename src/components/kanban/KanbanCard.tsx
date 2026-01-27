import { useState } from 'react'
import { Calendar, CheckSquare, MoreHorizontal, Trash2, ArrowRight, Check } from 'lucide-react'
import { Task, KanbanColumn } from '../../store/types'
import { useTaskStore } from '../../store/taskStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// DnD Kit
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface KanbanCardProps {
    task: Task
    allColumns?: KanbanColumn[]
    onMoveTask?: (taskId: string, columnId: string | null, newIndex: number) => void
}

export function KanbanCard({ task, allColumns = [], onMoveTask }: KanbanCardProps) {
    const { moveToTrash } = useTaskStore()
    const [menuOpen, setMenuOpen] = useState(false)

    // DnD Kit sortable
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 1,
    }

    // Simplified Date Display
    const dateDisplay = task.due_at ? format(new Date(task.due_at), 'd MMM', { locale: ptBR }) : null

    // Subtasks Progress
    const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0
    const totalSubtasks = task.subtasks?.length || 0
    const hasSubtasks = totalSubtasks > 0

    const handleMoveToColumn = (columnId: string | null, e: React.MouseEvent) => {
        e.stopPropagation()
        if (onMoveTask) {
            onMoveTask(task.id, columnId, 0)
        }
        setMenuOpen(false)
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        moveToTrash(task.id)
        setMenuOpen(false)
    }

    // Sort columns by order
    const sortedColumns = [...allColumns].sort((a, b) => (a.order || 0) - (b.order || 0))

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group relative touch-none"
        >
            <div className={`bg-surface rounded-lg p-3 border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'border-primary shadow-lg' : 'border-outline-variant/20 hover:border-primary/30'}`}>
                <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-medium leading-snug line-clamp-2 flex-1 ${task.status === 'done' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                        {task.title}
                    </span>

                    <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 p-1 -mr-1 -mt-1 rounded text-on-surface-variant/50 hover:bg-surface-variant hover:text-on-surface transition-all shrink-0"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>

                {/* Badges */}
                {(dateDisplay || hasSubtasks) && (
                    <div className="flex items-center gap-1.5 mt-2">
                        {dateDisplay && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant/70 bg-surface-variant/30 px-1.5 py-0.5 rounded">
                                <Calendar className="w-2.5 h-2.5" />
                                {dateDisplay}
                            </div>
                        )}
                        {hasSubtasks && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant/70 bg-surface-variant/30 px-1.5 py-0.5 rounded">
                                <CheckSquare className="w-2.5 h-2.5" />
                                {completedSubtasks}/{totalSubtasks}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Card Menu */}
            {menuOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
                    <div
                        className="absolute top-full left-0 mt-1 w-48 bg-surface rounded-xl shadow-xl border border-outline-variant/30 z-50 py-1 overflow-hidden"
                    >
                        {/* Move To Section */}
                        {sortedColumns.length > 0 && (
                            <>
                                <div className="px-3 py-1.5 text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-wider flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" />
                                    Mover para
                                </div>
                                {sortedColumns.map(col => (
                                    <button
                                        key={col.id}
                                        onClick={(e) => handleMoveToColumn(col.id, e)}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-primary/5 transition-colors flex items-center gap-2 ${col.id === task.column_id ? 'bg-primary/5 text-primary' : 'text-on-surface hover:text-primary'}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full bg-${col.color}-500`} />
                                        <span className="flex-1">{col.title}</span>
                                        {col.id === task.column_id && <Check className="w-3 h-3" />}
                                    </button>
                                ))}
                                <div className="border-t border-outline-variant/20 my-1" />
                            </>
                        )}

                        {/* Delete */}
                        <button
                            onClick={handleDelete}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-error/10 text-error flex items-center gap-2"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
