import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, LogOut, PanelRightOpen } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import crownLogo from '../../assets/crown.svg'
import { AVATAR_ICONS } from '../../constants/icons.tsx'
import { UserProfile } from '../../store/types'
import { User } from '@supabase/supabase-js'

interface HeaderProps {
    userProfile: UserProfile
    user: User | null
    signOut: () => Promise<void>
    openSettings: (tab?: 'api' | 'sectors' | 'profile', openCreation?: boolean) => void
    isRightSidebarOpen: boolean
    toggleRightSidebar: () => void
}

export function Header({
    userProfile,
    user,
    signOut,
    openSettings,
    isRightSidebarOpen,
    toggleRightSidebar
}: HeaderProps) {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

    const getGreeting = () => {
        const hour = new Date().getHours()
        let greeting = 'Bom dia'
        if (hour >= 12 && hour < 18) greeting = 'Boa tarde'
        if (hour >= 18) greeting = 'Boa noite'
        return `${greeting}, `
    }

    return (
        <header className="px-8 py-6 flex justify-between items-start shrink-0 z-40 relative">
            <div>
                <motion.h1
                    key={userProfile.displayName}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-on-surface flex items-center gap-2"
                >
                    {getGreeting()}
                    <span className="text-primary">{userProfile.displayName || 'Boss'}.</span>
                </motion.h1>
                <p className="text-sm text-on-surface-variant mt-1 capitalize opacity-80 pl-1 font-medium">
                    {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative z-50">
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="w-11 h-11 rounded-full border-2 border-outline-variant hover:border-primary p-0.5 transition-all overflow-hidden bg-surface relative"
                    >
                        {userProfile.avatarType === 'url' && userProfile.customAvatarUrl ? (
                            <img src={userProfile.customAvatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <div className={`w-full h-full rounded-full flex items-center justify-center bg-primary-container/30 text-primary`}>
                                {userProfile.avatarType === 'icon' && userProfile.selectedIcon ? (
                                    userProfile.selectedIcon === 'crown' ? (
                                        <img src={crownLogo} className="w-6 h-6" alt="Crown" />
                                    ) : (
                                        (() => {
                                            const IconComponent = AVATAR_ICONS.find(i => i.value === userProfile.selectedIcon)?.icon || AVATAR_ICONS[0].icon
                                            return <IconComponent className="w-6 h-6" />
                                        })()
                                    )
                                ) : (
                                    <span className="font-bold text-lg">{userProfile.displayName?.charAt(0).toUpperCase() || (user?.email?.charAt(0).toUpperCase() || 'B')}</span>
                                )}
                            </div>
                        )}
                    </button>

                    <AnimatePresence>
                        {isUserMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-[20px] shadow-5 border border-outline-variant overflow-hidden flex flex-col py-2 z-50"
                                >
                                    <div className="px-4 py-3 border-b border-outline-variant/50 mb-1">
                                        <p className="text-sm font-bold text-on-surface truncate">
                                            {userProfile.displayName || 'Boss'}
                                        </p>
                                        <p className="text-xs text-on-surface-variant truncate opacity-80">
                                            {user?.email}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setIsUserMenuOpen(false)
                                            openSettings('profile')
                                        }}
                                        className="w-full px-4 py-2.5 text-sm text-left text-on-surface hover:bg-surface-variant/50 flex items-center gap-3 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary">
                                            {userProfile.avatarType === 'icon' && userProfile.selectedIcon ? (
                                                userProfile.selectedIcon === 'crown' ? (
                                                    <img src={crownLogo} className="w-4 h-4" alt="Crown" />
                                                ) : (
                                                    (() => {
                                                        const IconComponent = AVATAR_ICONS.find(i => i.value === userProfile.selectedIcon)?.icon || AVATAR_ICONS[0].icon
                                                        return <IconComponent className="w-4 h-4" />
                                                    })()
                                                )
                                            ) : (
                                                <Settings className="w-4 h-4" />
                                            )}
                                        </div>
                                        Editar Perfil
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsUserMenuOpen(false)
                                            openSettings('sectors')
                                        }}
                                        className="w-full px-4 py-2.5 text-sm text-left text-on-surface hover:bg-surface-variant/50 flex items-center gap-3 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
                                            <Settings className="w-4 h-4 text-on-surface-variant" />
                                        </div>
                                        Configurações
                                    </button>

                                    <div className="h-px bg-outline-variant/50 my-1 mx-4" />

                                    <button
                                        onClick={signOut}
                                        className="w-full px-4 py-2.5 text-sm text-left text-error hover:bg-error-container/10 flex items-center gap-3 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-error-container/20 flex items-center justify-center">
                                            <LogOut className="w-4 h-4" />
                                        </div>
                                        Sair da conta
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {!isRightSidebarOpen && (
                    <button
                        onClick={toggleRightSidebar}
                        className="w-11 h-11 rounded-full border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary hover:bg-surface-variant flex items-center justify-center transition-all"
                        title="Abrir Ferramentas"
                    >
                        <PanelRightOpen className="w-5 h-5" />
                    </button>
                )}
            </div>
        </header>
    )
}
