import { create } from 'zustand'

export interface Toast {
    id: string
    message: string
    type: 'success' | 'error' | 'info'
    action?: {
        label: string
        onClick: () => void
    }
}

interface ToastState {
    toasts: Toast[]
    addToast: (message: string, type?: 'success' | 'error' | 'info', action?: { label: string; onClick: () => void }) => void
    removeToast: (id: string) => void
}

export const useToast = create<ToastState>((set) => ({
    toasts: [],
    addToast: (message, type = 'success', action) => {
        const id = Math.random().toString(36).substring(7)
        set((state) => ({ toasts: [...state.toasts, { id, message, type, action }] }))
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
        }, 5000) // Increase duration to give time for Undo
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
