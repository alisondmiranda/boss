import { useSettingsStore } from '../store/settingsStore'

const SYSTEM_INSTRUCTION = `Você é o Boss, um assistente de vida inteligente. Seu trabalho é ajudar o usuário a organizar tarefas em 3 setores: work (trabalho), health (saúde) e personal (pessoal).

Quando o usuário pedir para criar, editar ou remover uma tarefa, responda APENAS com um JSON válido no formato:
{
  "action": "add" | "update" | "delete" | "query" | "chat",
  "task": {
    "title": "string",
    "sector": "work" | "health" | "personal"
  },
  "message": "Mensagem amigável para o usuário"
}

Se for apenas uma conversa normal sem ação de tarefa, use action: "chat" e apenas o campo message.

Exemplos:
- "Agendar dentista amanhã" -> { "action": "add", "task": { "title": "Dentista amanhã", "sector": "health" }, "message": "Agendei sua consulta no dentista!" }
- "Reunião com cliente às 15h" -> { "action": "add", "task": { "title": "Reunião com cliente às 15h", "sector": "work" }, "message": "Reunião adicionada ao seu quadro de trabalho." }
- "Oi, tudo bem?" -> { "action": "chat", "message": "Olá! Estou bem, obrigado. Como posso ajudar você hoje?" }

Seja conciso, profissional e amigável.`

export interface GeminiResponse {
    action: 'add' | 'update' | 'delete' | 'query' | 'chat'
    task?: {
        title: string
        sector: 'work' | 'health' | 'personal'
    }
    message: string
}

export async function sendMessageToGemini(userMessage: string): Promise<GeminiResponse> {
    const apiKey = useSettingsStore.getState().geminiApiKey

    if (!apiKey) {
        return {
            action: 'chat',
            message: 'Por favor, configure sua chave de API do Gemini nas configurações.'
        }
    }

    try {
        // O modelo 1.5 não está disponível para esta chave. Usando 2.0 Experimental (Funcional e Gratuito)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${SYSTEM_INSTRUCTION}\n\nUser: ${userMessage}`
                        }]
                    }]
                })
            }
        )

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Gemini API Rest Error:', errorData)
            throw new Error(errorData.error?.message || `Erro HTTP: ${response.status}`)
        }

        const data = await response.json()
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!responseText) {
            throw new Error('A IA não retornou nenhuma resposta.')
        }

        // Try to parse JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as GeminiResponse
        }

        // Fallback if no JSON found
        return {
            action: 'chat',
            message: responseText
        }

    } catch (error: any) {
        console.error('Gemini API Error:', error)

        let friendlyError = error.message || 'Erro desconhecido'
        if (friendlyError.includes('404') || friendlyError.includes('not found')) {
            friendlyError = 'Erro 404: O modelo de IA não foi encontrado. Verifique se a API "Generative Language" está ativada no seu projeto do Google Cloud.'
        } else if (friendlyError.includes('API key not valid')) {
            friendlyError = 'Chave de API inválida.'
        }

        return {
            action: 'chat',
            message: `Erro Sistema: ${friendlyError}`
        }
    }
}
