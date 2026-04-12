import pb from '@/lib/pocketbase/client'

export const getVendas = () => pb.send('/backend/v1/vendas', { method: 'GET' })

export const getVenda = (id: string) =>
  pb.collection('vendas').getOne(id, { expand: 'cliente_id,evento_id' })

export const getVendaCompleta = async (id: string) => {
  const venda = await pb.collection('vendas').getOne(id, { expand: 'cliente_id' })
  const itens = await pb
    .collection('itens_venda')
    .getFullList({ filter: `venda_id='${id}'`, expand: 'animal_id' })
  const parcelas = await pb
    .collection('parcelas_venda')
    .getFullList({ filter: `venda_id='${id}'`, sort: 'numero_parcela' })
  return { venda, itens, parcelas }
}

export const createVenda = async (venda: any, itens: any[], parcelas: any[]) => {
  const valor_total_venda = itens.reduce(
    (acc, item) => acc + (Number(item.valor_unitario) - Number(item.desconto_aplicado || 0)),
    0,
  )

  const record = await pb.collection('vendas').create({
    ...venda,
    quantidade_animais: itens.length,
    numero_parcelas: parcelas.length || 1,
    valor_total_venda,
  })

  try {
    for (const item of itens) {
      await pb.collection('itens_venda').create({
        venda_id: record.id,
        animal_id: item.animal_id,
        valor_unitario: Number(item.valor_unitario),
        desconto_aplicado: Number(item.desconto_aplicado || 0),
      })
      await pb.collection('animais').update(item.animal_id, { status: 'Vendido' })
    }
    // Criação de parcelas e transações agora é feita automaticamente pelo edge function 'vendas_after_create'
  } catch (err) {
    console.error('Failed to create items', err)
    throw err
  }

  return record
}

export const updateVenda = async (id: string, venda: any, itens: any[], parcelas: any[]) => {
  const valor_total_venda = itens.reduce(
    (acc, item) => acc + (Number(item.valor_unitario) - Number(item.desconto_aplicado || 0)),
    0,
  )

  const record = await pb.collection('vendas').update(id, {
    ...venda,
    quantidade_animais: itens.length,
    valor_total_venda,
  })

  try {
    const oldItens = await pb.collection('itens_venda').getFullList({ filter: `venda_id='${id}'` })
    for (const oi of oldItens) {
      await pb.collection('itens_venda').delete(oi.id)
    }

    for (const item of itens) {
      await pb.collection('itens_venda').create({
        venda_id: record.id,
        animal_id: item.animal_id,
        valor_unitario: Number(item.valor_unitario),
        desconto_aplicado: Number(item.desconto_aplicado || 0),
      })
      await pb.collection('animais').update(item.animal_id, { status: 'Vendido' })
    }

    const oldParcelas = await pb
      .collection('parcelas_venda')
      .getFullList({ filter: `venda_id='${id}'` })
    for (const op of oldParcelas) {
      await pb.collection('parcelas_venda').delete(op.id)
    }

    if (venda.forma_pagamento === 'Parcelado' && parcelas.length > 0) {
      for (const p of parcelas) {
        await pb.collection('parcelas_venda').create({
          venda_id: record.id,
          numero_parcela: p.numero,
          valor_parcela: Number(p.valor),
          data_vencimento: p.data_vencimento,
          status_parcela: p.status_parcela || 'Pendente',
        })
      }
    } else {
      await pb.collection('parcelas_venda').create({
        venda_id: record.id,
        numero_parcela: 1,
        valor_parcela: valor_total_venda,
        data_vencimento: new Date().toISOString(),
        status_parcela: 'Pendente',
      })
    }
  } catch (err) {
    console.error('Failed to update items/parcelas', err)
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

export const getAnimaisParaVenda = async (vendaId?: string) => {
  const disponiveis = await pb.collection('animais').getFullList({ filter: "status != 'Vendido'" })
  if (!vendaId) return disponiveis

  const itens = await pb
    .collection('itens_venda')
    .getFullList({ filter: `venda_id='${vendaId}'`, expand: 'animal_id' })
  const animaisVenda = itens.map((i) => i.expand?.animal_id).filter(Boolean)

  const map = new Map()
  disponiveis.forEach((a) => map.set(a.id, a))
  animaisVenda.forEach((a) => map.set(a.id, a))
  return Array.from(map.values())
}
