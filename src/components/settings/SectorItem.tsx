import { Reorder, useDragControls } from 'framer-motion'
import { GripVertical, Pencil, Trash2, Tag } from 'lucide-react'
import { Sector } from '../../store/types'
import { ICONS, COLORS } from '../../constants/icons.tsx'

interface SectorItemProps {
    sector: Sector
    sortBy: 'manual' | 'alpha' | 'created'
    editingId: string | null
    onEdit: (sector: Sector) => void
    onRemove: (id: string, label: string) => void
}

export function SectorItem({ sector, sortBy, editingId, onEdit, onRemove }: SectorItemProps) {
    const dragControls = useDragControls()
    const Icon = ICONS.find(i => i.value === sector.icon)?.icon || Tag
    const colorHex = COLORS.find(c => c.value === sector.color)?.hex || '#ccc'

    return (
        <Reorder.Item
            value={sector}
            dragListener={false}
            dragControls={dragControls}
            whileDrag={{
                scale: 1.02,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            }}
            transition={{ type: "spring", stiffness: 600, damping: 40 }}
            className={`flex items-center justify-between p-3 bg-surface border rounded-[14px] group shadow-sm ${editingId === sector.id ? 'border-primary bg-primary-container/10' : 'border-outline-variant hover:border-primary/40'} select-none relative mb-2 last:mb-0`}
        >
            <div className="flex items-center gap-3">
                {sortBy === 'manual' && (
                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        className="p-2 -ml-1 cursor-grab active:cursor-grabbing hover:bg-surface-variant/50 rounded-md transition-colors"
                    >
                        <GripVertical className="w-5 h-5 text-on-surface-variant/40 group-hover:text-on-surface-variant/80" />
                    </div>
                )}
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shadow-sm pointer-events-none ${sector.color === 'white' ? 'border border-outline-variant text-black' : 'text-white'}`} style={{ backgroundColor: colorHex }}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm text-on-surface pointer-events-none">{sector.label}</span>
            </div>

            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    onClick={() => onEdit(sector)}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/30 rounded-full transition-all"
                    title="Editar"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => onRemove(sector.id, sector.label)}
                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/10 rounded-full transition-all"
                    title="Excluir"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </Reorder.Item>
    )
}
