import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useAuthStore } from './store/authStore'
import { useTaskStore } from './store/taskStore'
import { useSettingsStore } from './store/settingsStore'
import { Dashboard } from './components/Dashboard'

import appleLogo from './assets/apple.svg'
import crownLogo from './assets/crown.svg'

function App() {
    const { user, loading, signInWithGoogle, signInWithApple, initializeAuth } = useAuthStore()

    useEffect(() => {
        initializeAuth()
    }, [])

    useEffect(() => {
        if (!user) return

        console.log('Iniciando conexões Realtime...')
        const unsubTasks = useTaskStore.getState().subscribeToTasks()
        const unsubSettings = useSettingsStore.getState().subscribeToSettings()

        return () => {
            console.log('Finalizando conexões Realtime...')
            unsubTasks()
            unsubSettings()
        }
    }, [user])

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        )
    }

    if (user) {
        return <Dashboard />
    }

    return (
        <div className="min-h-screen bg-background text-on-background flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Dynamic Background - Subtle M3 Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-container/30 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-tertiary-container/30 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                className="w-full max-w-md z-10 p-8 rounded-[32px] bg-surface/80 backdrop-blur-xl border border-outline-variant shadow-4 relative overflow-hidden"
            >
                <div className="flex flex-col items-center mb-12 relative">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="mb-6 relative"
                    >
                        <div className="w-24 h-24 rounded-[28px] bg-primary-container flex items-center justify-center">
                            <img src={crownLogo} className="w-12 h-12 text-on-primary-container" alt="Boss Logo" />
                        </div>
                    </motion.div>

                    <h1 className="text-4xl font-normal text-on-surface tracking-tight text-center">
                        Bem-vindo ao <span className="font-bold text-primary">Boss</span>
                    </h1>
                    <p className="text-on-surface-variant text-base mt-3 text-center max-w-[85%] leading-relaxed font-medium">
                        Seu assistente de vida inteligente. Organize sua rotina de forma superior.
                    </p>
                </div>

                <div className="space-y-4">
                    <LoginButton
                        provider="google"
                        onLogin={signInWithGoogle}
                    />

                    <LoginButton
                        provider="apple"
                        onLogin={signInWithApple}
                    />

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-outline-variant"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                            <span className="px-4 bg-surface text-on-surface-variant/70">Powered by Grupo Biz</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Footer */}
            <div className="absolute bottom-6 text-on-surface-variant/40 text-xs tracking-widest uppercase font-medium">
                System Ready v1.0
            </div>
        </div>
    )
}

function LoginButton({ onLogin, provider }: { onLogin: () => void, provider: 'google' | 'apple' }) {
    const isGoogle = provider === 'google'

    return (
        <motion.button
            whileHover={{ scale: 1.02, boxShadow: "var(--md-sys-elevation-3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogin}
            id={`btn-login-${provider}`}
            className={`group relative w-full h-14 rounded-[20px] flex items-center justify-center transition-all shadow-1 hover:shadow-2 overflow-hidden ${isGoogle
                ? 'bg-primary hover:bg-primary/90 text-on-primary'
                : 'bg-black text-white hover:bg-gray-900'
                }`}
        >
            <div className="flex items-center gap-3 w-[200px]">
                <div className="p-1.5 rounded-full flex items-center justify-center shadow-sm bg-white shrink-0">
                    {isGoogle ? (
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    ) : (
                        <img src={appleLogo} className="w-5 h-5" alt="Apple" />
                    )}
                </div>
                <span className="text-base font-bold tracking-wide text-left">
                    {isGoogle ? 'Entrar com Google' : 'Entrar com Apple'}
                </span>
            </div>
            <ArrowRight className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 group-hover:translate-x-1 transition-transform ${isGoogle ? 'text-on-primary/70' : 'text-white/70'}`} />
        </motion.button>
    )
}

export default App
