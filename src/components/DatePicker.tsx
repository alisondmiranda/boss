import { motion, AnimatePresence } from 'framer-motion'
import { useFloating, autoUpdate, offset, flip, shift, useDismiss, useInteractions, FloatingPortal } from '@floating-ui/react'
import { StandardCalendar } from './StandardCalendar'

interface DatePickerProps {
    date: Date | null
    onSelect: (date: Date | null) => void
    isOpen: boolean
    onClose: () => void
    triggerRef: React.RefObject<HTMLElement>
}

export function DatePicker({ date, onSelect, isOpen, onClose, triggerRef }: DatePickerProps) {




    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: (open) => {
            if (!open) onClose()
        },
        elements: {
            reference: triggerRef.current
        },
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(8),
            flip({ fallbackAxisSideDirection: 'start' }),
            shift({ padding: 8 })
        ],
        placement: 'bottom-start'
    })

    const dismiss = useDismiss(context)

    const { getFloatingProps } = useInteractions([dismiss])

    return (
        <AnimatePresence>
            {isOpen && (
                <FloatingPortal>
                    <div
                        ref={refs.setFloating}
                        style={floatingStyles}
                        {...getFloatingProps()}
                        className="z-[90]"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-surface border border-outline-variant shadow-5 rounded-2xl p-0 w-[300px] max-w-[90vw] overflow-hidden"
                        >
                            <StandardCalendar
                                selectedDate={date}
                                onDateSelect={(d) => {
                                    onSelect(d)
                                    // Don't close immediately if we might want to edit time?
                                    // For now, let's keep it open so user can see what they picked or change time
                                    // Actually the StandardCalendar handles time change updates too.
                                }}
                                enableTime={true}
                                className="border-none shadow-none"
                            />
                        </motion.div>
                    </div>
                </FloatingPortal>
            )}
        </AnimatePresence>
    )
}
