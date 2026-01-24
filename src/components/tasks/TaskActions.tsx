import { Pencil, Trash2 } from 'lucide-react'

interface TaskActionsProps {
    onEdit: () => void
    onDelete: () => void
}

export function TaskActions({ onEdit, onDelete }: TaskActionsProps) {
    return (
        <div className="flex items-center gap-1 shrink-0 w-[52px] justify-end relative z-10 bg-surface pl-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                }}
                className="p-1 text-on-surface-variant hover:text-primary hover:bg-primary/20 rounded-md transition-all"
                title="Editar"
            >
                <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                }}
                className="p-1 text-on-surface-variant hover:text-error hover:bg-error/20 rounded-md transition-all"
                title="Excluir"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}
