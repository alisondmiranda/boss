import { Reorder, useDragControls, AnimatePresence, motion } from 'framer-motion'
import { Check, X, GripVertical, ChevronRight } from 'lucide-react'
import { Subtask } from '../../store/taskStore'

interface SubtaskItemProps {
    subtask: Subtask
    isExpanded: boolean
    onToggleExpand: (id: string) => void
    onToggleComplete: (id: string) => void
    isEditing: boolean
    editTitle: string
    setEditTitle: (val: string) => void
    onSaveEdit: () => void
    onStartEdit: (id: string, title: string) => void
    onDelete: (id: string) => void
    details: string
    onSaveDetails: (id: string, val: string) => void
}

function SubtaskItem({
    subtask,
    isExpanded,
    onToggleExpand,
    onToggleComplete,
    isEditing,
    editTitle,
    setEditTitle,
    onSaveEdit,
    onStartEdit,
    onDelete,
    details,
    onSaveDetails
}: SubtaskItemProps) {
    const dragControls = useDragControls()

    return (
        <Reorder.Item
            value={subtask}
            dragListener={false}
            dragControls={dragControls}
            whileDrag={{
                scale: 1.02,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                zIndex: 50
            }}
            transition={{ type: "spring", stiffness: 600, damping: 40 }}
            className="group/subtask bg-surface rounded-md relative select-none"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center gap-2 text-[13px] py-0.5">
                {/* Handle */}
                <div
                    onPointerDown={(e) => dragControls.start(e)}
                    className="p-1 -ml-1 cursor-grab active:cursor-grabbing hover:bg-surface-variant/50 rounded transition-colors opacity-0 group-hover/subtask:opacity-100"
                >
                    <GripVertical className="w-3.5 h-3.5 text-on-surface-variant/40" />
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleExpand(subtask.id)
                    }}
                    className={`p-0.5 rounded transition-all ${isExpanded ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
                    title="Detalhes da subtarefa"
                >
                    <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleComplete(subtask.id)
                    }}
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${subtask.completed ? 'bg-primary border-primary text-on-primary' : 'border-outline/40 hover:border-primary'}`}
                >
                    {subtask.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </button>

                {isEditing ? (
                    <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={onSaveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
                        className="flex-1 bg-transparent border-none text-sm text-on-surface focus:outline-none py-1"
                    />
                ) : (
                    <span
                        onClick={(e) => {
                            e.stopPropagation()
                            onStartEdit(subtask.id, subtask.title)
                        }}
                        className={`flex-1 cursor-text ${subtask.completed ? 'text-on-surface-variant/50 line-through' : 'text-on-surface hover:text-primary transition-colors'}`}
                    >
                        {subtask.title}
                    </span>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(subtask.id)
                    }}
                    className="opacity-0 group-hover/subtask:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="overflow-hidden"
                    >
                        <div className="ml-[1.6rem] mr-[1.6rem] mb-2">
                            <textarea
                                value={details || ''}
                                onChange={(e) => onSaveDetails(subtask.id, e.target.value)}
                                placeholder="Adicionar detalhes..."
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-surface-variant/15 rounded-md p-2 text-[11px] text-on-surface placeholder:text-on-surface-variant/40 resize-none border border-transparent focus:border-primary/20 focus:outline-none transition-all min-h-[50px]"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    )
}

interface SubtaskListProps {
    subtasks: Subtask[]
    onReorder: (newOrder: Subtask[]) => void
    // Props for SubtaskItem
    expandedDetails: Set<string>
    onToggleDetails: (id: string) => void
    onToggleComplete: (id: string) => void
    editingId: string | null
    editTitle: string
    setEditTitle: (val: string) => void
    onSaveEdit: () => void
    onStartEdit: (id: string, title: string) => void
    onDelete: (id: string) => void
    detailsMap: Record<string, string>
    onSaveDetails: (id: string, val: string) => void
}

export function SubtaskList({
    subtasks, onReorder,
    expandedDetails, onToggleDetails, onToggleComplete,
    editingId, editTitle, setEditTitle, onSaveEdit, onStartEdit, onDelete,
    detailsMap, onSaveDetails
}: SubtaskListProps) {
    return (
        <Reorder.Group
            axis="y"
            values={subtasks}
            onReorder={onReorder}
            className="space-y-1"
        >
            {subtasks.map(subtask => (
                <SubtaskItem
                    key={subtask.id}
                    subtask={subtask}
                    isExpanded={expandedDetails.has(subtask.id)}
                    onToggleExpand={onToggleDetails}
                    onToggleComplete={onToggleComplete}
                    isEditing={editingId === subtask.id}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onSaveEdit={onSaveEdit}
                    onStartEdit={onStartEdit}
                    onDelete={onDelete}
                    details={detailsMap[subtask.id]}
                    onSaveDetails={onSaveDetails}
                />
            ))}
        </Reorder.Group>
    )
}
