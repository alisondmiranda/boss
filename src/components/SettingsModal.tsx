import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Settings, X, Key, ExternalLink, Check, AlertCircle, Plus, Trash2, Tag,
    Briefcase, Heart, User, Home, DollarSign, Book, Plane, Star, Zap,
    Coffee, Music, Gamepad, Bookmark, Pencil // Added Pencil icon
} from 'lucide-react'
import { useSettingsStore, Sector } from '../store/settingsStore'
import { useToast } from '../store/toastStore'

export const ICONS = [
    { value: 'briefcase', icon: Briefcase, label: 'Trabalho' },
    { value: 'heart', icon: Heart, label: 'Saúde' },
    { value: 'user', icon: User, label: 'Pessoal' },
    { value: 'home', icon: Home, label: 'Casa' },
    { value: 'dollar-sign', icon: DollarSign, label: 'Finanças' },
    { value: 'book', icon: Book, label: 'Estudos' },
    { value: 'plane', icon: Plane, label: 'Viagem' },
    { value: 'star', icon: Star, label: 'Importante' },
    { value: 'zap', icon: Zap, label: 'Urgente' },
    { value: 'coffee', icon: Coffee, label: 'Lazer' },
    { value: 'music', icon: Music, label: 'Música' },
    { value: 'gamepad', icon: Gamepad, label: 'Games' },
    { value: 'bookmark', icon: Bookmark, label: 'Outros' },
    { value: 'tag', icon: Tag, label: 'Tag' }
]

const COLORS: { value: Sector['color'], hex: string, label: string }[] = [
    { value: 'slate', hex: '#64748b', label: 'Cinza' },
    { value: 'red', hex: '#ef4444', label: 'Vermelho' },
    { value: 'orange', hex: '#f97316', label: 'Laranja' },
    { value: 'amber', hex: '#f59e0b', label: 'Âmbar' },
    { value: 'yellow', hex: '#eab308', label: 'Amarelo' },
    { value: 'lime', hex: '#84cc16', label: 'Lima' },
    { value: 'green', hex: '#10b981', label: 'Verde' },
    { value: 'teal', hex: '#14b8a6', label: 'Verde Água' },
    { value: 'cyan', hex: '#06b6d4', label: 'Ciano' },
    { value: 'sky', hex: '#0ea5e9', label: 'Céu' },
    { value: 'blue', hex: '#3b82f6', label: 'Azul' },
    { value: 'indigo', hex: '#6366f1', label: 'Índigo' },
    { value: 'violet', hex: '#8b5cf6', label: 'Violeta' },
    { value: 'purple', hex: '#a855f7', label: 'Roxo' },
    { value: 'fuchsia', hex: '#d946ef', label: 'Fúcsia' },
    { value: 'pink', hex: '#ec4899', label: 'Rosa' },
]

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
    initialTab?: 'api' | 'sectors'
}

export function SettingsModal({ isOpen, onClose, initialTab = 'api' }: SettingsModalProps) {
    const { geminiApiKey, setGeminiApiKey, sectors, addSector, updateSector, removeSector } = useSettingsStore()
    const { addToast } = useToast()
    const [inputKey, setInputKey] = useState(geminiApiKey || '')

    // Sector Form State
    const [activeTab, setActiveTab] = useState<'api' | 'sectors'>(initialTab)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [sectorName, setSectorName] = useState('')
    const [sectorColor, setSectorColor] = useState<Sector['color']>('blue')
    const [sectorIcon, setSectorIcon] = useState('tag')

    useEffect(() => {
        if (isOpen) setActiveTab(initialTab)
    }, [isOpen, initialTab])

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
            addToast(`Setor "${sectorName}" atualizado!`, 'success')
        } else {
            // Create New
            const newId = sectorName.toLowerCase().replace(/\s+/g, '-')
            // Simple check for duplicates
            if (sectors.some(s => s.id === newId)) {
                addToast('Já existe um setor com este ID (nome).', 'error')
                return
            }

            addSector({
                id: newId,
                label: sectorName,
                color: sectorColor,
                icon: sectorIcon
            })
            addToast(`Setor "${sectorName}" criado!`, 'success')
        }
        resetForm()
    }

    const handleEditClick = (sector: Sector) => {
        setEditingId(sector.id)
        setSectorName(sector.label)
        setSectorColor(sector.color)
        setSectorIcon(sector.icon)
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
                                onClick={() => setActiveTab('api')}
                                className={`flex-1 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === 'api' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-variant/30'}`}
                            >
                                API & IA
                            </button>
                            <button
                                onClick={() => setActiveTab('sectors')}
                                className={`flex-1 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === 'sectors' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-variant/30'}`}
                            >
                                Setores & Cores
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar bg-surface-variant/30 flex-1">
                            {activeTab === 'api' ? (
                                <div className="space-y-6">
                                    <div className="bg-primary-container p-4 rounded-xl border border-transparent">
                                        <p className="text-sm text-on-primary-container leading-relaxed">
                                            O Boss usa a inteligência do <strong>Google Gemini</strong> para organizar suas tarefas.
                                            Sua chave fica salva apenas no seu navegador.
                                        </p>
                                    </div>

                                    <div>
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
                                            />
                                            <button
                                                onClick={handleSaveKey}
                                                className="h-[50px] px-6 bg-primary text-on-primary rounded-[12px] hover:shadow-2 transition-all flex items-center justify-center"
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
                                            <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-primary hover:underline flex items-center gap-1">
                                                Obter chave <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <form onSubmit={handleSaveSector} className={`space-y-4 bg-surface p-5 rounded-[20px] shadow-1 border transition-colors ${editingId ? 'border-primary ring-1 ring-primary/20' : 'border-outline-variant/50'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-sm font-bold text-on-surface">
                                                {editingId ? 'Editar Setor' : 'Novo Setor'}
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
                                        <h3 className="text-sm font-bold text-on-surface px-1">Seus Setores</h3>
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
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
