import pb from '@/lib/pocketbase/client'

export interface ParceiroNegocio {
  id: string
  nome_razao_social: string
  tipo_documento?: 'CPF' | 'CNPJ'
  numero_documento?: string
  contato_whatsapp?: string
  email?: string
  categoria_parceiro?: 'Fornecedor' | 'Cliente' | 'Funcionário' | 'Transportadora'
  status?: string
  created: string
  updated: string
}

export const getParceiros = () => pb.collection('parceiros_negocios').getFullList<ParceiroNegocio>()
export const getParceiro = (id: string) =>
  pb.collection('parceiros_negocios').getOne<ParceiroNegocio>(id)
export const createParceiro = (data: Partial<ParceiroNegocio>) =>
  pb.collection('parceiros_negocios').create<ParceiroNegocio>(data)
export const updateParceiro = (id: string, data: Partial<ParceiroNegocio>) =>
  pb.collection('parceiros_negocios').update<ParceiroNegocio>(id, data)
export const deleteParceiro = (id: string) => pb.collection('parceiros_negocios').delete(id)
