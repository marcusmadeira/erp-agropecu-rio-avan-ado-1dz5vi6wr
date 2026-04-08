import pb from '@/lib/pocketbase/client'

export interface ConversaIA {
  id: string
  usuario_id: string
  pergunta: string
  resposta: string
  created: string
  updated: string
}

export const getConversas = async (): Promise<ConversaIA[]> => {
  return pb.collection('conversas_ia').getFullList<ConversaIA>({
    sort: 'created',
  })
}

export const askAi = async (pergunta: string): Promise<ConversaIA> => {
  return pb.send('/backend/v1/ai-assistant', {
    method: 'POST',
    body: JSON.stringify({ pergunta }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const clearConversas = async (): Promise<{ success: boolean; count: number }> => {
  return pb.send('/backend/v1/ai-assistant/clear', {
    method: 'DELETE',
  })
}
