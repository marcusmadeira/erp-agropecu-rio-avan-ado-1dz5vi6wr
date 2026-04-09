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
    if (contextData.categoria === 'Bezerro' && contextData.animais?.length > 0) {
      const maes = contextData.animais.filter((a: any) => a.categoria === 'Matriz PO')
      const pais = contextData.animais.filter((a: any) => a.categoria === 'Touro PO')

      const suggestion: any = { peso_atual_kg: 250 }
      if (maes.length > 0) suggestion.mae_id = maes[0].id
      if (pais.length > 0) suggestion.pai_id = pais[0].id

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Notei que você selecionou "Bezerro". Sugiro um peso inicial de 250kg e preenchi sugestões de Pai e Mãe com base no rebanho. Deseja aplicar?',
          suggestion,
        },
      ])
    }
  }, [contextData.categoria, contextData.animais])

  const handleSend = () => {
    if (!input.trim()) return
    setMessages((prev) => [...prev, { role: 'user', text: input }])
    setInput('')

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Ainda estou em fase de aprendizado contínuo, mas registrei sua preferência para melhorar as próximas sugestões!',
        },
      ])
    }, 1000)
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
