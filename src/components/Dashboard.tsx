import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import { useTaskStore, Task } from '../store/taskStore'
import { useSettingsStore } from '../store/settingsStore'
import { useUIStore } from '../store/uiStore'
import { useTaskFiltering } from '../hooks/useTaskFiltering'
import { useChatAssistant } from '../hooks/useChatAssistant'
import { useTaskActions } from '../hooks/useTaskActions'
import { useQuickTaskInput } from '../hooks/useQuickTaskInput'
import { useToast } from '../store/toastStore'

import { SettingsModal } from './SettingsModal'
import { TaskFormModal } from './TaskFormModal'
import { RightSidebar } from './RightSidebar'
import { ToastContainer } from './ToastContainer'
import { Header } from './layout/Header'
import { Sidebar } from './layout/Sidebar'
import { ChatView } from './chat/ChatView'
import { TaskToolbar } from './tasks/TaskToolbar'
import { TaskListView } from './tasks/TaskListView'
import { TrashView } from './tasks/TrashView'
import { KanbanView } from './kanban/KanbanView'
import { MobileBottomNav } from './layout/MobileBottomNav'
import { TaskDetailBottomSheet } from './tasks/TaskDetailBottomSheet'

export function Dashboard() {
    // UI Store
    const {
        toggleRightSidebar, isRightSidebarOpen,
        isLeftSidebarExpanded, setLeftSidebarExpanded,
        fetchUIPreferences, subscribeToUIPreferences
    } = useUIStore()

    // Auth Store
    const { signOut, user } = useAuthStore()

    // Task Store
    const {
        tasks, trashTasks, loading, fetchTasks,
        toggleTaskSector, updateTask, updateSubtask,
        addTask, addSubtask, toggleSubtask, deleteSubtask,
        reorderTasks, reorderSubtasks, subscribeToTasks,
        columns, fetchColumns
    } = useTaskStore()

    // Settings Store
    const { sectors, userProfile, sortBy: sortBySettings } = useSettingsStore()
    const { addToast } = useToast()

    // --- Custom Hooks ---

    // Task Filtering
    const {
        filter, setFilter, searchQuery, setSearchQuery,
        sortBy, handleSortChange, toggleFilter, sortedSectors,
        sortedTasks
    } = useTaskFiltering(tasks, sectors, sortBySettings)

    // Task Actions
    const {
        editingTask, setEditingTask,
        handleAddTask, handleMoveToTrash, handleRestore,
        handlePermanentDelete, handleClearDone, handleEmptyTrash,
        handleToggleTask
    } = useTaskActions()

    // Quick Task Input
    const {
        quickTaskTitle, setQuickTaskTitle,
        showQuickAddSuccess, setShowQuickAddSuccess,
        quickInputRef, searchInputRef, searchContainerRef,
        isSearchOpen, setIsSearchOpen, handleQuickTaskSubmit
    } = useQuickTaskInput({
        onSubmit: async (title) => {
            try {
                await handleAddTask(title, [], null, null, null, [], null)
            } catch (error) {
                addToast('Erro ao criar tarefa. Tente novamente.', 'error')
            }
        }
    })

    // Chat Assistant
    const {
        chatInput, setChatInput, chatMessages,
        isThinking, chatEndRef, handleChatSubmit
    } = useChatAssistant(async (title, chatSectors) => {
        await addTask(title, chatSectors)
    })

    // --- Local State ---
    const [sidebarOpen] = useState(true)
    const isSidebarExpanded = isLeftSidebarExpanded
    const setIsSidebarExpanded = setLeftSidebarExpanded
    const [sidebarMode, setSidebarMode] = useState<'nav' | 'chat' | 'trash' | 'kanban'>('nav')
    const [menuOpen, setMenuOpen] = useState(false)
    const [showDone, setShowDone] = useState(false)

    // Modal States
    const [showSettings, setShowSettings] = useState(false)
    const [settingsTab, setSettingsTab] = useState<'api' | 'sectors' | 'profile'>('api')
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
    const [initialOpenPicker, setInitialOpenPicker] = useState<'date' | 'recurrence' | null>(null)
    const [settingsOpenCreation, setSettingsOpenCreation] = useState(false)

    // Task Menu State
    const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null)
    const [mobileTaskToEdit, setMobileTaskToEdit] = useState<Task | null>(null)

    // Computed
    const doneTasksCount = useMemo(() => tasks.filter(t => t.status === 'done').length, [tasks])
    const trashTasksCount = useMemo(() => trashTasks.length, [trashTasks])

    // --- Handlers ---

    const openSettings = (tab: 'api' | 'sectors' | 'profile' = 'api', openCreation = false) => {
        setSettingsTab(tab)
        setSettingsOpenCreation(openCreation)
        setShowSettings(true)
    }

    const handleEditClick = (task: Task) => {
        setEditingTask(task)
        setInitialOpenPicker(null)
        setIsTaskFormOpen(true)
    }

    const handleDateClick = (task: Task) => {
        setEditingTask(task)
        setInitialOpenPicker('date')
        setIsTaskFormOpen(true)
    }

    const handleRecurrenceClick = (task: Task) => {
        setEditingTask(task)
        setInitialOpenPicker('recurrence')
        setIsTaskFormOpen(true)
    }

    const handleFormSave = async (
        title: string,
        inputSectors: string[],
        dueAt: Date | null,
        recurrence: any,
        details: string | null,
        subtasks: any[]
    ) => {
        await handleAddTask(title, inputSectors, dueAt, recurrence, details, subtasks, editingTask)
    }

    // --- Effects ---

    // Fetch data and subscribe on mount
    useEffect(() => {
        fetchTasks()
        fetchColumns()
        fetchUIPreferences()
        const unsubscribeUI = subscribeToUIPreferences()
        const unsubscribeTasks = subscribeToTasks()
        return () => {
            unsubscribeUI()
            unsubscribeTasks()
        }
    }, [])

    // Listen for custom event to open sectors settings
    useEffect(() => {
        const handleOpenSectors = () => openSettings('sectors', true)
        window.addEventListener('open-sectors-settings', handleOpenSectors)
        return () => window.removeEventListener('open-sectors-settings', handleOpenSectors)
    }, [])

    // --- Render ---

    return (
        <div className="flex h-screen overflow-hidden bg-background font-sans">
            <ToastContainer />

            <SettingsModal
                isOpen={showSettings}
                onClose={() => { setShowSettings(false); setSettingsOpenCreation(false) }}
                initialTab={settingsTab}
                initialOpenCreation={settingsOpenCreation}
            />

            {/* LEFT: Sidebar */}
            <Sidebar
                isSidebarExpanded={isSidebarExpanded}
                setIsSidebarExpanded={setIsSidebarExpanded}
                sidebarOpen={sidebarOpen}
                sidebarMode={sidebarMode}
                setSidebarMode={setSidebarMode}
                filter={filter}
                setFilter={setFilter}
                toggleFilter={toggleFilter}
                sortedSectors={sortedSectors}
                openSettings={openSettings}
            />

            {/* RIGHT: Main Content Section */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
                {/* Header */}
                <Header
                    userProfile={userProfile}
                    user={user}
                    signOut={signOut}
                    openSettings={openSettings}
                    isRightSidebarOpen={isRightSidebarOpen}
                    toggleRightSidebar={toggleRightSidebar}
                />

                {/* Main Views */}
                <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-32 md:pb-20 custom-scrollbar relative">

                    {/* VIEW: CHAT */}
                    {sidebarMode === 'chat' && (
                        <ChatView
                            chatMessages={chatMessages}
                            isThinking={isThinking}
                            chatEndRef={chatEndRef}
                            chatInput={chatInput}
                            setChatInput={setChatInput}
                            handleChatSubmit={handleChatSubmit}
                        />
                    )}

                    {/* VIEW: NAV (Tasks) */}
                    {sidebarMode === 'nav' && (
                        <div className="max-w-4xl mx-auto space-y-2 pt-2">
                            <TaskToolbar
                                quickInputRef={quickInputRef}
                                quickTaskTitle={quickTaskTitle}
                                setQuickTaskTitle={setQuickTaskTitle}
                                showQuickAddSuccess={showQuickAddSuccess}
                                setShowQuickAddSuccess={setShowQuickAddSuccess}
                                handleQuickTaskSubmit={handleQuickTaskSubmit}
                                searchContainerRef={searchContainerRef}
                                searchInputRef={searchInputRef}
                                isSearchOpen={isSearchOpen}
                                setIsSearchOpen={setIsSearchOpen}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                onCreateClick={() => setIsTaskFormOpen(true)}
                                menuOpen={menuOpen}
                                setMenuOpen={setMenuOpen}
                                sortBy={sortBy}
                                handleSortChange={handleSortChange}
                                setSidebarMode={setSidebarMode}
                                doneTasksCount={doneTasksCount}
                                handleClearDone={() => handleClearDone(doneTasksCount)}
                            />

                            <TaskFormModal
                                isOpen={isTaskFormOpen}
                                onClose={() => {
                                    setIsTaskFormOpen(false)
                                    setEditingTask(null)
                                    setInitialOpenPicker(null)
                                }}
                                onSave={handleFormSave}
                                sectors={sortedSectors}
                                mode={editingTask ? 'edit' : 'create'}
                                initialTitle={editingTask?.title}
                                initialSectors={editingTask ? (Array.isArray(editingTask.sector) ? editingTask.sector : (editingTask.sector?.toString().split(',').filter(Boolean) || [])) : []}
                                initialDueAt={editingTask?.due_at ? new Date(editingTask.due_at) : null}
                                initialDetails={editingTask?.details}
                                initialSubtasks={editingTask?.subtasks || []}
                                initialOpenPicker={initialOpenPicker}
                            />

                            <TaskListView
                                tasks={sortedTasks}
                                loading={loading}
                                sortedSectors={sortedSectors}
                                columns={columns}
                                sortBy={sortBy}
                                handleSortChange={handleSortChange}
                                toggleTask={handleToggleTask}
                                toggleTaskSector={toggleTaskSector}
                                updateSubtask={updateSubtask}
                                addSubtask={addSubtask}
                                toggleSubtask={toggleSubtask}
                                deleteSubtask={deleteSubtask}
                                reorderSubtasks={reorderSubtasks}
                                reorderTasks={reorderTasks}
                                taskMenuOpen={taskMenuOpen}
                                setTaskMenuOpen={setTaskMenuOpen}
                                handleMoveToTrash={handleMoveToTrash}
                                updateTask={updateTask}
                                onEditClick={handleEditClick}
                                onDateClick={handleDateClick}
                                onRecurrenceClick={handleRecurrenceClick}
                                showDone={showDone}
                                setShowDone={setShowDone}
                                handleClearDone={() => handleClearDone(doneTasksCount)}
                                onMobileClick={(task) => setMobileTaskToEdit(task)}
                            />
                        </div>
                    )}

                    {/* VIEW: TRASH */}
                    {sidebarMode === 'trash' && (
                        <TrashView
                            trashTasks={trashTasks}
                            setSidebarMode={setSidebarMode}
                            handleEmptyTrash={() => handleEmptyTrash(trashTasksCount)}
                            handleRestore={handleRestore}
                            handlePermanentDelete={handlePermanentDelete}
                        />
                    )}

                    {/* VIEW: KANBAN */}
                    {sidebarMode === 'kanban' && (
                        <KanbanView />
                    )}
                </div>
            </main>

            <RightSidebar />

            <MobileBottomNav
                onMenuClick={() => openSettings('sectors')}
                onAddClick={() => setIsTaskFormOpen(true)}
                onSearchClick={() => {
                    setIsSearchOpen(true)
                    // Pequeno delay para garantir que a UI expandiu
                    setTimeout(() => searchInputRef.current?.focus(), 100)
                }}
                onCalendarClick={() => {
                    // Por enquanto abre o form com data, ou poderia ser um toast
                    setInitialOpenPicker('date')
                    setIsTaskFormOpen(true)
                }}
            />

            <TaskDetailBottomSheet
                task={mobileTaskToEdit}
                isOpen={!!mobileTaskToEdit}
                onClose={() => setMobileTaskToEdit(null)}
                updateTask={updateTask}
                toggleTask={handleToggleTask}
                addSubtask={addSubtask}
                updateSubtask={updateSubtask}
                deleteSubtask={deleteSubtask}
                toggleSubtask={toggleSubtask}
                reorderSubtasks={reorderSubtasks}
                handleMoveToTrash={handleMoveToTrash}
                sectors={sortedSectors}
                toggleTaskSector={toggleTaskSector}
            />
        </div>
    )
}
