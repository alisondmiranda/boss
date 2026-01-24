import { Check } from 'lucide-react'
import { PlusIcon } from '../icons/PlusIcon'

interface TaskAddSubtaskProps {
    value: string
    onChange: (val: string) => void
    onAdd: () => void
    className?: string
}

export function TaskAddSubtask({ value, onChange, onAdd, className = '' }: TaskAddSubtaskProps) {
    return (
        <div className={`flex items-center gap-2 pt-2 ${className}`}>
            <div className="flex items-center gap-2 flex-1 group">
                <div className="w-5 h-5 flex items-center justify-center text-primary/60 group-hover:text-primary transition-colors">
                    <PlusIcon className="w-4 h-4" />
                </div>
                <input
                    type="text"
                    placeholder="Adicionar subtarefa..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            e.stopPropagation()
                            onAdd()
                        }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent border-b border-outline-variant/30 py-1 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-all rounded-t-sm hover:border-outline-variant/60"
                />
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onAdd()
                }}
                className={`p-1.5 rounded-full transition-all ${value.trim() ? 'bg-primary text-on-primary hover:brightness-110 shadow-sm' : 'bg-surface-variant/50 text-on-surface-variant/50 cursor-not-allowed'}`}
                disabled={!value.trim()}
            >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
        </div>
    )
}
