import pb from '@/lib/pocketbase/client'

export const importarAnimais = (arquivo_nome: string, registros: any[]) =>
  pb.send('/backend/v1/importar-animais', {
    method: 'POST',
    body: JSON.stringify({ arquivo_nome, registros }),
    headers: { 'Content-Type': 'application/json' },
  })

export const desfazerImportacao = (id: string) =>
  pb.send(`/backend/v1/desfazer-importacao/${id}`, { method: 'POST' })

export const getHistoricoImportacoes = () =>
  pb.collection('historico_importacoes').getFullList({ sort: '-created', expand: 'usuario_id' })
