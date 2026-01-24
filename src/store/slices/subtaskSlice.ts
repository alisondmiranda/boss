import { StateCreator } from 'zustand'
import { supabase } from '../../lib/supabase'
import { TaskState } from '../types'

export interface SubtaskSlice {
    addSubtask: (taskId: string, title: string) => Promise<void>
    toggleSubtask: (subtaskId: string) => Promise<void>
    deleteSubtask: (subtaskId: string) => Promise<void>
    updateSubtask: (subtaskId: string, title: string, details?: string) => Promise<void>
    reorderSubtasks: (taskId: string, newSubtasks: any[]) => Promise<void>
}

export const createSubtaskSlice: StateCreator<TaskState, [], [], SubtaskSlice> = (set, get) => ({
    addSubtask: async (taskId, title) => {
        const { tasks, syncingIds } = get()
        const tempId = `temp-${Date.now()}`

        // Find max order from local state
        const task = tasks.find(t => t.id === taskId)
        const maxOrder = task?.subtasks && task.subtasks.length > 0
            ? Math.max(...task.subtasks.map(s => s.order || 0))
            : -1

        // OPTIMISTIC UPDATE - Instant UI feedback
        const newSubtask = {
            id: tempId,
            title,
            task_id: taskId,
            completed: false,
            status: 'todo' as 'todo' | 'done',
            order: maxOrder + 1,
            created_at: new Date().toISOString()
        }

        syncingIds.add(taskId)
        const newTasks = tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    subtasks: [...(t.subtasks || []), newSubtask]
                }
            }
            return t
        })
        set({ tasks: newTasks, syncingIds: new Set(syncingIds), isSyncing: true })

        // SYNC TO DATABASE - Background
        try {
            await supabase.from('subtasks').insert([{
                task_id: taskId,
                title,
                order: maxOrder + 1
            }])

            // Fetch real data to get the actual ID
            await get().fetchTasks()
        } catch (error) {
            console.error('[DATABASE] Error adding subtask:', error)
            // Rollback on error
            await get().fetchTasks()
        } finally {
            setTimeout(() => {
                const { syncingIds } = get()
                syncingIds.delete(taskId)
                set({ syncingIds: new Set(syncingIds), isSyncing: false })
            }, 300)
        }
    },

    toggleSubtask: async (subtaskId) => {
        // Find the subtask in local state for optimistic update
        const { tasks, syncingIds } = get()
        let taskId: string | null = null
        let currentCompleted: boolean | undefined = undefined

        for (const t of tasks) {
            const st = t.subtasks?.find(s => s.id === subtaskId)
            if (st) {
                taskId = t.id
                currentCompleted = st.completed
                break
            }
        }

        if (!taskId || currentCompleted === undefined) return

        const newCompleted = !currentCompleted

        // OPTIMISTIC UPDATE - Instant UI feedback
        syncingIds.add(taskId)
        const newTasks = tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: newCompleted, status: (newCompleted ? 'done' : 'todo') as 'done' | 'todo' } : st)
                }
            }
            return t
        })
        set({ tasks: newTasks, syncingIds: new Set(syncingIds), isSyncing: true })

        // SYNC TO DATABASE - Background
        try {
            await supabase.from('subtasks').update({ completed: newCompleted }).eq('id', subtaskId)
        } catch (error) {
            console.error('Error toggling subtask:', error)
            // Rollback on error
            await get().fetchTasks()
        } finally {
            setTimeout(() => {
                const { syncingIds } = get()
                syncingIds.delete(taskId!)
                set({ syncingIds: new Set(syncingIds), isSyncing: false })
            }, 500)
        }
    },

    deleteSubtask: async (subtaskId) => {
        set({ isSyncing: true })
        try {
            await supabase.from('subtasks').delete().eq('id', subtaskId)
            await get().fetchTasks()
        } catch (error) {
            console.error('Error deleting subtask:', error)
        } finally {
            setTimeout(() => set({ isSyncing: false }), 2000)
        }
    },

    updateSubtask: async (subtaskId, title, details) => {
        set({ isSyncing: true })
        try {
            await supabase.from('subtasks').update({ title, details }).eq('id', subtaskId)
            await get().fetchTasks()
        } catch (error) {
            console.error('Error updating subtask:', error)
        } finally {
            setTimeout(() => set({ isSyncing: false }), 2000)
        }
    },

    reorderSubtasks: async (taskId, newSubtasks) => {
        const { tasks, syncingIds } = get()

        // Mark as syncing
        syncingIds.add(taskId)
        set({ syncingIds: new Set(syncingIds), isSyncing: true })

        // Optimistic update
        const updatedTasks = tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    subtasks: newSubtasks.map((s: any, idx: number) => ({ ...s, order: idx }))
                }
            }
            return t
        })
        set({ tasks: updatedTasks })

        // Persist to database - update each subtask's order
        try {
            const updatePromises = newSubtasks.map((s: any, idx: number) =>
                supabase.from('subtasks').update({ order: idx }).eq('id', s.id)
            )
            await Promise.all(updatePromises)
        } catch (error) {
            console.error('Error reordering subtasks:', error)
            await get().fetchTasks()
        } finally {
            setTimeout(() => {
                const { syncingIds } = get()
                syncingIds.delete(taskId)
                set({ syncingIds: new Set(syncingIds), isSyncing: false })
            }, 2000)
        }
    },
})
