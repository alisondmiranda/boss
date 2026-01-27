import { motion } from 'framer-motion'
import { Plus, Search, Calendar, Menu, Layers } from 'lucide-react'

interface MobileBottomNavProps {
    onMenuClick: () => void
    onAddClick: () => void
    onSearchClick: () => void
    onCalendarClick: () => void
}

export function MobileBottomNav({
    onMenuClick,
    onAddClick,
    onSearchClick,
    onCalendarClick
}: MobileBottomNavProps) {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-outline-variant/20 pb-safe-area-bottom">
            <div className="flex items-center justify-between px-6 h-16 pt-2 pb-2">

                {/* Workspace / Menu */}
                <button
                    onClick={onMenuClick}
                    className="flex flex-col items-center justify-center w-12 h-12 text-on-surface-variant hover:text-primary transition-colors gap-1"
                >
                    <div className="p-1.5 rounded-xl bg-surface-variant/30">
                        <Layers className="w-5 h-5" />
                    </div>
                </button>

                {/* Search */}
                <button
                    onClick={onSearchClick}
                    className="flex flex-col items-center justify-center w-12 h-12 text-on-surface-variant hover:text-primary transition-colors"
                >
                    <Search className="w-6 h-6" />
                </button>

                {/* FAB - Add Task (Central) */}
                <div className="relative -top-5">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onAddClick}
                        className="w-14 h-14 rounded-2xl bg-primary shadow-[0_8px_20px_rgba(var(--primary-rgb),0.35)] flex items-center justify-center text-on-primary"
                    >
                        <Plus className="w-7 h-7" />
                    </motion.button>
                </div>

                {/* Calendar / Agenda */}
                <button
                    onClick={onCalendarClick}
                    className="flex flex-col items-center justify-center w-12 h-12 text-on-surface-variant hover:text-primary transition-colors"
                >
                    <Calendar className="w-6 h-6" />
                </button>

                {/* Menu / More */}
                <button
                    onClick={onMenuClick} // TODO: Separate menu if needed, currently reusing for symmetry or different action
                    className="flex flex-col items-center justify-center w-12 h-12 text-on-surface-variant hover:text-primary transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </div>
    )
}
