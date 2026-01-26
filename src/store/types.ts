export interface Subtask {
    id: string
    title: string
    status?: 'todo' | 'done'
    completed?: boolean // For UI compatibility
    task_id: string
    created_at: string
    order: number
    details?: string
}

export interface Task {
    id: string
    title: string
    status: 'todo' | 'done'
    sector: any // Compatibility with string and string[]
    user_id: string
    created_at: string
    trash_date: string | null
    due_at: string | null
    recurrence_id: string | null
    details: string | null
    subtasks: Subtask[]
    order: number
}

export interface Sector {
    id: string
    label: string
    color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'slate' | 'indigo' | 'teal' | 'cyan' | 'amber' | 'yellow' | 'lime' | 'sky' | 'violet' | 'fuchsia' | 'rose' | 'stone' | 'zinc' | 'gray' | 'brown' | 'black' | 'white'
    icon: string
    createdAt?: string
}

export interface UserProfile {
    displayName: string
    avatarType: 'icon' | 'url' | 'upload'
    selectedIcon: string | null
    customAvatarUrl: string | null
}

export interface TaskState {
    tasks: Task[]
    trashTasks: Task[]
    loading: boolean
    isSyncing: boolean
    syncingIds: Set<string>
    filter: string | null
    pendingSectorUpdates: Record<string, any>

    setFilter: (sectorId: string | null) => void
    fetchTasks: (isBackgroundUpdate?: boolean) => Promise<void>
    addTask: (title: any, sectors?: any, dueAt?: any, recurrence?: any, details?: any, subtasks?: any[]) => Promise<void>
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>
    updateTaskWithSubtasks: (id: string, updates: Partial<Task>, subtasks: any[]) => Promise<void>
    toggleTask: (id: string, currentStatus: string) => Promise<void>
    updateTaskSector: (taskId: string, sectorIds: any) => Promise<void>
    toggleTaskSector: (taskId: string, sectorId: string, allSectors: { id: string, label: string }[]) => Promise<void>
    moveToTrash: (id: string) => Promise<void>
    restoreTask: (id: string) => Promise<void>
    permanentlyDeleteTask: (id: string) => Promise<void>
    clearDoneTasks: () => Promise<void>
    emptyTrash: () => Promise<void>
    reorderTasks: (newTasks: Task[]) => Promise<void>

    // Subtask actions
    addSubtask: (taskId: string, title: string) => Promise<void>
    toggleSubtask: (subtaskId: string) => Promise<void>
    deleteSubtask: (subtaskId: string) => Promise<void>
    updateSubtask: (subtaskId: string, title: string, details?: string) => Promise<void>
    reorderSubtasks: (taskId: string, newSubtasks: any[]) => Promise<void>

    subscribeToTasks: () => () => void
}
