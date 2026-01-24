import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

interface TaskCheckboxProps {
    isCompleted: boolean
    isAnimating: boolean
    onToggle: () => void
}

export function TaskCheckbox({ isCompleted, isAnimating, onToggle }: TaskCheckboxProps) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation()
                onToggle()
            }}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 relative overflow-hidden mt-0.5 ${isCompleted || isAnimating
                ? 'bg-primary border-primary text-on-primary shadow-sm'
                : 'border-outline/40 hover:border-primary text-transparent hover:bg-primary/5'
                }`}
        >
            <AnimatePresence>
                {(isCompleted || isAnimating) && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                    >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    )
}
