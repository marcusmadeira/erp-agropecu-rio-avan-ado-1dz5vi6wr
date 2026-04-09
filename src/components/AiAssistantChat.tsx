import { useState, useEffect } from 'react'
import { Sparkles, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AiAssistantChatProps {
  contextData: any
  onAcceptSuggestion: (suggestion: any) => void
}

export function AiAssistantChat({ contextData, onAcceptSuggestion }: AiAssistantChatProps) {
  const [messages, setMessages] = useState<
    { role: 'user' | 'ai'; text: string; suggestion?: any }[]
  >([{ role: 'ai', text: 'Olá! Sou o ADAPT. Como posso ajudar com este cadastro?' }])
  const [input, setInput] = useState('')

  useEffect(() => {
    if (contextData.categoria && contextData.animais?.length > 0) {
      const maes = contextData.animais.filter((a: any) => a.categoria === 'Matriz PO')
      const pais = contextData.animais.filter((a: any) => a.categoria === 'Touro PO')

      let pesoSugerido = 0
      if (contextData.categoria === 'Bezerro') pesoSugerido = 250
      else if (contextData.categoria === 'Matriz PO') pesoSugerido = 450
      else if (contextData.categoria === 'Touro PO') pesoSugerido = 800
      else pesoSugerido = 300

      const suggestion: any = { peso_atual_kg: pesoSugerido }
      if (contextData.categoria === 'Bezerro') {
        if (maes.length > 0) suggestion.mae_id = maes[0].id
        if (pais.length > 0) suggestion.pai_id = pais[0].id
      }

      const txt =
        contextData.categoria === 'Bezerro'
          ? `Notei que você selecionou "Bezerro". Sugiro um peso inicial de ${pesoSugerido}kg e preenchi sugestões de Pai e Mãe com base na genealogia histórica para evitar consanguinidade. Deseja aplicar?`
          : `Para a categoria "${contextData.categoria}", o peso médio histórico aponta ${pesoSugerido}kg. Posso preencher isso para você?`

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: txt,
          suggestion,
        },
      ])
    }
  }, [contextData.categoria, contextData.animais])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setInput('')

    try {
      const pb = (await import('@/lib/pocketbase/client')).default
      const res = await pb.send('/backend/v1/ai-assistant', {
        method: 'POST',
        body: JSON.stringify({ pergunta: userMsg }),
      })
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: res.resposta || 'Anotado! Como posso ajudar mais?',
        },
      ])
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Ainda estou em fase de aprendizado contínuo. Desculpe, não consegui conectar à base no momento.',
        },
      ])
    }
  }

  return (
    <div className="flex flex-col h-[500px] border-l pl-6">
      <h4 className="font-semibold flex items-center gap-2 mb-4 text-[#094016]">
        <Sparkles className="h-5 w-5" /> ADAPT AI
      </h4>
      <ScrollArea className="flex-1 bg-muted/30 rounded-md p-4 mb-4">
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.role === 'ai' ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`p-3 rounded-lg max-w-[90%] text-sm ${m.role === 'ai' ? 'bg-[#094016]/10 text-[#094016]' : 'bg-muted text-foreground'}`}
              >
                {m.text}
              </div>
              {m.suggestion && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-[#094016] text-[#094016]"
                  onClick={() => onAcceptSuggestion(m.suggestion)}
                >
                  Aceitar Sugestão
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte ao ADAPT..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button
          size="icon"
          onClick={handleSend}
          className="bg-[#094016] hover:bg-[#094016]/90 text-white shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
