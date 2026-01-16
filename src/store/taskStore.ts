import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { addDays, addWeeks, addMonths, addYears } from 'date-fns'

export interface RecurrenceInput {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    week_days?: number[]
    ends_on?: Date | null
}

export interface Recurrence {
    id: string
    user_id: string
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    week_days?: number[]
    ends_on?: string
    created_at: string
}

export interface Subtask {
    id: string
    task_id: string
    title: string
    completed: boolean
    order: number
    created_at: string
}

export interface Task {
    id: string
    title: string
    status: 'todo' | 'doing' | 'done' | 'trash'
    sector: string | string[]
    user_id: string
    created_at: string
    trash_date?: string
    due_at?: string | null
    recurrence_id?: string | null
    details?: string | null
    subtasks?: Subtask[]
}

interface TaskState {
    tasks: Task[]
    trashTasks: Task[]
    loading: boolean
    filter: string[]
    setFilter: (sectors: string[]) => void
    fetchTasks: () => Promise<void>
    addTask: (title: string, sector: string | string[], dueAt?: Date | null, recurrence?: RecurrenceInput | null, details?: string | null, subtasks?: Omit<Subtask, 'id' | 'task_id' | 'created_at'>[]) => Promise<void>
    updateTaskSector: (id: string, newSector: string | string[]) => Promise<void>
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>
    updateTaskWithSubtasks: (id: string, updates: Partial<Task>, newSubtasks: Omit<Subtask, 'id' | 'task_id' | 'created_at'>[]) => Promise<void>
    toggleTask: (id: string, currentStatus: Task['status']) => Promise<void>
    moveToTrash: (id: string) => Promise<void>
    restoreTask: (id: string) => Promise<void>
    permanentlyDeleteTask: (id: string) => Promise<void>
    clearDoneTasks: () => Promise<void>
    emptyTrash: () => Promise<void>
    subscribeToTasks: () => () => void
    // Subtask methods
    addSubtask: (taskId: string, title: string) => Promise<void>
    toggleSubtask: (subtaskId: string) => Promise<void>
    deleteSubtask: (subtaskId: string) => Promise<void>
    updateSubtask: (subtaskId: string, title: string) => Promise<void>
    updateSubtaskOrder: (taskId: string, subtaskIds: string[]) => Promise<void>
    toggleTaskSector: (taskId: string, sectorId: string, allSectors: { id: string; label: string }[]) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    trashTasks: [],
    loading: false,
    filter: [],

    setFilter: (sectors) => set({ filter: sectors }),

    fetchTasks: async () => {
        set({ loading: true })

        // Fetch active tasks with subtasks
        const { data: activeData, error: activeError } = await supabase
            .from('tasks')
            .select(`
                *,
                subtasks (*)
            `)
            .neq('status', 'trash')
            .order('created_at', { ascending: false })

        // Fetch trash tasks with subtasks
        const { data: trashData, error: trashError } = await supabase
            .from('tasks')
            .select(`
                *,
                subtasks (*)
            `)
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

    addTask: async (title, sector, dueAt, recurrence, details, subtasks) => {
        const tempId = Math.random().toString()
        const user = (await supabase.auth.getUser()).data.user
        if (!user) throw new Error('User not authenticated')
        const currentUser = user.id

        // 1. Handle Recurrence Creation
        let recurrenceId: string | null = null
        if (recurrence) {
            const { data: recData, error: recError } = await supabase
                .from('recurrences')
                .insert([{
                    user_id: currentUser,
                    frequency: recurrence.frequency,
                    interval: recurrence.interval,
                    week_days: recurrence.week_days,
                    ends_on: recurrence.ends_on ? recurrence.ends_on.toISOString() : null
                }])
                .select()
                .single()

            if (recError) {
                console.error('Error creating recurrence:', recError)
            } else {
                recurrenceId = recData.id
            }
        }

        const newTask: Task = {
            id: tempId,
            title,
            sector,
            status: 'todo',
            user_id: currentUser,
            created_at: new Date().toISOString(),
            due_at: dueAt ? dueAt.toISOString() : null,
            recurrence_id: recurrenceId,
            details: details || null,
            subtasks: []
        }

        set(state => ({ tasks: [newTask, ...state.tasks] }))

        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                title,
                sector,
                user_id: currentUser,
                status: 'todo',
                due_at: dueAt ? dueAt.toISOString() : null,
                recurrence_id: recurrenceId,
                details: details || null
            }])
            .select()
            .single()

        if (error) {
            console.error('Error adding task:', error)
            set(state => ({ tasks: state.tasks.filter(t => t.id !== tempId) }))
            throw error
        } else {
            // 2. Create subtasks if provided
            if (subtasks && subtasks.length > 0 && data) {
                const subtasksToInsert = subtasks.map((st, index) => ({
                    task_id: data.id,
                    title: st.title,
                    completed: st.completed,
                    order: index
                }))

                const { data: subtasksData, error: subtasksError } = await supabase
                    .from('subtasks')
                    .insert(subtasksToInsert)
                    .select()

                if (subtasksError) {
                    console.error('Error creating subtasks:', subtasksError)
                } else {
                    data.subtasks = subtasksData
                }
            }

            set(state => ({
                tasks: state.tasks.map(t => t.id === tempId ? data : t)
            }))
        }
    },

    updateTaskSector: async (id, newSector) => {
        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, sector: newSector } : t)
        }))

        const { error } = await supabase
            .from('tasks')
            .update({ sector: newSector })
            .eq('id', id)

        if (error) {
            console.error('Error updating task sector:', error)
        }
    },

    toggleTaskSector: async (taskId, sectorId, allSectors) => {
        const task = get().tasks.find(t => t.id === taskId)
        if (!task) return

        const selectedSector = allSectors.find(s => s.id === sectorId)
        const isSelectingGeral = selectedSector?.label.toLowerCase() === 'geral' || selectedSector?.label.toLowerCase() === 'general'

        let currentSectors = Array.isArray(task.sector) ? [...task.sector] : [task.sector]

        if (isSelectingGeral) {
            // Selecting Geral clears all others
            currentSectors = [sectorId]
        } else if (currentSectors.includes(sectorId)) {
            // Deselecting a sector
            currentSectors = currentSectors.filter(s => s !== sectorId)
            // If empty, revert to Geral
            if (currentSectors.length === 0) {
                const geral = allSectors.find(s => s.label.toLowerCase() === 'geral' || s.label.toLowerCase() === 'general')
                currentSectors = geral ? [geral.id] : ['geral']
            }
        } else {
            // Adding new sector - remove Geral if present
            currentSectors = currentSectors.filter(id => {
                const sec = allSectors.find(s => s.id === id)
                return sec && sec.label.toLowerCase() !== 'geral' && sec.label.toLowerCase() !== 'general'
            })
            currentSectors = [...currentSectors, sectorId]
        }

        // Optimistic Update
        set(state => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, sector: currentSectors } : t)
        }))

        // Server Update
        const { error } = await supabase
            .from('tasks')
            .update({ sector: currentSectors })
            .eq('id', taskId)

        if (error) {
            console.error('Error toggling task sector:', error)
            // Revert on error (could use previous state if stored, but fetchTasks is safer for sync)
            get().fetchTasks()
        }
    },

    updateTask: async (id, updates) => {
        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
        }))

        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)

        if (error) {
            console.error('Error updating task:', error)
        }
    },

    updateTaskWithSubtasks: async (id, updates, newSubtasks) => {
        // 1. Update Task Details
        await get().updateTask(id, updates)

        // 2. Replace Subtasks
        const { error: delError } = await supabase
            .from('subtasks')
            .delete()
            .eq('task_id', id)

        if (delError) {
            console.error('Error deleting old subtasks:', delError)
            return
        }

        if (newSubtasks.length > 0) {
            const toInsert = newSubtasks.map((st, index) => ({
                task_id: id,
                title: st.title,
                completed: st.completed || false,
                order: index
            }))

            const { error: insError } = await supabase
                .from('subtasks')
                .insert(toInsert)

            if (insError) console.error('Error inserting new subtasks:', insError)
        }

        // 3. Refresh to get fresh state (IDs etc)
        await get().fetchTasks()
    },

    toggleTask: async (id, currentStatus) => {
        const tasks = get().tasks
        const task = tasks.find(t => t.id === id)
        if (!task) return

        const newStatus = currentStatus === 'todo' ? 'done' : 'todo'
        const previousStatus = task.status

        // Optimistic Update for current task
        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, status: newStatus } : t)
        }))

        // Handle Recurrence if marking as DONE
        if (newStatus === 'done' && task.recurrence_id && task.status !== 'done') {
            try {
                // Fetch recurrence rule
                const { data: rule, error: ruleError } = await supabase
                    .from('recurrences')
                    .select('*')
                    .eq('id', task.recurrence_id)
                    .single()

                if (rule && !ruleError) {
                    // Calculate next date
                    const currentDue = task.due_at ? new Date(task.due_at) : new Date()
                    // If no due date, base it on completion (now)

                    let nextDate: Date = new Date(currentDue)
                    const interval = rule.interval || 1

                    switch (rule.frequency) {
                        case 'daily': nextDate = addDays(currentDue, interval); break;
                        case 'weekly': nextDate = addWeeks(currentDue, interval); break;
                        case 'monthly': nextDate = addMonths(currentDue, interval); break;
                        case 'yearly': nextDate = addYears(currentDue, interval); break;
                    }

                    // Check ends_on
                    const endsOn = rule.ends_on ? new Date(rule.ends_on) : null
                    if (!endsOn || nextDate <= endsOn) {
                        // Create Next Task
                        const tempId = Math.random().toString()
                        const nextTask: Task = {
                            ...task,
                            id: tempId,
                            status: 'todo',
                            due_at: nextDate.toISOString(),
                            created_at: new Date().toISOString()
                        }

                        // Optimistic Add
                        set(state => ({ tasks: [nextTask, ...state.tasks] }))

                        // DB Insert
                        await supabase.from('tasks').insert([{
                            title: task.title,
                            sector: task.sector,
                            user_id: task.user_id,
                            status: 'todo',
                            due_at: nextDate.toISOString(),
                            recurrence_id: task.recurrence_id
                        }])
                    }
                }
            } catch (err) {
                console.error('Error processing recurrence:', err)
            }
        }

        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) {
            console.error('Error toggling task:', error)
            set(state => ({
                tasks: state.tasks.map(t => t.id === id ? { ...t, status: previousStatus } : t)
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
    },

    clearDoneTasks: async () => {
        const doneTasks = get().tasks.filter(t => t.status === 'done')
        if (doneTasks.length === 0) return

        const doneTaskIds = doneTasks.map(t => t.id)
        const now = new Date().toISOString()

        // Move active 'done' tasks to trashTasks
        set(state => ({
            tasks: state.tasks.filter(t => t.status !== 'done'),
            trashTasks: [
                ...doneTasks.map(t => ({ ...t, status: 'trash' as const, trash_date: now })),
                ...state.trashTasks
            ]
        }))

        // Batch update in Supabase
        const { error } = await supabase
            .from('tasks')
            .update({ status: 'trash', trash_date: now })
            .in('id', doneTaskIds)

        if (error) {
            console.error('Error clearing done tasks:', error)
            // Revert is complex here, generally rely on refetch if major fail, or just log.
            // For simplicity in this codebase, we log.
            get().fetchTasks()
        }
    },

    emptyTrash: async () => {
        const trashIds = get().trashTasks.map(t => t.id)
        if (trashIds.length === 0) return

        set({ trashTasks: [] })

        const { error } = await supabase
            .from('tasks')
            .delete()
            .in('id', trashIds)

        if (error) {
            console.error('Error emptying trash:', error)
            get().fetchTasks()
        }
    },

    subscribeToTasks: () => {
        const channel = supabase
            .channel('tasks-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks'
                },
                () => {
                    // Refetch all to maintain sorting and trash separation correctly
                    get().fetchTasks()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    },

    // Subtask methods
    addSubtask: async (taskId, title) => {
        const task = get().tasks.find(t => t.id === taskId)
        if (!task) return

        const nextOrder = (task.subtasks?.length || 0)

        const { data, error } = await supabase
            .from('subtasks')
            .insert([{
                task_id: taskId,
                title,
                completed: false,
                order: nextOrder
            }])
            .select()
            .single()

        if (error) {
            console.error('Error adding subtask:', error)
        } else {
            set(state => ({
                tasks: state.tasks.map(t =>
                    t.id === taskId
                        ? { ...t, subtasks: [...(t.subtasks || []), data] }
                        : t
                )
            }))
        }
    },

    toggleSubtask: async (subtaskId) => {
        const task = get().tasks.find(t => t.subtasks?.some(st => st.id === subtaskId))
        if (!task) return

        const subtask = task.subtasks?.find(st => st.id === subtaskId)
        if (!subtask) return

        const newCompleted = !subtask.completed

        const { error } = await supabase
            .from('subtasks')
            .update({ completed: newCompleted })
            .eq('id', subtaskId)

        if (error) {
            console.error('Error toggling subtask:', error)
        } else {
            set(state => ({
                tasks: state.tasks.map(t =>
                    t.id === task.id
                        ? {
                            ...t,
                            subtasks: t.subtasks?.map(st =>
                                st.id === subtaskId ? { ...st, completed: newCompleted } : st
                            )
                        }
                        : t
                )
            }))
        }
    },

    deleteSubtask: async (subtaskId) => {
        const task = get().tasks.find(t => t.subtasks?.some(st => st.id === subtaskId))
        if (!task) return

        const { error } = await supabase
            .from('subtasks')
            .delete()
            .eq('id', subtaskId)

        if (error) {
            console.error('Error deleting subtask:', error)
        } else {
            set(state => ({
                tasks: state.tasks.map(t =>
                    t.id === task.id
                        ? { ...t, subtasks: t.subtasks?.filter(st => st.id !== subtaskId) }
                        : t
                )
            }))
        }
    },

    updateSubtask: async (subtaskId, title) => {
        const task = get().tasks.find(t => t.subtasks?.some(st => st.id === subtaskId))
        if (!task) return

        const { error } = await supabase
            .from('subtasks')
            .update({ title })
            .eq('id', subtaskId)

        if (error) {
            console.error('Error updating subtask:', error)
        } else {
            set(state => ({
                tasks: state.tasks.map(t =>
                    t.id === task.id
                        ? {
                            ...t,
                            subtasks: t.subtasks?.map(st =>
                                st.id === subtaskId ? { ...st, title } : st
                            )
                        }
                        : t
                )
            }))
        }
    },

    updateSubtaskOrder: async (_taskId, subtaskIds) => {
        const updates = subtaskIds.map((id, index) => ({
            id,
            order: index
        }))

        for (const update of updates) {
            await supabase
                .from('subtasks')
                .update({ order: update.order })
                .eq('id', update.id)
        }

        // Refetch to get updated order
        get().fetchTasks()
    }
}))
