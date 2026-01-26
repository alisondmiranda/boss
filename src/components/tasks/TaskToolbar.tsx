import React, { RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, Check, MoreVertical, Trash2 } from 'lucide-react'

interface TaskToolbarProps {
    // Quick Input
    quickInputRef: RefObject<HTMLInputElement>
    quickTaskTitle: string
    setQuickTaskTitle: (title: string) => void
    showQuickAddSuccess: boolean
    setShowQuickAddSuccess: (show: boolean) => void
    handleQuickTaskSubmit: (e: React.KeyboardEvent) => void

    // Search
    searchContainerRef: RefObject<HTMLDivElement>
    searchInputRef: RefObject<HTMLInputElement>
    isSearchOpen: boolean
    setIsSearchOpen: (open: boolean) => void
    searchQuery: string
    setSearchQuery: (query: string) => void

    // Actions
    onCreateClick: () => void
    menuOpen: boolean
    setMenuOpen: (open: boolean) => void
    sortBy: string
    handleSortChange: (sort: any) => void
    setSidebarMode: (mode: 'nav' | 'chat' | 'trash') => void
    doneTasksCount: number
    handleClearDone: () => void
}

export function TaskToolbar({
    quickInputRef,
    quickTaskTitle,
    setQuickTaskTitle,
    showQuickAddSuccess,
    setShowQuickAddSuccess,
    handleQuickTaskSubmit,
    searchContainerRef,
    searchInputRef,
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    onCreateClick,
    menuOpen,
    setMenuOpen,
    sortBy,
    handleSortChange,
    setSidebarMode,
    doneTasksCount,
    handleClearDone
}: TaskToolbarProps) {
    return (
        <div className="flex flex-col md:flex-row gap-2 mb-2 sticky top-0 bg-background z-30 py-1 items-center">
            {/* INTERACTIVE ZONE: Quick Task + Expanding Search */}
            <div className="flex-1 flex items-center gap-0 relative w-full">
                {/* Quick Task Input */}
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

                        {/* Input / Success Badge */}
                        <div className="flex-1 min-w-0 relative h-6 flex items-center">
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

                            {/* Success Badge Overlay */}
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

                        {/* Keyboard Shortcut Hint */}
                        {!quickTaskTitle && !showQuickAddSuccess && !isSearchOpen && (
                            <div className="hidden md:flex items-center gap-2 pointer-events-none select-none opacity-40 shrink-0">
                                <span className="px-1.5 py-0.5 rounded border border-on-surface-variant text-[10px] font-medium text-on-surface-variant">
                                    /
                                </span>
                            </div>
                        )}
                    </motion.div>
                </motion.div>

                {/* Expanding Search */}
                <motion.div
                    ref={searchContainerRef}
                    layout
                    initial={false}
                    animate={{ flex: isSearchOpen ? '1 1 50%' : '0 0 40px' }}
                    style={{ marginLeft: '8px' }}
                    transition={{ type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: 0.35 }}
                    className="relative h-10 z-10"
                >
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
                        <motion.div
                            layout
                            className="flex items-center justify-center shrink-0"
                            transition={{ type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: 0.35 }}
                        >
                            <Search className={`w-5 h-5 transition-colors duration-200 ${isSearchOpen ? 'text-primary' : 'text-on-surface-variant'}`} />
                        </motion.div>

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
                                            e.stopPropagation()
                                            setSearchQuery('')
                                            setIsSearchOpen(false)
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
                    onClick={onCreateClick}
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
    )
}
