import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, CheckCircle2, Trash2, LogOut,
    Settings, Send, Loader2, PanelLeftClose,
    Layout, Calendar, Tag, Check, ListTodo
} from 'lucide-react'
import crownLogo from '../assets/crown.svg'
import { ICONS } from './SettingsModal'
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

export function Dashboard() {
    const { signOut } = useAuthStore()
    const { tasks, fetchTasks, addTask, toggleTask, deleteTask, updateTaskSector } = useTaskStore()
    const { sectors } = useSettingsStore()
    const { addToast } = useToast()

    const [newTaskInput, setNewTaskInput] = useState('')
    const [filter, setFilter] = useState<string[]>([])
    const [showSettings, setShowSettings] = useState(false)
    const [settingsTab, setSettingsTab] = useState<'api' | 'sectors'>('api')

    // Sidebar State
    const [sidebarOpen, setSidebarOpen] = useState(true) // For Mobile Drawer
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true) // For Desktop Collapse/Expand
    const [sidebarMode, setSidebarMode] = useState<'nav' | 'chat'>('nav')

    // Task Context Menu State
    const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null)

    const openSettings = (tab: 'api' | 'sectors' = 'api') => {
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
        if (hour < 12) return 'Bom dia'
        if (hour < 18) return 'Boa tarde'
        return 'Boa noite'
    }

    // Updated Filtering Logic
    const filteredTasks = tasks.filter(t => {
        if (filter.length === 0) return true
        const taskSectors = Array.isArray(t.sector) ? t.sector : [t.sector]
        return taskSectors.some(s => filter.includes(s))
    })

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTaskInput.trim()) return

        // Default to first selected filter or 'work' if none
        const defaultSector = filter.length > 0 ? filter[0] : (sectors[0]?.id || 'work')

        try {
            await addTask(newTaskInput, defaultSector)
            setNewTaskInput('')
            addToast('Tarefa adicionada com sucesso!', 'success')
        } catch (error) {
            console.error(error)
            addToast(`Erro ao criar tarefa: ${(error as any).message || 'Tente novamente'}`, 'error')
        }
    }

    const handleDeleteTask = async (id: string) => {
        await deleteTask(id)
        addToast('Tarefa concluída/removida.', 'info')
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
                        <div className="w-10 h-10 rounded-[12px] bg-primary-container flex items-center justify-center shrink-0">
                            <img src={crownLogo} className="w-6 h-6 text-on-primary-container" alt="Boss" />
                        </div>
                        {isSidebarExpanded && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="font-bold text-xl text-on-surface tracking-tight whitespace-nowrap"
                            >
                                Boss
                            </motion.span>
                        )}
                    </div>

                    {isSidebarExpanded && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsSidebarExpanded(false)
                            }}
                            className="p-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-full transition-all"
                        >
                            <PanelLeftClose className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Sidebar Modes */}
                <div className={`flex ${isSidebarExpanded ? 'px-4 gap-2' : 'flex-col px-2 gap-4 items-center'} mb-4 shrink-0 transition-all mt-4`}>
                    <button
                        onClick={() => {
                            setSidebarMode('nav')
                            if (!isSidebarExpanded) setIsSidebarExpanded(true)
                        }}
                        className={`flex items-center justify-center ${isSidebarExpanded ? 'flex-1 py-1.5' : 'w-10 h-10'} text-sm font-medium rounded-lg transition-all ${sidebarMode === 'nav' ? 'bg-secondary-container text-on-secondary-container' : 'hover:bg-surface-variant/50 text-on-surface-variant'}`}
                        title="Listas"
                    >
                        {isSidebarExpanded ? 'Listas' : <Layout className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => {
                            setSidebarMode('chat')
                            if (!isSidebarExpanded) setIsSidebarExpanded(true)
                        }}
                        className={`flex items-center justify-center ${isSidebarExpanded ? 'flex-1 py-1.5' : 'w-10 h-10'} text-sm font-medium rounded-lg transition-all ${sidebarMode === 'chat' ? 'bg-secondary-container text-on-secondary-container' : 'hover:bg-surface-variant/50 text-on-surface-variant'}`}
                        title="Chat IA"
                    >
                        {isSidebarExpanded ? 'Chat IA' : <Send className="w-5 h-5" />}
                    </button>
                </div>

                {/* Only show content if expanded, otherwise clean icons above handle navigation/expanding */}
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
                                            onClick={() => setFilter([s.id])}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[28px] text-sm font-medium transition-all group ${isSelected
                                                ? 'bg-primary-container/40 text-on-primary-container font-semibold'
                                                : 'text-on-surface hover:bg-surface-variant/30'
                                                }`}
                                        >
                                            <SectorIcon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary transition-colors'}`} />
                                            <span className="truncate">{s.label}</span>
                                        </button>
                                    )
                                })}

                                <button
                                    onClick={() => openSettings('sectors')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-[28px] text-sm font-medium text-on-surface-variant hover:bg-surface-variant/30 hover:text-primary transition-all mt-2"
                                >
                                    <Plus className="w-5 h-5 shrink-0" />
                                    <span className="truncate">Criar nova lista</span>
                                </button>
                            </div>
                        )}

                        {/* MODE: CHAT */}
                        {sidebarMode === 'chat' && (
                            <div className="flex-1 flex flex-col h-full overflow-hidden">
                                <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'} `}>
                                            <div
                                                className={`max-w-[90%] p-3 text-sm leading-relaxed shadow-sm ${msg.role === 'assistant'
                                                    ? 'bg-surface-variant text-on-surface rounded-[16px] rounded-tl-[4px] border border-outline-variant/30'
                                                    : 'bg-primary text-on-primary rounded-[16px] rounded-tr-[4px] shadow-1'
                                                    } `}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isThinking && (
                                        <div className="flex justify-start">
                                            <div className="bg-surface-variant px-4 py-2 rounded-full flex items-center gap-2 text-xs font-medium text-primary border border-outline-variant/30">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Digitando...
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                <div className="p-4 bg-surface border-t border-outline-variant/30 shrink-0">
                                    <form onSubmit={handleChatSubmit} className="relative">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Pergunte ao Boss..."
                                            className="w-full bg-surface-variant/30 text-on-surface text-sm rounded-full border border-transparent focus:border-outline-variant focus:bg-surface pl-4 pr-10 py-2.5 outline-none transition-all placeholder:text-on-surface-variant/50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!chatInput.trim() || isThinking}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-primary disabled:opacity-50 hover:bg-primary/10 rounded-full transition-all"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Info */}
                {isSidebarExpanded && (
                    <div className="p-4 text-[10px] text-on-surface-variant/30 text-center uppercase tracking-widest font-bold border-t border-outline-variant/20">
                        Boss v1.0
                    </div>
                )}

            </motion.aside>

            {/* RIGHT: Main Content Section */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
                {/* Top App Bar - Simplified */}
                <header className="h-20 flex items-center justify-between px-6 lg:px-10 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 -ml-2 hover:bg-surface-variant/50 rounded-full text-on-surface-variant transition-all lg:hidden"
                        >
                            <Layout className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-normal text-on-surface tracking-normal">{getGreeting()}, <span className="font-bold">Boss.</span></h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => openSettings('api')}
                            className="p-3 hover:bg-surface-variant/50 rounded-full text-on-surface-variant hover:text-primary transition-all"
                            title="Configurações"
                        >
                            <Settings className="w-6 h-6" />
                        </button>
                        <button
                            onClick={signOut}
                            className="p-3 hover:bg-error-container hover:text-on-error-container rounded-full text-on-surface-variant transition-all"
                            title="Sair"
                        >
                            <LogOut className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                {/* Task Board - Filter Chips are gone, replaced by Sidebar */}
                <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-20 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-6 pt-4">

                        {/* Input Area */}
                        <form onSubmit={handleAddTask} className="relative group mb-8">
                            <div className="relative z-10 bg-surface rounded-[28px] shadow-2 group-focus-within:shadow-3 transition-shadow duration-200">
                                <input
                                    type="text"
                                    value={newTaskInput}
                                    onChange={(e) => setNewTaskInput(e.target.value)}
                                    placeholder={`Adicionar nova tarefa ${filter.length > 0 ? `em ${sectors.find(s => s.id === filter[0])?.label || '...'}` : '...'}...`}
                                    className="w-full bg-transparent border-none py-4 pl-6 pr-32 text-lg text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none rounded-[28px]"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <button
                                        type="submit"
                                        disabled={!newTaskInput}
                                        className="h-10 px-5 bg-primary text-on-primary rounded-[20px] text-sm font-medium hover:shadow-1 disabled:opacity-0 disabled:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <span>Adicionar</span>
                                        <Plus className="w-4 h-4" />
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
                                        <motion.div
                                            key={task.id}
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

                                            <span className={`flex-1 text-base transition-all truncate select-none ${task.status === 'done' ? 'text-on-surface-variant line-through opacity-60' : 'text-on-surface'
                                                }`}>
                                                {task.title}
                                            </span>

                                            {/* Sector Badges */}
                                            <div className="relative flex gap-1 flex-wrap justify-end">
                                                {taskSectors.map((sectorId) => {
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
                                                })}

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
                                                                                handleUpdateTaskSector(task.id, s.id)
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
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-full transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
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

