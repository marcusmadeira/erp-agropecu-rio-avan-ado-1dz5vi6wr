import pb from '@/lib/pocketbase/client'

export const getAnimais = (options?: any) => {
  const qs = new URLSearchParams()
  if (options?.categoria && options.categoria !== 'all') qs.append('categoria', options.categoria)
  if (options?.sexo && options.sexo !== 'all') qs.append('sexo', options.sexo)
  if (options?.status && options.status !== 'all') qs.append('status', options.status)
  if (options?.lote_id && options.lote_id !== 'all') qs.append('lote_id', options.lote_id)

  return pb.send(`/backend/v1/animais/listar?${qs.toString()}`, { method: 'GET' })
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
