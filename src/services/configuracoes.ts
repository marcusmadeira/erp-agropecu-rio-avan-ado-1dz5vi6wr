import pb from '@/lib/pocketbase/client'

export interface SystemConfig {
  id: string
  logo: string
  taxa_oportunidade_padrao?: number
}

export const getSystemConfig = async () => {
  try {
    const records = await pb.collection('configuracoes_sistema').getList(1, 1)
    if (records.items.length > 0) return records.items[0]
    return null
  } catch (e) {
    return null
  }
}

export const updateSystemConfig = async (id: string | null, data: FormData) => {
  if (id) {
    return pb.collection('configuracoes_sistema').update(id, data)
  } else {
    return pb.collection('configuracoes_sistema').create(data)
  }
}

export const getLogoUrl = (record: any) => {
  if (!record || !record.logo) return null
  return pb.files.getURL(record, record.logo)
}
