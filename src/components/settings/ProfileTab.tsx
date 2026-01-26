import { useState } from 'react'
import { ChevronDown, ChevronUp, Github } from 'lucide-react'
import crownLogo from '../../assets/crown.svg'
import { AVATAR_ICONS } from '../../constants/icons.tsx'
import { ProviderLinkButton, GoogleIcon, LinkedInIcon } from './ProviderLinkButton'
import { UserProfile } from '../../store/types'

interface ProfileTabProps {
    userProfile: UserProfile
    user: any
    linkIdentity: (provider: any) => Promise<void>
    unlinkIdentity: (identity: any) => Promise<void>
    updateUserProfile: (updates: Partial<UserProfile>) => void
    addToast: (message: string, type: 'success' | 'error' | 'info', action?: any) => void
}

export function ProfileTab({
    userProfile,
    user,
    linkIdentity,
    unlinkIdentity,
    updateUserProfile,
    addToast
}: ProfileTabProps) {
    const [displayName, setDisplayName] = useState(userProfile.displayName || '')
    const [avatarType, setAvatarType] = useState(userProfile.avatarType || 'icon')
    const [selectedIcon, setSelectedIcon] = useState(userProfile.selectedIcon || 'crown')
    const [customAvatarUrl, setCustomAvatarUrl] = useState(userProfile.customAvatarUrl || '')
    const [showAllAvatars, setShowAllAvatars] = useState(false)

    const handleSaveProfile = () => {
        updateUserProfile({
            displayName,
            avatarType,
            selectedIcon,
            customAvatarUrl
        })
        addToast('Perfil atualizado!', 'success')
    }

    return (
        <div className="space-y-8">
            {/* Name Section */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider block">Como quer ser chamado?</label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Boss"
                    className="w-full input-field !bg-surface text-lg border border-outline-variant rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <p className="text-xs text-on-surface-variant/70">
                    Deixe em branco para ser chamado de "Boss".
                </p>
            </div>

            {/* Custom Avatar URL */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider block">Avatar por URL (Opcional)</label>
                <input
                    type="text"
                    value={customAvatarUrl}
                    onChange={(e) => {
                        setCustomAvatarUrl(e.target.value)
                        if (e.target.value.trim()) setAvatarType('url')
                    }}
                    placeholder="https://exemplo.com/avatar.png"
                    className="w-full input-field !bg-surface text-sm border border-outline-variant rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none"
                />
            </div>

            {/* Avatar Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider block">Avatar</label>
                    <button
                        type="button"
                        onClick={() => setShowAllAvatars(!showAllAvatars)}
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                    >
                        {showAllAvatars ? 'Ver menos' : 'Ver todos'}
                        {showAllAvatars ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {/* Default Crown */}
                    <button
                        type="button"
                        onClick={() => { setAvatarType('icon'); setSelectedIcon('crown') }}
                        className={`w-full aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${avatarType === 'icon' && selectedIcon === 'crown' ? 'border-primary bg-primary-container/30' : 'border-outline-variant hover:border-primary/50 bg-surface'}`}
                    >
                        <img src={crownLogo} className="w-5 h-5 opacity-80" alt="Crown" />
                    </button>

                    {/* Other Icons */}
                    {AVATAR_ICONS.filter(i => i.value !== 'crown').slice(0, showAllAvatars ? undefined : 6).map(avatar => (
                        <button
                            key={avatar.value}
                            type="button"
                            onClick={() => { setAvatarType('icon'); setSelectedIcon(avatar.value) }}
                            className={`w-full aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${avatarType === 'icon' && selectedIcon === avatar.value ? 'border-primary bg-primary-container/30 text-primary' : 'border-outline-variant hover:border-primary/50 bg-surface text-on-surface-variant'}`}
                            title={avatar.label}
                        >
                            <avatar.icon className="w-5 h-5" />
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

            {/* Save Button */}
            <div className="pt-4 border-t border-outline-variant/30 bg-surface -mx-6 px-6 -mb-6 pb-6 mt-4">
                <button
                    onClick={handleSaveProfile}
                    className="w-full py-4 bg-primary text-on-primary rounded-[16px] font-bold shadow-2 active:scale-[0.98] transition-all"
                >
                    Salvar Alterações
                </button>
            </div>
        </div>
    )
}
