import { useDragControls, DragControls } from 'framer-motion'
import { PointerEvent } from 'react'

interface UseDragReorderReturn {
    dragControls: DragControls
    handlePointerDown: (e: PointerEvent) => void
    dragWhileActive: {
        scale: number
        boxShadow: string
        zIndex: number
    }
    dragTransition: {
        type: string
        stiffness: number
        damping: number
    }
}

/**
 * Custom hook to encapsulate Drag & Drop reorder logic using framer-motion.
 * Returns drag controls and handlers for use with Reorder.Item.
 */
export function useDragAndDrop(): UseDragReorderReturn {
    const dragControls = useDragControls()

    const handlePointerDown = (e: PointerEvent) => {
        dragControls.start(e)
    }

    const dragWhileActive = {
        scale: 1.02,
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        zIndex: 50
    }

    const dragTransition = {
        type: "spring",
        stiffness: 600,
        damping: 40
    }

    return {
        dragControls,
        handlePointerDown,
        dragWhileActive,
        dragTransition
    }
}
