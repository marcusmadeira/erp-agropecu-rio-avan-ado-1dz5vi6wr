import pb from '@/lib/pocketbase/client'

export interface PesagemDiaria {
  id: string
  animal_id: string
  data_pesagem: string
  peso_kg: number
  responsavel_pesagem?: string
  observacoes?: string
  created: string
  updated: string
  expand?: {
    animal_id?: {
      id: string
      id_manejo_brinco: string
      [key: string]: any
    }
  }
}

export const getPesagens = async (options?: any) => {
  if (options?.filter && options.filter.includes('animal_id =')) {
    const match = options.filter.match(/animal_id\s*=\s*['"]([^'"]+)['"]/)
    if (match && match[1]) {
      return pb.send(`/backend/v1/animais/${match[1]}/pesagens`, { method: 'GET' })
    }
  }
  return pb.collection('pesagens_diarias').getFullList<PesagemDiaria>(options)
}

export const getPesagem = async (id: string, options?: any) => {
  return pb.collection('pesagens_diarias').getOne<PesagemDiaria>(id, options)
}

export const createPesagem = async (data: Partial<PesagemDiaria>) => {
  return pb.send('/backend/v1/animais/pesagem', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const updatePesagem = async (id: string, data: Partial<PesagemDiaria>) => {
  return pb.collection('pesagens_diarias').update<PesagemDiaria>(id, data)
}

export const deletePesagem = async (id: string) => {
  return pb.collection('pesagens_diarias').delete(id)
}

export const getHistoricoPesagem = async (animalId: string) => {
  return pb.send(`/backend/v1/animais/${animalId}/pesagens`, { method: 'GET' })
}
