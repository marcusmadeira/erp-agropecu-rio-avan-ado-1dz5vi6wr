import pb from '@/lib/pocketbase/client'

export interface NascimentoDesmama {
  id: string
  matriz_mae_id: string
  data_nascimento: string
  sexo?: 'Macho' | 'Fêmea'
  peso_nascer?: number
  status_cria?: string
  rgn_provisorio_abcz?: string
  created: string
  updated: string
  expand?: {
    matriz_mae_id?: { id_manejo_brinco: string; id: string }
  }
}

export const getNascimentos = () =>
  pb.collection('nascimentos_e_desmama').getFullList<NascimentoDesmama>({
    expand: 'matriz_mae_id',
  })

export const getNascimento = (id: string) =>
  pb.collection('nascimentos_e_desmama').getOne<NascimentoDesmama>(id, {
    expand: 'matriz_mae_id',
  })

export const createNascimento = (data: Partial<NascimentoDesmama>) =>
  pb.collection('nascimentos_e_desmama').create<NascimentoDesmama>(data)

export const updateNascimento = (id: string, data: Partial<NascimentoDesmama>) =>
  pb.collection('nascimentos_e_desmama').update<NascimentoDesmama>(id, data)

export const deleteNascimento = (id: string) => pb.collection('nascimentos_e_desmama').delete(id)
