import { useEffect, useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { KanbanColumn as ColumnComponent } from './KanbanColumn'
import { ErrorBoundary } from '../common/ErrorBoundary'
import { Task, KanbanColumn } from '../../store/types'

// DnD Kit imports
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'

// Simple card preview for drag overlay
function CardOverlay({ task }: { task: Task }) {
    return (
        <div className="bg-surface rounded-lg p-3 border border-primary/50 shadow-xl w-64 opacity-90 rotate-2">
            <span className="text-sm font-medium text-on-surface line-clamp-2">{task.title}</span>
        </div>
    )
}

export function KanbanView() {
    const {
        tasks,
        columns,
        fetchColumns,
        addColumn,
        reorderColumns,
        moveTaskToColumn,
        reorderTasks
    } = useTaskStore()

    const [newColumnTitle, setNewColumnTitle] = useState('')
    const [isAddingColumn, setIsAddingColumn] = useState(false)
    const [activeTask, setActiveTask] = useState<Task | null>(null)
    const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null)

    useEffect(() => {
        fetchColumns()
    }, [])

    // Sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor)
    )

    // Filter out completed tasks and group by column
    const tasksByColumn = useMemo(() => {
        const activeTasks = tasks.filter(t => t.status !== 'done')
        const grouped: Record<string, typeof activeTasks> = {}

        columns.forEach(col => {
            grouped[col.id] = []
        })

        // Get first column ID for uncategorized tasks
        const firstColumnId = columns.length > 0 ? columns[0].id : null

        activeTasks.forEach(task => {
            if (task.column_id && grouped[task.column_id]) {
                grouped[task.column_id].push(task)
            } else if (firstColumnId) {
                // Tasks without column go to first column
                grouped[firstColumnId].push(task)
            }
        })

        // Sort by order
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => (a.order || 0) - (b.order || 0))
        })

        return grouped
    }, [tasks, columns])

    const handleAddColumn = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newColumnTitle.trim()) return
        await addColumn(newColumnTitle, 'slate')
        setNewColumnTitle('')
        setIsAddingColumn(false)
    }

    // DnD Handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const activeId = active.id as string

        // Check if dragging a column
        const column = columns.find(c => c.id === activeId)
        if (column) {
            setActiveColumn(column)
            return
        }

        // Otherwise it's a task
        const task = tasks.find(t => t.id === activeId)
        if (task) {
            setActiveTask(task)
        }
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over || !activeTask) return

        const activeId = active.id as string
        const overId = over.id as string

        // Find which columns contain the active and over items
        const activeColumnId = findColumnByTaskId(activeId)
        const overColumnId = findColumnByTaskId(overId) || overId // overId might be a column itself

        if (!activeColumnId || activeColumnId === overColumnId) return

        // Move task to new column
        const overColumn = columns.find(c => c.id === overColumnId)
        if (overColumn) {
            moveTaskToColumn(activeId, overColumnId, 0)
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        setActiveTask(null)
        setActiveColumn(null)

        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        // Handle column reordering
        if (activeColumn) {
            const oldIndex = columns.findIndex(c => c.id === activeId)
            const newIndex = columns.findIndex(c => c.id === overId)
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const newOrder = arrayMove(columns, oldIndex, newIndex)
                reorderColumns(newOrder)
            }
            return
        }

        // Handle task reordering within same column
        const activeColumnId = findColumnByTaskId(activeId)
        const overColumnId = findColumnByTaskId(overId)

        if (activeColumnId && overColumnId && activeColumnId === overColumnId) {
            const columnTasks = tasksByColumn[activeColumnId]
            const oldIndex = columnTasks.findIndex(t => t.id === activeId)
            const newIndex = columnTasks.findIndex(t => t.id === overId)
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const newOrder = arrayMove(columnTasks, oldIndex, newIndex)
                reorderTasks(newOrder)
            }
        }
    }

    const findColumnByTaskId = (taskId: string): string | null => {
        for (const [columnId, colTasks] of Object.entries(tasksByColumn)) {
            if (colTasks.find(t => t.id === taskId)) {
                return columnId
            }
        }
        return null
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-surface-variant/20">
            {/* Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="h-full flex items-start gap-4 p-4 min-w-max">
                        {/* Render Columns */}
                        <SortableContext
                            items={columns.map(c => c.id)}
                            strategy={horizontalListSortingStrategy}
                        >
                            {columns.map(col => (
                                <ErrorBoundary key={col.id} name={`Column: ${col.title}`}>
                                    <ColumnComponent
                                        column={col}
                                        tasks={tasksByColumn[col.id] || []}
                                        onMoveTask={moveTaskToColumn}
                                        allColumns={columns}
                                    />
                                </ErrorBoundary>
                            ))}
                        </SortableContext>

                        {/* Add Column Button */}
                        <div className="w-72 shrink-0">
                            {isAddingColumn ? (
                                <form onSubmit={handleAddColumn} className="bg-surface rounded-xl p-4 border border-outline-variant/50 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Nome da coluna..."
                                        value={newColumnTitle}
                                        onChange={e => setNewColumnTitle(e.target.value)}
                                        className="w-full bg-surface-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface outline-none border border-transparent focus:border-primary/30 mb-3"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingColumn(false)}
                                            className="text-xs font-bold text-on-surface-variant hover:text-on-surface px-3 py-1.5"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="text-xs font-bold bg-primary text-on-primary px-3 py-1.5 rounded-lg hover:bg-primary/90"
                                        >
                                            Criar
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setIsAddingColumn(true)}
                                    className="w-full h-12 border-2 border-dashed border-outline-variant/30 rounded-xl flex items-center justify-center text-on-surface-variant/50 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-xs font-bold">Adicionar lista</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Drag Overlay */}
                    <DragOverlay>
                        {activeTask ? <CardOverlay task={activeTask} /> : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    )
}
