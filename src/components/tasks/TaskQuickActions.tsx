import { motion } from 'framer-motion'
import React from 'react'
import { Calendar, AlignLeft, ListChecks, Repeat } from 'lucide-react'
import { Task } from '../../store/taskStore'

interface TaskQuickActionsProps {
    task: Task
    updateTask: (id: string, updates: Partial<Task>) => void
    showCalendar: boolean
    setShowCalendar: (val: boolean) => void
    showDescription: boolean
    handleToggleDescription: (e: React.MouseEvent) => void
    showSubtasks: boolean
    handleToggleSubtasks: (e: React.MouseEvent) => void
    onRecurrenceClick?: (task: Task) => void
}

export function TaskQuickActions({
    task, updateTask,
    showCalendar, setShowCalendar,
    showDescription, handleToggleDescription,
    showSubtasks, handleToggleSubtasks,
    onRecurrenceClick
}: TaskQuickActionsProps) {
    const hasSubtasks = task.subtasks && task.subtasks.length > 0

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="overflow-hidden"
        >
            <div className="flex flex-wrap gap-2 py-1.5">
                <button
                    onClick={() => updateTask(task.id, { due_at: new Date().toISOString() })}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-variant hover:bg-primary/10 text-[11px] font-bold text-on-surface transition-colors border border-transparent hover:border-primary/20"
                >
                    Hoje
                </button>
                <button
                    onClick={() => {
                        const tomorrow = new Date()
                        tomorrow.setDate(tomorrow.getDate() + 1)
                        updateTask(task.id, { due_at: tomorrow.toISOString() })
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-variant hover:bg-primary/10 text-[11px] font-bold text-on-surface transition-colors border border-transparent hover:border-primary/20"
                >
                    Amanhã
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors border ${showCalendar ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surface-variant hover:bg-primary/10 text-on-surface border-transparent hover:border-primary/20'}`}
                        title="Calendário"
                    >
                        <Calendar className="w-3.5 h-3.5" />
                    </button>
                </div>

                <button
                    onClick={handleToggleDescription}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors border ${showDescription ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surface-variant hover:bg-primary/10 text-on-surface border-transparent hover:border-primary/20'}`}
                    title="Descrição"
                >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Descrição</span>
                </button>

                <button
                    onClick={handleToggleSubtasks}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors border ${showSubtasks ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surface-variant hover:bg-primary/10 text-on-surface border-transparent hover:border-primary/20'}`}
                    title="Subtarefas"
                >
                    <ListChecks className="w-3.5 h-3.5" />
                    <span>Subtarefas</span>
                    {hasSubtasks && (
                        <span className="text-[10px] opacity-70">({task.subtasks!.filter(s => s.completed).length}/{task.subtasks!.length})</span>
                    )}
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onRecurrenceClick?.(task)
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-variant hover:bg-primary/10 text-[11px] font-bold text-on-surface transition-colors border border-transparent hover:border-primary/20"
                    title="Recorrência"
                >
                    <Repeat className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    )
}
