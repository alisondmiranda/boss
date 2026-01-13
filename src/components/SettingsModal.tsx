
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Pencil, Link as LinkIcon, Github, Linkedin, X, Settings, AlertCircle, ExternalLink, Check, Trash2, Plus, Tag, Key
} from 'lucide-react'
import { useSettingsStore, Sector } from '../store/settingsStore'
import { useToast } from '../store/toastStore'
import { useAuthStore } from '../store/authStore'
import crownLogo from '../assets/crown.svg'
import { ICONS, AVATAR_ICONS, COLORS } from '../constants/icons'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
    initialTab?: 'api' | 'sectors' | 'profile'
}

export function SettingsModal({ isOpen, onClose, initialTab = 'profile' }: SettingsModalProps) {
    const {
        geminiApiKey, setGeminiApiKey,
        sectors, addSector, updateSector, removeSector,
        userProfile, updateUserProfile
    } = useSettingsStore()

    const { user, signInWithGoogle, linkIdentity, unlinkIdentity } = useAuthStore()
    const { addToast } = useToast()
    const [inputKey, setInputKey] = useState(geminiApiKey || '')

    const scrollRef = useRef<HTMLDivElement>(null)

    // Safe Profile Access
    const defaultProfile = { displayName: '', avatarType: 'icon' as const, selectedIcon: 'crown', customAvatarUrl: '' }
    const safeProfile = userProfile || defaultProfile

    // Tabs
    const [activeTab, setActiveTab] = useState<'api' | 'sectors' | 'profile'>(initialTab)

    // Sector Form State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [sectorName, setSectorName] = useState('')
    const [sectorColor, setSectorColor] = useState<Sector['color']>('blue')
    const [sectorIcon, setSectorIcon] = useState('tag')

    // Profile Form State
    const [displayName, setDisplayName] = useState(safeProfile.displayName || '')
    const [avatarType, setAvatarType] = useState(safeProfile.avatarType || 'icon')
    const [selectedIcon, setSelectedIcon] = useState(safeProfile.selectedIcon || 'crown')
    const [customAvatarUrl, setCustomAvatarUrl] = useState(safeProfile.customAvatarUrl || '')

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab)
            setDisplayName(safeProfile.displayName || '')
            setAvatarType(safeProfile.avatarType)
            setSelectedIcon(safeProfile.selectedIcon || 'crown')
            setCustomAvatarUrl(safeProfile.customAvatarUrl || '')
        }
    }, [isOpen, initialTab, safeProfile])

    // Reset form when tab changes
    useEffect(() => {
        if (activeTab === 'sectors') resetForm()
    }, [activeTab])

    const resetForm = () => {
        setEditingId(null)
        setSectorName('')
        setSectorColor('blue')
        setSectorIcon('tag')
    }

    const handleSaveKey = () => {
        if (inputKey.trim()) {
            setGeminiApiKey(inputKey.trim())
            addToast('Chave de API salva com sucesso!', 'success')
        }
    }

    const handleSaveProfile = () => {
        updateUserProfile({
            displayName,
            avatarType,
            selectedIcon,
            customAvatarUrl
        })
        addToast('Perfil atualizado!', 'success')
    }



    const handleSaveSector = (e: React.FormEvent) => {
        e.preventDefault()
        if (!sectorName.trim()) return

        if (editingId) {
            // Update Existing
            updateSector(editingId, {
                label: sectorName,
                color: sectorColor,
                icon: sectorIcon

            })
            addToast(`Lista "${sectorName}" atualizada!`, 'success')
        } else {
            // Create New
            const newId = sectorName.toLowerCase().replace(/\s+/g, '-')
            // Simple check for duplicates
            if (sectors.some(s => s.id === newId)) {
                addToast('Já existe uma lista com este ID (nome).', 'error')
                return
            }

            addSector({
                id: newId,
                label: sectorName,
                color: sectorColor,
                icon: sectorIcon
            })
            addToast(`Lista "${sectorName}" criada!`, 'success')
        }
        resetForm()
    }

    const handleEditClick = (sector: Sector) => {
        setEditingId(sector.id)
        setSectorName(sector.label)
        setSectorColor(sector.color)
        setSectorIcon(sector.icon)
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }

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

                        {/* Tabs */}
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
                                Listas
                            </button>
                            <button
                                onClick={() => setActiveTab('api')}
                                className={`flex-1 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === 'api' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-variant/30'}`}
                            >
                                API & IA
                            </button>
                        </div>

                        <div ref={scrollRef} className="p-6 overflow-y-auto custom-scrollbar bg-surface-variant/30 flex-1">
                            {activeTab === 'api' && (
                                <div className="space-y-6 relative">
                                    {/* WIP Overlay */}
                                    <div className="absolute inset-0 bg-surface/90 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center text-center p-6 rounded-xl">
                                        <div className="bg-surface p-6 rounded-2xl shadow-6 border border-primary/20 max-w-sm">
                                            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                                <AlertCircle className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-xl font-bold text-on-surface mb-2">Em desenvolvimento</h3>
                                            <p className="text-sm text-on-surface-variant">
                                                A integração com a IA está sendo aprimorada para oferecer uma experiência ainda melhor. Volte em breve!
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-primary-container p-4 rounded-xl border border-transparent opacity-50 pointer-events-none">
                                        <p className="text-sm text-on-primary-container leading-relaxed">
                                            O Boss usa a inteligência do <strong>Google Gemini</strong> para organizar suas tarefas.
                                            Sua chave fica salva apenas no seu navegador.
                                        </p>
                                    </div>

                                    <div className="opacity-50 pointer-events-none">
                                        <label className="block text-sm font-medium text-on-surface-variant mb-2 flex items-center gap-2">
                                            <Key className="w-4 h-4" />
                                            Chave de API
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value={inputKey}
                                                onChange={(e) => setInputKey(e.target.value)}
                                                placeholder="Cole sua chave AIza..."
                                                className="flex-1 input-field !bg-surface"
                                                disabled
                                            />
                                            <button
                                                onClick={handleSaveKey}
                                                className="h-[50px] px-6 bg-primary text-on-primary rounded-[12px] hover:shadow-2 transition-all flex items-center justify-center"
                                                disabled
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="mt-3 text-xs flex justify-between items-center">
                                            {geminiApiKey ? (
                                                <span className="text-green-600 flex items-center gap-1 font-medium bg-green-100 px-2 py-1 rounded-md">
                                                    <Check className="w-3 h-3" /> Conectado
                                                </span>
                                            ) : (
                                                <span className="text-amber-600 flex items-center gap-1 font-medium bg-amber-100 px-2 py-1 rounded-md">
                                                    <AlertCircle className="w-3 h-3" /> Não configurado
                                                </span>
                                            )}
                                            <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-primary hover:underline flex items-center gap-1 pointer-events-none">
                                                Obter chave <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div className="space-y-8">
                                    {/* Name Section */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider block">Como quer ser chamado?</label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Boss"
                                            className="w-full input-field !bg-surface text-lg"
                                        />
                                        <p className="text-xs text-on-surface-variant/70">
                                            Deixe em branco para ser chamado de "Boss".
                                        </p>
                                    </div>

                                    {/* Avatar Section */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider block">Avatar</label>

                                        <div className="grid grid-cols-6 gap-3">
                                            {/* Default Crown */}
                                            <button
                                                onClick={() => { setAvatarType('icon'); setSelectedIcon('crown') }}
                                                className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-all ${avatarType === 'icon' && selectedIcon === 'crown' ? 'border-primary bg-primary-container/30' : 'border-outline-variant hover:border-primary/50 bg-surface'}`}
                                            >
                                                <img src={crownLogo} className="w-8 h-8 opacity-80" alt="Crown" />
                                            </button>

                                            {/* Other Icons */}
                                            {AVATAR_ICONS.filter(i => i.value !== 'crown').map(avatar => (
                                                <button
                                                    key={avatar.value}
                                                    onClick={() => { setAvatarType('icon'); setSelectedIcon(avatar.value) }}
                                                    className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-all ${avatarType === 'icon' && selectedIcon === avatar.value ? 'border-primary bg-primary-container/30 text-primary' : 'border-outline-variant hover:border-primary/50 bg-surface text-on-surface-variant'}`}
                                                    title={avatar.label}
                                                >
                                                    <avatar.icon className="w-8 h-8" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Identity Linking */}
                                    <div className="space-y-3 pt-4 border-t border-outline-variant/30">
                                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Contas Vinculadas</label>

                                        <div className="flex flex-col gap-2">
                                            <ProviderLinkButton
                                                provider="google"
                                                label="Google"
                                                icon={GoogleIcon}
                                                user={user}
                                                onLink={() => linkIdentity('google')}
                                                onUnlink={(id) => unlinkIdentity(id)}
                                            />
                                            <ProviderLinkButton
                                                provider="github"
                                                label="GitHub"
                                                icon={Github}
                                                user={user}
                                                onLink={() => linkIdentity('github')}
                                                onUnlink={(id) => unlinkIdentity(id)}
                                            />
                                            <ProviderLinkButton
                                                provider="linkedin_oidc"
                                                label="LinkedIn"
                                                icon={LinkedInIcon}
                                                user={user}
                                                onLink={() => linkIdentity('linkedin_oidc')}
                                                onUnlink={(id) => unlinkIdentity(id)}
                                            />

                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sectors' && (
                                <div className="space-y-6">
                                    <form onSubmit={handleSaveSector} className={`space-y-4 bg-surface p-5 rounded-[20px] shadow-1 border transition-colors ${editingId ? 'border-primary ring-1 ring-primary/20' : 'border-outline-variant/50'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-sm font-bold text-on-surface">
                                                {editingId ? 'Editar Lista' : 'Nova Lista'}
                                            </h3>
                                            {editingId && (
                                                <button
                                                    type="button"
                                                    onClick={resetForm}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={sectorName}
                                                onChange={(e) => setSectorName(e.target.value)}
                                                placeholder="Nome (ex: Viagens)"
                                                className="flex-1 input-field !bg-surface-variant/50"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!sectorName}
                                                className="h-[50px] w-[50px] bg-primary text-on-primary rounded-[12px] flex items-center justify-center hover:shadow-2 disabled:opacity-50 disabled:shadow-none transition-all flex-shrink-0"
                                            >
                                                {editingId ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                                            </button>
                                        </div>

                                        {/* Colors */}
                                        <div>
                                            <label className="text-xs font-bold text-on-surface-variant uppercase mb-3 block tracking-wider">Cor do Marcador</label>
                                            <div className="flex flex-wrap gap-2">
                                                {COLORS.map(c => (
                                                    <button
                                                        key={c.value}
                                                        type="button"
                                                        onClick={() => setSectorColor(c.value)}
                                                        className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${sectorColor === c.value ? 'scale-110 ring-2 ring-offset-2 ring-primary shadow-sm' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                                        style={{ backgroundColor: c.hex }}
                                                        title={c.label}
                                                    >
                                                        {sectorColor === c.value && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Icons */}
                                        <div>
                                            <label className="text-xs font-bold text-on-surface-variant uppercase mb-3 block tracking-wider">Ícone</label>
                                            <div className="grid grid-cols-7 gap-2">
                                                {ICONS.map(i => (
                                                    <button
                                                        key={i.value}
                                                        type="button"
                                                        onClick={() => setSectorIcon(i.value)}
                                                        className={`p-2 rounded-xl flex items-center justify-center transition-all ${sectorIcon === i.value
                                                            ? 'bg-secondary-container text-on-secondary-container shadow-sm ring-1 ring-secondary'
                                                            : 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                                                            }`}
                                                        title={i.label}
                                                    >
                                                        <i.icon className="w-5 h-5" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </form>

                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold text-on-surface px-1">Suas Listas</h3>
                                        <div className="grid gap-2">
                                            {sectors.map(sector => {
                                                const Icon = ICONS.find(i => i.value === sector.icon)?.icon || Tag
                                                return (
                                                    <div key={sector.id} className={`flex items-center justify-between p-4 bg-surface border rounded-[16px] group transition-all shadow-sm ${editingId === sector.id ? 'border-primary bg-primary-container/10' : 'border-outline-variant hover:border-primary/50'}`}>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: COLORS.find(c => c.value === sector.color)?.hex || '#ccc' }}>
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                            <span className="font-medium text-base text-on-surface">{sector.label}</span>
                                                        </div>

                                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEditClick(sector)}
                                                                className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/30 rounded-full transition-all"
                                                                title="Editar"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => removeSector(sector.id)}
                                                                className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-all"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sticky Footer for Profile Save */}
                        {activeTab === 'profile' && (
                            <div className="p-4 border-t border-outline-variant bg-surface shrink-0">
                                <button
                                    onClick={handleSaveProfile}
                                    className="w-full py-3 bg-primary text-on-primary rounded-[16px] font-medium shadow-2 active:scale-95 transition-all"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
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



interface ProviderLinkButtonProps {
    provider: string
    label: string
    icon?: any
    user: any
    onLink: () => Promise<void>
    onUnlink: (identityId: string) => Promise<void>
}

function ProviderLinkButton({ provider, label, icon: Icon, user, onLink, onUnlink }: ProviderLinkButtonProps) {
    const { addToast } = useToast()


    const identity = user?.identities?.find((id: any) => id.provider === provider)
    const isLinked = !!identity

    const handleLink = async () => {
        try {
            if (isLinked) {
                if (confirm(`Desvincular conta do ${label}?`)) {
                    await onUnlink(identity.identity_id)
                    addToast(`${label} desvinculado.`, 'success')
                }
            } else {
                await onLink()
                addToast(`${label} vinculado com sucesso!`, 'success')
            }
        } catch (e) {
            addToast(`Erro ao atualizar ${label}.`, 'error')
        }
    }

    return (
        <button
            onClick={handleLink}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${isLinked
                ? 'bg-surface border-green-200 text-green-700'
                : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-variant'}`}
        >
            <span className="flex items-center gap-2 font-medium text-sm">
                <div className={`w-2 h-2 rounded-full ${isLinked ? 'bg-green-500' : 'bg-on-surface/20'}`} />
                {Icon && <Icon className="w-4 h-4" />}
                {label}
            </span>
            {isLinked ? <X className="w-4 h-4 text-on-surface-variant hover:text-error" /> : <LinkIcon className="w-4 h-4 opacity-50" />}
        </button>
    )
}
