import { Trash2, ListTodo, Ghost, LogOut } from 'lucide-react'
import { Task } from '../../store/taskStore'

interface TrashViewProps {
    trashTasks: Task[]
    setSidebarMode: (mode: 'nav' | 'chat' | 'trash') => void
    handleEmptyTrash: () => void
    handleRestore: (id: string) => void
    handlePermanentDelete: (id: string) => void
}

export function TrashView({
    trashTasks,
    setSidebarMode,
    handleEmptyTrash,
    handleRestore,
    handlePermanentDelete
}: TrashViewProps) {
    const trashTasksCount = trashTasks.length

    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-8">
            <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-error/10 rounded-full text-error">
                        <Trash2 className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-on-surface">Lixeira</h2>
                    <span className="text-sm font-medium text-on-surface-variant bg-surface-variant/50 px-2 py-0.5 rounded-full">
                        {trashTasksCount}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSidebarMode('nav')}
                        className="text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <ListTodo className="w-4 h-4" />
                        Tarefas
                    </button>
                    {trashTasksCount > 0 && (
                        <button
                            onClick={handleEmptyTrash}
                            className="text-sm font-medium text-error hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors border border-error/20"
                        >
                            Esvaziar Lixeira
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {trashTasks.length === 0 ? (
                    <div className="text-center py-20 opacity-70">
                        <Ghost className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">Lixeira vazia</p>
                    </div>
                ) : (
                    trashTasks.map(t => (
                        <div key={t.id} className="bg-surface p-4 rounded-xl border border-outline-variant/50 flex items-center justify-between group hover:border-error/30 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-base text-on-surface line-through opacity-60">{t.title}</span>
                                <span className="text-xs text-on-surface-variant mt-1">
                                    Excluída em {t.trash_date && new Date(t.trash_date).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleRestore(t.id)}
                                    className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                    title="Restaurar"
                                >
                                    <LogOut className="w-4 h-4 rotate-180" />
                                </button>
                                <button
                                    onClick={() => handlePermanentDelete(t.id)}
                                    className="p-2 text-error bg-error-50 rounded-lg hover:bg-error-100 transition-colors"
                                    title="Excluir Permanentemente"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
