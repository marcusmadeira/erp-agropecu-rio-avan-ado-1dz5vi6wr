import pb from '@/lib/pocketbase/client'

export const getVendas = () =>
  pb.collection('vendas').getFullList({ expand: 'cliente_id,evento_id', sort: '-created' })
export const getVenda = (id: string) =>
  pb.collection('vendas').getOne(id, { expand: 'cliente_id,evento_id' })

export const createVenda = async (venda: any, itens: any[]) => {
  const record = await pb.collection('vendas').create({
    ...venda,
    quantidade_animais: itens.length,
    valor_total_venda: itens.reduce(
      (acc, item) => acc + (Number(item.valor_unitario) - Number(item.desconto_aplicado || 0)),
      0,
    ),
  })

  try {
    for (const item of itens) {
      await pb.collection('itens_venda').create({
        venda_id: record.id,
        animal_id: item.animal_id,
        valor_unitario: Number(item.valor_unitario),
        desconto_aplicado: Number(item.desconto_aplicado || 0),
      })
    }
  } catch (err) {
    console.error('Failed to create items', err)
    throw err
  }

  return record
}

export const updateVendaStatus = (id: string, status: string) =>
  pb.collection('vendas').update(id, { status_venda: status })
export const deleteVenda = async (id: string) => {
  await pb.collection('vendas').delete(id)
}

export const getParceirosClientes = () => pb.collection('parceiros_negocios').getFullList()
export const getEventos = () => pb.collection('eventos_venda').getFullList()
export const getAnimaisDisponiveis = () =>
  pb.collection('animais').getFullList({ filter: "status != 'Vendido'", sort: '-created' })
