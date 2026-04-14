import pb from '@/lib/pocketbase/client'

export interface IngredienteReceita {
  id_produto: string
  proporcao_percentual: number
}

export interface FormulacaoRacao {
  id: string
  nome_formulacao: string
  categoria_animal: string
  ingredientes: IngredienteReceita[]
  custo_kg_produzido: number
  usuario_id: string
  created: string
  updated: string
}

export const getFormulacoes = () => {
  return pb.collection('formulacoes_racao').getFullList<FormulacaoRacao>({ sort: '-created' })
}

export const getFormulacao = (id: string) => {
  return pb.collection('formulacoes_racao').getOne<FormulacaoRacao>(id)
}

export const createFormulacao = (data: Partial<FormulacaoRacao>) => {
  return pb.collection('formulacoes_racao').create<FormulacaoRacao>({
    ...data,
    usuario_id: pb.authStore.record?.id,
  })
}

export const updateFormulacao = (id: string, data: Partial<FormulacaoRacao>) => {
  return pb.collection('formulacoes_racao').update<FormulacaoRacao>(id, data)
}

export const deleteFormulacao = (id: string) => {
  return pb.collection('formulacoes_racao').delete(id)
}
