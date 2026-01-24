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
        set({ isSyncing: true })
        try {
            const { data: subtasks } = await supabase.from('subtasks').select('order').eq('task_id', taskId)
            const maxOrder = subtasks && subtasks.length > 0 ? Math.max(...subtasks.map(s => s.order || 0)) : -1

            const { error } = await supabase.from('subtasks').insert([{
                task_id: taskId,
                title,
                order: maxOrder + 1
            }])

            if (error) {
                console.error('[DATABASE] Error adding subtask:', error)
            }

            await get().fetchTasks()
        } catch (error) {
            console.error('Error adding subtask:', error)
        } finally {
            setTimeout(() => set({ isSyncing: false }), 1000)
        }
    },

    toggleSubtask: async (subtaskId) => {
        try {
            const { data: subtask } = await supabase.from('subtasks').select('status, task_id').eq('id', subtaskId).single()
            if (!subtask) return

            const newStatus = subtask.status === 'todo' ? 'done' : 'todo'

            const { syncingIds } = get()
            syncingIds.add(subtask.task_id)
            set({ syncingIds: new Set(syncingIds), isSyncing: true })

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
                set({ syncingIds: new Set(syncingIds), isSyncing: false })
            }, 2000)
        } catch (error) {
            console.error('Error toggling subtask:', error)
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
