import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Pencil, Trash2, Palette, Smile, Plus, Check } from 'lucide-react'
import { KanbanColumn as IKanbanColumn, Task } from '../../store/types'
import { useTaskStore } from '../../store/taskStore'
import { KanbanCard } from './KanbanCard'
import { COLORS, ICONS } from '../../constants/icons'

// DnD Kit
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface KanbanColumnProps {
    column: IKanbanColumn
    tasks: Task[]
    isSystemColumn?: boolean
    onMoveTask?: (taskId: string, columnId: string | null, newIndex: number) => void
    allColumns?: IKanbanColumn[]
}

export function KanbanColumn({ column, tasks, isSystemColumn = false, onMoveTask, allColumns = [] }: KanbanColumnProps) {
    const { deleteColumn, updateColumn, addTask } = useTaskStore()

    // DnD Kit sortable for column
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: column.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    // States
    const [menuOpen, setMenuOpen] = useState(false)
    const [colorMenuOpen, setColorMenuOpen] = useState(false)
    const [iconMenuOpen, setIconMenuOpen] = useState(false)
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editedTitle, setEditedTitle] = useState(column.title)
    const [isAddingCard, setIsAddingCard] = useState(false)
    const [newCardTitle, setNewCardTitle] = useState('')

    const titleInputRef = useRef<HTMLInputElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus()
            titleInputRef.current.select()
        }
    }, [isEditingTitle])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
                setColorMenuOpen(false)
                setIconMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSaveTitle = () => {
        if (editedTitle.trim() && editedTitle !== column.title) {
            updateColumn(column.id, { title: editedTitle.trim() })
        }
        setIsEditingTitle(false)
    }

    const handleColorChange = (color: string) => {
        updateColumn(column.id, { color })
        setColorMenuOpen(false)
        setMenuOpen(false)
    }

    const handleIconChange = (icon: string) => {
        updateColumn(column.id, { icon })
        setIconMenuOpen(false)
        setMenuOpen(false)
    }

    const handleAddCard = async () => {
        if (!newCardTitle.trim()) return
        await addTask(newCardTitle, [], null, null, null, [], column.id)
        setNewCardTitle('')
        setIsAddingCard(false)
    }

    // Get current icon component
    const ColumnIcon = column.icon ? ICONS.find(i => i.value === column.icon)?.icon : null

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="w-72 h-full flex flex-col shrink-0"
        >
            {/* Header - Drag Handle */}
            <div
                {...(isEditingTitle ? {} : { ...attributes, ...listeners })}
                className={`flex items-center justify-between px-3 py-2.5 mb-2 bg-surface rounded-xl border border-outline-variant/30 shadow-sm group ${(!isSystemColumn && !isEditingTitle) ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Color/Icon indicator */}
                    {ColumnIcon ? (
                        <ColumnIcon className={`w-4 h-4 text-${column.color}-500 shrink-0`} />
                    ) : (
                        <div className={`w-3 h-3 rounded-full bg-${column.color}-500 shrink-0`} />
                    )}

                    {/* Title */}
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            value={editedTitle}
                            onChange={e => setEditedTitle(e.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyDown={e => {
                                e.stopPropagation()
                                if (e.key === 'Enter') handleSaveTitle()
                            }}
                            className="flex-1 bg-transparent font-bold text-sm text-on-surface outline-none border-b border-primary"
                        />
                    ) : (
                        <h3
                            onClick={() => setIsEditingTitle(true)}
                            className="font-bold text-sm text-on-surface truncate cursor-pointer hover:text-primary transition-colors"
                        >
                            {column.title}
                        </h3>
                    )}

                    {/* Task count */}
                    <span className="text-[10px] font-bold text-on-surface-variant/50 bg-surface-variant/50 px-1.5 py-0.5 rounded-md shrink-0">
                        {tasks.length}
                    </span>
                </div>

                {/* Menu Button */}
                {!isSystemColumn && (
                    <div ref={menuRef} className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-variant transition-all text-on-surface-variant/50 hover:text-on-surface"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-surface rounded-xl shadow-xl border border-outline-variant/30 py-1 z-50">
                                <button
                                    onClick={() => setIsEditingTitle(true)}
                                    className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-primary/5 flex items-center gap-2 text-on-surface"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Editar nome
                                </button>
                                <button
                                    onClick={() => { setColorMenuOpen(!colorMenuOpen); setIconMenuOpen(false) }}
                                    className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-primary/5 flex items-center gap-2 text-on-surface"
                                >
                                    <Palette className="w-3.5 h-3.5" />
                                    Alterar cor
                                </button>
                                <button
                                    onClick={() => { setIconMenuOpen(!iconMenuOpen); setColorMenuOpen(false) }}
                                    className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-primary/5 flex items-center gap-2 text-on-surface"
                                >
                                    <Smile className="w-3.5 h-3.5" />
                                    Alterar ícone
                                </button>
                                <div className="border-t border-outline-variant/20 my-1" />
                                <button
                                    onClick={() => deleteColumn(column.id)}
                                    className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-error/10 flex items-center gap-2 text-error"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Excluir lista
                                </button>
                            </div>
                        )}

                        {/* Color Submenu */}
                        {colorMenuOpen && (
                            <div className="absolute right-full top-0 mr-1 w-32 bg-surface rounded-xl shadow-xl border border-outline-variant/30 p-2 z-50">
                                <div className="grid grid-cols-4 gap-1.5">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.value}
                                            onClick={() => handleColorChange(c.value)}
                                            className={`w-6 h-6 rounded-full bg-${c.value}-500 hover:ring-2 hover:ring-offset-1 hover:ring-${c.value}-500 transition-all flex items-center justify-center`}
                                        >
                                            {column.color === c.value && <Check className="w-3 h-3 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Icon Submenu */}
                        {iconMenuOpen && (
                            <div className="absolute right-full top-0 mr-1 w-48 bg-surface rounded-xl shadow-xl border border-outline-variant/30 p-2 z-50">
                                <div className="grid grid-cols-5 gap-1.5">
                                    {ICONS.map(i => {
                                        const Icon = i.icon
                                        return (
                                            <button
                                                key={i.value}
                                                onClick={() => handleIconChange(i.value)}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${column.icon === i.value ? 'bg-primary/10 text-primary' : 'hover:bg-surface-variant text-on-surface-variant'}`}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Task List with SortableContext */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <SortableContext
                    items={tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2 pb-2 min-h-[60px]">
                        {tasks.length === 0 ? (
                            <div className="text-center py-6 text-on-surface-variant/40 text-xs font-medium">
                                Arraste cards aqui
                            </div>
                        ) : (
                            tasks.map(task => (
                                <KanbanCard
                                    key={task.id}
                                    task={task}
                                    allColumns={allColumns}
                                    onMoveTask={onMoveTask}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            </div>

            {/* Add Card Button */}
            <div className="pt-2 mt-auto">
                {isAddingCard ? (
                    <div className="bg-surface rounded-lg p-2 border border-outline-variant/30 shadow-sm">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Título do card..."
                            value={newCardTitle}
                            onChange={e => setNewCardTitle(e.target.value)}
                            onKeyDown={e => {
                                e.stopPropagation()
                                if (e.key === 'Enter') handleAddCard()
                            }}
                            className="w-full bg-surface-variant/30 rounded px-2 py-1.5 text-sm text-on-surface outline-none border border-transparent focus:border-primary/30 mb-2"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsAddingCard(false)}
                                className="text-[10px] font-bold text-on-surface-variant hover:text-on-surface px-2 py-1"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddCard}
                                className="text-[10px] font-bold bg-primary text-on-primary px-2 py-1 rounded hover:bg-primary/90"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAddingCard(true)}
                        className="w-full py-2 text-xs font-bold text-on-surface-variant/50 hover:text-primary hover:bg-primary/5 rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar cartão
                    </button>
                )}
            </div>
        </div>
    )
}
