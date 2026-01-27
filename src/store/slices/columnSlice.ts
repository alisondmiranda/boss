import { StateCreator } from 'zustand'
import { supabase } from '../../lib/supabase'
import { TaskState, KanbanColumn } from '../types'

export interface ColumnSlice {
    columns: KanbanColumn[]
    fetchColumns: () => Promise<void>
    addColumn: (title: string, color?: string) => Promise<void>
    updateColumn: (id: string, updates: Partial<KanbanColumn>) => Promise<void>
    deleteColumn: (id: string) => Promise<void>
    reorderColumns: (newColumns: KanbanColumn[]) => Promise<void>
    moveTaskToColumn: (taskId: string, columnId: string | null, newIndex: number) => Promise<void>
}

export const createColumnSlice: StateCreator<TaskState, [], [], ColumnSlice> = (set, get) => ({
    columns: [],

    fetchColumns: async () => {
        try {
            const user = (await supabase.auth.getUser()).data.user
            if (!user) return

            const { data, error } = await supabase
                .from('kanban_columns')
                .select('*')
                .eq('user_id', user.id)
                .order('order', { ascending: true })

            if (error) throw error
            set({ columns: data || [] })
        } catch (error) {
            console.error('Error fetching columns:', error)
        }
    },

    addColumn: async (title, color = 'slate') => {
        try {
            const user = (await supabase.auth.getUser()).data.user
            if (!user) return

            const { columns } = get()
            const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order)) : -1

            const { data, error } = await supabase
                .from('kanban_columns')
                .insert([{
                    title,
                    color,
                    user_id: user.id,
                    order: maxOrder + 1
                }])
                .select()
                .single()

            if (error) throw error

            set({ columns: [...columns, data] })
        } catch (error) {
            console.error('Error adding column:', error)
        }
    },

    updateColumn: async (id, updates) => {
        const { columns } = get()
        set({
            columns: columns.map(c => c.id === id ? { ...c, ...updates } : c)
        })

        try {
            const { error } = await supabase
                .from('kanban_columns')
                .update(updates)
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating column:', error)
            await get().fetchColumns()
        }
    },

    deleteColumn: async (id) => {
        const { columns } = get()
        set({
            columns: columns.filter(c => c.id !== id)
        })

        try {
            const { error } = await supabase
                .from('kanban_columns')
                .delete()
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Error deleting column:', error)
            await get().fetchColumns()
        }
    },

    reorderColumns: async (newColumns) => {
        set({ columns: newColumns })

        try {
            const updatePromises = newColumns.map((col, idx) =>
                supabase.from('kanban_columns').update({ order: idx }).eq('id', col.id)
            )
            await Promise.all(updatePromises)
        } catch (error) {
            console.error('Error reordering columns:', error)
            await get().fetchColumns()
        }
    },

    moveTaskToColumn: async (taskId, columnId, _newIndex) => {
        // Optimistic update
        const { tasks } = get()
        const task = tasks.find(t => t.id === taskId)

        if (!task) return

        // 1. Update task's column
        const updatedTask = { ...task, column_id: columnId }

        set({
            tasks: tasks.map(t => t.id === taskId ? updatedTask : t)
        })

        // 2. Persist
        try {
            await supabase
                .from('tasks')
                .update({ column_id: columnId || null }) // TODO: Handle order within column if needed later
                .eq('id', taskId)
        } catch (error) {
            console.error('Error moving task to column:', error)
            get().fetchTasks()
        }
    }
})
