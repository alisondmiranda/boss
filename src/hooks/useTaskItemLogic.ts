import { useState, useEffect, useRef, useCallback } from 'react'
import { Task } from '../store/types'

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

export function useTaskItemLogic(
    task: Task,
    updateTask: (id: string, updates: Partial<Task>) => void,
    toggleTask: (id: string, status: Task['status']) => void,
    addSubtask: (taskId: string, title: string) => Promise<void>,
    updateSubtask: (subtaskId: string, title: string) => Promise<void>,
    deleteSubtask: (subtaskId: string) => Promise<void>
) {
    // Refs
    const cardRef = useRef<HTMLDivElement>(null)

    // Estados de expansão
    const [isFullyExpanded, setIsFullyExpanded] = useState(false)
    const [isQuickExpanded, setIsQuickExpanded] = useState(false)

    // Carregar preferências persistidas
    const storedPrefs = getStoredPrefs(task.id)
    const [showDescription, setShowDescription] = useState(storedPrefs?.showDescription ?? !!task.details)
    const [showSubtasks, setShowSubtasks] = useState(storedPrefs?.showSubtasks ?? true)

    // Subtask Editing
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
    const [editSubtaskTitle, setEditSubtaskTitle] = useState('')

    // Animation & UI states
    const [animationState, setAnimationState] = useState<'idle' | 'celebrating' | 'exiting'>('idle')
    const [showCalendar, setShowCalendar] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(task.title)
    const [description, setDescription] = useState(task.details || '')
    const [expandedSubtaskDetails, setExpandedSubtaskDetails] = useState<Set<string>>(new Set())
    const [subtaskDetailsMap, setSubtaskDetailsMap] = useState<Record<string, string>>({})

    // Unused in component but kept if needed for logic symmetry with original
    const [isEditingDescription, setIsEditingDescription] = useState(false)

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

    // Persistir preferências
    const persistPrefs = useCallback((desc: boolean, subs: boolean) => {
        setStoredPrefs(task.id, { showDescription: desc, showSubtasks: subs })
    }, [task.id])

    // Handlers
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

    const handleSubtaskDetailsSave = (subtaskId: string, details: string) => {
        setSubtaskDetailsMap(prev => ({ ...prev, [subtaskId]: details }))
    }

    const handleChevronClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsFullyExpanded(!isFullyExpanded)
    }

    const handleToggleDescription = (e: React.MouseEvent) => {
        e.stopPropagation()
        const newValue = !showDescription
        setShowDescription(newValue)
        persistPrefs(newValue, showSubtasks)
    }

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

    return {
        cardRef,
        isFullyExpanded, setIsFullyExpanded,
        isQuickExpanded, setIsQuickExpanded,
        showDescription, setShowDescription,
        showSubtasks, setShowSubtasks,
        newSubtaskTitle, setNewSubtaskTitle,
        editingSubtaskId, setEditingSubtaskId,
        editSubtaskTitle, setEditSubtaskTitle,
        animationState, setAnimationState,
        showCalendar, setShowCalendar,
        isEditing, setIsEditing,
        editTitle, setEditTitle,
        description, setDescription,
        expandedSubtaskDetails, setExpandedSubtaskDetails,
        subtaskDetailsMap, setSubtaskDetailsMap,
        isEditingDescription, setIsEditingDescription,

        toggleSubtaskDetails,
        handleSubtaskDetailsSave,
        handleChevronClick,
        handleToggleDescription,
        handleToggleSubtasks,
        handleSaveTitle,
        handleSaveDescription,
        handleSubtaskEditStart,
        handleToggleCompletion,
        handleAddSubtask,
        handleSubtaskEditSave,
        deleteSubtask // Exporting this so component can use it
    }
}
