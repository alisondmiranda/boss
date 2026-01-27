import { motion } from 'framer-motion'
import { useUIStore } from '../store/uiStore'
import { CalendarWidget } from './widgets/CalendarWidget'
import { TimeHubWidget } from './widgets/TimeHubWidget'
import { PanelRightClose } from 'lucide-react'
import { ErrorBoundary } from './common/ErrorBoundary'

export function RightSidebar() {
    const { isRightSidebarOpen, toggleRightSidebar } = useUIStore()

    return (
        <motion.aside
            initial={false}
            animate={{
                width: isRightSidebarOpen ? 320 : 0,
                opacity: isRightSidebarOpen ? 1 : 0
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full bg-surface border-l border-outline-variant/30 overflow-hidden flex-shrink-0 relative shadow-xl z-20"
        >
            <div className="w-[320px] h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-6 border-b border-outline-variant/30 shrink-0">
                    <span className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-[0.1em]">Ferramentas</span>
                    <button
                        onClick={toggleRightSidebar}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant/50 rounded-full transition-colors"
                    >
                        <PanelRightClose className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <ErrorBoundary name="CalendarWidget">
                        <CalendarWidget />
                    </ErrorBoundary>
                    <ErrorBoundary name="TimeHubWidget">
                        <TimeHubWidget />
                    </ErrorBoundary>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-outline-variant/30 text-center">
                    <p className="text-[10px] text-on-surface-variant/40">Widgets</p>
                </div>
            </div>
        </motion.aside>
    )
}
