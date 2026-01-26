import { X, Link as LinkIcon } from 'lucide-react'
import { useToast } from '../../store/toastStore'

interface ProviderLinkButtonProps {
    provider: string
    label: string
    icon?: any
    user: any
    onLink: () => Promise<void>
    onUnlink: (identity: any) => Promise<void>
}

export function ProviderLinkButton({ provider, label, icon: Icon, user, onLink, onUnlink }: ProviderLinkButtonProps) {
    const { addToast } = useToast()

    const identity = user?.identities?.find((id: any) => id.provider === provider)
    const isLinked = !!identity

    const handleLink = async () => {
        try {
            if (isLinked) {
                if (confirm(`Desvincular conta do ${label}?`)) {
                    await onUnlink(identity)
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

export function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M21.35 11.1H12v3.8h5.36c-.23 1.25-2.23 3.66-5.36 3.66-3.23 0-5.86-2.61-5.86-6.17s2.63-6.17 5.86-6.17c1.83 0 3.04.78 3.74 1.45l2.67-2.9C16.89 3.07 14.65 2 12 2 6.48 2 2 6.48 2 12s4.48 10 10 10c5.77 0 9.6-4.06 9.6-9.77 0-.67-.06-1.31-.19-1.92z" />
        </svg>
    )
}

export function LinkedInIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.216zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
        </svg>
    )
}
