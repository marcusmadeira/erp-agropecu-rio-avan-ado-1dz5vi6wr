import pb from '@/lib/pocketbase/client'

export const extrairDocumentoIA = (base64: string, mimeType: string) =>
  pb.send('/backend/v1/extrair-documento-ia', {
    method: 'POST',
    body: JSON.stringify({ base64, mimeType }),
    headers: { 'Content-Type': 'application/json' },
  })

export const processarImportacaoAnimais = (registros: any[], origem: string) =>
  pb.send('/backend/v1/processar-importacao-animais', {
    method: 'POST',
    body: JSON.stringify({ registros, origem }),
    headers: { 'Content-Type': 'application/json' },
  })

export const processarImportacao = (
  tipo_dado: string,
  registros: any[],
  arquivo_nome: string,
  estrategia: string,
) =>
  pb.send('/backend/v1/processar-importacao', {
    method: 'POST',
    body: JSON.stringify({ tipo_dado, registros, arquivo_nome, estrategia }),
    headers: { 'Content-Type': 'application/json' },
  })

export const importarAnimais = (
  registros: any[],
  arquivo_nome: string = 'import.csv',
  estrategia: string = 'apenas_validos',
) => processarImportacao('animais', registros, arquivo_nome, estrategia)

export const desfazerImportacao = (id: string) =>
  pb.send(`/backend/v1/desfazer-importacao/${id}`, { method: 'POST' })

export const getHistoricoImportacoes = () =>
  pb.collection('historico_importacoes').getFullList({ sort: '-created', expand: 'usuario_id' })
