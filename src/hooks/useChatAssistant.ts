import { useState, useRef, useEffect } from 'react'
import { sendMessageToGemini, GeminiResponse } from '../lib/gemini'

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export function useChatAssistant(addTask: (title: any, sectors?: any) => Promise<void>) {
    const [chatInput, setChatInput] = useState('')
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Olá! Sou o Boss. Como posso ajudar a organizar sua vida hoje?' }
    ])
    const [isThinking, setIsThinking] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages])

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!chatInput.trim() || isThinking) return

        const userMessage = chatInput.trim()
        setChatInput('')
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsThinking(true)

        try {
            const response: GeminiResponse = await sendMessageToGemini(userMessage)
            if (response.action === 'add' && response.task) {
                // Adapter for the generic addTask which might expect title as object or string
                // In Dashboard it was calling: addTask(response.task.title, response.task.sector)
                await addTask(response.task.title, response.task.sector)
            }
            setChatMessages(prev => [...prev, { role: 'assistant', content: response.message }])
        } catch (error) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com a IA.' }])
        } finally {
            setIsThinking(false)
        }
    }

    return {
        chatInput,
        setChatInput,
        chatMessages,
        isThinking,
        chatEndRef,
        handleChatSubmit
    }
}
