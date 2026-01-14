import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Trash2, LogOut,
    Settings, Send, Loader2,
    Calendar, Tag, ListTodo, Ghost,
    MessageCircle, CheckCircle2, PanelLeftClose, PanelRightOpen,
    Search, X
} from 'lucide-react'
import crownLogo from '../assets/crown.svg'
import { AVATAR_ICONS, ICONS } from '../constants/icons.tsx'
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
    const { toggleRightSidebar, isRightSidebarOpen } = useUIStore()
    const { signOut, user } = useAuthStore()
    const {
        tasks, trashTasks, fetchTasks, addTask, toggleTask,
        moveToTrash, restoreTask, permanentlyDeleteTask, updateTaskSector, updateTask, updateTaskWithSubtasks,
        clearDoneTasks, emptyTrash, updateSubtask, addSubtask, toggleSubtask, deleteSubtask
    } = useTaskStore()
    const { sectors, userProfile } = useSettingsStore()
    const { addToast } = useToast()

    const [showSettings, setShowSettings] = useState(false)
    const [settingsTab, setSettingsTab] = useState<'api' | 'sectors' | 'profile'>('api')
    const [filter, setFilter] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt' | 'name'>(() => {
        const saved = localStorage.getItem('boss-task-sort')
        return (saved as 'dueDate' | 'createdAt' | 'name') || 'dueDate'
    })

    // Sidebar State
    const [sidebarOpen] = useState(true) // For Mobile Drawer
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true) // For Desktop Collapse/Expand
    const [sidebarMode, setSidebarMode] = useState<'nav' | 'chat' | 'trash' | 'done'>('nav')

    // Task Context Menu State
    const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null)

    const openSettings = (tab: 'api' | 'sectors' | 'profile' = 'api') => {
        setSettingsTab(tab)
        setShowSettings(true)
    }

    // Chat State
    const [chatInput, setChatInput] = useState('')
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Olá! Sou o Boss. Como posso ajudar a organizar sua vida hoje?' }
    ])
    const [isThinking, setIsThinking] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchTasks()
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

    // Computed Counts
    const doneTasksCount = tasks.filter(t => t.status === 'done').length
    const trashTasksCount = trashTasks.length

    const filteredTasks = tasks.filter(t => {
        // Filter by sector
        if (filter.length > 0) {
            const taskSectors = Array.isArray(t.sector) ? t.sector : [t.sector]
            if (!taskSectors.some(s => filter.includes(s))) return false
        }
        // Filter by search query
        if (searchQuery.trim()) {
            return t.title.toLowerCase().includes(searchQuery.toLowerCase())
        }
        return true
    })

    // Sorted tasks
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        switch (sortBy) {
            case 'dueDate':
                // Tasks with due date first, sorted by date (earliest first)
                // Then tasks without due date, sorted by creation
                if (a.due_at && b.due_at) {
                    const diff = new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
                    if (diff !== 0) return diff
                    // Tie-breaker: creation date (older first)
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                }
                if (a.due_at && !b.due_at) return -1
                if (!a.due_at && b.due_at) return 1
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            case 'createdAt':
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            case 'name':
                return a.title.localeCompare(b.title, 'pt-BR')
            default:
                return 0
        }
    })

    const handleSortChange = (newSort: 'dueDate' | 'createdAt' | 'name') => {
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
        if (confirm('Deseja mover esta tarefa para a lixeira?')) {
            try {
                await moveToTrash(id)
                addToast('Tarefa movida para a lixeira.', 'info')
            } catch (error) {
                addToast('Erro ao excluir tarefa.', 'error')
            }
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
            addToast('Tarefas concluídas movidas para a lixeira.', 'success')
        }
    }

    const handleEmptyTrash = async () => {
        if (trashTasksCount === 0) return
        if (confirm('Tem certeza que deseja esvaziar a lixeira? Essa ação é irreversível.')) {
            await emptyTrash()
            addToast('Lixeira esvaziada.', 'success')
        }
    }

    const handleUpdateTaskSector = async (taskId: string, sectorId: string) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) return
        let currentSectors = Array.isArray(task.sector) ? task.sector : [task.sector]
        if (currentSectors.includes(sectorId)) {
            if (currentSectors.length > 1) {
                currentSectors = currentSectors.filter(s => s !== sectorId)
            }
        } else {
            currentSectors = [...currentSectors, sectorId]
        }
        await updateTaskSector(taskId, currentSectors)
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


    return (
        <div className="flex h-screen overflow-hidden bg-background font-sans">
            <ToastContainer />
            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} initialTab={settingsTab} />

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
                    <div
                        className="w-[72px] h-20 shrink-0 flex items-center justify-center cursor-pointer"
                        onClick={() => !isSidebarExpanded && setIsSidebarExpanded(true)}
                    >
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                            <img src={crownLogo} className="w-8 h-8 text-on-primary-container" alt="Boss" />
                        </div>
                    </div>

                    <motion.div
                        initial={false}
                        animate={{
                            opacity: isSidebarExpanded ? 1 : 0,
                            x: isSidebarExpanded ? 0 : -10,
                            display: isSidebarExpanded ? 'block' : 'none'
                        }}
                        className="overflow-hidden whitespace-nowrap pr-4"
                    >
                        <span className="font-bold text-xl leading-tight text-on-surface tracking-tight">
                            Boss
                        </span>
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
                            className={`w-full flex items-center rounded-r-[16px] text-sm font-medium transition-colors relative cursor-pointer group/item ${sidebarMode === 'nav' && filter.length === 0 ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-variant/30'}`}
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

                        {/* Done */}
                        <button
                            onClick={() => setSidebarMode('done')}
                            className={`w-full flex items-center rounded-r-[16px] text-sm font-medium transition-colors relative ${sidebarMode === 'done' ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-variant/30'}`}
                        >
                            {sidebarMode === 'done' && (
                                <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full" />
                            )}

                            <div className="w-[72px] h-12 shrink-0 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>

                            <motion.span
                                initial={false}
                                animate={{ opacity: isSidebarExpanded ? 1 : 0, x: isSidebarExpanded ? 0 : -10 }}
                                className="truncate overflow-hidden whitespace-nowrap flex-1 text-left"
                            >
                                Concluídas
                            </motion.span>

                            {isSidebarExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: doneTasksCount > 0 ? 1 : 0, scale: doneTasksCount > 0 ? 1 : 0.8 }}
                                    className={`mr-4 text-xs font-bold px-2 py-0.5 rounded-full ${sidebarMode === 'done' ? 'bg-primary/20 text-primary' : 'bg-surface-variant text-on-surface-variant'}`}
                                >
                                    {doneTasksCount}
                                </motion.span>
                            )}
                        </button>

                        {/* Chat (Assistant) */}
                        <button
                            onClick={() => setSidebarMode('chat')}
                            className={`w-full flex items-center rounded-r-[16px] text-sm font-medium transition-colors relative ${sidebarMode === 'chat' ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-variant/30'}`}
                        >
                            {sidebarMode === 'chat' && (
                                <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full" />
                            )}

                            <div className="w-[72px] h-12 shrink-0 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5" />
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

                    {/* Sectors List */}
                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                        <motion.div
                            initial={false}
                            animate={{ opacity: isSidebarExpanded ? 1 : 0, height: isSidebarExpanded ? 'auto' : 0 }}
                            className="px-6 pb-2 pt-4 flex items-center justify-between group overflow-hidden"
                        >
                            <span className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-[0.1em]">Listas</span>
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={() => openSettings('sectors')}
                                    className="p-1 hover:bg-surface-variant/50 rounded-full text-on-surface-variant/50 hover:text-primary transition-colors"
                                    title="Nova Lista"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>

                        {sectors.map((s) => {
                            const isSelected = sidebarMode === 'nav' && filter.includes(s.id)
                            const SectorIcon = ICONS.find(i => i.value === s.icon)?.icon || Tag
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => { setSidebarMode('nav'); toggleFilter(s.id); }}
                                    className={`w-full flex items-center rounded-r-[16px] text-sm font-medium transition-colors relative group ${isSelected
                                        ? 'bg-primary/5 text-primary font-semibold'
                                        : 'text-on-surface hover:bg-surface-variant/30'
                                        }`}
                                    title={s.label}
                                >
                                    {isSelected && (
                                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full" />
                                    )}

                                    <div className="w-[72px] h-12 shrink-0 flex items-center justify-center">
                                        <SectorIcon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`} />
                                    </div>

                                    <motion.span
                                        initial={false}
                                        animate={{ opacity: isSidebarExpanded ? 1 : 0, x: isSidebarExpanded ? 0 : -10 }}
                                        className="truncate flex-1 text-left overflow-hidden whitespace-nowrap"
                                    >
                                        {s.label}
                                    </motion.span>

                                    {isSelected && isSidebarExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="mr-5"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
                                        </motion.div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="mt-auto px-6 py-6 border-t border-outline-variant/30 bg-surface-variant/5">
                    <p className="text-[10px] text-on-surface-variant/30 font-bold uppercase tracking-widest pl-1">Boss v1.2.0</p>
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
                                className="w-11 h-11 rounded-full border border-outline-variant hover:border-primary/50 text-on-surface-variant hover:text-primary hover:bg-surface-variant/30 flex items-center justify-center transition-all"
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


                    {/* VIEW: NAV (Tasks) & DONE */}
                    {
                        (sidebarMode === 'nav' || sidebarMode === 'done') && (
                            <div className="max-w-4xl mx-auto space-y-6 pt-4">

                                {/* Quick Filters / Navigation Buttons */}
                                {/* Unified Toolbar (Only in Nav) */}
                                {sidebarMode === 'nav' && (
                                    <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-0 bg-background z-30 pt-2 pb-2">
                                        {/* Search Bar */}
                                        <div className="flex-1 relative group">
                                            <div className="relative z-10 bg-surface rounded-[20px] shadow-sm border border-outline-variant/30 flex items-center px-4 py-3">
                                                <Search className="w-5 h-5 text-on-surface-variant/50 mr-3" />
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Buscar tarefas..."
                                                    className="flex-1 bg-transparent border-none text-base text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
                                                />
                                                {searchQuery && (
                                                    <button
                                                        onClick={() => setSearchQuery('')}
                                                        className="p-1 hover:bg-surface-variant rounded-full transition-colors"
                                                    >
                                                        <X className="w-4 h-4 text-on-surface-variant" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions Group */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => setIsTaskFormOpen(true)}
                                                className="h-[46px] px-4 rounded-full bg-primary text-on-primary font-bold shadow-2 hover:shadow-4 hover:scale-105 transition-all flex items-center gap-2"
                                            >
                                                <Plus className="w-5 h-5" />
                                                <span className="hidden md:inline">Nova Tarefa</span>
                                            </button>

                                            <div className="w-px h-8 bg-outline-variant/50 mx-1" />

                                            <button
                                                onClick={() => setSidebarMode('done')}
                                                className="h-[46px] px-4 rounded-full bg-surface border border-outline-variant/50 text-on-surface-variant hover:bg-surface-variant/30 hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
                                                title="Concluídas"
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                                <span className="hidden lg:inline">Concluídas</span>
                                            </button>

                                            <button
                                                onClick={() => setSidebarMode('trash')}
                                                className="h-[46px] px-4 rounded-full bg-surface border border-outline-variant/50 text-on-surface-variant hover:bg-error/5 hover:text-error hover:border-error/20 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
                                                title="Lixeira"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                                <span className="hidden lg:inline">Lixeira</span>
                                            </button>
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
                                    sectors={sectors}
                                    mode={editingTask ? 'edit' : 'create'}
                                    initialTitle={editingTask?.title}
                                    initialSectors={editingTask ? (Array.isArray(editingTask.sector) ? editingTask.sector : [editingTask.sector]) : []}
                                    initialDueAt={editingTask?.due_at ? new Date(editingTask.due_at) : null}
                                    initialDetails={editingTask?.details}
                                    initialSubtasks={editingTask?.subtasks || []}
                                    initialOpenPicker={initialOpenPicker}
                                />


                                {/* Header for Done/Filtered Views */}
                                {
                                    sidebarMode === 'done' && (
                                        <div className="flex items-center justify-between pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <h2 className="text-xl font-bold text-on-surface">Tarefas Concluídas</h2>
                                                <span className="text-sm font-medium text-on-surface-variant bg-surface-variant/50 px-2 py-0.5 rounded-full">{doneTasksCount}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSidebarMode('nav')}
                                                    className="text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                                                >
                                                    <ListTodo className="w-4 h-4" />
                                                    Tarefas
                                                </button>
                                                {doneTasksCount > 0 && (
                                                    <button
                                                        onClick={handleClearDone}
                                                        className="text-sm font-medium text-error hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        Limpar Concluídas
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }


                                {/* Tasks List */}
                                <div className="space-y-3 pb-20">
                                    {/* Sort dropdown */}
                                    {sidebarMode !== 'done' && (
                                        <div className="flex items-center justify-end mb-2">
                                            <select
                                                value={sortBy}
                                                onChange={(e) => handleSortChange(e.target.value as 'dueDate' | 'createdAt' | 'name')}
                                                className="text-[11px] text-on-surface-variant bg-surface border border-outline-variant/30 rounded-lg px-2 py-1 outline-none focus:border-primary"
                                            >
                                                <option value="dueDate">Por vencimento</option>
                                                <option value="createdAt">Por criação</option>
                                                <option value="name">Por nome</option>
                                            </select>
                                        </div>
                                    )}
                                    <AnimatePresence mode='popLayout'>
                                        {sortedTasks
                                            .filter(t => {
                                                if (sidebarMode === 'done') return t.status === 'done';
                                                return t.status !== 'done';
                                            })
                                            .map((task) => {
                                                const rawSector = task.sector
                                                const taskSectors = Array.isArray(rawSector)
                                                    ? rawSector.filter(Boolean)
                                                    : (rawSector ? [rawSector] : [])

                                                return (
                                                    <TaskItem
                                                        key={task.id}
                                                        task={task}
                                                        taskSectors={taskSectors as string[]}
                                                        sectors={sectors}
                                                        toggleTask={toggleTask}
                                                        updateTaskSector={handleUpdateTaskSector}
                                                        updateSubtask={updateSubtask}
                                                        addSubtask={addSubtask}
                                                        toggleSubtask={toggleSubtask}
                                                        deleteSubtask={deleteSubtask}
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
                                    </AnimatePresence>

                                    {filteredTasks.filter(t => sidebarMode === 'done' ? t.status === 'done' : t.status !== 'done').length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                            <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center mb-4">
                                                {sidebarMode === 'done' ? <ListTodo className="w-10 h-10 text-on-surface-variant" /> : <Calendar className="w-10 h-10 text-on-surface-variant" />}
                                            </div>
                                            <h3 className="text-lg font-medium text-on-surface">{sidebarMode === 'done' ? 'Nenhuma tarefa concluída' : 'Tudo limpo!'}</h3>
                                            <p className="text-sm text-on-surface-variant">{sidebarMode === 'done' ? 'Complete tarefas para vê-las aqui.' : 'Aproveite o momento.'}</p>
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
                                        <div className="text-center py-20 opacity-40">
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

