import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Plus, Check } from 'lucide-react'
import { useFloating, autoUpdate, offset, flip, shift, useDismiss, useInteractions, FloatingPortal } from '@floating-ui/react'
import { Sector } from '../../store/settingsStore'
import { Task } from '../../store/taskStore'
import { ICONS } from '../../constants/icons'
import { getSectorColorClass } from '../../lib/utils'

interface TaskSectorsProps {
    task: Task
    taskSectors: string[]
    sectors: Sector[]
    taskMenuOpen: string | null
    setTaskMenuOpen: (id: string | null) => void
    toggleTaskSector: (taskId: string, sectorId: string, allSectors: { id: string; label: string }[]) => Promise<void>
}

export function TaskSectors({
    task, taskSectors, sectors,
    taskMenuOpen, setTaskMenuOpen, toggleTaskSector
}: TaskSectorsProps) {
    const isSectorMenuOpen = taskMenuOpen === task.id
    const { refs: sectorMenuRefs, floatingStyles: sectorMenuStyles, context: sectorMenuContext } = useFloating({
        open: isSectorMenuOpen,
        onOpenChange: (open) => setTaskMenuOpen(open ? task.id : null),
        whileElementsMounted: autoUpdate,
        middleware: [offset(8), flip(), shift()],
        placement: 'bottom-end'
    })
    const sectorMenuDismiss = useDismiss(sectorMenuContext)
    const { getFloatingProps: getSectorMenuFloatingProps, getReferenceProps: getSectorMenuReferenceProps } = useInteractions([sectorMenuDismiss])

    const getSectorDetails = (sectorId: string) => {
        return sectors.find(s => s.id === sectorId) || { id: sectorId, label: 'Geral', color: 'slate' as const, icon: 'tag' }
    }

    const distinctSectors = (Array.isArray(task.sector) ? task.sector : (task.sector ? [task.sector] : []))
        .filter((value, index, self) => self.indexOf(value) === index)
    const isEmpty = distinctSectors.length === 0
    const allSectors = distinctSectors
        .map((sectorId: string) => ({ sectorId, sector: getSectorDetails(sectorId) }))
        .sort((a: any, b: any) => a.sector.label.localeCompare(b.sector.label, 'pt-BR'))

    // If empty -> "Add Tag" button
    if (isEmpty) {
        return (
            <>
                <div
                    ref={sectorMenuRefs.setReference}
                    {...getSectorMenuReferenceProps()}
                    className="relative"
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)
                        }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 transition-all hover:brightness-95 bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant"
                        title="Adicionar Etiqueta"
                    >
                        <Tag className="w-3 h-3 opacity-60" />
                        <span>Etiquetar</span>
                    </button>
                </div>
                <SectorMenu
                    isOpen={isSectorMenuOpen}
                    refs={sectorMenuRefs}
                    style={sectorMenuStyles}
                    getFloatingProps={getSectorMenuFloatingProps}
                    sectors={sectors}
                    taskSectors={taskSectors}
                    toggleTaskSector={toggleTaskSector}
                    task={task}
                    setTaskMenuOpen={setTaskMenuOpen}
                />
            </>
        )
    }

    // Regra: ≤3 mostra todas, ≥4 mostra 2 + badge "+N"
    const showAll = allSectors.length <= 3
    const visibleSectors = showAll ? allSectors : allSectors.slice(0, 2)
    const remainingCount = allSectors.length - 2

    return (
        <div
            ref={sectorMenuRefs.setReference}
            {...getSectorMenuReferenceProps()}
            className="hidden sm:flex items-center gap-1 mr-2 flex-nowrap overflow-hidden max-w-[150px] md:max-w-[200px] lg:max-w-[280px]"
        >
            {visibleSectors.map(({ sectorId, sector }: { sectorId: string; sector: any }) => {
                const SectorIcon = ICONS.find(i => i.value === sector.icon)?.icon || Tag
                // Limite de caracteres
                const maxChars = 12
                const displayLabel = sector.label.length > maxChars
                    ? sector.label.substring(0, maxChars) + '…'
                    : sector.label

                return (
                    <div key={`${task.id}-${sectorId}`} className="shrink-0 min-w-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)
                            }}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 transition-all hover:brightness-95 max-w-full ${getSectorColorClass(sector.color)}`}
                            title={sector.label}
                        >
                            <SectorIcon className="w-3 h-3 opacity-60 shrink-0" />
                            <span className="truncate max-w-[60px] md:max-w-[80px]">{displayLabel}</span>
                        </button>
                    </div>
                )
            })}
            {!showAll && (
                <div className="relative shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)
                        }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 transition-all hover:brightness-95 bg-surface-variant text-on-surface-variant"
                        title="Mais etiquetas..."
                    >
                        <Plus className="w-3 h-3 opacity-60" />
                        <span>{remainingCount}</span>
                    </button>
                </div>
            )}

            <SectorMenu
                isOpen={isSectorMenuOpen}
                refs={sectorMenuRefs}
                style={sectorMenuStyles}
                getFloatingProps={getSectorMenuFloatingProps}
                sectors={sectors}
                taskSectors={taskSectors}
                toggleTaskSector={toggleTaskSector}
                task={task}
                setTaskMenuOpen={setTaskMenuOpen}
            />
        </div>
    )
}

function SectorMenu({ isOpen, refs, style, getFloatingProps, sectors, taskSectors, toggleTaskSector, task, setTaskMenuOpen }: any) {
    return (
        <AnimatePresence>
            {isOpen && (
                <FloatingPortal>
                    <div
                        ref={refs.setFloating}
                        style={style}
                        {...getFloatingProps()}
                        className="z-[90]"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="w-48 bg-surface rounded-[20px] shadow-lg border border-outline-variant/50 z-50 overflow-hidden flex flex-col py-2"
                        >
                            <span className="px-4 py-2 text-[10px] uppercase font-bold text-on-surface-variant/50 tracking-wider">Mover para...</span>
                            {sectors
                                .filter((s: any) => {
                                    const isGeral = s.label.toLowerCase() === 'geral' || s.label.toLowerCase() === 'general'
                                    const hasOtherSelected = taskSectors.some((id: string) => {
                                        const sec = sectors.find((sec: any) => sec.id === id)
                                        return sec && sec.label.toLowerCase() !== 'geral' && sec.label.toLowerCase() !== 'general'
                                    })
                                    if (isGeral && hasOtherSelected) return false
                                    return true
                                })
                                .map((s: any) => {
                                    const isActive = taskSectors.includes(s.id)
                                    const IconComp = ICONS.find((i: any) => i.value === s.icon)?.icon || Tag
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleTaskSector(task.id, s.id, sectors)
                                            }}
                                            className={`px-4 py-2.5 text-sm text-left flex items-center gap-3 hover:bg-surface-variant/50 transition-colors ${isActive ? 'text-primary font-bold bg-primary/5' : 'text-on-surface'}`}
                                        >
                                            <IconComp className={`w-4 h-4 ${getSectorColorClass(s.color).split(' ')[1]}`} />
                                            {s.label}
                                            {isActive && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                                        </button>
                                    )
                                })}
                            <div className="pt-2 mt-1 border-t border-outline-variant/30 px-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setTaskMenuOpen(null)
                                        window.dispatchEvent(new CustomEvent('open-sectors-settings'))
                                    }}
                                    className="w-full px-2 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-wide"
                                >
                                    <Plus className="w-3 h-3" />
                                    Nova Etiqueta
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </FloatingPortal>
            )}
        </AnimatePresence>
    )
}
