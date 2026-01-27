import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Repeat, AlignLeft, ListChecks, Check, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { format, isPast, isToday, isTomorrow, isThisYear, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Task } from '../../store/taskStore'
import { Sector } from '../../store/settingsStore'
import { TaskCheckbox } from './TaskCheckbox'
import { TaskSectors } from './TaskSectors'
import { SubtaskList } from './SubtaskList'
import { TaskAddSubtask } from './TaskAddSubtask'

interface TaskDetailBottomSheetProps {
    task: Task | null
    isOpen: boolean
    onClose: () => void
    updateTask: (id: string, updates: Partial<Task>) => void
    toggleTask: (id: string, status: Task['status']) => void
    addSubtask: (taskId: string, title: string) => Promise<void>
    updateSubtask: (subtaskId: string, title: string, details?: string) => Promise<void>
    deleteSubtask: (subtaskId: string) => Promise<void>
    toggleSubtask: (subtaskId: string) => Promise<void>
    reorderSubtasks: (taskId: string, newSubtasks: any[]) => Promise<void>
    handleMoveToTrash: (id: string) => void
    sectors: Sector[]
    toggleTaskSector: (taskId: string, sectorId: string, allSectors: { id: string; label: string }[]) => Promise<void>
}

export function TaskDetailBottomSheet({
    task, isOpen, onClose, updateTask, toggleTask,
    addSubtask, deleteSubtask, toggleSubtask, reorderSubtasks,
    handleMoveToTrash, sectors, toggleTaskSector
}: TaskDetailBottomSheetProps) {

    // Internal state for editing
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

    // Sync state when task changes
    useEffect(() => {
        if (task) {
            setTitle(task.title)
            setDescription(task.details || '')
        }
    }, [task])

    if (!task) return null

    // Date formatting helper (duplicated from TaskItem - could be util)
    const getDueDateDisplay = () => {
        if (!task.due_at) return null
        const date = new Date(task.due_at)
        const isOverdue = isPast(date) && !isToday(date) && task.status !== 'done'
        let text = ''
        if (isToday(date)) text = 'Hoje'
        else if (isTomorrow(date)) text = 'Amanhã'
        else if (isOverdue) text = formatDistanceToNow(date, { locale: ptBR, addSuffix: true })
        else if (isThisYear(date)) text = format(date, 'd MMM', { locale: ptBR })
        else text = format(date, 'd MMM yyyy', { locale: ptBR })

        return { text, isOverdue, date }
    }

    const dateDisplay = getDueDateDisplay()

    const handleSaveTitle = () => {
        if (title !== task.title) updateTask(task.id, { title })
        setIsEditingTitle(false)
    }

    const handleSaveDescription = () => {
        if (description !== (task.details || '')) updateTask(task.id, { details: description })
    }

    const handleAddSubtaskWrapper = async () => {
        if (!newSubtaskTitle.trim()) return
        await addSubtask(task.id, newSubtaskTitle)
        setNewSubtaskTitle('')
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-[32px] z-50 md:hidden flex flex-col max-h-[90vh] shadow-[0_-8px_30px_rgba(0,0,0,0.3)] pb-safe-area-bottom"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag Handle */}
                        <div className="w-full h-8 flex items-center justify-center shrink-0" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-on-surface-variant/20 rounded-full" />
                        </div>

                        {/* Content Scrollable */}
                        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">

                            {/* Header: Checkbox & Title */}
                            <div className="flex items-start gap-4 mb-6">
                                <div className="mt-1">
                                    <TaskCheckbox
                                        isCompleted={task.status === 'done'}
                                        isAnimating={false}
                                        onToggle={() => toggleTask(task.id, task.status)}
                                        size="lg" // Assuming we can add size prop or use styling
                                    />
                                </div>
                                <div className="flex-1">
                                    {isEditingTitle ? (
                                        <input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            onBlur={handleSaveTitle}
                                            autoFocus
                                            className="w-full bg-transparent text-xl font-bold text-on-surface focus:outline-none border-b border-primary/50 pb-1"
                                        />
                                    ) : (
                                        <h2
                                            onClick={() => setIsEditingTitle(true)}
                                            className={`text-xl font-bold leading-tight ${task.status === 'done' ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}
                                        >
                                            {task.title}
                                        </h2>
                                    )}
                                </div>
                                <button onClick={onClose} className="p-2 -mr-2 text-on-surface-variant/50">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Metadata Badges */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {dateDisplay && (
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${dateDisplay.isOverdue
                                        ? 'bg-error/15 text-error'
                                        : 'bg-primary/10 text-primary'
                                        }`}>
                                        <Calendar className="w-3.5 h-3.5" />
                                        {dateDisplay.text}
                                    </div>
                                )}
                                {task.recurrence_id && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-secondary/10 text-secondary">
                                        <Repeat className="w-3.5 h-3.5" />
                                        Recorrente
                                    </div>
                                )}
                                <TaskSectors
                                    task={task}
                                    sectors={sectors}
                                    taskSectors={Array.isArray(task.sector) ? task.sector : []}
                                    taskMenuOpen={null}
                                    setTaskMenuOpen={() => { }}
                                    toggleTaskSector={toggleTaskSector}
                                />
                            </div>

                            {/* Description */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-2 text-sm font-bold text-on-surface-variant/70 uppercase tracking-wider">
                                    <AlignLeft className="w-4 h-4" />
                                    Descrição
                                </div>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={handleSaveDescription}
                                    placeholder="Toque para adicionar uma descrição..."
                                    className="w-full bg-surface-variant/30 rounded-xl p-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium leading-relaxed"
                                />
                            </div>

                            {/* Subtasks */}
                            <div className="mb-20">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-sm font-bold text-on-surface-variant/70 uppercase tracking-wider">
                                        <ListChecks className="w-4 h-4" />
                                        Subtarefas
                                    </div>
                                    <span className="text-xs font-bold text-on-surface-variant/50 bg-surface-variant/30 px-2 py-0.5 rounded-md">
                                        {task.subtasks?.filter(s => s.completed).length || 0}/{task.subtasks?.length || 0}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {task.subtasks && task.subtasks.length > 0 ? (
                                        <SubtaskList
                                            subtasks={task.subtasks}
                                            onReorder={(newOrder) => reorderSubtasks(task.id, newOrder)}
                                            expandedDetails={new Set<string>()} // No details expansion in sheet for now
                                            onToggleDetails={() => { }}
                                            onToggleComplete={toggleSubtask}
                                            editingId={null} // Simplified for now
                                            editTitle=""
                                            setEditTitle={() => { }}
                                            onSaveEdit={async () => { }}
                                            onStartEdit={() => { }}
                                            onDelete={deleteSubtask}
                                            detailsMap={{}}
                                            onSaveDetails={async () => { }}
                                        />
                                    ) : (
                                        <p className="text-sm text-on-surface-variant/40 italic py-2">Nenhuma subtarefa ainda.</p>
                                    )}
                                </div>

                                <TaskAddSubtask
                                    value={newSubtaskTitle}
                                    onChange={setNewSubtaskTitle}
                                    onAdd={handleAddSubtaskWrapper}
                                />
                            </div>

                        </div>

                        {/* Bottom Action Bar */}
                        <div className="p-4 border-t border-outline-variant/20 flex gap-3 bg-surface z-10 safe-area-bottom">
                            <button
                                onClick={() => {
                                    handleMoveToTrash(task.id)
                                    onClose()
                                }}
                                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-error/10 text-error font-bold text-sm hover:bg-error/20 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20"
                            >
                                <Check className="w-4 h-4" />
                                Concluído
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
