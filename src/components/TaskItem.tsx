import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { Check, Pencil, Trash2, Repeat, Calendar, Plus, CornerDownLeft, X, GripVertical, Tag, ListChecks, AlignLeft, ChevronRight } from 'lucide-react'
import { Sector } from '../store/settingsStore'
import { ICONS } from '../constants/icons.tsx'
import { Task } from '../store/taskStore'
import { getSectorColorClass } from '../lib/utils'
import { format, isPast, isToday, isTomorrow, isThisYear, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFloating, autoUpdate, offset, flip, shift, useDismiss, useInteractions, FloatingPortal } from '@floating-ui/react'

import { StandardCalendar } from './StandardCalendar'

// Persistência de preferências de visualização
const getStoredPrefs = (taskId: string) => {
    try {
        const stored = localStorage.getItem(`taskPrefs_${taskId}`)
        return stored ? JSON.parse(stored) : null
    } catch {
        return null
    }
}

const setStoredPrefs = (taskId: string, prefs: { showDescription: boolean; showSubtasks: boolean }) => {
    try {
        localStorage.setItem(`taskPrefs_${taskId}`, JSON.stringify(prefs))
    } catch {
        // Ignore storage errors
    }
}

interface TaskItemProps {
    task: Task
    taskSectors: string[]
    sectors: Sector[]
    toggleTask: (id: string, status: Task['status']) => void
    toggleTaskSector: (taskId: string, sectorId: string, allSectors: { id: string; label: string }[]) => Promise<void>
    setTaskMenuOpen: (id: string | null) => void
    taskMenuOpen: string | null
    handleMoveToTrash: (id: string) => void
    updateTask: (id: string, updates: Partial<Task>) => void
    onEditClick?: (task: Task) => void
    onDateClick?: (task: Task) => void
    onRecurrenceClick?: (task: Task) => void
    updateSubtask: (subtaskId: string, title: string, details?: string) => Promise<void>
    addSubtask: (taskId: string, title: string) => Promise<void>
    toggleSubtask: (subtaskId: string) => Promise<void>
    deleteSubtask: (subtaskId: string) => Promise<void>
    reorderSubtasks: (taskId: string, newSubtasks: any[]) => Promise<void>
    sortBy?: 'dueDate' | 'createdAt' | 'name' | 'manual'
}

/* 
 * SubtaskItem Component
 * Extracted to allow individual drag controls and proper reorder behavior
 */
interface SubtaskItemProps {
    subtask: any
    expandedSubtaskDetails: Set<string>
    toggleSubtaskDetails: (id: string) => void
    handleToggleSubtask: (id: string) => void
    editingSubtaskId: string | null
    editSubtaskTitle: string
    setEditSubtaskTitle: (val: string) => void
    handleSubtaskEditSave: () => void
    handleSubtaskEditStart: (id: string, title: string) => void
    handleDeleteSubtask: (id: string) => void
    subtaskDetailsMap: Record<string, string>
    handleSubtaskDetailsSave: (id: string, val: string) => void
}

function SubtaskItem({
    subtask,
    expandedSubtaskDetails,
    toggleSubtaskDetails,
    handleToggleSubtask,
    editingSubtaskId,
    editSubtaskTitle,
    setEditSubtaskTitle,
    handleSubtaskEditSave,
    handleSubtaskEditStart,
    handleDeleteSubtask,
    subtaskDetailsMap,
    handleSubtaskDetailsSave
}: SubtaskItemProps) {
    const dragControls = useDragControls()

    return (
        <Reorder.Item
            value={subtask}
            dragListener={false}
            dragControls={dragControls}
            whileDrag={{
                scale: 1.02,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                zIndex: 50
            }}
            transition={{ type: "spring", stiffness: 600, damping: 40 }}
            className="group/subtask bg-surface rounded-md relative select-none"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center gap-2 text-[13px] py-0.5">
                {/* Handle */}
                <div
                    onPointerDown={(e) => dragControls.start(e)}
                    className="p-1 -ml-1 cursor-grab active:cursor-grabbing hover:bg-surface-variant/50 rounded transition-colors opacity-0 group-hover/subtask:opacity-100"
                >
                    <GripVertical className="w-3.5 h-3.5 text-on-surface-variant/40" />
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        toggleSubtaskDetails(subtask.id)
                    }}
                    className={`p-0.5 rounded transition-all ${expandedSubtaskDetails.has(subtask.id) ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
                    title="Detalhes da subtarefa"
                >
                    <ChevronRight className={`w-3 h-3 transition-transform ${expandedSubtaskDetails.has(subtask.id) ? 'rotate-90' : ''}`} />
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleToggleSubtask(subtask.id)
                    }}
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${subtask.completed ? 'bg-primary border-primary text-on-primary' : 'border-outline/40 hover:border-primary'}`}
                >
                    {subtask.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </button>

                {editingSubtaskId === subtask.id ? (
                    <input
                        autoFocus
                        value={editSubtaskTitle}
                        onChange={(e) => setEditSubtaskTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={handleSubtaskEditSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubtaskEditSave()}
                        className="flex-1 bg-transparent border-none text-sm text-on-surface focus:outline-none py-1"
                    />
                ) : (
                    <span
                        onClick={(e) => {
                            e.stopPropagation()
                            handleSubtaskEditStart(subtask.id, subtask.title)
                        }}
                        className={`flex-1 cursor-text ${subtask.completed ? 'text-on-surface-variant/50 line-through' : 'text-on-surface hover:text-primary transition-colors'}`}
                    >
                        {subtask.title}
                    </span>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSubtask(subtask.id)
                    }}
                    className="opacity-0 group-hover/subtask:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <AnimatePresence>
                {expandedSubtaskDetails.has(subtask.id) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="overflow-hidden"
                    >
                        <div className="ml-8 mr-2 mb-2">
                            <textarea
                                value={subtaskDetailsMap[subtask.id] || ''}
                                onChange={(e) => handleSubtaskDetailsSave(subtask.id, e.target.value)}
                                placeholder="Adicionar detalhes..."
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-surface-variant/15 rounded-md p-2 text-[11px] text-on-surface placeholder:text-on-surface-variant/40 resize-none border border-transparent focus:border-primary/20 focus:outline-none transition-all min-h-[50px]"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    )
}

export function TaskItem({
    task, taskSectors, sectors, toggleTask, toggleTaskSector,
    setTaskMenuOpen, taskMenuOpen, handleMoveToTrash, updateTask, onEditClick, onRecurrenceClick,
    updateSubtask, addSubtask, toggleSubtask, deleteSubtask, reorderSubtasks
}: TaskItemProps) {
    const dragControls = useDragControls()
    const cardRef = useRef<HTMLDivElement>(null)

    // Estados de expansão
    const [isFullyExpanded, setIsFullyExpanded] = useState(false) // Chevron = expansão total

    // Carregar preferências persistidas
    const storedPrefs = getStoredPrefs(task.id)
    const [showDescription, setShowDescription] = useState(storedPrefs?.showDescription ?? !!task.details)
    const [showSubtasks, setShowSubtasks] = useState(storedPrefs?.showSubtasks ?? true)

    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
    const [editSubtaskTitle, setEditSubtaskTitle] = useState('')
    const [animationState, setAnimationState] = useState<'idle' | 'celebrating' | 'exiting'>('idle')
    const [showCalendar, setShowCalendar] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(task.title)
    const [description, setDescription] = useState(task.details || '')
    const [expandedSubtaskDetails, setExpandedSubtaskDetails] = useState<Set<string>>(new Set())
    const [subtaskDetailsMap, setSubtaskDetailsMap] = useState<Record<string, string>>({})
    const [isEditingDescription, setIsEditingDescription] = useState(false)
    const [isQuickExpanded, setIsQuickExpanded] = useState(false)

    // Calendar Floating UI
    const { refs: calendarRefs, floatingStyles: calendarStyles, context: calendarContext } = useFloating({
        open: showCalendar,
        onOpenChange: setShowCalendar,
        whileElementsMounted: autoUpdate,
        middleware: [offset(8), flip(), shift()],
        placement: 'bottom-start'
    })
    const calendarDismiss = useDismiss(calendarContext)
    const { getFloatingProps: getCalendarFloatingProps, getReferenceProps: getCalendarReferenceProps } = useInteractions([calendarDismiss])

    // Sector Menu Floating UI
    const isSectorMenuOpen = taskMenuOpen === task.id
    const { refs: sectorMenuRefs, floatingStyles: sectorMenuStyles, context: sectorMenuContext } = useFloating({
        open: isSectorMenuOpen,
        onOpenChange: (open) => setTaskMenuOpen(open ? task.id : null),
        whileElementsMounted: autoUpdate,
        middleware: [offset(8), flip(), shift()],
        placement: 'bottom-end' // right-0 aligned usually means bottom-end
    })
    const sectorMenuDismiss = useDismiss(sectorMenuContext)
    const { getFloatingProps: getSectorMenuFloatingProps, getReferenceProps: getSectorMenuReferenceProps } = useInteractions([sectorMenuDismiss])

    // Fechar expansão rápida ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
                setIsQuickExpanded(false)
            }
        }
        if (isQuickExpanded) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isQuickExpanded])

    // Verificar se há dados para exibir indicadores
    const hasDate = !!task.due_at
    const hasRecurrence = !!task.recurrence_id
    const hasDescription = !!task.details
    const hasSubtasks = task.subtasks && task.subtasks.length > 0
    const hasAnyContent = hasDate || hasRecurrence || hasDescription || hasSubtasks

    // Persistir preferências quando mudam
    const persistPrefs = useCallback((desc: boolean, subs: boolean) => {
        setStoredPrefs(task.id, { showDescription: desc, showSubtasks: subs })
    }, [task.id])

    // Update local description if task updates
    useEffect(() => {
        if (task.details !== description) {
            setDescription(task.details || '')
        }
    }, [task.details])

    // Initialize subtask details from task data
    useEffect(() => {
        if (task.subtasks) {
            const detailsMap: Record<string, string> = {}
            task.subtasks.forEach(st => {
                if ((st as any).details) {
                    detailsMap[st.id] = (st as any).details
                }
            })
            setSubtaskDetailsMap(detailsMap)
        }
    }, [task.subtasks])

    // Toggle subtask details visibility
    const toggleSubtaskDetails = (subtaskId: string) => {
        setExpandedSubtaskDetails(prev => {
            const newSet = new Set(prev)
            if (newSet.has(subtaskId)) {
                newSet.delete(subtaskId)
            } else {
                newSet.add(subtaskId)
            }
            return newSet
        })
    }

    // Handle subtask details save
    const handleSubtaskDetailsSave = (subtaskId: string, details: string) => {
        setSubtaskDetailsMap(prev => ({ ...prev, [subtaskId]: details }))
    }

    // Handler para expansão total (Chevron)
    const handleChevronClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsFullyExpanded(!isFullyExpanded)
    }

    // Handler para toggle de descrição
    const handleToggleDescription = (e: React.MouseEvent) => {
        e.stopPropagation()
        const newValue = !showDescription
        setShowDescription(newValue)
        persistPrefs(newValue, showSubtasks)
    }

    // Handler para toggle de subtarefas
    const handleToggleSubtasks = (e: React.MouseEvent) => {
        e.stopPropagation()
        const newValue = !showSubtasks
        setShowSubtasks(newValue)
        persistPrefs(showDescription, newValue)
    }

    const handleSaveTitle = () => {
        if (editTitle.trim() && editTitle !== task.title) {
            updateTask(task.id, { title: editTitle.trim() })
        }
        setIsEditing(false)
    }

    const handleSaveDescription = () => {
        if (description !== task.details) {
            updateTask(task.id, { details: description })
        }
        // Sai do modo de edição apenas se não estiver expandido totalmente, ou mantem se preferir
        // Mas a logica diz: "Se clicar no texto... ativa modo edição". Ao sair, desativa.
        setIsEditingDescription(false)
    }

    const handleSubtaskEditStart = (id: string, title: string) => {
        setEditingSubtaskId(id)
        setEditSubtaskTitle(title)
    }

    const handleToggleCompletion = async () => {
        if (task.status !== 'done') {
            setAnimationState('celebrating')
            setTimeout(() => {
                setAnimationState('exiting')
                setTimeout(() => {
                    toggleTask(task.id, task.status)
                    setTimeout(() => setAnimationState('idle'), 100)
                }, 200)
            }, 200)
        } else {
            toggleTask(task.id, task.status)
        }
    }

    const handleToggleSubtask = (subtaskId: string) => toggleSubtask(subtaskId)
    const handleDeleteSubtask = (subtaskId: string) => deleteSubtask(subtaskId)
    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return
        addSubtask(task.id, newSubtaskTitle.trim())
        setNewSubtaskTitle('')
    }
    const handleSubtaskEditSave = () => {
        if (editingSubtaskId && editSubtaskTitle.trim()) {
            updateSubtask(editingSubtaskId, editSubtaskTitle.trim())
        }
        setEditingSubtaskId(null)
    }

    const getSectorDetails = (sectorId: string) => {
        return sectors.find(s => s.id === sectorId) || { id: sectorId, label: 'Geral', color: 'slate' as const, icon: 'tag' }
    }

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

    // Determinar o que mostrar com base no estado
    const isActuallyExpanded = isFullyExpanded || isQuickExpanded
    const shouldShowDescription = isActuallyExpanded || (showDescription && hasDescription)
    const shouldShowSubtasks = isActuallyExpanded || (showSubtasks && hasSubtasks)
    const shouldShowQuickActions = isActuallyExpanded
    const hasVisibleContent = shouldShowDescription || shouldShowSubtasks

    return (
        <Reorder.Item
            value={task}
            id={task.id}
            dragListener={false}
            dragControls={dragControls}
            whileDrag={{
                scale: 1.02,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                zIndex: 50,
            }}
            transition={{ type: "spring", stiffness: 600, damping: 40 }}
            className={`bg-surface border border-outline-variant/30 rounded-[18px] flex flex-col group relative shadow-sm select-none hover:border-primary/60 hover:shadow-md ${task.status === 'done' ? 'opacity-75' : ''} ${animationState !== 'idle' ? 'pointer-events-none' : ''}`}
            ref={cardRef}
            onClick={() => {
                // Click on card expands temporarily if not actually expanded
                // Only quick-expand, do not toggle fullyExpanded here
                if (!isActuallyExpanded) setIsQuickExpanded(true)
            }}
        >
            {/* Main Task Row */}
            <div className="flex items-center gap-1 p-1.5 w-full cursor-pointer">
                {/* Drag Handle */}
                <div
                    onPointerDown={(e) => dragControls.start(e)}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 cursor-grab active:cursor-grabbing hover:bg-surface-variant rounded-md transition-colors shrink-0"
                >
                    <GripVertical className="w-3.5 h-3.5 text-on-surface-variant/50 group-hover:text-on-surface-variant/80 transition-colors" />
                </div>

                {/* Chevron - ANTES do título para expansão total */}
                <button
                    onClick={handleChevronClick}
                    className={`p-1 rounded transition-all shrink-0 ${isActuallyExpanded ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
                    title={isActuallyExpanded ? 'Recolher' : 'Expandir tudo'}
                >
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActuallyExpanded ? 'rotate-90' : ''}`} />
                </button>

                {/* Checkbox */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleToggleCompletion()
                    }}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 relative overflow-hidden ${task.status === 'done' || animationState !== 'idle'
                        ? 'bg-primary border-primary text-on-primary shadow-sm'
                        : 'border-outline/40 hover:border-primary text-transparent hover:bg-primary/5'
                        }`}
                >
                    <AnimatePresence>
                        {(task.status === 'done' || animationState !== 'idle') && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                            >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>

                {/* Content Section */}
                <div className="flex-1 min-w-0 flex flex-col justify-center pl-1">
                    <div className="flex flex-col">
                        {isEditing ? (
                            <input
                                autoFocus
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={handleSaveTitle}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveTitle()
                                    if (e.key === 'Escape') {
                                        setEditTitle(task.title)
                                        setIsEditing(false)
                                    }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-transparent border-none text-[15px] text-on-surface font-medium focus:outline-none p-0"
                            />
                        ) : (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation()
                                    // Single click to edit, and ensure quick expanded if not already
                                    setIsEditing(true)
                                    if (!isActuallyExpanded) setIsQuickExpanded(true)
                                }}
                                className={`text-sm font-medium leading-tight truncate cursor-pointer transition-colors ${task.status === 'done' ? 'text-on-surface-variant/60 line-through' : 'text-on-surface hover:text-primary'}`}
                            >
                                {task.title}
                            </span>
                        )}

                        {/* Badges de metadados - apenas se existirem dados */}
                        {hasAnyContent && (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {dateDisplay && (
                                    <div
                                        ref={calendarRefs.setReference}
                                        {...getCalendarReferenceProps()}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setShowCalendar(true)
                                        }}
                                        className={`group/date flex items-center pl-1.5 pr-0.5 py-0.5 rounded text-[10px] font-bold border w-fit transition-all cursor-pointer select-none ${dateDisplay.text === 'Hoje'
                                            ? 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30'
                                            : dateDisplay.isOverdue
                                                ? 'bg-error/15 text-error border-error/30 hover:bg-error/25'
                                                : 'bg-surface-variant text-on-surface-variant border-transparent hover:bg-on-surface-variant/10'
                                            }`}
                                    >
                                        <Calendar className="w-3 h-3 mr-1" />
                                        <span>{dateDisplay.text}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                updateTask(task.id, { due_at: null })
                                            }}
                                            className="w-0 group-hover/date:w-4 h-4 flex items-center justify-center rounded-sm hover:bg-black/10 transition-all overflow-hidden duration-200 opacity-0 group-hover/date:opacity-100"
                                            title="Remover data"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                )}

                                {hasRecurrence && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onRecurrenceClick?.(task)
                                        }}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border w-fit transition-colors bg-surface-variant/30 text-primary border-transparent hover:bg-surface-variant/50"
                                        title="Recorrência"
                                    >
                                        <Repeat className="w-3 h-3" />
                                    </button>
                                )}

                                {/* Toggle Descrição - só aparece se há descrição */}
                                {hasDescription && (
                                    <button
                                        onClick={handleToggleDescription}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border w-fit transition-colors ${showDescription ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-variant/30 text-on-surface-variant border-transparent hover:bg-surface-variant/50'}`}
                                        title={showDescription ? 'Ocultar descrição' : 'Mostrar descrição'}
                                    >
                                        <AlignLeft className="w-3 h-3" />
                                    </button>
                                )}

                                {/* Toggle Subtarefas - só aparece se há subtarefas */}
                                {hasSubtasks && (
                                    <button
                                        onClick={handleToggleSubtasks}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border w-fit transition-colors ${showSubtasks ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-variant/30 text-on-surface-variant border-transparent hover:bg-surface-variant/50'}`}
                                        title={showSubtasks ? 'Ocultar subtarefas' : 'Mostrar subtarefas'}
                                    >
                                        <ListChecks className="w-3 h-3" />
                                        <span>{task.subtasks!.filter(s => s.completed).length}/{task.subtasks!.length}</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sector & Actions Section */}
                <div className="flex items-center shrink-0 h-full">
                    {/* Sector Badges - max-width dinâmico com overflow controlado */}
                    <div
                        ref={sectorMenuRefs.setReference}
                        {...getSectorMenuReferenceProps()}
                        className="hidden sm:flex items-center gap-1 mr-2 flex-nowrap overflow-hidden max-w-[150px] md:max-w-[200px] lg:max-w-[280px]"
                    >
                        {(() => {
                            const distinctSectors = (Array.isArray(task.sector) ? task.sector : (task.sector ? [task.sector] : []))
                                .filter((value, index, self) => self.indexOf(value) === index)
                            const isEmpty = distinctSectors.length === 0
                            const allSectors = distinctSectors
                                .map((sectorId: string) => ({ sectorId, sector: getSectorDetails(sectorId) }))
                                .sort((a: any, b: any) => a.sector.label.localeCompare(b.sector.label, 'pt-BR'))

                            // Force "Add Tag" button if empty
                            if (isEmpty) {
                                return (
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)
                                            }}
                                            className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 transition-all hover:brightness-95 bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant"
                                            title="Adicionar Etiqueta"
                                        >
                                            <Tag className="w-3 h-3 opacity-60" />
                                            <span>Etiquetar</span>
                                        </button>
                                    </div>
                                )
                            }

                            // Regra: ≤3 mostra todas, ≥4 mostra 2 + badge "+N"
                            const showAll = allSectors.length <= 3
                            const visibleSectors = showAll ? allSectors : allSectors.slice(0, 2)
                            const remainingCount = allSectors.length - 2

                            return (
                                <>
                                    {visibleSectors.map(({ sectorId, sector }: { sectorId: string; sector: any }) => {
                                        const SectorIcon = ICONS.find(i => i.value === sector.icon)?.icon || Tag
                                        // Limite de caracteres por etiqueta
                                        const maxChars = 12
                                        const displayLabel = sector.label.length > maxChars
                                            ? sector.label.substring(0, maxChars) + '…'
                                            : sector.label

                                        return (
                                            <div key={`${task.id}-${sectorId}`} className="shrink-0 min-w-0">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)
                                                    }}
                                                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 transition-all hover:brightness-95 max-w-full ${getSectorColorClass(sector.color)}`}
                                                    title={sector.label}
                                                >
                                                    <SectorIcon className="w-3 h-3 opacity-60 shrink-0" />
                                                    <span className="truncate max-w-[60px] md:max-w-[80px]">{displayLabel}</span>
                                                </button>
                                            </div>
                                        )
                                    })}
                                    {!showAll && (
                                        <div className="relative shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)
                                                }}
                                                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 transition-all hover:brightness-95 bg-surface-variant text-on-surface-variant"
                                                title="Mais etiquetas..."
                                            >
                                                <Plus className="w-3 h-3 opacity-60" />
                                                <span>{remainingCount}</span>
                                            </button>
                                        </div>
                                    )}
                                </>
                            )
                        })()}

                        {/* Sector Popup Menu */}
                        <AnimatePresence>
                            {isSectorMenuOpen && (
                                <FloatingPortal>
                                    <div
                                        ref={sectorMenuRefs.setFloating}
                                        style={sectorMenuStyles}
                                        {...getSectorMenuFloatingProps()}
                                        className="z-[90]"
                                    >
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="w-48 bg-surface rounded-[20px] shadow-lg border border-outline-variant/50 z-50 overflow-hidden flex flex-col py-2"
                                        >
                                            <span className="px-4 py-2 text-[10px] uppercase font-bold text-on-surface-variant/50 tracking-wider">Mover para...</span>
                                            {sectors
                                                .filter(s => {
                                                    const isGeral = s.label.toLowerCase() === 'geral' || s.label.toLowerCase() === 'general'
                                                    const hasOtherSelected = taskSectors.some(id => {
                                                        const sec = sectors.find(sec => sec.id === id)
                                                        return sec && sec.label.toLowerCase() !== 'geral' && sec.label.toLowerCase() !== 'general'
                                                    })
                                                    if (isGeral && hasOtherSelected) return false
                                                    return true
                                                })
                                                .map(s => {
                                                    const isActive = taskSectors.includes(s.id)
                                                    const IconComp = ICONS.find(i => i.value === s.icon)?.icon || Tag
                                                    return (
                                                        <button
                                                            key={s.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                toggleTaskSector(task.id, s.id, sectors)
                                                            }}
                                                            className={`px-4 py-2.5 text-sm text-left flex items-center gap-3 hover:bg-surface-variant/50 transition-colors ${isActive ? 'text-primary font-bold bg-primary/5' : 'text-on-surface'}`}
                                                        >
                                                            <IconComp className={`w-4 h-4 ${getSectorColorClass(s.color).split(' ')[1]}`} />
                                                            {s.label}
                                                            {isActive && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                                                        </button>
                                                    )
                                                })}
                                            <div className="pt-2 mt-1 border-t border-outline-variant/30 px-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        // Since I cannot open settings here directly, I will just close menu.
                                                        setTaskMenuOpen(null)
                                                        // Maybe dispatch a custom event? 
                                                        window.dispatchEvent(new CustomEvent('open-sectors-settings'))
                                                    }}
                                                    className="w-full px-2 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-wide"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Nova Etiqueta
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>
                                </FloatingPortal>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Actions - Zona fixa com largura definida e z-index superior */}
                    <div className="flex items-center gap-1 shrink-0 w-[52px] justify-end relative z-10 bg-surface pl-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onEditClick?.(task)
                            }}
                            className="p-1 text-on-surface-variant hover:text-primary hover:bg-primary/20 rounded-md transition-all"
                            title="Editar"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleMoveToTrash(task.id)
                            }}
                            className="p-1 text-on-surface-variant hover:text-error hover:bg-error/20 rounded-md transition-all"
                            title="Excluir"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Popup */}
            <AnimatePresence>
                {showCalendar && (
                    <FloatingPortal>
                        <div
                            ref={calendarRefs.setFloating}
                            style={calendarStyles}
                            {...getCalendarFloatingProps()}
                            className="z-[90]"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="z-50 min-w-[280px]"
                            >
                                <StandardCalendar
                                    selectedDate={dateDisplay?.date || new Date()}
                                    onDateSelect={(date) => {
                                        updateTask(task.id, { due_at: date.toISOString() })
                                        setShowCalendar(false)
                                    }}
                                    enableTime={true}
                                />
                            </motion.div>

                        </div>
                    </FloatingPortal>
                )}
            </AnimatePresence>

            {/* Expanded Content Section */}
            <AnimatePresence initial={false}>
                {hasVisibleContent && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="overflow-hidden border-t border-outline-variant/20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-2 pb-1">
                            {/* Quick Actions - só no modo totalmente expandido */}
                            <AnimatePresence initial={false}>
                                {shouldShowQuickActions && (
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
                                )}
                            </AnimatePresence>

                            {/* Seção de Descrição */}
                            <AnimatePresence initial={false}>
                                {shouldShowDescription && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.12 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mb-1 pt-1">
                                            {isActuallyExpanded || isEditingDescription ? (
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    onBlur={handleSaveDescription}
                                                    placeholder="Adicionar descrição..."
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus={isEditingDescription}
                                                    className="w-full bg-surface-variant/20 rounded-lg p-2 text-xs text-on-surface placeholder:text-on-surface-variant/50 resize-none border border-transparent focus:border-primary/20 focus:outline-none focus:bg-surface-variant/30 transition-all min-h-[60px]"
                                                />
                                            ) : (
                                                <p
                                                    className="text-xs text-on-surface-variant line-clamp-2 bg-surface-variant/10 rounded-lg p-2 cursor-text hover:bg-surface-variant/20 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setIsEditingDescription(true)
                                                    }}
                                                >
                                                    {task.details}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Seção de Subtarefas */}
                            <AnimatePresence initial={false}>
                                {shouldShowSubtasks && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.12 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-1">
                                            {task.subtasks && task.subtasks.length > 0 ? (
                                                <Reorder.Group
                                                    axis="y"
                                                    values={task.subtasks}
                                                    onReorder={(newOrder) => reorderSubtasks(task.id, newOrder)}
                                                    className="space-y-1"
                                                >
                                                    {task.subtasks.map(subtask => (
                                                        <SubtaskItem
                                                            key={subtask.id}
                                                            subtask={subtask}
                                                            expandedSubtaskDetails={expandedSubtaskDetails}
                                                            toggleSubtaskDetails={toggleSubtaskDetails}
                                                            handleToggleSubtask={handleToggleSubtask}
                                                            editingSubtaskId={editingSubtaskId}
                                                            editSubtaskTitle={editSubtaskTitle}
                                                            setEditSubtaskTitle={setEditSubtaskTitle}
                                                            handleSubtaskEditSave={handleSubtaskEditSave}
                                                            handleSubtaskEditStart={handleSubtaskEditStart}
                                                            handleDeleteSubtask={handleDeleteSubtask}
                                                            subtaskDetailsMap={subtaskDetailsMap}
                                                            handleSubtaskDetailsSave={handleSubtaskDetailsSave}
                                                        />
                                                    ))}
                                                </Reorder.Group>
                                            ) : null}

                                            {isActuallyExpanded && (
                                                <div className="flex items-center gap-2 mt-1 luxury-input-container">
                                                    <Plus className="w-3.5 h-3.5 text-on-surface-variant/30" />
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Adicionar subtarefa..."
                                                            value={newSubtaskTitle}
                                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                                            className="w-full bg-transparent border-none text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none py-0.5"
                                                        />
                                                        {newSubtaskTitle && (
                                                            <button
                                                                onClick={handleAddSubtask}
                                                                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                                                            >
                                                                <CornerDownLeft className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    )
}
