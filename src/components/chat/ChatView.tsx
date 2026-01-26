import { Loader2, Send } from 'lucide-react'

interface ChatViewProps {
    chatMessages: any[]
    isThinking: boolean
    chatEndRef: React.RefObject<HTMLDivElement>
    chatInput: string
    setChatInput: (input: string) => void
    handleChatSubmit: (e: React.FormEvent) => void
}

export function ChatView({
    chatMessages,
    isThinking,
    chatEndRef,
    chatInput,
    setChatInput,
    handleChatSubmit
}: ChatViewProps) {
    return (
        <div className="max-w-2xl mx-auto h-full flex flex-col py-6">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-on-primary rounded-tr-sm' : 'bg-surface text-on-surface border border-outline-variant/50 rounded-tl-sm'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-surface p-4 rounded-3xl rounded-tl-sm flex items-center gap-3 border border-outline-variant/50 shadow-sm">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <span className="text-sm text-on-surface-variant font-medium">Boss está pensando...</span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="mt-4 relative">
                <form onSubmit={handleChatSubmit} className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-md group-hover:bg-primary/10 transition-colors" />
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Em breve..."
                        className="w-full bg-surface border border-outline-variant/50 rounded-3xl pl-6 pr-14 py-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm relative z-10 disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={true}
                    />
                    <button
                        type="submit"
                        disabled={!chatInput.trim() || isThinking}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-on-primary rounded-full disabled:opacity-50 transition-all hover:shadow-md hover:scale-105 active:scale-95 z-20"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    )
}
