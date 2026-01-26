import { useState, useCallback } from 'react'
import { useTaskStore, Task } from '../store/taskStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToast } from '../store/toastStore'
import { RecurrenceRule } from '../components/RecurrencePicker'

export function useTaskActions() {
    const {
        addTask, toggleTask, moveToTrash, restoreTask, permanentlyDeleteTask,
        updateTaskWithSubtasks, clearDoneTasks, emptyTrash
    } = useTaskStore()
    const { sectors } = useSettingsStore()
    const { addToast } = useToast()

    const [editingTask, setEditingTask] = useState<Task | null>(null)

    const handleAddTask = useCallback(async (
        title: string,
        inputSectors: string[],
        dueAt: Date | null,
        recurrence: RecurrenceRule | null,
        details: string | null,
        subtasks: any[],
        editing: Task | null = editingTask
    ) => {
        try {
            let finalSectors = inputSectors
            if (!finalSectors || finalSectors.length === 0) {
                const geral = sectors.find(s => s.label.toLowerCase() === 'geral' || s.label.toLowerCase() === 'general')
                finalSectors = geral ? [geral.id] : ['geral']
            }

            if (editing) {
                await updateTaskWithSubtasks(editing.id, {
                    title,
                    sector: finalSectors,
                    due_at: dueAt ? dueAt.toISOString() : null,
                    details,
                    recurrence_id: recurrence ? (recurrence as any).id || editing.recurrence_id : null
                }, subtasks)
                addToast('Tarefa atualizada!', 'success')
            } else {
                let finalSectorsForAdd = inputSectors
                const isGeralOnly = !finalSectorsForAdd ||
                    finalSectorsForAdd.length === 0 ||
                    (finalSectorsForAdd.length === 1 && (finalSectorsForAdd[0] === 'geral' || finalSectorsForAdd[0] === 'general'))

                if (isGeralOnly) {
                    const geral = sectors.find(s => s.label.toLowerCase() === 'geral' || s.label.toLowerCase() === 'general')
                    finalSectorsForAdd = geral ? [geral.id] : ['geral']
                }

                await addTask(title, finalSectorsForAdd, dueAt, recurrence, details, subtasks)
                addToast('Tarefa criada com sucesso!', 'success')
            }
        } catch (error) {
            console.error(error)
            addToast(`Erro ao ${(editing ? 'atualizar' : 'criar')} tarefa: ${(error as any).message || 'Tente novamente'}`, 'error')
        }
    }, [sectors, editingTask, addTask, updateTaskWithSubtasks, addToast])

    const handleMoveToTrash = useCallback(async (id: string) => {
        try {
            await moveToTrash(id)
            addToast('Tarefa movida para a lixeira.', 'info', {
                label: 'Desfazer',
                onClick: () => restoreTask(id)
            })
        } catch {
            addToast('Erro ao excluir tarefa.', 'error')
        }
    }, [moveToTrash, restoreTask, addToast])

    const handleRestore = useCallback(async (id: string) => {
        await restoreTask(id)
        addToast('Tarefa restaurada!', 'success')
    }, [restoreTask, addToast])

    const handlePermanentDelete = useCallback(async (id: string) => {
        if (confirm('Tem certeza? Essa ação não pode ser desfeita.')) {
            await permanentlyDeleteTask(id)
            addToast('Tarefa excluída permanentemente.', 'info')
        }
    }, [permanentlyDeleteTask, addToast])

    const handleClearDone = useCallback(async (count: number) => {
        if (count === 0) return
        if (confirm(`Tem certeza que deseja mover ${count} tarefas concluídas para a lixeira?`)) {
            await clearDoneTasks()
            addToast('Tarefas movidas para a lixeira.', 'success')
        }
    }, [clearDoneTasks, addToast])

    const handleEmptyTrash = useCallback(async (count: number) => {
        if (count === 0) return
        if (confirm('Tem certeza que deseja esvaziar a lixeira? Essa ação é irreversível.')) {
            await emptyTrash()
            addToast('Lixeira esvaziada.', 'success')
        }
    }, [emptyTrash, addToast])

    const handleToggleTask = useCallback(async (id: string, currentStatus: string) => {
        const isCompleting = currentStatus !== 'done'
        await toggleTask(id, currentStatus as any)

        if (isCompleting) {
            setTimeout(() => {
                addToast('Tarefa concluída! 🎉', 'success', {
                    label: 'Desfazer',
                    onClick: () => toggleTask(id, 'done')
                })
            }, 150)
        }
    }, [toggleTask, addToast])

    return {
        editingTask,
        setEditingTask,
        handleAddTask,
        handleMoveToTrash,
        handleRestore,
        handlePermanentDelete,
        handleClearDone,
        handleEmptyTrash,
        handleToggleTask
    }
}
