import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface Subtask {
    id: string
    title: string
    status?: 'pending' | 'done'
    completed?: boolean // For UI compatibility
    task_id: string
    created_at: string
    order: number
    details?: string
}

export interface Task {
    id: string
    title: string
    status: 'pending' | 'done'
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

interface TaskState {
    tasks: Task[]
    trashTasks: Task[]
    loading: boolean
    isSyncing: boolean
    syncingIds: Set<string>
    filter: string | null
    pendingSectorUpdates: Record<string, string>

    setFilter: (sectorId: string | null) => void
    fetchTasks: () => Promise<void>
    addTask: (title: any, sectors?: any, dueAt?: any, recurrence?: any, details?: any, subtasks?: any[]) => Promise<void>
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>
    updateTaskWithSubtasks: (id: string, updates: Partial<Task>, subtasks: any[]) => Promise<void>
    toggleTask: (id: string, currentStatus: string) => Promise<void>
    updateTaskSector: (taskId: string, sectorIds: string) => Promise<void>
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

const isSame = (a: any, b: any): boolean => {
    const keys = ['title', 'status', 'sector', 'due_at', 'details', 'order', 'trash_date']
    for (const key of keys) {
        if (a[key] !== b[key]) return false
    }
    return true
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    trashTasks: [],
    loading: false,
    isSyncing: false,
    syncingIds: new Set<string>(),
    filter: null,
    pendingSectorUpdates: {},

    setFilter: (sectorId) => set({ filter: sectorId }),

    fetchTasks: async () => {
        set({ loading: true })
        try {
            const user = (await supabase.auth.getUser()).data.user
            if (!user) return

            const { data, error } = await supabase
                .from('tasks')
                .select('*, subtasks(*)')
                .eq('user_id', user.id)
                .order('order', { ascending: true })

            if (error) throw error

            const tasksData = (data || []).map((t: any) => ({
                ...t,
                subtasks: (t.subtasks || [])
                    .map((s: any) => ({
                        ...s,
                        status: s.status || (s.completed ? 'done' : 'pending'),
                        completed: s.status === 'done' || !!s.completed
                    }))
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            }))

            const tasks = tasksData.filter((t: any) => !t.trash_date)
            const trashTasks = tasksData.filter((t: any) => t.trash_date)

            const { pendingSectorUpdates } = get()
            const mergedTasks = tasks.map((t: any) => ({
                ...t,
                sector: pendingSectorUpdates[t.id] || t.sector
            }))

            set({ tasks: mergedTasks, trashTasks, loading: false })
        } catch (error) {
            console.error('Error fetching tasks:', error)
            set({ loading: false })
        }
    },

    addTask: async (title, sectors = [], dueAt = null, recurrence = null, details = null, subtasksInput = []) => {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) return

        const { tasks } = get()
        const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order || 0)) : -1

        let finalTitle = title
        let finalSectors = sectors
        if (typeof title === 'object' && title !== null) {
            finalTitle = title.title
            finalSectors = title.sector || []
        }

        try {
            const { data: taskData, error: taskError } = await supabase
                .from('tasks')
                .insert([{
                    title: finalTitle,
                    status: 'pending',
                    sector: Array.isArray(finalSectors) ? finalSectors.join(',') : (finalSectors || 'personal'),
                    user_id: user.id,
                    due_at: dueAt instanceof Date ? dueAt.toISOString() : dueAt,
                    recurrence_id: recurrence?.id || null,
                    details,
                    order: maxOrder + 1
                }])
                .select()
                .single()

            if (taskError) throw taskError

            if (subtasksInput.length > 0 && taskData) {
                const subtasksToInsert = subtasksInput.map((s: any, idx: number) => ({
                    title: s.title,
                    status: s.status || (s.completed ? 'done' : 'pending'),
                    task_id: taskData.id,
                    order: idx,
                    details: s.details
                }))
                await supabase.from('subtasks').insert(subtasksToInsert)
            }

            await get().fetchTasks()
        } catch (error) {
            console.error('Error adding task:', error)
        }
    },

    updateTask: async (id, updates) => {
        const { syncingIds, tasks, trashTasks } = get()
        syncingIds.add(id)
        set({ syncingIds: new Set(syncingIds) })

        const cleanUpdates = { ...updates }
        if (Array.isArray(cleanUpdates.sector)) {
            // @ts-ignore
            cleanUpdates.sector = cleanUpdates.sector.join(',')
        }

        const updateList = (list: Task[]) => list.map(t => t.id === id ? { ...t, ...cleanUpdates } as Task : t)
        set({
            tasks: updateList(tasks),
            trashTasks: updateList(trashTasks)
        })

        try {
            const { error } = await supabase
                .from('tasks')
                .update(cleanUpdates)
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating task:', error)
        } finally {
            setTimeout(() => {
                const { syncingIds } = get()
                syncingIds.delete(id)
                set({ syncingIds: new Set(syncingIds) })
            }, 1000)
        }
    },

    updateTaskWithSubtasks: async (id, updates, subtasksInput) => {
        const { syncingIds } = get()
        syncingIds.add(id)
        set({ syncingIds: new Set(syncingIds) })

        try {
            const cleanUpdates = { ...updates }
            if (Array.isArray(cleanUpdates.sector)) {
                // @ts-ignore
                cleanUpdates.sector = cleanUpdates.sector.join(',')
            }

            const { error: taskError } = await supabase
                .from('tasks')
                .update(cleanUpdates)
                .eq('id', id)

            if (taskError) throw taskError

            for (const s of subtasksInput) {
                const subStatus = s.status || (s.completed ? 'done' : 'pending')
                if (s.id && !s.id.toString().includes('temp')) {
                    await supabase.from('subtasks').update({
                        title: s.title,
                        status: subStatus,
                        order: s.order,
                        details: s.details
                    }).eq('id', s.id)
                } else {
                    await supabase.from('subtasks').insert([{
                        task_id: id,
                        title: s.title,
                        status: subStatus,
                        order: s.order,
                        details: s.details
                    }])
                }
            }

            await get().fetchTasks()
        } catch (error) {
            console.error('Error updating task with subtasks:', error)
        } finally {
            setTimeout(() => {
                const { syncingIds } = get()
                syncingIds.delete(id)
                set({ syncingIds: new Set(syncingIds) })
            }, 1000)
        }
    },

    toggleTask: async (id, currentStatus) => {
        const newStatus = currentStatus === 'pending' ? 'done' : 'pending'
        await get().updateTask(id, { status: newStatus as any })
    },

    updateTaskSector: async (taskId, sectorId) => {
        const { pendingSectorUpdates } = get()
        set({
            pendingSectorUpdates: { ...pendingSectorUpdates, [taskId]: sectorId }
        })
        await get().updateTask(taskId, { sector: sectorId })

        setTimeout(() => {
            const { pendingSectorUpdates } = get()
            const newPending = { ...pendingSectorUpdates }
            delete newPending[taskId]
            set({ pendingSectorUpdates: newPending })
        }, 2000)
    },

    toggleTaskSector: async (taskId, sectorId, allSectors) => {
        const task = get().tasks.find(t => t.id === taskId)
        if (!task) return

        const currentSectors = task.sector?.toString().split(',').filter(Boolean) || []
        let newSectors: string[]

        if (currentSectors.includes(sectorId)) {
            newSectors = currentSectors.filter((s: string) => s !== sectorId)
        } else {
            newSectors = [...currentSectors, sectorId]
        }

        const sectorOrder = allSectors.map(s => s.id)
        newSectors.sort((a, b) => sectorOrder.indexOf(a) - sectorOrder.indexOf(b))

        await get().updateTaskSector(taskId, newSectors.join(','))
    },

    moveToTrash: async (id) => {
        const { tasks, trashTasks } = get()
        const taskToMove = tasks.find(t => t.id === id)
        if (!taskToMove) return

        const trashDate = new Date().toISOString()
        set({
            tasks: tasks.filter(t => t.id !== id),
            trashTasks: [...trashTasks, { ...taskToMove, trash_date: trashDate }]
        })

        try {
            await supabase
                .from('tasks')
                .update({ trash_date: trashDate })
                .eq('id', id)
        } catch (error) {
            console.error('Error moving to trash:', error)
            await get().fetchTasks()
        }
    },

    restoreTask: async (id) => {
        const { tasks, trashTasks } = get()
        const taskToRestore = trashTasks.find(t => t.id === id)
        if (!taskToRestore) return

        set({
            trashTasks: trashTasks.filter(t => t.id !== id),
            tasks: [...tasks, { ...taskToRestore, trash_date: null }].sort((a, b) => (a.order || 0) - (b.order || 0))
        })

        try {
            await supabase
                .from('tasks')
                .update({ trash_date: null })
                .eq('id', id)
        } catch (error) {
            console.error('Error restoring task:', error)
            await get().fetchTasks()
        }
    },

    permanentlyDeleteTask: async (id) => {
        const { trashTasks } = get()
        set({ trashTasks: trashTasks.filter(t => t.id !== id) })

        try {
            await supabase.from('tasks').delete().eq('id', id)
        } catch (error) {
            console.error('Error deleting task:', error)
            await get().fetchTasks()
        }
    },

    clearDoneTasks: async () => {
        const { tasks } = get()
        const doneTasks = tasks.filter(t => t.status === 'done')
        const trashDate = new Date().toISOString()

        set({
            tasks: tasks.filter(t => t.status !== 'done'),
            trashTasks: [...get().trashTasks, ...doneTasks.map(t => ({ ...t, trash_date: trashDate }))]
        })

        try {
            const ids = doneTasks.map(t => t.id)
            await supabase.from('tasks').update({ trash_date: trashDate }).in('id', ids)
        } catch (error) {
            console.error('Error clearing done tasks:', error)
            await get().fetchTasks()
        }
    },

    emptyTrash: async () => {
        set({ trashTasks: [] })
        try {
            const user = (await supabase.auth.getUser()).data.user
            if (!user) return
            await supabase.from('tasks').delete().not('trash_date', 'is', null).eq('user_id', user.id)
        } catch (error) {
            console.error('Error emptying trash:', error)
            await get().fetchTasks()
        }
    },

    reorderTasks: async (newTasks) => {
        const oldTasks = get().tasks
        set({ tasks: newTasks })

        const updates = newTasks
            .map((task, index) => ({ id: task.id, order: index }))
            .filter((update) => {
                const oldTask = oldTasks.find(t => t.id === update.id)
                return !oldTask || oldTask.order !== update.order
            })

        if (updates.length === 0) return

        try {
            const { error } = await supabase.from('tasks').upsert(
                updates.map(u => ({ id: u.id, order: u.order })),
                { onConflict: 'id' }
            )
            if (error) throw error
        } catch (error) {
            console.error('Error reordering tasks:', error)
        }
    },

    addSubtask: async (taskId, title) => {
        try {
            const { data: subtasks } = await supabase.from('subtasks').select('order').eq('task_id', taskId)
            const maxOrder = subtasks && subtasks.length > 0 ? Math.max(...subtasks.map(s => s.order || 0)) : -1

            await supabase.from('subtasks').insert([{
                task_id: taskId,
                title,
                status: 'pending',
                order: maxOrder + 1
            }])

            await get().fetchTasks()
        } catch (error) {
            console.error('Error adding subtask:', error)
        }
    },

    toggleSubtask: async (subtaskId) => {
        try {
            const { data: subtask } = await supabase.from('subtasks').select('status, task_id').eq('id', subtaskId).single()
            if (!subtask) return

            const newStatus = subtask.status === 'pending' ? 'done' : 'pending'

            const { syncingIds } = get()
            syncingIds.add(subtask.task_id)
            set({ syncingIds: new Set(syncingIds) })

            await supabase.from('subtasks').update({ status: newStatus }).eq('id', subtaskId)

            const { tasks } = get()
            const newTasks = tasks.map(t => {
                if (t.id === subtask.task_id) {
                    return {
                        ...t,
                        subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, status: newStatus as any, completed: newStatus === 'done' } : st)
                    }
                }
                return t
            })
            set({ tasks: newTasks })

            setTimeout(() => {
                const { syncingIds } = get()
                syncingIds.delete(subtask.task_id)
                set({ syncingIds: new Set(syncingIds) })
            }, 1000)
        } catch (error) {
            console.error('Error toggling subtask:', error)
        }
    },

    deleteSubtask: async (subtaskId) => {
        try {
            await supabase.from('subtasks').delete().eq('id', subtaskId)
            await get().fetchTasks()
        } catch (error) {
            console.error('Error deleting subtask:', error)
        }
    },

    updateSubtask: async (subtaskId, title, details) => {
        try {
            await supabase.from('subtasks').update({ title, details }).eq('id', subtaskId)
            await get().fetchTasks()
        } catch (error) {
            console.error('Error updating subtask:', error)
        }
    },

    reorderSubtasks: async (taskId, newSubtasks) => {
        try {
            const updates = newSubtasks.map((s: any, idx: number) => ({
                id: s.id,
                order: idx,
                task_id: taskId
            }))

            const { error } = await supabase.from('subtasks').upsert(updates)
            if (error) throw error

            await get().fetchTasks()
        } catch (error) {
            console.error('Error reordering subtasks:', error)
        }
    },

    subscribeToTasks: () => {
        let debounceTimer: NodeJS.Timeout

        const channel = supabase
            .channel('tasks-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                async (payload) => {
                    const { syncingIds } = get()

                    if (payload.eventType === 'INSERT') {
                        if (get().tasks.some(t => t.id === payload.new.id)) return
                        await get().fetchTasks()
                    }
                    else if (payload.eventType === 'UPDATE') {
                        if (syncingIds.has(payload.new.id)) return

                        const updatedTask = payload.new as Task
                        const currentTask = get().tasks.find(t => t.id === updatedTask.id) ||
                            get().trashTasks.find(t => t.id === updatedTask.id)

                        if (currentTask && isSame(currentTask, updatedTask)) return

                        const wasInTrash = !!currentTask?.trash_date
                        const isInTrash = !!updatedTask.trash_date

                        if (wasInTrash !== isInTrash) {
                            await get().fetchTasks()
                        } else {
                            set(state => {
                                const updateList = (list: Task[]) => {
                                    const newList = list.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t)
                                    return newList.sort((a, b) => (a.order || 0) - (b.order || 0))
                                }
                                return {
                                    tasks: updateList(state.tasks),
                                    trashTasks: updateList(state.trashTasks)
                                }
                            })
                        }
                    }
                    else if (payload.eventType === 'DELETE') {
                        set(state => ({
                            tasks: state.tasks.filter(t => t.id !== payload.old.id),
                            trashTasks: state.trashTasks.filter(t => t.id !== payload.old.id)
                        }))
                    }

                    clearTimeout(debounceTimer)
                    debounceTimer = setTimeout(() => {
                        const { syncingIds } = get()
                        if (syncingIds.size === 0) {
                            get().fetchTasks()
                        }
                    }, 3000)
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'subtasks' },
                () => {
                    clearTimeout(debounceTimer)
                    debounceTimer = setTimeout(() => {
                        get().fetchTasks()
                    }, 1000)
                }
            )
            .subscribe()

        return () => {
            clearTimeout(debounceTimer)
            supabase.removeChannel(channel)
        }
    }
}))