import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Lock, Github, X } from 'lucide-react'
import { useAuthStore } from './store/authStore'
import { useTaskStore } from './store/taskStore'
import { useSettingsStore } from './store/settingsStore'
import { Dashboard } from './components/Dashboard'

import crownLogo from './assets/crown.svg'

function App() {
    const {
        user, loading, initializeAuth,
        signInWithGoogle, signInWithProvider,
        signInWithEmail, signUpWithEmail
    } = useAuthStore()

    const [authMode, setAuthMode] = useState<'login' | 'register' | 'oauth'>('oauth')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [legalType, setLegalType] = useState<'terms' | 'privacy' | null>(null)

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
        <div className="min-h-screen bg-[#0f1115] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow delay-1000" />
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px] mix-blend-screen" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                className="w-full max-w-[420px] z-10 relative"
            >
                {/* Glass Card */}
                <div className="bg-[#1a1c23]/80 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl relative overflow-hidden">

                    {/* Header */}
                    <div className="flex flex-col items-center mb-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="bg-transparent mb-4"
                        >
                            <img src={crownLogo} className="w-16 h-16 drop-shadow-xl filter brightness-125" alt="Boss Logo" />
                        </motion.div>

                        <h1 className="text-3xl font-bold tracking-tight text-white text-center">
                            Bem-vindo ao Boss
                        </h1>
                        <p className="text-white/40 text-sm mt-2 font-medium text-center">
                            Organize sua vida. Domine sua rotina.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            {authMode === 'oauth' ? (
                                <motion.div
                                    key="oauth"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    {/* Social Buttons Row */}
                                    <div className="grid grid-cols-1 gap-3">
                                        <SocialLoginButton
                                            icon={GoogleIcon}
                                            label="Continuar com Google"
                                            onClick={signInWithGoogle}
                                            delay={0.1}
                                        />
                                        <SocialLoginButton
                                            icon={Github}
                                            label="Continuar com GitHub"
                                            onClick={() => signInWithProvider('github')}
                                            delay={0.2}
                                        />
                                        <SocialLoginButton
                                            icon={LinkedInIcon}
                                            label="Continuar com LinkedIn"
                                            onClick={() => signInWithProvider('linkedin_oidc')}
                                            delay={0.3}
                                        />
                                    </div>

                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-white/10"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="px-4 text-xs text-white/30 font-medium bg-[#1a1c23]/80 uppercase tracking-widest">OU</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setAuthMode('login')}
                                        className="w-full py-4 text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10"
                                    >
                                        Usar E-mail e Senha
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={async (e) => {
                                        e.preventDefault()
                                        setIsSubmitting(true)
                                        setError(null)
                                        setSuccess(null)

                                        if (authMode === 'register' && password !== confirmPassword) {
                                            setError('As senhas não coincidem')
                                            setIsSubmitting(false)
                                            return
                                        }

                                        try {
                                            if (authMode === 'login') {
                                                await signInWithEmail(email, password)
                                            } else {
                                                await signUpWithEmail(email, password)
                                                setSuccess('Conta criada com sucesso! Enviamos um e-mail de confirmação. Verifique sua caixa de entrada e SPAM antes de tentar fazer login.')
                                                setAuthMode('login')
                                                // Optional: clear fields
                                                setPassword('')
                                                setConfirmPassword('')
                                            }
                                        } catch (err: any) {
                                            console.error(err)
                                            // Translate common Supabase errors if needed
                                            // Translate common Supabase errors
                                            if (err.message === 'User already registered') {
                                                setError('Este e-mail já está cadastrado.')
                                            } else if (err.message.includes('Email not confirmed')) {
                                                setError('E-mail não confirmado. Verifique sua caixa de entrada.')
                                            } else if (err.message === 'Invalid login credentials') {
                                                setError('E-mail ou senha incorretos.')
                                            } else {
                                                setError(err.message || 'Erro na autenticação. Tente novamente.')
                                            }
                                        } finally {
                                            setIsSubmitting(false)
                                        }
                                    }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-3">
                                        <InputGroup icon={Mail} type="email" placeholder="E-mail" value={email} onChange={setEmail} />
                                        <InputGroup icon={Lock} type="password" placeholder="Senha" value={password} onChange={setPassword} />
                                        {authMode === 'register' && (
                                            <InputGroup icon={Lock} type="password" placeholder="Confirmar Senha" value={confirmPassword} onChange={setConfirmPassword} />
                                        )}
                                    </div>

                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <p className="text-xs text-red-200 font-medium text-center">{error}</p>
                                        </motion.div>
                                    )}
                                    {success && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                                            <p className="text-xs text-green-200 font-medium text-center">{success}</p>
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 mt-4"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Entrar na Conta' : 'Criar Nova Conta')}
                                    </button>

                                    <div className="flex flex-col gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                                            className="text-xs font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest text-center"
                                        >
                                            {authMode === 'login' ? 'Criar uma conta' : 'Já possuo conta'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAuthMode('oauth')}
                                            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest text-center"
                                        >
                                            Voltar para Social
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-8 flex justify-center gap-6 text-[10px] font-bold tracking-widest uppercase text-white/20">
                    <button onClick={() => setLegalType('terms')} className="hover:text-white/40 transition-colors">Termos</button>
                    <span>•</span>
                    <button onClick={() => setLegalType('privacy')} className="hover:text-white/40 transition-colors">Privacidade</button>
                </div>
            </motion.div>

            <AnimatePresence>
                {legalType && <LegalModal type={legalType} onClose={() => setLegalType(null)} />}
            </AnimatePresence>
        </div>
    )
}

function SocialLoginButton({ icon: Icon, label, onClick, delay }: { icon: any, label: string, onClick: () => void, delay: number }) {
    return (
        <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            onClick={onClick}
            className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl flex items-center px-4 transition-all group"
        >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors" >
                <Icon className="w-5 h-5 text-white/80 group-hover:text-white" />
            </div>
            <span className="flex-1 text-sm font-bold text-white/70 group-hover:text-white text-center transition-colors">
                {label}
            </span>
        </motion.button>
    )
}

function InputGroup({ icon: Icon, type, placeholder, value, onChange }: { icon: any, type: string, placeholder: string, value: string, onChange: (val: string) => void }) {
    return (
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors">
                <Icon className="w-5 h-5" />
            </div>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
            />
        </div>
    )
}

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M21.35 11.1H12v3.8h5.36c-.23 1.25-2.23 3.66-5.36 3.66-3.23 0-5.86-2.61-5.86-6.17s2.63-6.17 5.86-6.17c1.83 0 3.04.78 3.74 1.45l2.67-2.9C16.89 3.07 14.65 2 12 2 6.48 2 2 6.48 2 12s4.48 10 10 10c5.77 0 9.6-4.06 9.6-9.77 0-.67-.06-1.31-.19-1.92z" />
        </svg>
    )
}

function LinkedInIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.216zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
        </svg>
    )
}




function LegalModal({ type, onClose }: { type: 'terms' | 'privacy', onClose: () => void }) {
    const title = type === 'terms' ? 'Termos de Serviço' : 'Política de Privacidade'

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface w-full max-w-2xl max-h-[80vh] rounded-[28px] shadow-5 flex flex-col overflow-hidden"
            >
                <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface sticky top-0">
                    <h2 className="text-xl font-bold text-on-surface">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto text-on-surface-variant leading-relaxed text-sm whitespace-pre-wrap">
                    {type === 'terms' ? (
                        <>
                            <h3 className="text-lg font-bold text-on-surface mb-2">1. Aceitação dos Termos</h3>
                            <p className="mb-4">Ao usar o Boss, você concorda com estes termos. Se não concordar, não use o serviço.</p>

                            <h3 className="text-lg font-bold text-on-surface mb-2">2. Uso do Serviço</h3>
                            <p className="mb-4">O Boss é um assistente pessoal. Use-o de forma legal e responsável. Você é responsável pela segurança da sua conta.</p>

                            <h3 className="text-lg font-bold text-on-surface mb-2">3. Contas e Login</h3>
                            <p className="mb-4">Usamos logins sociais (Google, GitHub, etc) apenas para autenticação. Não postamos nada em seu nome.</p>

                            <h3 className="text-lg font-bold text-on-surface mb-2">4. Propriedade</h3>
                            <p className="mb-4">O software é propriedade do Grupo Biz. Não copie nosso código.</p>

                            <h3 className="text-lg font-bold text-on-surface mb-2">5. Isenção</h3>
                            <p className="mb-4">O serviço é fornecido 'como está', sem garantias absolutas.</p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-on-surface mb-2">1. Dados Coletados</h3>
                            <p className="mb-4">Coletamos nome, email e foto para criar sua conta via login social. Armazenamos suas tarefas e configurações para o funcionamento do app.</p>

                            <h3 className="text-lg font-bold text-on-surface mb-2">2. Uso dos Dados</h3>
                            <p className="mb-4">Usamos seus dados para fornecer o serviço, sincronizar entre dispositivos e melhorar a experiência.</p>

                            <h3 className="text-lg font-bold text-on-surface mb-2">3. Compartilhamento</h3>
                            <p className="mb-4 text-primary font-bold">NÃO vendemos seus dados.</p>
                            <p className="mb-4">Compartilhamos apenas o necessário com provedores de infraestrutura (ex: banco de dados).</p>

                            <h3 className="text-lg font-bold text-on-surface mb-2">4. Google Gemini</h3>
                            <p className="mb-4">Se usar a IA, sua chave API fica salva apenas no seu dispositivo. Não temos acesso a ela.</p>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}



export default App
