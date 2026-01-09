import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface Task {
    id: string
    title: string
    status: 'todo' | 'doing' | 'done' | 'trash'
    sector: string | string[]
    user_id: string
    created_at: string
    trash_date?: string
}

interface TaskState {
    tasks: Task[]
    trashTasks: Task[]
    loading: boolean
    filter: string[]
    setFilter: (sectors: string[]) => void
    fetchTasks: () => Promise<void>
    addTask: (title: string, sector: string | string[]) => Promise<void>
    updateTaskSector: (id: string, newSector: string | string[]) => Promise<void>
    toggleTask: (id: string, currentStatus: Task['status']) => Promise<void>
    moveToTrash: (id: string) => Promise<void>
    restoreTask: (id: string) => Promise<void>
    permanentlyDeleteTask: (id: string) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    trashTasks: [],
    loading: false,
    filter: [],

    setFilter: (sectors) => set({ filter: sectors }),

    fetchTasks: async () => {
        set({ loading: true })

        // Fetch active tasks
        const { data: activeData, error: activeError } = await supabase
            .from('tasks')
            .select('*')
            .neq('status', 'trash')
            .order('created_at', { ascending: false })

        // Fetch trash tasks
        const { data: trashData, error: trashError } = await supabase
            .from('tasks')
            .select('*')
            .eq('status', 'trash')
            .order('trash_date', { ascending: false })

        if (activeError) console.error('Error fetching active tasks:', activeError)
        if (trashError) console.error('Error fetching trash tasks:', trashError)

        // Auto-cleanup: Permanently delete tasks in trash > 30 days
        const now = new Date()
        const validTrashTasks: Task[] = []
        const expiredTaskIds: string[] = []

        if (trashData) {
            (trashData as Task[]).forEach(task => {
                if (task.trash_date) {
                    const trashDate = new Date(task.trash_date)
                    const diffTime = Math.abs(now.getTime() - trashDate.getTime())
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                    if (diffDays > 30) {
                        expiredTaskIds.push(task.id)
                    } else {
                        validTrashTasks.push(task)
                    }
                } else {
                    // Legacy trash (if any) or missing date, keep it or default delete? Keep safe.
                    validTrashTasks.push(task)
                }
            })
        }

        // Background delete expired
        if (expiredTaskIds.length > 0) {
            console.log('Cleaning up expired trash tasks:', expiredTaskIds)
            supabase.from('tasks').delete().in('id', expiredTaskIds).then(({ error }) => {
                if (error) console.error('Failed to cleanup trash:', error)
            })
        }

        set({
            tasks: (activeData as Task[]) || [],
            trashTasks: validTrashTasks,
            loading: false
        })
    },

    addTask: async (title, sector) => {
        const tempId = Math.random().toString()
        const currentUser = (await supabase.auth.getUser()).data.user?.id

        if (!currentUser) throw new Error('User not authenticated')

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
                sector,
                user_id: currentUser,
                status: 'todo'
            }])
            .select()
            .single()

        if (error) {
            console.error('Error adding task:', error)
            set(state => ({ tasks: state.tasks.filter(t => t.id !== tempId) }))
            throw error // Propagate error to UI
        } else {
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
            set(state => ({
                tasks: state.tasks.map(t => t.id === id ? { ...t, status: currentStatus } : t)
            }))
        }
    },

    moveToTrash: async (id) => {
        const taskMoving = get().tasks.find(t => t.id === id)
        if (!taskMoving) return

        // Optimistic Move
        set(state => ({
            tasks: state.tasks.filter(t => t.id !== id),
            trashTasks: [{ ...taskMoving, status: 'trash', trash_date: new Date().toISOString() }, ...state.trashTasks]
        }))

        const { error } = await supabase
            .from('tasks')
            .update({ status: 'trash', trash_date: new Date().toISOString() })
            .eq('id', id)

        if (error) {
            console.error('Error moving to trash:', error)
            // Rollback
            set(state => ({
                tasks: [...state.tasks, taskMoving],
                trashTasks: state.trashTasks.filter(t => t.id !== id)
            }))
            throw error
        }
    },

    restoreTask: async (id) => {
        const taskRestoring = get().trashTasks.find(t => t.id === id)
        if (!taskRestoring) return

        // Optimistic Restore
        set(state => ({
            trashTasks: state.trashTasks.filter(t => t.id !== id),
            tasks: [{ ...taskRestoring, status: 'todo', trash_date: undefined }, ...state.tasks]
        }))

        const { error } = await supabase
            .from('tasks')
            .update({ status: 'todo', trash_date: null })
            .eq('id', id)

        if (error) {
            console.error('Error restoring task:', error)
            // Rollback
            set(state => ({
                trashTasks: [...state.trashTasks, taskRestoring],
                tasks: state.tasks.filter(t => t.id !== id)
            }))
        }
    },

    permanentlyDeleteTask: async (id) => {
        const previousTrash = get().trashTasks
        set(state => ({ trashTasks: state.trashTasks.filter(t => t.id !== id) }))

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error permanently deleting task:', error)
            set({ trashTasks: previousTrash })
        }
    }
}))
