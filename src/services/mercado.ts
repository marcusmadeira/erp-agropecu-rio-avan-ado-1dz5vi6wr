import pb from '@/lib/pocketbase/client'

export const getPrecosMercado = async () => {
  try {
    const records = await pb.collection('precos_mercado').getFullList({ sort: '-data_registro' })
    return records
  } catch {
    return []
  }
}

export const createPrecoMercado = (data: any) => pb.collection('precos_mercado').create(data)
export const updatePrecoMercado = (id: string, data: any) =>
  pb.collection('precos_mercado').update(id, data)
export const deletePrecoMercado = (id: string) => pb.collection('precos_mercado').delete(id)

export const getAnaliseTendencia = () => pb.send('/backend/v1/analise-tendencia', { method: 'GET' })
