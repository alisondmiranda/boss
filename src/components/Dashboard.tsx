import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Trash2, LogOut,
    Settings, Send, Loader2,
    Layout, Calendar, Tag, ListTodo,
    Crown, Smile, UserCircle, Ghost, Cat, Dog, Bird, Component
} from 'lucide-react'
import crownLogo from '../assets/crown.svg'
import { ICONS } from '../constants/icons'
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

const AVATAR_MAP: Record<string, any> = {
    'crown': Crown,
    'smile': Smile,
    'user-circle': UserCircle,
    'ghost': Ghost,
    'cat': Cat,
    'dog': Dog,
    'bird': Bird,
    'component': Component
}

export function Dashboard() {
    const { signOut } = useAuthStore()
    const {
        tasks, trashTasks, fetchTasks, addTask, toggleTask,
        moveToTrash, restoreTask, permanentlyDeleteTask, updateTaskSector, updateTask
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
    const [sidebarMode, setSidebarMode] = useState<'nav' | 'chat' | 'trash'>('nav')

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

    // Avatar Logic
    const AvatarIcon = AVATAR_MAP[userProfile.selectedIcon || 'crown'] || Crown


    const [selectedInputSector, setSelectedInputSector] = useState<string | null>(null)

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

    const filteredTasks = tasks.filter(t => {
        if (filter.length === 0) return true
        const taskSectors = Array.isArray(t.sector) ? t.sector : [t.sector]
        return taskSectors.some(s => filter.includes(s))
    })

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTaskInput.trim()) return

        const sectorToUse = selectedInputSector || 'work'

        try {
            await addTask(newTaskInput, sectorToUse)
            setNewTaskInput('')
        } catch (error) {
            console.error(error)
            addToast(`Erro ao criar tarefa: ${(error as any).message || 'Tente novamente'}`, 'error')
        }
    }

    const InputSectorIcon = selectedInputSector
        ? (ICONS.find(i => i.value === sectors.find(s => s.id === selectedInputSector)?.icon)?.icon || Tag)
        : Plus // Default icon when nothing selected


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
                    width: isSidebarExpanded ? '280px' : '80px',
                    opacity: sidebarOpen ? 1 : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`${sidebarOpen ? 'flex' : 'hidden'} lg:flex h-full flex-col bg-surface border-r border-outline-variant/50 shadow-sm z-20 overflow-hidden relative`}
            >
                {/* Header / Mode Switcher */}
                <div
                    onClick={() => !isSidebarExpanded && setIsSidebarExpanded(true)}
                    className={`h-20 flex items-center ${isSidebarExpanded ? 'justify-between px-4' : 'justify-center'} shrink-0 border-b border-transparent transition-all cursor-pointer`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-[12px] bg-primary-container flex items-center justify-center shrink-0 overflow-hidden">
                            {userProfile.avatarType === 'url' && userProfile.customAvatarUrl ? (
                                <img src={userProfile.customAvatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                                userProfile.selectedIcon === 'crown' ? (
                                    <img src={crownLogo} className="w-6 h-6 text-on-primary-container" alt="Boss" />
                                ) : (
                                    <AvatarIcon className="w-6 h-6 text-on-primary-container" />
                                )
                            )}
                        </div>
                        {isSidebarExpanded && (
                            <div className="flex flex-col">
                                <span className="font-bold text-base leading-tight text-on-surface truncate">
                                    {userProfile.displayName || 'Boss'}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Premium</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Modes */}
                {isSidebarExpanded && (
                    <div className="flex items-center gap-1 p-2 mx-2 mt-2 bg-surface-variant/30 rounded-xl mb-2">
                        <button
                            onClick={() => setSidebarMode('nav')}
                            className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${sidebarMode === 'nav' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
                            title="Tarefas"
                        >
                            <Layout className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setSidebarMode('chat')}
                            className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${sidebarMode === 'chat' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
                            title="Assistant"
                        >
                            <div className="relative">
                                <Crown className="w-5 h-5" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                            </div>
                        </button>
                        <button
                            onClick={() => setSidebarMode('trash')}
                            className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${sidebarMode === 'trash' ? 'bg-surface shadow-sm text-error' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
                            title="Lixeira"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {isSidebarExpanded && (
                    <div className="flex-1 overflow-hidden relative w-full flex flex-col">
                        {/* MODE: NAV (Lists) */}
                        {sidebarMode === 'nav' && (
                            <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar pb-4">
                                <button
                                    onClick={() => setFilter([])}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[28px] text-sm font-medium transition-all ${filter.length === 0 ? 'bg-primary-container/40 text-on-primary-container font-semibold' : 'text-on-surface hover:bg-surface-variant/30'
                                        }`}
                                >
                                    <ListTodo className="w-5 h-5 shrink-0" />
                                    <span className="truncate">Todas as tarefas</span>
                                </button>

                                <div className="pt-4 pb-2 px-4 text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest">
                                    Suas Listas
                                </div>

                                {sectors.map((s) => {
                                    const isSelected = filter.includes(s.id)
                                    const SectorIcon = ICONS.find(i => i.value === s.icon)?.icon || Tag
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => toggleFilter(s.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[28px] text-sm font-medium transition-all group ${isSelected
                                                ? 'bg-primary-container/40 text-on-primary-container font-semibold'
                                                : 'text-on-surface hover:bg-surface-variant/30'
                                                }`}
                                        >
                                            <SectorIcon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary transition-colors'}`} />
                                            <span className="truncate">{s.label}</span>
                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />}
                                        </button>
                                    )
                                })}

                                <button
                                    onClick={() => openSettings('sectors')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-[28px] text-sm font-medium text-on-surface-variant hover:bg-surface-variant/30 transition-all mt-2 border border-dashed border-outline-variant/60 hover:border-primary/50"
                                >
                                    <Plus className="w-5 h-5 shrink-0" />
                                    <span className="truncate">Nova Lista</span>
                                </button>
                            </div>
                        )}

                        {/* MODE: CHAT */}
                        {sidebarMode === 'chat' && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-on-primary rounded-tr-sm' : 'bg-surface-variant/50 text-on-surface rounded-tl-sm'}`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isThinking && (
                                        <div className="flex justify-start">
                                            <div className="bg-surface-variant/50 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                <span className="text-xs text-on-surface-variant">Pensando...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="p-4 bg-surface border-t border-outline-variant/30">
                                    <form onSubmit={handleChatSubmit} className="relative">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Fale com a IA..."
                                            className="w-full bg-surface-variant/30 border-none rounded-xl pl-4 pr-10 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            disabled={isThinking}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!chatInput.trim() || isThinking}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-on-primary rounded-lg disabled:opacity-50 transition-all hover:shadow-md"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* MODE: TRASH */}
                        {sidebarMode === 'trash' && (
                            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar">
                                <div className="pb-2 px-1 text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest flex items-center gap-2">
                                    <Trash2 className="w-3 h-3" />
                                    Lixeira
                                </div>
                                {trashTasks.length === 0 ? (
                                    <div className="text-center py-10 opacity-40">
                                        <Ghost className="w-10 h-10 mx-auto mb-2" />
                                        <p className="text-xs">Lixeira vazia</p>
                                    </div>
                                ) : (
                                    trashTasks.map(t => (
                                        <div key={t.id} className="bg-surface-variant/30 p-3 rounded-xl border border-transparent hover:border-error/30 transition-all group relative">
                                            <p className="text-sm text-on-surface line-through opacity-60 mb-2 truncate">{t.title}</p>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleRestore(t.id)}
                                                    className="p-1.5 text-green-600 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                                                    title="Restaurar"
                                                >
                                                    <LogOut className="w-3.5 h-3.5 rotate-180" />
                                                </button>
                                                <button
                                                    onClick={() => handlePermanentDelete(t.id)}
                                                    className="p-1.5 text-error bg-error-container/30 rounded-lg hover:bg-error-container transition-colors"
                                                    title="Excluir Permanentemente"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                    </div>
                )}

                <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between shrink-0">
                    <button
                        onClick={signOut}
                        className={`flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-error transition-all p-2 rounded-xl hover:bg-surface-variant/50 ${!isSidebarExpanded && 'justify-center w-full'}`}
                        title="Sair"
                    >
                        <LogOut className="w-5 h-5" />
                        {isSidebarExpanded && <span>Sair</span>}
                    </button>

                    {isSidebarExpanded && (
                        <div className="text-[10px] text-on-surface-variant/40 font-mono">
                            v1.0
                        </div>
                    )}
                </div>
            </motion.aside>

            {/* RIGHT: Main Content Section */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
                {/* Header */}
                <header className="h-20 shrink-0 px-6 lg:px-10 flex items-center justify-between z-10">
                    <div>
                        <h1 className="text-2xl font-semibold text-on-surface flex items-center gap-2">
                            {getGreeting()} <span className="text-primary">{userProfile.displayName || 'Boss'}.</span>
                        </h1>
                        <p className="text-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => openSettings()}
                            className="w-10 h-10 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors"
                        >
                            <Settings className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                {/* Task Board */}
                <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-20 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-6 pt-4">

                        {/* Input Area */}
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
                                    <div className="relative group/sector">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // Rotate sector or open menu. Simple rotation for now or mock menu?
                                                // User wants to choose. Let's make a mini dropdown.
                                                // Actually, better to just show current and click to change.
                                            }}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${selectedInputSector
                                                ? 'bg-primary-container text-on-primary-container'
                                                : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant'}`}
                                            title="Escolher Lista"
                                        >
                                            <InputSectorIcon className="w-4 h-4" />
                                        </button>

                                        <div className="absolute top-full right-0 mt-2 w-48 bg-surface rounded-xl shadow-4 border border-outline-variant hidden group-hover/sector:flex flex-col py-1 overflow-hidden z-20">
                                            <span className="px-3 py-2 text-[10px] uppercase font-bold text-on-surface-variant/50 tracking-wider">Salvar em...</span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedInputSector(null)}
                                                className={`px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-surface-variant transition-colors ${!selectedInputSector ? 'text-primary font-medium bg-primary-container/20' : 'text-on-surface'}`}
                                            >
                                                <ListTodo className="w-4 h-4" />
                                                Geral (Sem lista)
                                            </button>
                                            {sectors.map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => setSelectedInputSector(s.id)}
                                                    className={`px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-surface-variant transition-colors ${selectedInputSector === s.id ? 'text-primary font-medium bg-primary-container/20' : 'text-on-surface'}`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${getSectorColorClass(s.color).split(' ')[0].replace('bg-', 'bg-').replace('-100', '-500')}`} />
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
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

                        {/* Tasks List */}
                        <div className="space-y-3 pb-20">
                            <AnimatePresence mode='popLayout'>
                                {filteredTasks.map((task) => {
                                    const taskSectors = Array.isArray(task.sector) ? task.sector : [task.sector]
                                    return (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            taskSectors={taskSectors}
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

                            {filteredTasks.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                    <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center mb-4">
                                        <Calendar className="w-10 h-10 text-on-surface-variant" />
                                    </div>
                                    <h3 className="text-lg font-medium text-on-surface">Tudo limpo!</h3>
                                    <p className="text-sm text-on-surface-variant">Aproveite o momento.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}

