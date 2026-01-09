import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToast } from '../store/toastStore'

export function ToastContainer() {
    const { toasts, removeToast } = useToast()

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        layout
                        className={`pointer-events-auto min-w-[300px] p-4 rounded-xl shadow-lg border flex items-center gap-3 backdrop-blur-md ${toast.type === 'success'
                                ? 'bg-[var(--md-sys-color-surface)]/90 border-green-200 text-green-800'
                                : toast.type === 'error'
                                    ? 'bg-red-50/90 border-red-200 text-red-800'
                                    : 'bg-[var(--md-sys-color-surface)]/90 border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]'
                            }`}
                    >
                        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                        {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}

                        <p className="text-sm font-medium flex-1">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-black/5 rounded-full transition-colors opacity-60 hover:opacity-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
