import pb from '@/lib/pocketbase/client'

export interface Lote {
  id: string
  nome_lote: string
  centro_custo?: 'CC01-Nelore PO' | 'CC02-Comercial TIP'
  quantidade_cabecas?: number
  peso_medio_lote?: number
  custo_acumulado_nutricao?: number
  created: string
  updated: string
}

export const getLotes = () => pb.collection('lotes').getFullList<Lote>()
export const getLote = (id: string) => pb.collection('lotes').getOne<Lote>(id)
export const createLote = (data: Partial<Lote>) => pb.collection('lotes').create<Lote>(data)
export const updateLote = (id: string, data: Partial<Lote>) =>
  pb.collection('lotes').update<Lote>(id, data)
export const deleteLote = (id: string) => pb.collection('lotes').delete(id)
