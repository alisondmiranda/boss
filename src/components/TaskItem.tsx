import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Trash2, Tag, Check, Pencil } from 'lucide-react'
import { Sector } from '../store/settingsStore'
import { ICONS } from '../constants/icons'
import { Task } from '../store/taskStore'

interface TaskItemProps {
    task: Task
    taskSectors: string[]
    sectors: Sector[]
    toggleTask: (id: string, status: Task['status']) => void
    updateTaskSector: (id: string, sectorId: string) => void
    setTaskMenuOpen: (id: string | null) => void
    taskMenuOpen: string | null
    handleMoveToTrash: (id: string) => void
    updateTask: (id: string, updates: Partial<Task>) => void
}

export function TaskItem({
    task, taskSectors, sectors, toggleTask, updateTaskSector,
    setTaskMenuOpen, taskMenuOpen, handleMoveToTrash, updateTask
}: TaskItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(task.title)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus()
        }
    }, [isEditing])

    const handleSave = () => {
        if (editTitle.trim() && editTitle !== task.title) {
            updateTask(task.id, { title: editTitle.trim() })
        }
        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') {
            setEditTitle(task.title)
            setIsEditing(false)
        }
    }

    const getSectorDetails = (sectorId: string) => {
        return sectors.find(s => s.id === sectorId) || { id: sectorId, label: 'Geral', color: 'slate' as const, icon: 'tag' }
    }

    const getSectorColorClass = (color: string) => {
        switch (color) {
            case 'slate': return 'bg-slate-100 text-slate-700 border-slate-200'
            case 'red': return 'bg-red-100 text-red-700 border-red-200'
            case 'orange': return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'amber': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'yellow': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'lime': return 'bg-lime-100 text-lime-700 border-lime-200'
            case 'green': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'teal': return 'bg-teal-100 text-teal-700 border-teal-200'
            case 'cyan': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
            case 'sky': return 'bg-sky-100 text-sky-700 border-sky-200'
            case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'indigo': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
            case 'violet': return 'bg-violet-100 text-violet-700 border-violet-200'
            case 'purple': return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'fuchsia': return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200'
            case 'pink': return 'bg-pink-100 text-pink-700 border-pink-200'
            default: return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card-filled !bg-surface flex items-center gap-4 group hover:shadow-1 transition-all border border-transparent hover:border-outline-variant/30 relative"
        >
            <button
                onClick={() => toggleTask(task.id, task.status)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${task.status === 'done'
                    ? 'bg-primary border-primary text-on-primary'
                    : 'border-outline hover:border-primary text-transparent'
                    }`}
            >
                <CheckCircle2 className="w-4 h-4" />
            </button>

            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-b border-primary outline-none py-1 text-base text-on-surface"
                />
            ) : (
                <div className="flex-1 flex items-center gap-2 overflow-hidden">
                    <span
                        onClick={() => setIsEditing(true)}
                        className={`text-base transition-all truncate select-none cursor-pointer hover:text-primary ${task.status === 'done' ? 'text-on-surface-variant line-through opacity-60' : 'text-on-surface'}`}
                        title="Clique para editar"
                    >
                        {task.title}
                    </span>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1"
                        title="Editar"
                    >
                        <Pencil className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Sector Badges */}
            <div className="relative flex gap-1 flex-wrap justify-end">
                {taskSectors.length === 0 ? (
                    <button
                        onClick={() => setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)}
                        className={`px-3 py-1 rounded-[8px] text-[11px] font-medium flex items-center gap-1.5 uppercase tracking-wide flex-shrink-0 cursor-pointer hover:brightness-95 transition-all bg-slate-100 text-slate-500 border-slate-200`}
                        title="Atribuir Setor"
                    >
                        <Tag className="w-3 h-3 opacity-70" />
                        Geral
                    </button>
                ) : (
                    taskSectors.map((sectorId) => {
                        const sector = getSectorDetails(sectorId)
                        const SectorIcon = ICONS.find(i => i.value === sector.icon)?.icon || Tag
                        return (
                            <button
                                key={`${task.id}-${sectorId}`}
                                onClick={() => setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)}
                                className={`px-3 py-1 rounded-[8px] text-[11px] font-medium flex items-center gap-1.5 uppercase tracking-wide flex-shrink-0 cursor-pointer hover:brightness-95 transition-all ${getSectorColorClass(sector.color)}`}
                                title="Mudar Setor"
                            >
                                <SectorIcon className="w-3 h-3 opacity-70" />
                                {sector.label}
                            </button>
                        )
                    })
                )}

                {/* Sector Popup Menu */}
                <AnimatePresence>
                    {taskMenuOpen === task.id && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setTaskMenuOpen(null)} />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl shadow-4 border border-outline-variant z-50 overflow-hidden flex flex-col py-1"
                            >
                                <span className="px-3 py-2 text-[10px] uppercase font-bold text-on-surface-variant/50 tracking-wider">Setores</span>
                                {sectors.map(s => {
                                    const isActive = taskSectors.includes(s.id)
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                updateTaskSector(task.id, s.id)
                                            }}
                                            className={`px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-surface-variant transition-colors ${isActive ? 'text-primary font-medium bg-primary-container/20' : 'text-on-surface'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${getSectorColorClass(s.color).split(' ')[0].replace('bg-', 'bg-').replace('-100', '-500')}`} />
                                            {s.label}
                                            {isActive && <Check className="w-3 h-3 ml-auto" />}
                                        </button>
                                    )
                                })}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            <button
                onClick={() => handleMoveToTrash(task.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-full transition-all"
                title="Excluir"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </motion.div>
    )
}
