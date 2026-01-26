import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import { useToast } from '../store/toastStore'
import { useAuthStore } from '../store/authStore'
import { ProfileTab } from './settings/ProfileTab'
import { SectorsTab } from './settings/SectorsTab'
import { APITab } from './settings/APITab'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
    initialTab?: 'api' | 'sectors' | 'profile'
    initialOpenCreation?: boolean
}

export function SettingsModal({
    isOpen,
    onClose,
    initialTab = 'profile',
    initialOpenCreation = false
}: SettingsModalProps) {
    const {
        geminiApiKey, setGeminiApiKey,
        sectors, addSector, updateSector, removeSector, reorderSectors,
        userProfile, updateUserProfile, sortBy, setSortBy
    } = useSettingsStore()

    const { user, linkIdentity, unlinkIdentity } = useAuthStore()
    const { addToast } = useToast()
    const scrollRef = useRef<HTMLDivElement>(null)

    // Tabs
    const [activeTab, setActiveTab] = useState<'api' | 'sectors' | 'profile'>(initialTab)

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab)
        }
    }, [isOpen, initialTab])

    return (
        <AnimatePresence>
            {isOpen && (
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
                        className="bg-surface w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] rounded-[28px] shadow-5"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface">
                            <h2 className="text-xl font-normal flex items-center gap-2 text-on-surface">
                                <Settings className="w-6 h-6 text-primary" />
                                Configurações
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full transition-colors text-on-surface-variant">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex border-b border-outline-variant px-6">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`flex-1 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === 'profile' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-variant/30'}`}
                            >
                                Perfil
                            </button>
                            <button
                                onClick={() => setActiveTab('sectors')}
                                className={`flex-1 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === 'sectors' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-variant/30'}`}
                            >
                                Etiquetas
                            </button>
                            <button
                                onClick={() => setActiveTab('api')}
                                className={`flex-1 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === 'api' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-variant/30'}`}
                            >
                                API & IA
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div ref={scrollRef} className="p-6 overflow-y-auto custom-scrollbar bg-surface-variant/30 flex-1">
                            {activeTab === 'profile' && (
                                <ProfileTab
                                    userProfile={userProfile}
                                    user={user}
                                    linkIdentity={linkIdentity}
                                    unlinkIdentity={unlinkIdentity}
                                    updateUserProfile={updateUserProfile}
                                    addToast={addToast}
                                />
                            )}

                            {activeTab === 'sectors' && (
                                <SectorsTab
                                    sectors={sectors}
                                    addSector={addSector}
                                    updateSector={updateSector}
                                    removeSector={removeSector}
                                    reorderSectors={reorderSectors}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                    addToast={addToast}
                                    initialOpenCreation={initialOpenCreation}
                                />
                            )}

                            {activeTab === 'api' && (
                                <APITab
                                    geminiApiKey={geminiApiKey}
                                    setGeminiApiKey={setGeminiApiKey}
                                    addToast={addToast}
                                />
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
