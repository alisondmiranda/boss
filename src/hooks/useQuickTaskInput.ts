import { useState, useRef, useEffect, useCallback, RefObject } from 'react'

interface UseQuickTaskInputProps {
    onSubmit: (title: string) => Promise<void>
}

interface UseQuickTaskInputReturn {
    quickTaskTitle: string
    setQuickTaskTitle: (title: string) => void
    showQuickAddSuccess: boolean
    setShowQuickAddSuccess: (show: boolean) => void
    quickInputRef: RefObject<HTMLInputElement>
    searchInputRef: RefObject<HTMLInputElement>
    searchContainerRef: RefObject<HTMLDivElement>
    isSearchOpen: boolean
    setIsSearchOpen: (open: boolean) => void
    handleQuickTaskSubmit: (e: React.KeyboardEvent) => Promise<void>
}

export function useQuickTaskInput({ onSubmit }: UseQuickTaskInputProps): UseQuickTaskInputReturn {
    const [quickTaskTitle, setQuickTaskTitle] = useState('')
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [showQuickAddSuccess, setShowQuickAddSuccess] = useState(false)

    const quickInputRef = useRef<HTMLInputElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const searchContainerRef = useRef<HTMLDivElement>(null)

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault()
                quickInputRef.current?.focus()
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsSearchOpen(true)
                setTimeout(() => searchInputRef.current?.focus(), 100)
            }
        }

        const handleClickOutside = (e: MouseEvent) => {
            if (isSearchOpen && searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node) && !quickInputRef.current?.contains(e.target as Node)) {
                setIsSearchOpen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('mousedown', handleClickOutside)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isSearchOpen])

    const handleQuickTaskSubmit = useCallback(async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && quickTaskTitle.trim()) {
            e.preventDefault()
            const taskTitle = quickTaskTitle.trim()

            // Optimistic UI
            setQuickTaskTitle('')
            setShowQuickAddSuccess(true)
            setTimeout(() => setShowQuickAddSuccess(false), 1800)

            try {
                await onSubmit(taskTitle)
            } catch (error) {
                console.error("Quick add failed", error)
            }
        }
    }, [quickTaskTitle, onSubmit])

    return {
        quickTaskTitle,
        setQuickTaskTitle,
        showQuickAddSuccess,
        setShowQuickAddSuccess,
        quickInputRef,
        searchInputRef,
        searchContainerRef,
        isSearchOpen,
        setIsSearchOpen,
        handleQuickTaskSubmit
    }
}
