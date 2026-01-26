import { useMemo } from 'react'
import { Reorder } from 'framer-motion'
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { Task } from '../../store/taskStore'
import { Sector } from '../../store/settingsStore'
import { TaskItem } from './TaskItem'

interface TaskListViewProps {
    tasks: Task[]
    loading: boolean
    sortedSectors: Sector[]
    sortBy: 'dueDate' | 'createdAt' | 'name' | 'manual'
    handleSortChange: (sort: any) => void

    // Task actions
    toggleTask: (id: string, status: string) => void
    toggleTaskSector: any
    updateSubtask: any
    addSubtask: any
    toggleSubtask: any
    deleteSubtask: any
    reorderSubtasks: any
    reorderTasks: (tasks: Task[]) => void
    taskMenuOpen: string | null
    setTaskMenuOpen: (id: string | null) => void
    handleMoveToTrash: (id: string) => void
    updateTask: any
    onEditClick: (task: Task) => void
    onDateClick: (task: Task) => void
    onRecurrenceClick: (task: Task) => void

    // Done section
    showDone: boolean
    setShowDone: (show: boolean) => void
    handleClearDone: () => void
}

function getTaskSectors(task: Task): string[] {
    const rawSector = task.sector
    return Array.isArray(rawSector)
        ? rawSector.filter(Boolean)
        : (rawSector?.toString().split(',').filter(Boolean) || [])
}

export function TaskListView({
    tasks,
    loading,
    sortedSectors,
    sortBy,
    handleSortChange,
    toggleTask,
    toggleTaskSector,
    updateSubtask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    reorderSubtasks,
    reorderTasks,
    taskMenuOpen,
    setTaskMenuOpen,
    handleMoveToTrash,
    updateTask,
    onEditClick,
    onDateClick,
    onRecurrenceClick,
    showDone,
    setShowDone,
    handleClearDone
}: TaskListViewProps) {
    const pendingTasks = useMemo(() => tasks.filter(t => t.status !== 'done'), [tasks])
    const doneTasks = useMemo(() => tasks.filter(t => t.status === 'done'), [tasks])
    const doneTasksCount = doneTasks.length

    const handleReorder = (newOrder: Task[]) => {
        if (sortBy !== 'manual') {
            handleSortChange('manual')
        }
        reorderTasks(newOrder)
    }

    return (
        <div className="space-y-3 pb-20">
            {/* PENDING TASKS */}
            <Reorder.Group
                axis="y"
                values={pendingTasks}
                onReorder={handleReorder}
                className="space-y-1"
            >
                {pendingTasks.map((task) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        taskSectors={getTaskSectors(task)}
                        sectors={sortedSectors}
                        toggleTask={toggleTask}
                        toggleTaskSector={toggleTaskSector}
                        updateSubtask={updateSubtask}
                        addSubtask={addSubtask}
                        toggleSubtask={toggleSubtask}
                        deleteSubtask={deleteSubtask}
                        reorderSubtasks={reorderSubtasks}
                        setTaskMenuOpen={setTaskMenuOpen}
                        taskMenuOpen={taskMenuOpen}
                        handleMoveToTrash={handleMoveToTrash}
                        updateTask={updateTask}
                        onEditClick={onEditClick}
                        onDateClick={onDateClick}
                        onRecurrenceClick={onRecurrenceClick}
                        sortBy={sortBy}
                    />
                ))}
            </Reorder.Group>

            {/* LOADING STATE */}
            {loading && tasks.length === 0 && (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-surface/50 border border-outline-variant/20 rounded-[18px] p-4 flex items-center gap-4 animate-pulse">
                            <div className="w-5 h-5 rounded-md bg-outline-variant/20" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-outline-variant/20 rounded-md w-3/4" />
                                <div className="h-3 bg-outline-variant/10 rounded-md w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && pendingTasks.length === 0 && doneTasksCount === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
                    <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-10 h-10 text-on-surface-variant" />
                    </div>
                    <h3 className="text-lg font-medium text-on-surface">Tudo limpo!</h3>
                    <p className="text-sm text-on-surface-variant">Aproveite o momento.</p>
                </div>
            )}

            {/* COMPLETED SECTION */}
            {doneTasksCount > 0 && (
                <div className="pt-4 border-t border-dashed border-outline-variant/30 mt-6">
                    <div className="flex items-center justify-between mb-2 group">
                        <button
                            onClick={() => setShowDone(!showDone)}
                            className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors py-2 px-1 rounded-md hover:bg-surface-variant/30 flex-1 text-left"
                        >
                            {showDone ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span>Concluídas ({doneTasksCount})</span>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleClearDone()
                            }}
                            className={`text-xs font-medium text-error hover:bg-error/10 px-3 py-1.5 rounded-full transition-colors ${showDone ? 'opacity-0 group-hover:opacity-100 focus:opacity-100' : 'opacity-0 pointer-events-none'}`}
                        >
                            Limpar todas
                        </button>
                    </div>

                    {showDone && (
                        <Reorder.Group
                            axis="y"
                            values={doneTasks}
                            onReorder={handleReorder}
                            className="space-y-1 mt-2"
                        >
                            {doneTasks.map((task) => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    taskSectors={getTaskSectors(task)}
                                    sectors={sortedSectors}
                                    toggleTask={toggleTask}
                                    toggleTaskSector={toggleTaskSector}
                                    updateSubtask={updateSubtask}
                                    addSubtask={addSubtask}
                                    toggleSubtask={toggleSubtask}
                                    deleteSubtask={deleteSubtask}
                                    reorderSubtasks={reorderSubtasks}
                                    setTaskMenuOpen={setTaskMenuOpen}
                                    taskMenuOpen={taskMenuOpen}
                                    handleMoveToTrash={handleMoveToTrash}
                                    updateTask={updateTask}
                                    onEditClick={onEditClick}
                                    onDateClick={onDateClick}
                                    onRecurrenceClick={onRecurrenceClick}
                                />
                            ))}
                        </Reorder.Group>
                    )}
                </div>
            )}
        </div>
    )
}
