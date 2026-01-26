import { useState, useMemo } from 'react'
import { Plus, Move, SortAsc, Clock, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Sector } from '../../store/types'
import { SectorItem } from './SectorItem'
import { ICONS, COLORS } from '../../constants/icons.tsx'

interface SectorsTabProps {
    sectors: Sector[]
    addSector: (sector: Sector) => void
    updateSector: (id: string, updates: Partial<Sector>) => void
    removeSector: (id: string) => void
    reorderSectors: (newSectors: Sector[]) => void
    sortBy: 'manual' | 'alpha' | 'created'
    setSortBy: (sort: 'manual' | 'alpha' | 'created') => void
    addToast: (message: string, type: 'success' | 'error' | 'info') => void
    initialOpenCreation?: boolean
}

export function SectorsTab({
    sectors,
    addSector,
    updateSector,
    removeSector,
    reorderSectors,
    sortBy,
    setSortBy,
    addToast,
    initialOpenCreation = false
}: SectorsTabProps) {
    const [isSectorFormOpen, setIsSectorFormOpen] = useState(initialOpenCreation)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [sectorName, setSectorName] = useState('')
    const [sectorColor, setSectorColor] = useState<Sector['color']>('blue')
    const [sectorIcon, setSectorIcon] = useState('tag')
    const [showAllColors, setShowAllColors] = useState(false)
    const [showAllIcons, setShowAllIcons] = useState(false)

    const displaySectors = useMemo(() => {
        const list = [...sectors]
        if (sortBy === 'alpha') return list.sort((a, b) => a.label.localeCompare(b.label))
        if (sortBy === 'created') return list.sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()))
        return list
    }, [sectors, sortBy])

    const resetForm = () => {
        setEditingId(null)
        setSectorName('')
        setSectorColor('blue')
        setSectorIcon('tag')
        setIsSectorFormOpen(false)
    }

    const handleSaveSector = (e: React.FormEvent) => {
        e.preventDefault()
        if (!sectorName.trim()) return

        if (editingId) {
            updateSector(editingId, {
                label: sectorName,
                color: sectorColor,
                icon: sectorIcon
            })
            addToast(`Etiqueta "${sectorName}" atualizada!`, 'success')
        } else {
            const newId = sectorName.toLowerCase().replace(/\s+/g, '-')
            if (sectors.some(s => s.id === newId)) {
                addToast('Já existe uma etiqueta com este nome.', 'error')
                return
            }

            addSector({
                id: newId,
                label: sectorName,
                color: sectorColor,
                icon: sectorIcon
            })
            addToast(`Etiqueta "${sectorName}" criada!`, 'success')
        }
        resetForm()
    }

    const handleEditClick = (sector: Sector) => {
        setEditingId(sector.id)
        setSectorName(sector.label)
        setSectorColor(sector.color)
        setSectorIcon(sector.icon)
        setIsSectorFormOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-on-surface">Minhas Etiquetas</h3>
                <button
                    type="button"
                    onClick={() => { resetForm(); setIsSectorFormOpen(true); }}
                    className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold hover:bg-primary/20 transition-all flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" strokeWidth={3} />
                    NOVA ETIQUETA
                </button>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 p-1 bg-surface-variant/30 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setSortBy('manual')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${sortBy === 'manual' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
                    >
                        <Move className="w-3.5 h-3.5" />
                        MINHA ORDEM
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortBy('alpha')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${sortBy === 'alpha' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
                    >
                        <SortAsc className="w-3.5 h-3.5" />
                        A-Z
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortBy('created')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${sortBy === 'created' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        CRIAÇÃO
                    </button>
                </div>

                <Reorder.Group
                    axis="y"
                    values={displaySectors}
                    onReorder={(newOrder) => {
                        if (sortBy === 'manual') reorderSectors(newOrder)
                    }}
                    className="space-y-1"
                >
                    <AnimatePresence mode="popLayout">
                        {displaySectors.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-10 border-2 border-dashed border-outline-variant/30 rounded-[20px]"
                            >
                                <p className="text-sm text-on-surface-variant font-medium">Nenhuma etiqueta criada.</p>
                                <button
                                    onClick={() => setIsSectorFormOpen(true)}
                                    className="text-primary text-xs font-bold mt-2 hover:underline"
                                >
                                    Começar agora
                                </button>
                            </motion.div>
                        ) : (
                            displaySectors.map(sector => (
                                <SectorItem
                                    key={sector.id}
                                    sector={sector}
                                    sortBy={sortBy}
                                    editingId={editingId}
                                    onEdit={handleEditClick}
                                    onRemove={(id, label) => {
                                        if (confirm(`Excluir a etiqueta "${label}"?`)) {
                                            removeSector(id)
                                        }
                                    }}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </Reorder.Group>
            </div>

            {/* Sector Form Popup Overlay */}
            <AnimatePresence>
                {isSectorFormOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={resetForm}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-surface rounded-[24px] shadow-5 border border-outline-variant overflow-hidden"
                        >
                            <form onSubmit={handleSaveSector} className="p-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-on-surface">
                                        {editingId ? 'Editar Etiqueta' : 'Nova Etiqueta'}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Nome da Etiqueta</label>
                                        <input
                                            type="text"
                                            autoFocus
                                            value={sectorName}
                                            onChange={(e) => setSectorName(e.target.value)}
                                            placeholder="Ex: Trabalho, Compras..."
                                            className="w-full input-field !bg-surface-variant/50 border border-outline-variant rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>

                                    {/* Colors */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cor do Marcador</label>
                                            <button
                                                type="button"
                                                onClick={() => setShowAllColors(!showAllColors)}
                                                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                                            >
                                                {showAllColors ? 'Ver menos' : 'Ver todas'}
                                                {showAllColors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-10 gap-2">
                                            {COLORS.slice(0, showAllColors ? undefined : 10).map(c => (
                                                <button
                                                    key={c.value}
                                                    type="button"
                                                    onClick={() => setSectorColor(c.value)}
                                                    className={`w-full aspect-square rounded-full transition-all flex items-center justify-center border-2 border-transparent hover:border-outline-variant/50 ${sectorColor === c.value ? 'ring-2 ring-offset-2 ring-primary shadow-sm scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'} ${c.value === 'white' ? '!border-outline-variant' : ''}`}
                                                    style={{ backgroundColor: c.hex }}
                                                >
                                                    {sectorColor === c.value && <Check className={`w-3 h-3 drop-shadow-md ${c.value === 'white' ? 'text-black' : 'text-white'}`} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Icons */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ícone</label>
                                            <button
                                                type="button"
                                                onClick={() => setShowAllIcons(!showAllIcons)}
                                                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                                            >
                                                {showAllIcons ? 'Ver menos' : 'Ver todos'}
                                                {showAllIcons ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-8 gap-2">
                                            {ICONS.slice(0, showAllIcons ? undefined : 8).map(i => (
                                                <button
                                                    key={i.value}
                                                    type="button"
                                                    onClick={() => setSectorIcon(i.value)}
                                                    className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${sectorIcon === i.value
                                                        ? 'bg-secondary-container text-on-secondary-container shadow-sm ring-1 ring-secondary'
                                                        : 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                                                        }`}
                                                >
                                                    <i.icon className="w-4 h-4" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={!sectorName}
                                        className="w-full py-4 bg-primary text-on-primary rounded-[16px] font-bold shadow-2 hover:shadow-3 active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        {editingId ? 'Salvar Edição' : 'Criar Etiqueta'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
