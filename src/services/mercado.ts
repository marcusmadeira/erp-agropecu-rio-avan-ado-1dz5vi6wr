import pb from '@/lib/pocketbase/client'

export const getPrecosMercado = async () => {
  try {
    const records = await pb.collection('precos_mercado').getList(1, 1, { sort: '-data_registro' })
    return records.items[0] || null
  } catch {
    return null
  }
}
