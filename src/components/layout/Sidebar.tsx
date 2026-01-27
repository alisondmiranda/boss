import { motion } from 'framer-motion'
import { PanelLeftClose, ListTodo, Trash2, Plus, Tag, LayoutGrid } from 'lucide-react'
import crownLogo from '../../assets/crown.svg'
import { ICONS, AssistantIcon } from '../../constants/icons.tsx'
import { Sector } from '../../store/types'

interface SidebarProps {
    isSidebarExpanded: boolean
    setIsSidebarExpanded: (expanded: boolean) => void
    sidebarOpen: boolean
    sidebarMode: 'nav' | 'chat' | 'trash' | 'kanban'
    setSidebarMode: (mode: 'nav' | 'chat' | 'trash' | 'kanban') => void
    filter: string[]
    setFilter: (filter: string[]) => void
    toggleFilter: (id: string) => void
    sortedSectors: Sector[]
    openSettings: (tab?: 'api' | 'sectors' | 'profile') => void
}

export function Sidebar({
    isSidebarExpanded,
    setIsSidebarExpanded,
    sidebarOpen,
    sidebarMode,
    setSidebarMode,
    filter,
    setFilter,
    toggleFilter,
    sortedSectors,
    openSettings
}: SidebarProps) {
    return (
        <motion.aside
            initial={false}
            animate={{
                width: isSidebarExpanded ? '280px' : '72px',
                opacity: sidebarOpen ? 1 : 0
            }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className={`${sidebarOpen ? 'flex' : 'hidden'} hidden md:flex h-full flex-col bg-surface border-r border-outline-variant/50 shadow-sm z-20 overflow-hidden relative`}
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

                    {/* Kanban */}
                    <button
                        onClick={() => setSidebarMode('kanban')}
                        className={`w-full flex items-center rounded-r-[16px] text-sm font-medium transition-colors relative ${sidebarMode === 'kanban' ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-variant/70'}`}
                    >
                        {sidebarMode === 'kanban' && (
                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full" />
                        )}

                        <div className="w-[72px] h-12 shrink-0 flex items-center justify-center">
                            <LayoutGrid className="w-5 h-5" />
                        </div>

                        <motion.span
                            initial={false}
                            animate={{ opacity: isSidebarExpanded ? 1 : 0, x: isSidebarExpanded ? 0 : -10 }}
                            className="truncate overflow-hidden whitespace-nowrap"
                        >
                            Quadro
                        </motion.span>
                    </button>
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
                <p className="text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-widest pl-1">Boss v1.7.0</p>
            </div>
        </motion.aside>
    )
}
