import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface Task {
    id: string
    title: string
    status: 'todo' | 'doing' | 'done'
    sector: string | string[] // Supports legacy string and new array
    user_id: string
    created_at: string
}

interface TaskState {
    tasks: Task[]
    loading: boolean
    filter: string[] // Changed to array
    setFilter: (sectors: string[]) => void
    fetchTasks: () => Promise<void>
    addTask: (title: string, sector: string | string[]) => Promise<void>
    updateTaskSector: (id: string, newSector: string | string[]) => Promise<void> // Supports both
    toggleTask: (id: string, currentStatus: Task['status']) => Promise<void>
    deleteTask: (id: string) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    loading: false,
    filter: [],

    setFilter: (sectors) => set({ filter: sectors }),

    fetchTasks: async () => {
        set({ loading: true })
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) console.error('Error fetching tasks:', error)
        else set({ tasks: data as Task[] })
        set({ loading: false })
    },

    addTask: async (title, sector) => {
        // Ensure sector is stored appropriately.
        // If DB column is text, we might need JSON.stringify if it's an array.
        // Assuming Supabase handles JSON automatically if column is JSONB, or we might need to cast.
        // For now, let's assume we send it as is, and if it fails, we might need adjustments.
        // Ideally the DB column 'sector' should be changed to JSONB or text[] to support this properly.
        // If it's a simple text column, storing an array might result in "{a,b}" string or "[a,b]".

        // Optimistic Update
        const tempId = Math.random().toString()
        const currentUser = (await supabase.auth.getUser()).data.user?.id || 'temp-user'

        const newTask: Task = {
            id: tempId,
            title,
            sector,
            status: 'todo',
            user_id: currentUser,
            created_at: new Date().toISOString()
        }

        set(state => ({ tasks: [newTask, ...state.tasks] }))

        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                title,
                sector, // Supabase client should handle array -> PG array/json if configured, else might error.
                user_id: currentUser,
                status: 'todo'
            }])
            .select()
            .single()

        if (error) {
            console.error('Error adding task:', error)
            // Rollback
            set(state => ({ tasks: state.tasks.filter(t => t.id !== tempId) }))
        } else {
            // Replace temp ID with real ID
            set(state => ({
                tasks: state.tasks.map(t => t.id === tempId ? data : t)
            }))
        }
    },

    updateTaskSector: async (id, newSector) => {
        const previousTasks = get().tasks
        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, sector: newSector } : t)
        }))

        const { error } = await supabase
            .from('tasks')
            .update({ sector: newSector })
            .eq('id', id)

        if (error) {
            console.error('Error updating task sector:', error)
            set({ tasks: previousTasks })
        }
    },

    toggleTask: async (id, currentStatus) => {
        const newStatus = currentStatus === 'todo' ? 'done' : 'todo'

        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, status: newStatus } : t)
        }))

        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) {
            console.error('Error toggling task:', error)
            // Rollback
            set(state => ({
                tasks: state.tasks.map(t => t.id === id ? { ...t, status: currentStatus } : t)
            }))
        }
    },

    deleteTask: async (id) => {
        const previousTasks = get().tasks
        set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }))

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting task:', error)
            set({ tasks: previousTasks })
        }
    }
}))
