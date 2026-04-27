import pb from '@/lib/pocketbase/client'

export const getAnimais = async (options?: any) => {
  try {
    const qs = new URLSearchParams()
    if (options?.categoria && options.categoria !== 'all') qs.append('categoria', options.categoria)
    if (options?.sexo && options.sexo !== 'all') qs.append('sexo', options.sexo)
    if (options?.status && options.status !== 'all') qs.append('status', options.status)
    if (options?.lote_id && options.lote_id !== 'all') qs.append('lote_id', options.lote_id)

    return await pb.send(`/backend/v1/animais/listar?${qs.toString()}`, { method: 'GET' })
  } catch (error: any) {
    console.warn('Fallback to direct collection access for animais', error)

    const filters: string[] = []
    if (options?.categoria && options.categoria !== 'all')
      filters.push(`categoria="${options.categoria}"`)
    if (options?.sexo && options.sexo !== 'all') filters.push(`sexo="${options.sexo}"`)
    if (options?.status && options.status !== 'all') filters.push(`status="${options.status}"`)
    if (options?.lote_id && options.lote_id !== 'all')
      filters.push(`lote_atual_id="${options.lote_id}"`)

    return await pb.collection('animais').getFullList({
      filter: filters.length > 0 ? filters.join(' && ') : '',
      expand: 'lote_atual_id,pai_id,mae_id',
      sort: '-created',
    })
  }
}

export const getAnimal = (id: string, options?: any) =>
  pb.collection('animais').getOne(id, { expand: 'lote_atual_id,pai_id,mae_id', ...options })

export const createAnimal = (data: any) =>
  pb.send('/backend/v1/animais/criar', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })

export const updateAnimal = (id: string, data: any) =>
  pb.send(`/backend/v1/animais/atualizar/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })

export const deleteAnimal = (id: string) =>
  pb.send(`/backend/v1/animais/deletar/${id}`, { method: 'DELETE' })

export const getRentabilidadeAnimal = (id: string) =>
  pb.send(`/backend/v1/animais/${id}/rentabilidade`, { method: 'GET' })
