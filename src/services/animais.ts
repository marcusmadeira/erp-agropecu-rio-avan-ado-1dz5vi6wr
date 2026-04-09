import pb from '@/lib/pocketbase/client'
import type { Lote } from './lotes'

export interface Animal {
  id: string
  id_manejo_brinco: string
  rgd_rgn_abcz?: string
  categoria?: 'Matriz PO' | 'Touro PO' | 'Bezerro' | 'Novilha TIP' | 'Garrote TIP'
  status?: string
  lote_atual?: string
  peso_atual_kg?: number
  genealogia_pai?: string
  genealogia_mae?: string
  custo_variavel_acumulado?: number
  created: string
  updated: string
  expand?: {
    lote_atual?: Lote
  }
}

export const getAnimais = () =>
  pb.collection('animais').getFullList<Animal>({ sort: '-created', expand: 'lote_atual' })

export const getAnimal = (id: string) =>
  pb.collection('animais').getOne<Animal>(id, { expand: 'lote_atual' })

export const createAnimal = (data: Partial<Animal>) => pb.collection('animais').create<Animal>(data)

export const updateAnimal = (id: string, data: Partial<Animal>) =>
  pb.collection('animais').update<Animal>(id, data)

export const deleteAnimal = (id: string) => pb.collection('animais').delete(id)
