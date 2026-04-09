import React, { useState, useEffect, useRef } from 'react'
import { Send, Trash2, Bot, User, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { getConversas, askAi, clearConversas, type ConversaIA } from '@/services/conversas_ia'
import { useRealtime } from '@/hooks/use-realtime'

export default function AssistenteIA() {
  const [messages, setMessages] = useState<ConversaIA[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const loadMessages = async () => {
    try {
      const data = await getConversas()
      setMessages(data)
    } catch (error) {
      console.error('Failed to load messages', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de conversas.',
        variant: 'destructive',
      })
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  useRealtime('conversas_ia', () => {
    // Only reload if we're not actively sending a message to avoid double renders
    // that might mess up the optimistic UI
    if (!isLoading) {
      loadMessages()
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const question = input.trim()
    setInput('')
    setIsLoading(true)

    // Optimistically add the user's message to the UI
    const tempMessage: ConversaIA = {
      id: 'temp-' + Date.now(),
      usuario_id: '',
      pergunta: question,
      resposta: '',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMessage])

    try {
      const savedResponse = await askAi(question)
      // Replace optimistic message with the real one
      setMessages((prev) => prev.map((m) => (m.id === tempMessage.id ? savedResponse : m)))
    } catch (error) {
      console.error('Failed to ask AI', error)
      toast({
        title: 'Erro',
        description: 'Falha ao comunicar com o assistente.',
        variant: 'destructive',
      })
      // Remove the optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = async () => {
    if (
      !window.confirm(
        'Tem certeza que deseja apagar todo o histórico de conversas? Esta ação não pode ser desfeita.',
      )
    )
      return

    setIsClearing(true)
    try {
      await clearConversas()
      setMessages([])
      toast({
        title: 'Sucesso',
        description: 'Histórico de conversas apagado.',
      })
    } catch (error) {
      console.error('Failed to clear messages', error)
      toast({
        title: 'Erro',
        description: 'Falha ao limpar o histórico.',
        variant: 'destructive',
      })
    } finally {
      setIsClearing(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[850px] bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-white z-10">
        <div className="flex items-center gap-4">
          <div className="bg-blue-900 p-2.5 rounded-xl shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-900 tracking-tight">Assistente IA</h1>
            <p className="text-sm text-blue-700/70 font-medium">
              Treinado com o Manual Gestão Pecuária 360º
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={isClearing || messages.length === 0}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 bg-white shadow-sm"
        >
          {isClearing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4 mr-2" />
          )}
          Limpar Conversa
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-blue-50/30 scroll-smooth">
        {messages.length === 0 && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-fade-in-up">
            <div className="w-20 h-20 bg-white border border-blue-100 shadow-sm rounded-2xl flex items-center justify-center mb-2">
              <Bot className="w-10 h-10 text-blue-900" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900">Como posso ajudar?</h3>
              <p className="text-blue-900/70 max-w-md mt-2 leading-relaxed">
                Faça uma pergunta sobre qualquer módulo do ERP Gestão Pecuária 360º. Estou aqui para
                tirar suas dúvidas com base em nosso manual completo.
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 font-medium shadow-sm">
                Rebanho
              </span>
              <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 font-medium shadow-sm">
                Financeiro
              </span>
              <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 font-medium shadow-sm">
                Reprodução
              </span>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="space-y-6">
              {/* User Message */}
              {msg.pergunta !== 'Mensagem de boas-vindas' && (
                <div className="flex justify-end gap-4 animate-fade-in-up">
                  <div className="max-w-[75%] bg-blue-900 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-sm">
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {msg.pergunta}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                    <User className="w-5 h-5 text-blue-900" />
                  </div>
                </div>
              )}

              {/* AI Response */}
              {msg.resposta && (
                <div className="flex justify-start gap-4 animate-fade-in-up">
                  <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center shrink-0 border-2 border-white shadow-sm mt-1">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="max-w-[85%] bg-white border border-blue-100 text-blue-950 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm">
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {/* Bold basic markdown formatting handler for simple bold text */}
                      {msg.resposta.split('**').map((chunk, i) =>
                        i % 2 === 1 ? (
                          <strong key={i} className="font-bold text-blue-900">
                            {chunk}
                          </strong>
                        ) : (
                          chunk
                        ),
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start gap-4 animate-fade-in-up">
            <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center shrink-0 border-2 border-white shadow-sm mt-1">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-blue-100 rounded-2xl rounded-tl-sm px-6 py-5 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-blue-100 z-10">
        <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida sobre o sistema..."
            className="w-full pr-14 py-7 text-[15px] bg-white border-blue-200 rounded-2xl shadow-sm focus-visible:ring-blue-900 focus-visible:bg-white transition-all"
            disabled={isLoading || isClearing}
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || isClearing}
            className="absolute right-2 h-11 w-11 bg-blue-900 hover:bg-blue-800 text-white rounded-xl transition-all shadow-sm"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </Button>
        </form>
        <div className="text-center mt-3">
          <p className="text-[11px] text-blue-900/40 font-medium tracking-wide">
            O ASSISTENTE IA É BASEADO NO MANUAL DO SISTEMA E PODE APRESENTAR IMPRECISÕES.
          </p>
        </div>
      </div>
    </div>
  )
}
