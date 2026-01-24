import { useEffect, useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
    Plus, Trash2, LogOut, Settings, Send, Loader2, Calendar, ListTodo, Ghost, Tag,
    PanelLeftClose, PanelRightOpen, Search, X, ChevronDown,
    ChevronRight, MoreVertical, Check
} from 'lucide-react'
import crownLogo from '../assets/crown.svg'
import { AVATAR_ICONS, ICONS, AssistantIcon } from '../constants/icons.tsx'
import { useAuthStore } from '../store/authStore'
import { useTaskStore, Task } from '../store/taskStore'
import { useSettingsStore } from '../store/settingsStore'
import { SettingsModal } from './SettingsModal'
import { sendMessageToGemini, GeminiResponse } from '../lib/gemini'
import { RecurrenceRule } from './RecurrencePicker'
import { TaskFormModal } from './TaskFormModal'
import { TaskItem } from './TaskItem'
import { RightSidebar } from './RightSidebar'
import { useUIStore } from '../store/uiStore'


interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

import { useToast } from '../store/toastStore'
import { ToastContainer } from './ToastContainer'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function Dashboard() {
    const { toggleRightSidebar, isRightSidebarOpen, isLeftSidebarExpanded, setLeftSidebarExpanded, fetchUIPreferences, subscribeToUIPreferences } = useUIStore()
    const { signOut, user } = useAuthStore()
    const {
        tasks, trashTasks, loading, fetchTasks, addTask, toggleTask,
        moveToTrash, restoreTask, permanentlyDeleteTask, toggleTaskSector, updateTask, updateTaskWithSubtasks,
        clearDoneTasks, emptyTrash, updateSubtask, addSubtask, toggleSubtask, deleteSubtask, reorderTasks, reorderSubtasks,
        subscribeToTasks
    } = useTaskStore()
    const { sectors, userProfile, sortBy: sortBySettings } = useSettingsStore()
    const { addToast } = useToast()

    const [showSettings, setShowSettings] = useState(false)
    const [settingsTab, setSettingsTab] = useState<'api' | 'sectors' | 'profile'>('api')
    const [filter, setFilter] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt' | 'name' | 'manual'>(() => {
        const saved = localStorage.getItem('boss-task-sort')
        return (saved as 'dueDate' | 'createdAt' | 'name' | 'manual') || 'dueDate'
    })

    // Sidebar State
    const [sidebarOpen] = useState(true) // For Mobile Drawer
    // isLeftSidebarExpanded now comes from uiStore
    const isSidebarExpanded = isLeftSidebarExpanded
    const setIsSidebarExpanded = setLeftSidebarExpanded
    const [sidebarMode, setSidebarMode] = useState<'nav' | 'chat' | 'trash'>('nav')
    const [showDone, setShowDone] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)


    // Task Context Menu State
    const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null)

    // Quick Input State
    const [quickTaskTitle, setQuickTaskTitle] = useState('')
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [showQuickAddSuccess, setShowQuickAddSuccess] = useState(false)
    const quickInputRef = useRef<HTMLInputElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const searchContainerRef = useRef<HTMLDivElement>(null)

    // Focus Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault()
                quickInputRef.current?.focus()
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsSearchOpen(true)
                setTimeout(() => searchInputRef.current?.focus(), 100)
            }
        }

        const handleClickOutside = (e: MouseEvent) => {
            if (isSearchOpen && searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node) && !quickInputRef.current?.contains(e.target as Node)) {
                setIsSearchOpen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('mousedown', handleClickOutside)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isSearchOpen])

    const [settingsOpenCreation, setSettingsOpenCreation] = useState(false)

    const openSettings = (tab: 'api' | 'sectors' | 'profile' = 'api', openCreation = false) => {
        setSettingsTab(tab)
        setSettingsOpenCreation(openCreation)
        setShowSettings(true)
        // Reset creating state after opening (SettingsModal handles it on mount/update)
        // Actually, we should keep it true while open if we want it to work on mount,
        // but since SettingsModal uses it in useEffect dependent on isOpen, it's fine.
    }

    // Listen for custom event to open sectors settings
    useEffect(() => {
        const handleOpenSectors = () => openSettings('sectors', true)
        window.addEventListener('open-sectors-settings', handleOpenSectors)
        return () => window.removeEventListener('open-sectors-settings', handleOpenSectors)
    }, [])

    // Chat State
    const [chatInput, setChatInput] = useState('')
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Olá! Sou o Boss. Como posso ajudar a organizar sua vida hoje?' }
    ])
    const [isThinking, setIsThinking] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchTasks()
        fetchUIPreferences()
        const unsubscribeUI = subscribeToUIPreferences()
        const unsubscribeTasks = subscribeToTasks()
        return () => {
            unsubscribeUI()
            unsubscribeTasks()
        }
    }, [])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages])

    // Dynamic Greeting
    const getGreeting = () => {
        const hour = new Date().getHours()
        let greeting = 'Bom dia'
        if (hour >= 12 && hour < 18) greeting = 'Boa tarde'
        if (hour >= 18) greeting = 'Boa noite'

        return `${greeting}, `
    }

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [initialOpenPicker, setInitialOpenPicker] = useState<'date' | 'recurrence' | null>(null)

    // Updated Filtering Logic
    const toggleFilter = (sectorId: string) => {
        setFilter(prev => {
            if (prev.includes(sectorId)) {
                return prev.filter(id => id !== sectorId)
            } else {
                return [...prev, sectorId]
            }
        })
    }

    const doneTasksCount = useMemo(() => tasks.filter(t => t.status === 'done').length, [tasks])
    const trashTasksCount = useMemo(() => trashTasks.length, [trashTasks])

    const sortedSectors = useMemo(() => {
        return [...sectors].sort((a, b) => {
            if (sortBySettings === 'alpha') return a.label.localeCompare(b.label)
            if (sortBySettings === 'created') return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime())
            return 0
        })
    }, [sectors, sortBySettings])

    const filteredTasks = useMemo(() => tasks.filter(t => {
        // Filter by sector
        if (filter.length > 0) {
            const taskSectors = Array.isArray(t.sector) ? t.sector : (t.sector?.toString().split(',').filter(Boolean) || [])
            if (!taskSectors.some((s: string) => filter.includes(s))) return false
        }
        // Filter by search query
        if (searchQuery.trim()) {
            return t.title.toLowerCase().includes(searchQuery.toLowerCase())
        }
        return true
    }), [tasks, filter, searchQuery])

    // Sorted tasks
    const sortedTasks = useMemo(() => [...filteredTasks].sort((a, b) => {
        switch (sortBy) {
            case 'dueDate':
                // Tasks with due date first, sorted by date (earliest first)
                // Then tasks without due date, sorted by creation
                if (a.due_at && b.due_at) {
                    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
                }
                if (a.due_at) return -1
                if (b.due_at) return 1
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            case 'createdAt':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            case 'name':
                return a.title.localeCompare(b.title, 'pt-BR')
            case 'manual':
                return (a.order ?? 0) - (b.order ?? 0)
            default:
                return 0
        }
    }), [filteredTasks, sortBy])

    const pendingTasks = useMemo(() => sortedTasks.filter(t => t.status !== 'done'), [sortedTasks])
    const doneTasks = useMemo(() => sortedTasks.filter(t => t.status === 'done'), [sortedTasks])

    const handleSortChange = (newSort: 'dueDate' | 'createdAt' | 'name' | 'manual') => {
        setSortBy(newSort)
        localStorage.setItem('boss-task-sort', newSort)
    }



    const handleAddTask = async (title: string, inputSectors: string[], dueAt: Date | null, recurrence: RecurrenceRule | null, details: string | null, subtasks: any[]) => {
        try {
            // Apply default sector (Geral) if none selected
            let finalSectors = inputSectors
            if (!finalSectors || finalSectors.length === 0) {
                const geral = sectors.find(s => s.label.toLowerCase() === 'geral' || s.label.toLowerCase() === 'general')
                if (geral) {
                    finalSectors = [geral.id]
                } else {
                    finalSectors = ['geral'] // Virtual default sector
                }
            }

            if (editingTask) {
                // Update Logic
                await updateTaskWithSubtasks(editingTask.id, {
                    title,
                    sector: finalSectors,
                    due_at: dueAt ? dueAt.toISOString() : null,
                    details,
                    recurrence_id: recurrence ? (recurrence as any).id || editingTask.recurrence_id : null
                }, subtasks)
                addToast('Tarefa atualizada!', 'success')
            } else {
                await addTask(title, finalSectors, dueAt, recurrence, details, subtasks)
                addToast('Tarefa criada com sucesso!', 'success')
            }
        } catch (error) {
            console.error(error)
            addToast(`Erro ao ${(editingTask ? 'atualizar' : 'criar')} tarefa: ${(error as any).message || 'Tente novamente'}`, 'error')
        }
    }


    const handleMoveToTrash = async (id: string) => {
        try {
            await moveToTrash(id)
            addToast('Tarefa movida para a lixeira.', 'info', {
                label: 'Desfazer',
                onClick: () => handleRestore(id)
            })
        } catch (error) {
            addToast('Erro ao excluir tarefa.', 'error')
        }
    }

    const handleRestore = async (id: string) => {
        await restoreTask(id)
        addToast('Tarefa restaurada!', 'success')
    }

    const handlePermanentDelete = async (id: string) => {
        if (confirm('Tem certeza? Essa ação não pode ser desfeita.')) {
            await permanentlyDeleteTask(id)
            addToast('Tarefa excluída permanentemente.', 'info')
        }
    }



    const handleClearDone = async () => {
        if (doneTasksCount === 0) return
        if (confirm(`Tem certeza que deseja mover ${doneTasksCount} tarefas concluídas para a lixeira?`)) {
            await clearDoneTasks()
            addToast('Tarefas movidas para a lixeira.', 'success')
        }
    }

    const handleEmptyTrash = async () => {
        if (trashTasksCount === 0) return
        if (confirm('Tem certeza que deseja esvaziar a lixeira? Essa ação é irreversível.')) {
            await emptyTrash()
            addToast('Lixeira esvaziada.', 'success')
        }
    }



    const handleToggleTask = async (id: string, currentStatus: string) => {
        const isCompleting = currentStatus !== 'done'

        await toggleTask(id, currentStatus as any)

        if (isCompleting) {
            // Pequeno delay para aparecer depois da animação
            setTimeout(() => {
                addToast('Tarefa concluída! 🎉', 'success', {
                    label: 'Desfazer',
                    onClick: () => toggleTask(id, 'done') // Reverte de volta para todo
                })
            }, 150)
        }
    }

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!chatInput.trim() || isThinking) return

        const userMessage = chatInput.trim()
        setChatInput('')
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsThinking(true)

        try {
            const response: GeminiResponse = await sendMessageToGemini(userMessage)
            if (response.action === 'add' && response.task) {
                await addTask(response.task.title, response.task.sector)
            }
            setChatMessages(prev => [...prev, { role: 'assistant', content: response.message }])
        } catch (error) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com a IA.' }])
        } finally {
            setIsThinking(false)
        }
    }

    const handleQuickTaskSubmit = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && quickTaskTitle.trim()) {
            e.preventDefault()
            const taskTitle = quickTaskTitle.trim()

            // OPTIMISTIC UI: Show success IMMEDIATELY
            setQuickTaskTitle('')
            setShowQuickAddSuccess(true)
            setTimeout(() => setShowQuickAddSuccess(false), 1800)

            // Then process in background
            try {
                await handleAddTask(taskTitle, [], null, null, null, [])
            } catch (error) {
                console.error("Quick add failed", error)
                addToast('Erro ao criar tarefa. Tente novamente.', 'error')
            }
        }
    }


    return (
        <div className="flex h-screen overflow-hidden bg-background font-sans">
            <ToastContainer />
            <SettingsModal
                isOpen={showSettings}
                onClose={() => { setShowSettings(false); setSettingsOpenCreation(false) }}
                initialTab={settingsTab}
                initialOpenCreation={settingsOpenCreation}
            />

            {/* LEFT: Sidebar (Tasks Style) */}
            <motion.aside
                initial={false}
                animate={{
                    width: isSidebarExpanded ? '280px' : '72px',
                    opacity: sidebarOpen ? 1 : 0
                }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                className={`${sidebarOpen ? 'flex' : 'hidden'} lg:flex h-full flex-col bg-surface border-r border-outline-variant/50 shadow-sm z-20 overflow-hidden relative`}
            >
                {/* Header / App Name */}
                <div className="h-20 flex items-center shrink-0 border-b border-transparent relative">
                    <a
                        href="https://boss-assistant.netlify.app/"
                        className="w-[72px] h-20 shrink-0 flex items-center justify-center cursor-pointer"
                        onClick={(e) => {
                            // Só interfere se for clique esquerdo sem teclas modificadoras
                            if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                                if (!isSidebarExpanded) {
                                    e.preventDefault()
                                    setIsSidebarExpanded(true)
                                }
                            }
                        }}
                    >
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                            <img src={crownLogo} className="w-8 h-8 text-on-primary-container" alt="Boss" />
                        </div>
                    </a>

                    <motion.div
                        initial={false}
                        animate={{
                            opacity: isSidebarExpanded ? 1 : 0,
                            x: isSidebarExpanded ? 0 : -10,
                            display: isSidebarExpanded ? 'block' : 'none'
                        }}
                        className="overflow-hidden whitespace-nowrap pr-4"
                    >
                        <a href="https://boss-assistant.netlify.app/" className="font-bold text-xl leading-tight text-on-surface tracking-tight hover:text-primary transition-colors">
                            Boss
                        </a>
                    </motion.div>

                    {isSidebarExpanded && (
                        <button
                            onClick={() => setIsSidebarExpanded(false)}
                            className="ml-auto mr-4 p-1.5 text-on-surface-variant/50 hover:text-primary transition-colors shrink-0"
                        >
                            <PanelLeftClose className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Sidebar Navigation */}
                <div className="flex-1 overflow-hidden relative w-full flex flex-col py-4 gap-2">
                    <div className="space-y-1">
                        {/* Tasks (Nav) */}
                        <div
                            onClick={() => { setSidebarMode('nav'); setFilter([]); }}
                            className={`w-full flex items-center rounded-r-[16px] text-sm font-medium transition-colors relative cursor-pointer group/item ${sidebarMode === 'nav' && filter.length === 0 ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-variant/70'}`}
                            role="button"
                        >
                            {/* Active Indicator Bar */}
                            {sidebarMode === 'nav' && filter.length === 0 && (
                                <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full" />
                            )}

                            <div className="w-[72px] h-12 shrink-0 flex items-center justify-center">
                                <ListTodo className="w-5 h-5" />
                            </div>

                            <motion.div
                                initial={false}
                                animate={{
                                    opacity: isSidebarExpanded ? 1 : 0,
                                    x: isSidebarExpanded ? 0 : -10
                                }}
                                className="flex-1 flex items-center justify-between pr-4 overflow-hidden"
                            >
                                <span className="truncate whitespace-nowrap">Tarefas</span>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSidebarMode('trash');
                                    }}
                                    className={`p-1.5 rounded-full transition-all opacity-0 group-hover/item:opacity-100 ${sidebarMode === 'trash' ? 'bg-error/10 text-error opacity-100' : 'text-on-surface-variant/50 hover:text-error hover:bg-error/10'}`}
                                    title="Lixeira"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </motion.div>
                        </div>



                        {/* Chat (Assistant) */}
                        <button
                            onClick={() => setSidebarMode('chat')}
                            className={`w-full flex items-center rounded-r-[16px] text-sm font-medium transition-colors relative ${sidebarMode === 'chat' ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-variant/70'}`}
                        >
                            {sidebarMode === 'chat' && (
                                <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full" />
                            )}

                            <div className="w-[72px] h-12 shrink-0 flex items-center justify-center">
                                <AssistantIcon className="w-5 h-5" />
                            </div>

                            <motion.span
                                initial={false}
                                animate={{ opacity: isSidebarExpanded ? 1 : 0, x: isSidebarExpanded ? 0 : -10 }}
                                className="truncate overflow-hidden whitespace-nowrap"
                            >
                                Assistente
                            </motion.span>
                        </button>
                    </div>

                    {/* Sectors List (Tags) */}
                    <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar mt-0">
                        <motion.div
                            initial={false}
                            animate={{ opacity: isSidebarExpanded ? 1 : 0, height: isSidebarExpanded ? 'auto' : 0 }}
                            className="px-6 pb-1 pt-3 flex items-center justify-between group overflow-hidden"
                        >
                            <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-[0.1em]">Etiquetas</span>
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={() => openSettings('sectors')}
                                    className="p-1 hover:bg-surface-variant/50 rounded-full text-on-surface-variant/50 hover:text-primary transition-colors"
                                    title="Nova Etiqueta"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </motion.div>

                        {sortedSectors.map((s) => {
                            const isSelected = sidebarMode === 'nav' && filter.includes(s.id)
                            const SectorIcon = ICONS.find(i => i.value === s.icon)?.icon || Tag
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => { setSidebarMode('nav'); toggleFilter(s.id); }}
                                    className={`w-full flex items-center rounded-r-[14px] text-[13px] font-medium transition-colors relative group py-0.5 ${isSelected
                                        ? 'bg-primary/5 text-primary font-semibold'
                                        : 'text-on-surface hover:bg-surface-variant/70'
                                        }`}
                                    title={s.label}
                                >
                                    {isSelected && (
                                        <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-r-full" />
                                    )}

                                    <div className="w-[72px] h-9 shrink-0 flex items-center justify-center">
                                        <SectorIcon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-on-surface-variant/80'}`} />
                                    </div>

                                    <motion.span
                                        initial={false}
                                        animate={{ opacity: isSidebarExpanded ? 1 : 0, x: isSidebarExpanded ? 0 : -10 }}
                                        className="truncate flex-1 text-left overflow-hidden whitespace-nowrap leading-none"
                                    >
                                        {s.label}
                                    </motion.span>

                                    {isSelected && isSidebarExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="mr-5"
                                        >
                                            <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_rgba(var(--primary-rgb),0.6)]" />
                                        </motion.div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="mt-auto px-6 py-6 border-t border-outline-variant/30 bg-surface-variant/5">
                    <p className="text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-widest pl-1">Boss v1.3.9</p>
                </div>
            </motion.aside>

            {/* RIGHT: Main Content Section */}
            < main className="flex-1 flex flex-col relative overflow-hidden bg-background" >
                {/* Header */}
                < header className="px-8 py-6 flex justify-between items-start shrink-0 z-40 relative" >
                    <div>
                        <motion.h1
                            key={userProfile.displayName} // Animate when name changes
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold text-on-surface flex items-center gap-2"
                        >
                            {getGreeting()}
                            <span className="text-primary">{userProfile.displayName || 'Boss'}.</span>
                        </motion.h1>
                        <p className="text-sm text-on-surface-variant mt-1 capitalize opacity-80 pl-1 font-medium">
                            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* User Menu */}
                        <div className="relative z-50">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="w-11 h-11 rounded-full border-2 border-outline-variant hover:border-primary p-0.5 transition-all overflow-hidden bg-surface relative"
                            >
                                {userProfile.avatarType === 'url' && userProfile.customAvatarUrl ? (
                                    <img src={userProfile.customAvatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <div className={`w-full h-full rounded-full flex items-center justify-center bg-primary-container/30 text-primary`}>
                                        {userProfile.avatarType === 'icon' && userProfile.selectedIcon ? (
                                            userProfile.selectedIcon === 'crown' ? (
                                                <img src={crownLogo} className="w-6 h-6" alt="Crown" />
                                            ) : (
                                                (() => {
                                                    const IconComponent = AVATAR_ICONS.find(i => i.value === userProfile.selectedIcon)?.icon || AVATAR_ICONS[0].icon
                                                    return <IconComponent className="w-6 h-6" />
                                                })()
                                            )
                                        ) : (
                                            <span className="font-bold text-lg">{userProfile.displayName?.charAt(0).toUpperCase() || (user?.email?.charAt(0).toUpperCase() || 'B')}</span>
                                        )}
                                    </div>
                                )}
                            </button>

                            <AnimatePresence>
                                {isUserMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-[20px] shadow-5 border border-outline-variant overflow-hidden flex flex-col py-2 z-50"
                                        >
                                            <div className="px-4 py-3 border-b border-outline-variant/50 mb-1">
                                                <p className="text-sm font-bold text-on-surface truncate">
                                                    {userProfile.displayName || 'Boss'}
                                                </p>
                                                <p className="text-xs text-on-surface-variant truncate opacity-80">
                                                    {user?.email}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setIsUserMenuOpen(false)
                                                    openSettings('profile')
                                                }}
                                                className="w-full px-4 py-2.5 text-sm text-left text-on-surface hover:bg-surface-variant/50 flex items-center gap-3 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary">
                                                    {userProfile.avatarType === 'icon' && userProfile.selectedIcon ? (
                                                        userProfile.selectedIcon === 'crown' ? (
                                                            <img src={crownLogo} className="w-4 h-4" alt="Crown" />
                                                        ) : (
                                                            (() => {
                                                                const IconComponent = AVATAR_ICONS.find(i => i.value === userProfile.selectedIcon)?.icon || AVATAR_ICONS[0].icon
                                                                return <IconComponent className="w-4 h-4" />
                                                            })()
                                                        )
                                                    ) : (
                                                        <Settings className="w-4 h-4" />
                                                    )}
                                                </div>
                                                Editar Perfil
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsUserMenuOpen(false)
                                                    openSettings('sectors')
                                                }}
                                                className="w-full px-4 py-2.5 text-sm text-left text-on-surface hover:bg-surface-variant/50 flex items-center gap-3 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
                                                    <Settings className="w-4 h-4 text-on-surface-variant" />
                                                </div>
                                                Configurações
                                            </button>

                                            <div className="h-px bg-outline-variant/50 my-1 mx-4" />

                                            <button
                                                onClick={signOut}
                                                className="w-full px-4 py-2.5 text-sm text-left text-error hover:bg-error-container/10 flex items-center gap-3 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-error-container/20 flex items-center justify-center">
                                                    <LogOut className="w-4 h-4" />
                                                </div>
                                                Sair da conta
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Right Sidebar Toggle - à direita do perfil */}
                        {!isRightSidebarOpen && (
                            <button
                                onClick={toggleRightSidebar}
                                className="w-11 h-11 rounded-full border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary hover:bg-surface-variant flex items-center justify-center transition-all"
                                title="Abrir Ferramentas"
                            >
                                <PanelRightOpen className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </header>

                {/* Task Board / Main Views */}
                < div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-20 custom-scrollbar relative" >

                    {/* VIEW: CHAT */}
                    {
                        sidebarMode === 'chat' && (
                            <div className="max-w-2xl mx-auto h-full flex flex-col py-6">
                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-on-primary rounded-tr-sm' : 'bg-surface text-on-surface border border-outline-variant/50 rounded-tl-sm'}`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isThinking && (
                                        <div className="flex justify-start">
                                            <div className="bg-surface p-4 rounded-3xl rounded-tl-sm flex items-center gap-3 border border-outline-variant/50 shadow-sm">
                                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                <span className="text-sm text-on-surface-variant font-medium">Boss está pensando...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                <div className="mt-4 relative">
                                    <form onSubmit={handleChatSubmit} className="relative group">
                                        <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-md group-hover:bg-primary/10 transition-colors" />
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Em breve..."
                                            className="w-full bg-surface border border-outline-variant/50 rounded-3xl pl-6 pr-14 py-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm relative z-10 disabled:opacity-60 disabled:cursor-not-allowed"
                                            disabled={true}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!chatInput.trim() || isThinking}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-on-primary rounded-full disabled:opacity-50 transition-all hover:shadow-md hover:scale-105 active:scale-95 z-20"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )
                    }


                    {/* VIEW: NAV (Tasks & Done Unified) */}
                    {
                        sidebarMode === 'nav' && (
                            <div className="max-w-4xl mx-auto space-y-2 pt-2">

                                {/* Quick Filters / Navigation Buttons */}
                                {/* Unified Toolbar (Only in Nav) */}
                                {sidebarMode === 'nav' && (
                                    <div className="flex flex-col md:flex-row gap-2 mb-2 sticky top-0 bg-background z-30 py-1 items-center">

                                        {/* INTERACTIVE ZONE: Quick Task + Expanding Search */}
                                        <div className="flex-1 flex items-center gap-0 relative w-full">

                                            {/* 1. Quick Task Input (Resizes with flex) */}
                                            <motion.div
                                                layout
                                                initial={false}
                                                animate={{ flex: isSearchOpen ? '1 1 50%' : '1 1 100%' }}
                                                transition={{ type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: 0.35 }}
                                                className="relative z-20 min-w-[200px]"
                                            >
                                                <motion.div
                                                    layout
                                                    animate={showQuickAddSuccess ? { scale: 1.015 } : { scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                    onClick={() => {
                                                        if (showQuickAddSuccess) setShowQuickAddSuccess(false)
                                                        quickInputRef.current?.focus()
                                                    }}
                                                    className={`relative z-10 bg-surface rounded-2xl shadow-sm border flex items-center px-4 py-2 overflow-hidden cursor-text whitespace-nowrap
                                                        ${showQuickAddSuccess
                                                            ? 'border-primary/60 shadow-[0_0_24px_rgba(var(--primary-rgb),0.2)]'
                                                            : 'border-outline-variant/30 focus-within:border-primary/50 focus-within:bg-secondary-container/30 focus-within:shadow-md'
                                                        }
                                                    `}
                                                >
                                                    {/* Animated Glow Background on Success */}
                                                    <AnimatePresence>
                                                        {showQuickAddSuccess && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 1.2 }}
                                                                transition={{ duration: 0.3 }}
                                                                className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 pointer-events-none"
                                                            />
                                                        )}
                                                    </AnimatePresence>

                                                    {/* Icon Container with Animation */}
                                                    <div className="mr-3.5 flex items-center justify-center shrink-0 relative">
                                                        <AnimatePresence mode="wait">
                                                            {showQuickAddSuccess ? (
                                                                <motion.div
                                                                    key="success"
                                                                    initial={{ scale: 0, rotate: -180 }}
                                                                    animate={{ scale: 1, rotate: 0 }}
                                                                    exit={{ scale: 0, rotate: 180 }}
                                                                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                                                    className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                                                                >
                                                                    <Check className="w-4 h-4 text-on-primary" strokeWidth={3} />
                                                                </motion.div>
                                                            ) : (
                                                                <motion.div
                                                                    key="plus"
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    exit={{ scale: 0 }}
                                                                    transition={{ duration: 0.15 }}
                                                                    className="text-on-surface-variant/50"
                                                                >
                                                                    <Plus className="w-5 h-5" />
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>

                                                    {/* Input / Success Badge - Input always rendered */}
                                                    <div className="flex-1 min-w-0 relative h-6 flex items-center">
                                                        {/* Input is ALWAYS rendered but may be visually hidden */}
                                                        <input
                                                            ref={quickInputRef}
                                                            type="text"
                                                            value={quickTaskTitle}
                                                            onFocus={() => {
                                                                setIsSearchOpen(false)
                                                                if (showQuickAddSuccess) setShowQuickAddSuccess(false)
                                                            }}
                                                            onChange={(e) => {
                                                                if (showQuickAddSuccess) setShowQuickAddSuccess(false)
                                                                setQuickTaskTitle(e.target.value)
                                                            }}
                                                            onKeyDown={handleQuickTaskSubmit}
                                                            placeholder="O que precisa ser feito agora?"
                                                            className={`w-full bg-transparent border-none text-[1.05rem] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none h-6 ${showQuickAddSuccess ? 'opacity-0' : 'opacity-100'} transition-opacity duration-150`}
                                                        />

                                                        {/* Success Badge Overlay - Click through to input */}
                                                        <AnimatePresence>
                                                            {showQuickAddSuccess && (
                                                                <motion.div
                                                                    key="badge"
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -10 }}
                                                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                                    className="absolute inset-0 flex items-center pointer-events-none"
                                                                >
                                                                    <span className="text-primary font-semibold text-sm tracking-wide">
                                                                        Tarefa criada!
                                                                    </span>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>

                                                    {/* Shortcuts / Hints */}
                                                    {!quickTaskTitle && !showQuickAddSuccess && !isSearchOpen && (
                                                        <div className="hidden md:flex items-center gap-2 pointer-events-none select-none opacity-40 shrink-0">
                                                            <span className="px-1.5 py-0.5 rounded border border-on-surface-variant text-[10px] font-medium text-on-surface-variant">
                                                                /
                                                            </span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            </motion.div>


                                            {/* 2. Expanding Search */}
                                            <motion.div
                                                ref={searchContainerRef}
                                                layout
                                                initial={false}
                                                animate={{ flex: isSearchOpen ? '1 1 50%' : '0 0 40px' }}
                                                style={{ marginLeft: '8px' }}
                                                transition={{ type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: 0.35 }}
                                                className="relative h-10 z-10"
                                            >
                                                {/* Container that morphs - Always centered content */}
                                                <motion.div
                                                    layout
                                                    onClick={() => !isSearchOpen && setIsSearchOpen(true)}
                                                    className={`
                                                        absolute inset-0 flex items-center justify-center cursor-pointer overflow-hidden
                                                        ${isSearchOpen
                                                            ? 'bg-surface border border-primary/50 shadow-md rounded-2xl !justify-start px-4'
                                                            : 'bg-surface-variant/20 hover:bg-surface-variant/40 border border-outline-variant/30 rounded-full'
                                                        }
                                                        transition-colors duration-200
                                                    `}
                                                    transition={{ type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: 0.35 }}
                                                >
                                                    {/* Search Icon - Layout animated for smooth repositioning */}
                                                    <motion.div
                                                        layout
                                                        className="flex items-center justify-center shrink-0"
                                                        transition={{ type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: 0.35 }}
                                                    >
                                                        <Search className={`w-5 h-5 transition-colors duration-200 ${isSearchOpen ? 'text-primary' : 'text-on-surface-variant'}`} />
                                                    </motion.div>

                                                    {/* Input Area - AnimatePresence for clean enter/exit */}
                                                    <AnimatePresence mode="sync">
                                                        {isSearchOpen && (
                                                            <motion.div
                                                                key="search-input-area"
                                                                initial={{ opacity: 0, width: 0 }}
                                                                animate={{ opacity: 1, width: 'auto' }}
                                                                exit={{ opacity: 0, width: 0 }}
                                                                transition={{
                                                                    opacity: { duration: 0.12, ease: "easeOut" },
                                                                    width: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }
                                                                }}
                                                                className="flex items-center min-w-0 flex-1 ml-3 overflow-hidden"
                                                            >
                                                                <input
                                                                    ref={searchInputRef}
                                                                    type="text"
                                                                    value={searchQuery}
                                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                                    placeholder="Buscar..."
                                                                    className="flex-1 bg-transparent border-none text-base text-on-surface focus:outline-none min-w-0"
                                                                />
                                                                <motion.button
                                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                                    transition={{ duration: 0.1 }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSearchQuery('');
                                                                        setIsSearchOpen(false);
                                                                    }}
                                                                    className="p-1.5 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors ml-2 shrink-0"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </motion.button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            </motion.div>

                                        </div>

                                        {/* Fixed Right Actions */}
                                        <div className="flex items-center gap-3 shrink-0 pl-2 border-l border-outline-variant/30 md:border-none md:pl-0">

                                            <button
                                                onClick={() => setIsTaskFormOpen(true)}
                                                className="h-10 w-10 md:w-auto md:px-5 rounded-3xl bg-tertiary text-on-tertiary font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all flex items-center justify-center gap-2"
                                                title="Formulário Completo"
                                            >
                                                <Plus className="w-5 h-5 md:w-4 md:h-4" />
                                                <span className="hidden md:inline text-sm">Criar</span>
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={() => setMenuOpen(!menuOpen)}
                                                    className={`h-[44px] w-[44px] rounded-full flex items-center justify-center transition-colors ${menuOpen ? 'bg-surface-variant text-on-surface' : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface'}`}
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                <AnimatePresence>
                                                    {menuOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                transition={{ duration: 0.1 }}
                                                                className="absolute right-0 top-14 w-64 bg-surface rounded-xl shadow-lg border border-outline-variant/50 z-50 py-2 flex flex-col overflow-hidden"
                                                            >
                                                                <div className="px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                                                                    Ordenar por
                                                                </div>

                                                                {[
                                                                    { label: 'Minha ordem', value: 'manual' },
                                                                    { label: 'Data de Vencimento', value: 'dueDate' },
                                                                    { label: 'Alfabético', value: 'name' },
                                                                    { label: 'Criação', value: 'createdAt' }
                                                                ].map((option) => (
                                                                    <button
                                                                        key={option.value}
                                                                        onClick={() => {
                                                                            handleSortChange(option.value as any)
                                                                            setMenuOpen(false)
                                                                        }}
                                                                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${sortBy === option.value ? 'bg-primary/5 text-primary font-medium' : 'text-on-surface hover:bg-on-surface/5'}`}
                                                                    >
                                                                        <span>{option.label}</span>
                                                                        {sortBy === option.value && <Check className="w-4 h-4" />}
                                                                    </button>
                                                                ))}

                                                                <div className="h-px bg-outline-variant/30 my-2 mx-4" />

                                                                <button
                                                                    onClick={() => {
                                                                        setSidebarMode('trash')
                                                                        setMenuOpen(false)
                                                                    }}
                                                                    className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-on-surface/5 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    <span>Lixeira</span>
                                                                </button>

                                                                {doneTasksCount > 0 && (
                                                                    <>
                                                                        <div className="h-px bg-outline-variant/30 my-2 mx-4" />
                                                                        <button
                                                                            onClick={() => {
                                                                                handleClearDone()
                                                                                setMenuOpen(false)
                                                                            }}
                                                                            className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 flex items-center gap-2 transition-colors"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                            <span>Excluir tarefas concluídas</span>
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <TaskFormModal
                                    isOpen={isTaskFormOpen}
                                    onClose={() => {
                                        setIsTaskFormOpen(false)
                                        setEditingTask(null)
                                        setInitialOpenPicker(null)
                                    }}
                                    onSave={handleAddTask}
                                    sectors={sortedSectors}
                                    mode={editingTask ? 'edit' : 'create'}
                                    initialTitle={editingTask?.title}
                                    initialSectors={editingTask ? (Array.isArray(editingTask.sector) ? editingTask.sector : (editingTask.sector?.toString().split(',').filter(Boolean) || [])) : []}
                                    initialDueAt={editingTask?.due_at ? new Date(editingTask.due_at) : null}
                                    initialDetails={editingTask?.details}
                                    initialSubtasks={editingTask?.subtasks || []}
                                    initialOpenPicker={initialOpenPicker}
                                />


                                {/* Header for Done/Filtered Views */}



                                {/* Tasks List */}
                                <div className="space-y-3 pb-20">
                                    {/* PENDING TASKS */}
                                    <Reorder.Group
                                        axis="y"
                                        values={pendingTasks}
                                        onReorder={(newOrder) => {
                                            if (sortBy !== 'manual') {
                                                handleSortChange('manual')
                                            }
                                            reorderTasks(newOrder)
                                        }}
                                        className="space-y-1"
                                    >
                                        {pendingTasks.map((task) => {
                                            const rawSector = task.sector
                                            const taskSectors = Array.isArray(rawSector)
                                                ? rawSector.filter(Boolean)
                                                : (rawSector?.toString().split(',').filter(Boolean) || [])

                                            return (
                                                <TaskItem
                                                    key={task.id}
                                                    task={task}
                                                    taskSectors={taskSectors as string[]}
                                                    sectors={sortedSectors}
                                                    toggleTask={handleToggleTask}
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
                                                    onEditClick={(task) => {
                                                        setEditingTask(task)
                                                        setInitialOpenPicker(null)
                                                        setIsTaskFormOpen(true)
                                                    }}
                                                    onDateClick={(task) => {
                                                        setEditingTask(task)
                                                        setInitialOpenPicker('date')
                                                        setIsTaskFormOpen(true)
                                                    }}
                                                    onRecurrenceClick={(task) => {
                                                        setEditingTask(task)
                                                        setInitialOpenPicker('recurrence')
                                                        setIsTaskFormOpen(true)
                                                    }}
                                                    sortBy={sortBy}
                                                />
                                            )
                                        })}
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

                                    {/* EMPTY STATE FOR PENDING */}
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
                                                    onReorder={(newOrder) => {
                                                        if (sortBy !== 'manual') {
                                                            handleSortChange('manual')
                                                        }
                                                        reorderTasks(newOrder)
                                                    }}
                                                    className="space-y-1 mt-2"
                                                >
                                                    {doneTasks.map((task) => {
                                                        const rawSector = task.sector
                                                        const taskSectors = Array.isArray(rawSector)
                                                            ? rawSector.filter(Boolean)
                                                            : (rawSector?.toString().split(',').filter(Boolean) || [])

                                                        return (
                                                            <TaskItem
                                                                key={task.id}
                                                                task={task}
                                                                taskSectors={taskSectors as string[]}
                                                                sectors={sortedSectors}
                                                                toggleTask={handleToggleTask}
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
                                                                onEditClick={(task) => {
                                                                    setEditingTask(task)
                                                                    setInitialOpenPicker(null)
                                                                    setIsTaskFormOpen(true)
                                                                }}
                                                                onDateClick={(task) => {
                                                                    setEditingTask(task)
                                                                    setInitialOpenPicker('date')
                                                                    setIsTaskFormOpen(true)
                                                                }}
                                                                onRecurrenceClick={(task) => {
                                                                    setEditingTask(task)
                                                                    setInitialOpenPicker('recurrence')
                                                                    setIsTaskFormOpen(true)
                                                                }}
                                                            />
                                                        )
                                                    })}
                                                </Reorder.Group>
                                            )}
                                        </div>
                                    )}
                                </div>

                            </div >
                        )
                    }

                    {/* VIEW: TRASH */}
                    {
                        sidebarMode === 'trash' && (
                            <div className="max-w-4xl mx-auto space-y-6 pt-8">
                                <div className="flex items-center justify-between pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-error/10 rounded-full text-error">
                                            <Trash2 className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-xl font-bold text-on-surface">Lixeira</h2>
                                        <span className="text-sm font-medium text-on-surface-variant bg-surface-variant/50 px-2 py-0.5 rounded-full">{trashTasksCount}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSidebarMode('nav')}
                                            className="text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <ListTodo className="w-4 h-4" />
                                            Tarefas
                                        </button>
                                        {trashTasksCount > 0 && (
                                            <button
                                                onClick={handleEmptyTrash}
                                                className="text-sm font-medium text-error hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors border border-error/20"
                                            >
                                                Esvaziar Lixeira
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {trashTasks.length === 0 ? (
                                        <div className="text-center py-20 opacity-70">
                                            <Ghost className="w-16 h-16 mx-auto mb-4" />
                                            <p className="text-lg font-medium">Lixeira vazia</p>
                                        </div>
                                    ) : (
                                        trashTasks.map(t => (
                                            <div key={t.id} className="bg-surface p-4 rounded-xl border border-outline-variant/50 flex items-center justify-between group hover:border-error/30 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-base text-on-surface line-through opacity-60">{t.title}</span>
                                                    <span className="text-xs text-on-surface-variant mt-1">Excluída em {t.trash_date && new Date(t.trash_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleRestore(t.id)}
                                                        className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                                        title="Restaurar"
                                                    >
                                                        <LogOut className="w-4 h-4 rotate-180" />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePermanentDelete(t.id)}
                                                        className="p-2 text-error bg-error-50 rounded-lg hover:bg-error-100 transition-colors"
                                                        title="Excluir Permanentemente"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    }


                </div >
            </main >

            <RightSidebar />
        </div >
    )
}
