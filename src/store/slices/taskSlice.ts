import { StateCreator } from 'zustand'
import { supabase } from '../../lib/supabase'
import { TaskState, Task, Subtask } from '../types'

export interface TaskSlice {
    tasks: Task[]
    trashTasks: Task[]

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

    subscribeToTasks: () => () => void
}

export const createTaskSlice: StateCreator<TaskState, [], [], TaskSlice> = (set, get) => ({
    tasks: [],
    trashTasks: [],

    fetchTasks: async (isBackgroundUpdate = false) => {
        const { isSyncing, syncingIds } = get()

        // CRITICAL FIX #1: Se estamos sincronizando (drag em andamento), 
        // ignorar COMPLETAMENTE atualizações de background para evitar race conditions
        if (isBackgroundUpdate && (isSyncing || syncingIds.size > 0)) {
            return // Ignora silenciosamente - a ordem local está correta
        }

        if (!isBackgroundUpdate) set({ loading: true })
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
                        status: s.status || (s.completed ? 'done' : 'todo'),
                        completed: s.status === 'done' || !!s.completed
                    }))
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            }))

            const fetchedTasks = tasksData.filter((t: any) => !t.trash_date)
            const trashTasks = tasksData.filter((t: any) => t.trash_date)

            const { tasks: currentTasks, pendingSectorUpdates } = get()

            // CRITICAL FIX #2: Preservar ORDEM local quando há syncingIds
            // Isso evita que o servidor sobrescreva a posição do item arrastado
            const currentSyncingIds = get().syncingIds
            if (currentSyncingIds.size > 0) {
                // Manter ordem local, apenas atualizar conteúdo de tarefas não-sincronizando
                const serverTasksMap = new Map(fetchedTasks.map((t: any) => [t.id, t]))
                const serverIds = new Set(fetchedTasks.map((t: any) => t.id))

                // Filtrar tarefas locais que ainda existem no servidor
                const mergedTasks = currentTasks
                    .filter(t => serverIds.has(t.id))
                    .map(localTask => {
                        if (currentSyncingIds.has(localTask.id)) {
                            // Tarefa sincronizando: preservar estado local completo
                            return localTask
                        }
                        // Tarefa normal: usar dados do servidor mas manter ordem local
                        const serverTask = serverTasksMap.get(localTask.id)
                        return {
                            ...serverTask,
                            order: localTask.order, // Preservar ordem local
                            sector: pendingSectorUpdates[localTask.id] || serverTask?.sector
                        }
                    })

                // Adicionar novas tarefas do servidor ao final
                const localIds = new Set(currentTasks.map(t => t.id))
                const newTasks = fetchedTasks
                    .filter((t: any) => !localIds.has(t.id))
                    .map((t: any) => ({
                        ...t,
                        sector: pendingSectorUpdates[t.id] || t.sector
                    }))

                set({ tasks: [...mergedTasks, ...newTasks], trashTasks, loading: false })
                return
            }

            // Caminho normal: nenhuma sync em andamento, usar dados do servidor
            const mergedTasks = fetchedTasks.map((t: any) => ({
                ...t,
                sector: pendingSectorUpdates[t.id] || t.sector
            }))

            set({ tasks: mergedTasks, trashTasks, loading: false })
        } catch (error) {
            console.error('Error fetching tasks:', error)
            set({ loading: false })
        }
    },

    addTask: async (title, sectors = [], dueAt = null, recurrence = null, details = null, subtasksInput = [], columnId = null) => {
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
                    status: 'todo',
                    sector: Array.isArray(finalSectors) ? finalSectors : (finalSectors ? [finalSectors] : ['personal']),
                    user_id: user.id,
                    due_at: dueAt instanceof Date ? dueAt.toISOString() : dueAt,
                    recurrence_id: recurrence?.id || null,
                    details,
                    order: maxOrder + 1,
                    column_id: columnId
                }])
                .select()
                .single()

            if (taskError) throw taskError

            let createdSubtasks: Subtask[] = []
            if (subtasksInput.length > 0 && taskData) {
                const subtasksToInsert = subtasksInput.map((s: any, idx: number) => ({
                    title: s.title,
                    status: s.status || (s.completed ? 'done' : 'todo'),
                    task_id: taskData.id,
                    order: idx,
                    details: s.details
                }))

                const { data: insertedSubtasks } = await supabase
                    .from('subtasks')
                    .insert(subtasksToInsert)
                    .select()

                if (insertedSubtasks) {
                    createdSubtasks = insertedSubtasks.map((s: any) => ({
                        ...s,
                        status: s.status || (s.completed ? 'done' : 'todo'),
                        completed: s.status === 'done' || !!s.completed
                    }))
                }
            }

            // Manually update local state to ensure UI reflects creation immediately
            const newTask: Task = {
                ...taskData,
                subtasks: createdSubtasks,
                // Ensure sector match format expected by UI if needed, but string is also handled by some comps
                // However, taskStore often normalizes. 
                // Let's keep it as is from DB (string) or formatted.
                // Dashboard.tsx handles string sector. 
            }

            set(state => ({
                tasks: [...state.tasks, newTask]
            }))

            await get().fetchTasks()
        } catch (error) {
            console.error('Error adding task:', error)
            throw error // Re-throw to allow component to handle fallback if needed
        }
    },

    updateTask: async (id, updates) => {
        const { syncingIds, tasks, trashTasks } = get()
        syncingIds.add(id)
        set({ syncingIds: new Set(syncingIds) })

        const cleanUpdates = { ...updates }
        // Removed manual array-to-string conversion for sector since DB expects array
        // if (Array.isArray(cleanUpdates.sector)) {
        //    cleanUpdates.sector = cleanUpdates.sector.join(',')
        // }

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
            // Removed manual array-to-string conversion for sector since DB expects array
            // if (Array.isArray(cleanUpdates.sector)) {
            //    cleanUpdates.sector = cleanUpdates.sector.join(',')
            // }

            const { error: taskError } = await supabase
                .from('tasks')
                .update(cleanUpdates)
                .eq('id', id)

            if (taskError) throw taskError

            for (const s of subtasksInput) {
                const subStatus = s.status || (s.completed ? 'done' : 'todo')
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
        const newStatus = currentStatus === 'todo' ? 'done' : 'todo'
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

        // Identify "Geral" ID
        const geralSector = allSectors.find(s => s.label.toLowerCase() === 'geral' || s.label.toLowerCase() === 'general')
        const geralId = geralSector?.id || 'geral'

        let newSectors: string[]

        if (sectorId === geralId) {
            // Selecting Geral clears everything else
            newSectors = [geralId]
        } else {
            // Selecting something else
            if (currentSectors.includes(sectorId)) {
                // Remove it
                newSectors = currentSectors.filter((s: string) => s !== sectorId)
            } else {
                // Add it and remove Geral if present
                newSectors = [...currentSectors.filter((s: string) => s !== geralId), sectorId]
            }
        }

        // If empty, add Geral back
        if (newSectors.length === 0) {
            newSectors = [geralId]
        }

        const sectorOrder = allSectors.map(s => s.id)
        newSectors.sort((a, b) => {
            const indexA = sectorOrder.indexOf(a)
            const indexB = sectorOrder.indexOf(b)
            if (indexA === -1 && indexB === -1) return 0
            if (indexA === -1) return 1
            if (indexB === -1) return -1
            return indexA - indexB
        })

        await get().updateTaskSector(taskId, newSectors)
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
        const { tasks, syncingIds } = get()

        // Mark as syncing
        const reorderingIds = newTasks.map(t => t.id)
        reorderingIds.forEach(id => syncingIds.add(id))
        set({ syncingIds: new Set(syncingIds), isSyncing: true })

        // Update order for reordered tasks
        const reorderedWithOrder = newTasks.map((t, idx) => ({ ...t, order: idx }))

        // Keep other tasks (done, filtered out, etc) with updated orders
        const reorderedIds = new Set(newTasks.map(t => t.id))
        const otherTasks = tasks.filter(t => !reorderedIds.has(t.id))
        const otherWithOrder = otherTasks.map((t, idx) => ({ ...t, order: newTasks.length + idx }))

        const mergedTasks = [...reorderedWithOrder, ...otherWithOrder]
        set({ tasks: mergedTasks })

        // Persist to database - update each task's order
        try {
            const updatePromises = newTasks.map((task, index) =>
                supabase.from('tasks').update({ order: index }).eq('id', task.id)
            )
            await Promise.all(updatePromises)
        } catch (error) {
            console.error('Error reordering tasks:', error)
            await get().fetchTasks()
        } finally {
            setTimeout(() => {
                const { syncingIds } = get()
                reorderingIds.forEach(id => syncingIds.delete(id))
                set({ syncingIds: new Set(syncingIds), isSyncing: false })
            }, 2000)
        }
    },

    subscribeToTasks: () => {
        let debounceTimer: NodeJS.Timeout

        const channel = supabase
            .channel('tasks-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => {
                    clearTimeout(debounceTimer)
                    debounceTimer = setTimeout(() => {
                        get().fetchTasks(true)
                    }, 500)
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'subtasks' },
                () => {
                    clearTimeout(debounceTimer)
                    debounceTimer = setTimeout(() => {
                        get().fetchTasks(true)
                    }, 500)
                }
            )
            .subscribe()

        return () => {
            clearTimeout(debounceTimer)
            supabase.removeChannel(channel)
        }
    }
})
