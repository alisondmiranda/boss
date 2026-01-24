import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Calendar, ChevronRight, GripVertical, X, Repeat, AlignLeft, ListChecks } from 'lucide-react'
import { useFloating, autoUpdate, offset, flip, shift, useDismiss, useInteractions, FloatingPortal } from '@floating-ui/react'
import { format, isPast, isToday, isTomorrow, isThisYear, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Sector } from '../../store/settingsStore'
import { Task } from '../../store/taskStore'
import { useTaskItemLogic } from '../../hooks/useTaskItemLogic'
import { useDragAndDrop } from '../../hooks/useDragAndDrop'
import { StandardCalendar } from '../StandardCalendar'

import { TaskCheckbox } from './TaskCheckbox'
import { TaskActions } from './TaskActions'
import { SubtaskList } from './SubtaskList'
import { TaskSectors } from './TaskSectors'
import { TaskQuickActions } from './TaskQuickActions'
import { TaskAddSubtask } from './TaskAddSubtask'

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

export function TaskItem({
    task, taskSectors, sectors, toggleTask, toggleTaskSector,
    setTaskMenuOpen, taskMenuOpen, handleMoveToTrash, updateTask, onEditClick, onRecurrenceClick,
    updateSubtask, addSubtask, toggleSubtask, deleteSubtask, reorderSubtasks
}: TaskItemProps) {
    const { dragControls, handlePointerDown } = useDragAndDrop()

    const {
        cardRef,
        isFullyExpanded,
        isQuickExpanded, setIsQuickExpanded,
        showDescription,
        showSubtasks,
        newSubtaskTitle, setNewSubtaskTitle,
        editingSubtaskId,
        editSubtaskTitle, setEditSubtaskTitle,
        animationState,
        showCalendar, setShowCalendar,
        isEditing, setIsEditing,
        editTitle, setEditTitle,
        description, setDescription,
        expandedSubtaskDetails,
        subtaskDetailsMap,
        isEditingDescription, setIsEditingDescription,

        toggleSubtaskDetails,
        handleSubtaskDetailsSave,
        handleChevronClick,
        handleToggleDescription,
        handleToggleSubtasks,
        handleSaveTitle,
        handleSubtaskEditStart,
        handleToggleCompletion,
        handleAddSubtask,
        handleSubtaskEditSave,
        handleSaveDescription
    } = useTaskItemLogic(task, updateTask, toggleTask, addSubtask, updateSubtask, deleteSubtask)

    const handleToggleSubtaskWrapper = (subtaskId: string) => toggleSubtask(subtaskId)
    const handleDeleteSubtaskWrapper = (subtaskId: string) => deleteSubtask(subtaskId)

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

    // Verificar se há dados para exibir indicadores
    const hasDate = !!task.due_at
    const hasRecurrence = !!task.recurrence_id
    const hasDescription = !!task.details
    const hasSubtasks = task.subtasks && task.subtasks.length > 0
    const hasAnyContent = hasDate || hasRecurrence || hasDescription || hasSubtasks

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
                if (!isActuallyExpanded) setIsQuickExpanded(true)
            }}
        >
            {/* Main Task Row */}
            <div className="flex items-start gap-1 p-1.5 w-full cursor-pointer">
                {/* Drag Handle */}
                <div
                    onPointerDown={handlePointerDown}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 cursor-grab active:cursor-grabbing hover:bg-surface-variant rounded-md transition-colors shrink-0 mt-0.5"
                >
                    <GripVertical className="w-3.5 h-3.5 text-on-surface-variant/50 group-hover:text-on-surface-variant/80 transition-colors" />
                </div>

                {/* Chevron */}
                <button
                    onClick={handleChevronClick}
                    className={`p-1 rounded transition-all shrink-0 mt-0.5 ${isActuallyExpanded ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
                    title={isActuallyExpanded ? 'Recolher' : 'Expandir tudo'}
                >
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActuallyExpanded ? 'rotate-90' : ''}`} />
                </button>

                {/* Checkbox (Atomized & Aligned Top) */}
                <TaskCheckbox
                    isCompleted={task.status === 'done'}
                    isAnimating={animationState !== 'idle'}
                    onToggle={() => handleToggleCompletion()}
                />

                {/* Content Section */}
                <div className="flex-1 min-w-0 flex flex-col justify-center pl-1 pt-0.5">
                    <div className="flex flex-col">
                        {isEditing ? (
                            <input
                                autoFocus
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={() => handleSaveTitle()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') { handleSaveTitle() }
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
                                    setIsEditing(true)
                                    if (!isActuallyExpanded) setIsQuickExpanded(true)
                                }}
                                className={`text-sm font-medium leading-tight truncate cursor-pointer transition-colors ${task.status === 'done' ? 'text-on-surface-variant/60 line-through' : 'text-on-surface hover:text-primary'}`}
                            >
                                {task.title}
                            </span>
                        )}

                        {/* Badges de metadados */}
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

                                {/* Toggle Descrição */}
                                {hasDescription && (
                                    <button
                                        onClick={handleToggleDescription}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border w-fit transition-colors ${showDescription ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-variant/30 text-on-surface-variant border-transparent hover:bg-surface-variant/50'}`}
                                        title={showDescription ? 'Ocultar descrição' : 'Mostrar descrição'}
                                    >
                                        <AlignLeft className="w-3 h-3" />
                                    </button>
                                )}

                                {/* Toggle Subtarefas */}
                                {hasSubtasks && (
                                    <button
                                        onClick={handleToggleSubtasks}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border w-fit transition-colors ${showSubtasks ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-variant/30 text-on-surface-variant border-transparent hover:border-primary/50'}`}
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
                <div className="flex items-center shrink-0 h-full mt-0.5">
                    {/* Sector Badges (Atomized) */}
                    <TaskSectors
                        task={task}
                        sectors={sectors}
                        taskSectors={taskSectors}
                        taskMenuOpen={taskMenuOpen}
                        setTaskMenuOpen={setTaskMenuOpen}
                        toggleTaskSector={toggleTaskSector}
                    />

                    {/* Actions (Atomized) */}
                    <TaskActions
                        onEdit={() => onEditClick?.(task)}
                        onDelete={() => handleMoveToTrash(task.id)}
                    />
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
                            {/* Quick Actions (Atomized) */}
                            <AnimatePresence initial={false}>
                                {shouldShowQuickActions && (
                                    <TaskQuickActions
                                        task={task}
                                        updateTask={updateTask}
                                        showCalendar={showCalendar}
                                        setShowCalendar={setShowCalendar}
                                        showDescription={showDescription}
                                        handleToggleDescription={handleToggleDescription}
                                        showSubtasks={showSubtasks}
                                        handleToggleSubtasks={handleToggleSubtasks}
                                        onRecurrenceClick={onRecurrenceClick}
                                    />
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
                                        <div className="mb-1 pt-1 pl-[1.6rem] pr-[1.6rem]">
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

                            {/* Subtasks List (Atomized) */}
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
                                                <SubtaskList
                                                    subtasks={task.subtasks}
                                                    onReorder={(newOrder) => reorderSubtasks(task.id, newOrder)}
                                                    expandedDetails={expandedSubtaskDetails}
                                                    onToggleDetails={toggleSubtaskDetails}
                                                    onToggleComplete={handleToggleSubtaskWrapper}
                                                    editingId={editingSubtaskId}
                                                    editTitle={editSubtaskTitle}
                                                    setEditTitle={setEditSubtaskTitle}
                                                    onSaveEdit={handleSubtaskEditSave}
                                                    onStartEdit={handleSubtaskEditStart}
                                                    onDelete={handleDeleteSubtaskWrapper}
                                                    detailsMap={subtaskDetailsMap}
                                                    onSaveDetails={handleSubtaskDetailsSave}
                                                />
                                            ) : (
                                                <p className="text-[11px] text-on-surface-variant/50 italic px-2 py-1 pl-[1.6rem]">Nenhuma subtarefa.</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Add Subtask Input (Atomized & Aligned) */}
                            {shouldShowSubtasks && (
                                <div className="pl-[1.6rem] pr-[1.6rem] pb-2">
                                    <TaskAddSubtask
                                        value={newSubtaskTitle}
                                        onChange={setNewSubtaskTitle}
                                        onAdd={handleAddSubtask}
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    )
}
