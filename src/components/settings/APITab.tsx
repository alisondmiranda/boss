import { useState } from 'react'
import { AlertCircle, Key, Check, ExternalLink } from 'lucide-react'

interface APITabProps {
    geminiApiKey: string | null
    setGeminiApiKey: (key: string) => void
    addToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export function APITab({ geminiApiKey, setGeminiApiKey, addToast }: APITabProps) {
    const [inputKey, setInputKey] = useState(geminiApiKey || '')

    const handleSaveKey = () => {
        if (inputKey.trim()) {
            setGeminiApiKey(inputKey.trim())
            addToast('Chave de API salva com sucesso!', 'success')
        }
    }

    return (
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
                        className="flex-1 bg-surface border border-outline-variant rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none h-[50px]"
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
    )
}
