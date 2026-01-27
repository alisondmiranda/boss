import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

interface TaskCheckboxProps {
    isCompleted: boolean
    isAnimating: boolean
    onToggle: () => void
    size?: 'sm' | 'md' | 'lg'
}

export function TaskCheckbox({ isCompleted, isAnimating, onToggle, size = 'md' }: TaskCheckboxProps) {
    const sizeClasses = {
        sm: 'w-4 h-4 rounded-[4px]',
        md: 'w-5 h-5 rounded-md',
        lg: 'w-7 h-7 rounded-lg'
    }

    const iconSize = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-5 h-5'
    }

    return (
        <button
            onClick={(e) => {
                e.stopPropagation()
                onToggle()
            }}
            className={`${sizeClasses[size]} border-2 flex items-center justify-center transition-all flex-shrink-0 relative overflow-hidden mt-0.5 ${isCompleted || isAnimating
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
                        <Check className={`${iconSize[size]} stroke-[3]`} />
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    )
}
