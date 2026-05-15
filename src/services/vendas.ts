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
  const payload = {
    venda: {
      ...venda,
      valor_total_venda: itens.reduce(
        (acc, item) =>
          acc +
          (Number(item.valor_total || item.valor_unitario) - Number(item.desconto_aplicado || 0)),
        0,
      ),
      quantidade_animais: itens.reduce((acc, item) => acc + Number(item.quantidade || 1), 0),
      numero_parcelas: parcelas.length || 1,
    },
    itens,
    parcelas,
  }
  const res = await pb.send('/backend/v1/vendas/registrar', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
  return { id: res.id }
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
      const payload: any = {
        venda_id: record.id,
        tipo_item: item.tipo_item || 'Animal',
        quantidade: item.quantidade || 1,
        valor_unitario: Number(item.valor_unitario || 0),
        valor_total: Number(item.valor_total || item.valor_unitario || 0),
        desconto_aplicado: Number(item.desconto_aplicado || 0),
      }
      if (item.tipo_item === 'Lote') {
        payload.lote_id = item.lote_id
        const oldItem = oldItens.find((oi: any) => oi.lote_id === item.lote_id)
        if (oldItem) {
          payload.lote_id_origem = oldItem.lote_id_origem
          payload.pastagem_id_origem = oldItem.pastagem_id_origem
        } else {
          try {
            const lote = await pb.collection('lotes').getOne(item.lote_id)
            payload.lote_id_origem = lote.id
            payload.pastagem_id_origem = lote.piquete_atual_id
          } catch {
            /* intentionally ignored */
          }
        }
      } else {
        payload.animal_id = item.animal_id
        const oldItem = oldItens.find((oi: any) => oi.animal_id === item.animal_id)
        if (oldItem) {
          payload.lote_id_origem = oldItem.lote_id_origem
          payload.pastagem_id_origem = oldItem.pastagem_id_origem
          payload.peso_momento_venda = oldItem.peso_momento_venda
          payload.status_anterior = oldItem.status_anterior
        } else {
          try {
            const animal = await pb.collection('animais').getOne(item.animal_id)
            payload.lote_id_origem = animal.lote_atual_id
            payload.pastagem_id_origem = animal.piquete_atual_id
            payload.peso_momento_venda = animal.peso_atual_kg
            payload.status_anterior = animal.status
          } catch {
            /* intentionally ignored */
          }
        }
      }
      await pb.collection('itens_venda').create(payload)
      if (item.tipo_item === 'Animal' && item.animal_id) {
        await pb
          .collection('animais')
          .update(item.animal_id, { status: 'Vendido' })
          .catch(() => {})
      } else if (item.tipo_item === 'Lote' && item.lote_id) {
        try {
          const animaisLote = await pb
            .collection('animais')
            .getFullList({ filter: `lote_atual_id='${item.lote_id}' && status!='Vendido'` })
          for (const a of animaisLote) {
            await pb.collection('animais').update(a.id, { status: 'Vendido' })
          }
        } catch {
          /* intentionally ignored */
        }
      }
    }

    const oldBoletos = await pb.collection('boletos').getFullList({ filter: `venda_id='${id}'` })
    for (const ob of oldBoletos) {
      await pb.collection('boletos').delete(ob.id)
    }

    const oldParcelas = await pb
      .collection('parcelas_venda')
      .getFullList({ filter: `venda_id='${id}'` })
    for (const op of oldParcelas) {
      await pb.collection('parcelas_venda').delete(op.id)
    }

    if (venda.forma_pagamento === 'Parcelado' && parcelas.length > 0) {
      for (let i = 0; i < parcelas.length; i++) {
        const p = parcelas[i]
        const recPar = await pb.collection('parcelas_venda').create({
          venda_id: record.id,
          numero_parcela: p.numero,
          valor_parcela: Number(p.valor),
          data_vencimento: p.data_vencimento,
          status_parcela: p.status_parcela || 'Pendente',
        })
        const recBol = await pb.collection('boletos').create({
          parcela_id: recPar.id,
          venda_id: record.id,
          numero_parcela: p.numero,
          numero_boleto: `BOL-${record.id.substring(0, 5).toUpperCase()}-${i + 1}-ED`,
          valor_boleto: Number(p.valor),
          data_vencimento: p.data_vencimento,
          data_vencimento_original: p.data_vencimento,
          status_boleto: p.status_parcela === 'Paga' ? 'Pago' : 'Pendente',
        })
        if (p.status_parcela === 'Paga') {
          await pb.collection('recebimentos_vendas').create({
            boleto_id: recBol.id,
            venda_id: record.id,
            data_recebimento: p.data_vencimento || venda.data_venda,
            valor_recebido: Number(p.valor),
            forma_recebimento: 'Dinheiro',
            usuario_id: pb.authStore.record?.id,
          })
        }
      }
    } else {
      const recPar = await pb.collection('parcelas_venda').create({
        venda_id: record.id,
        numero_parcela: 1,
        valor_parcela: valor_total_venda,
        data_vencimento: new Date().toISOString(),
        status_parcela: 'Pendente',
      })
      await pb.collection('boletos').create({
        parcela_id: recPar.id,
        venda_id: record.id,
        numero_parcela: 1,
        numero_boleto: `BOL-${record.id.substring(0, 5).toUpperCase()}-1-ED`,
        valor_boleto: valor_total_venda,
        data_vencimento: new Date().toISOString(),
        data_vencimento_original: new Date().toISOString(),
        status_boleto: 'Pendente',
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
