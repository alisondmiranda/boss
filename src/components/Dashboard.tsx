import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Trash2, LogOut,
    Settings, Send, Loader2,
    Calendar, Tag, ListTodo, Ghost,
    MessageCircle, CheckCircle2, PanelLeftClose, Check
} from 'lucide-react'
import crownLogo from '../assets/crown.svg'
import { AVATAR_ICONS, ICONS } from '../constants/icons'
import { useAuthStore } from '../store/authStore'
import { useTaskStore } from '../store/taskStore'
import { useSettingsStore } from '../store/settingsStore'
import { SettingsModal } from './SettingsModal'
import { sendMessageToGemini, GeminiResponse } from '../lib/gemini'

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

import { useToast } from '../store/toastStore'
import { ToastContainer } from './ToastContainer'
import { TaskItem } from './TaskItem'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function Dashboard() {
    const { signOut, user } = useAuthStore()
    const today = new Date()
    const {
        tasks, trashTasks, fetchTasks, addTask, toggleTask,
        moveToTrash, restoreTask, permanentlyDeleteTask, updateTaskSector, updateTask,
        clearDoneTasks, emptyTrash
    } = useTaskStore()
    const { sectors, userProfile } = useSettingsStore()
    const { addToast } = useToast()

    const [newTaskInput, setNewTaskInput] = useState('')
    const [filter, setFilter] = useState<string[]>([])
    const [showSettings, setShowSettings] = useState(false)
    const [settingsTab, setSettingsTab] = useState<'api' | 'sectors' | 'profile'>('api')

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

    const [selectedInputSectors, setSelectedInputSectors] = useState<string[]>([])
    const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

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
        if (filter.length === 0) return true
        const taskSectors = Array.isArray(t.sector) ? t.sector : [t.sector]
        return taskSectors.some(s => filter.includes(s))
    })

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTaskInput.trim()) return

        // If no sector selected, pass empty array.
        // The backend/DB must handle this (e.g. nullable column or support for empty array).
        const sectorsToUse = selectedInputSectors

        try {
            await addTask(newTaskInput, sectorsToUse)
            setNewTaskInput('')
            // Keep selection or clear? Usually helpful to keep context for rapid entry, but let's keep it.
        } catch (error) {
            console.error(error)
            addToast(`Erro ao criar tarefa: ${(error as any).message || 'Tente novamente'}`, 'error')
        }
    }

    const InputSectorIcon = selectedInputSectors.length === 1
        ? (ICONS.find(i => i.value === sectors.find(s => s.id === selectedInputSectors[0])?.icon)?.icon || Tag)
        : (selectedInputSectors.length > 1 ? ListTodo : Plus)


    const handleMoveToTrash = async (id: string) => {
        try {
            await moveToTrash(id)
            addToast('Tarefa movida para a lixeira. (Pode ser restaurada na aba Lixeira)', 'info')
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
                        <div className="w-10 h-10 rounded-[12px] bg-primary-container flex items-center justify-center shrink-0">
                            <img src={crownLogo} className="w-6 h-6 text-on-primary-container" alt="Boss" />
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
                        <button
                            onClick={() => { setSidebarMode('nav'); setFilter([]); }}
                            className={`w-full flex items-center rounded-r-[16px] text-sm font-medium transition-colors relative ${sidebarMode === 'nav' && filter.length === 0 ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-variant/30'}`}
                        >
                            {/* Active Indicator Bar */}
                            {sidebarMode === 'nav' && filter.length === 0 && (
                                <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full" />
                            )}

                            <div className="w-[72px] h-12 shrink-0 flex items-center justify-center">
                                <ListTodo className="w-5 h-5" />
                            </div>

                            <motion.span
                                initial={false}
                                animate={{
                                    opacity: isSidebarExpanded ? 1 : 0,
                                    x: isSidebarExpanded ? 0 : -10
                                }}
                                className="truncate overflow-hidden whitespace-nowrap"
                            >
                                Tarefas
                            </motion.span>
                        </button>

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
                                Assistant
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
                            <span className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest whitespace-nowrap">Listas</span>
                            <button
                                onClick={() => openSettings('sectors')}
                                className="p-1 hover:bg-surface-variant/50 rounded-full text-on-surface-variant/50 hover:text-primary transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
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
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Trash at Bottom */}
                <div className="mt-auto pb-4">
                    <button
                        onClick={() => setSidebarMode('trash')}
                        className={`w-full flex items-center rounded-r-[16px] text-sm font-medium transition-colors relative ${sidebarMode === 'trash' ? 'bg-error/10 text-error' : 'text-on-surface-variant hover:text-error hover:bg-error/5'}`}
                    >
                        {sidebarMode === 'trash' && (
                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-error rounded-r-full" />
                        )}

                        <div className="w-[72px] h-12 shrink-0 flex items-center justify-center">
                            <Trash2 className="w-5 h-5" />
                        </div>

                        <motion.span
                            initial={false}
                            animate={{ opacity: isSidebarExpanded ? 1 : 0, x: isSidebarExpanded ? 0 : -10 }}
                            className="truncate overflow-hidden whitespace-nowrap flex-1 text-left"
                        >
                            Lixeira
                        </motion.span>

                        {isSidebarExpanded && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: trashTasksCount > 0 ? 1 : 0, scale: trashTasksCount > 0 ? 1 : 0.8 }}
                                className={`mr-4 text-xs font-bold px-2 py-0.5 rounded-full ${sidebarMode === 'trash' ? 'bg-error/20 text-error' : 'bg-surface-variant text-on-surface-variant'}`}
                            >
                                {trashTasksCount}
                            </motion.span>
                        )}
                    </button>
                </div>
            </motion.aside>

            {/* RIGHT: Main Content Section */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
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
                            {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
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
                    </div>
                </header >

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

                                {/* Input Area (Only in Nav) */}
                                {sidebarMode === 'nav' && (
                                    <form onSubmit={handleAddTask} className="relative group mb-8">
                                        <div className="relative z-10 bg-surface rounded-[28px] shadow-2 group-focus-within:shadow-3 transition-shadow duration-200 flex items-center pl-6 pr-2 py-2">
                                            <input
                                                type="text"
                                                value={newTaskInput}
                                                onChange={(e) => setNewTaskInput(e.target.value)}
                                                placeholder="Adicionar nova tarefa..."
                                                className="flex-1 bg-transparent border-none py-2 text-lg text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
                                            />

                                            <div className="flex items-center gap-2">
                                                {/* Sector Select Dropdown (Mini) */}
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)}
                                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${selectedInputSectors.length > 0
                                                            ? 'bg-primary-container text-on-primary-container'
                                                            : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant'}`}
                                                        title="Escolher Listas"
                                                    >
                                                        <InputSectorIcon className="w-4 h-4" />
                                                    </button>

                                                    <AnimatePresence>
                                                        {isSectorDropdownOpen && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" onClick={() => setIsSectorDropdownOpen(false)} />
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                    className="absolute top-full right-0 mt-2 w-56 bg-surface rounded-xl shadow-4 border border-outline-variant flex flex-col py-1 overflow-hidden z-50 max-h-64 overflow-y-auto custom-scrollbar"
                                                                >
                                                                    <span className="px-3 py-2 text-[10px] uppercase font-bold text-on-surface-variant/50 tracking-wider flex justify-between items-center bg-surface sticky top-0 z-10">
                                                                        Salvar em...
                                                                        {selectedInputSectors.length > 0 && (
                                                                            <span onClick={(e) => { e.stopPropagation(); setSelectedInputSectors([]) }} className="cursor-pointer text-primary hover:underline lowercase font-medium">limpar</span>
                                                                        )}
                                                                    </span>

                                                                    {sectors.map(s => {
                                                                        const isSelected = selectedInputSectors.includes(s.id)
                                                                        return (
                                                                            <button
                                                                                key={s.id}
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    setSelectedInputSectors(prev =>
                                                                                        prev.includes(s.id)
                                                                                            ? prev.filter(id => id !== s.id)
                                                                                            : [...prev, s.id]
                                                                                    )
                                                                                }}
                                                                                className={`px-3 py-2.5 text-sm text-left flex items-center justify-between hover:bg-surface-variant/50 transition-colors ${isSelected ? 'text-on-surface font-medium bg-surface-variant/30' : 'text-on-surface/80'}`}
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={`w-2 h-2 rounded-full ${getSectorColorClass(s.color).split(' ')[0].replace('bg-', 'bg-').replace('-100', '-500')}`} />
                                                                                    {s.label}
                                                                                </div>
                                                                                {isSelected && <Check className="w-4 h-4 text-primary" />}
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </motion.div>
                                                            </>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {/* Add Button */}
                                                <button
                                                    type="submit"
                                                    disabled={!newTaskInput}
                                                    className="w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center hover:shadow-1 disabled:opacity-0 disabled:scale-95 transition-all"
                                                >
                                                    <Plus className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}

                                {/* Header for Done/Filtered Views */}
                                {sidebarMode === 'done' && (
                                    <div className="flex items-center justify-between pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <h2 className="text-xl font-bold text-on-surface">Tarefas Concluídas</h2>
                                            <span className="text-sm font-medium text-on-surface-variant bg-surface-variant/50 px-2 py-0.5 rounded-full">{doneTasksCount}</span>
                                        </div>
                                        {doneTasksCount > 0 && (
                                            <button
                                                onClick={handleClearDone}
                                                className="text-sm font-medium text-error hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Limpar Concluídas
                                            </button>
                                        )}
                                    </div>
                                )}


                                {/* Tasks List */}
                                <div className="space-y-3 pb-20">
                                    <AnimatePresence mode='popLayout'>
                                        {filteredTasks
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
                                                        setTaskMenuOpen={setTaskMenuOpen}
                                                        taskMenuOpen={taskMenuOpen}
                                                        handleMoveToTrash={handleMoveToTrash}
                                                        updateTask={updateTask}
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

                            </div>
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
                                    {trashTasksCount > 0 && (
                                        <button
                                            onClick={handleEmptyTrash}
                                            className="text-sm font-medium text-error hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors border border-error/20"
                                        >
                                            Esvaziar Lixeira
                                        </button>
                                    )}
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
        </div >
    )
}

