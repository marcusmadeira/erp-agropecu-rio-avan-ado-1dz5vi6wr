import pb from '@/lib/pocketbase/client'

export const getEventosG = () =>
  pb.collection('eventos_venda').getFullList({ sort: '-data_evento' })
export const createEventoG = (data: any) => pb.collection('eventos_venda').create(data)
export const updateEventoG = (id: string, data: any) =>
  pb.collection('eventos_venda').update(id, data)
export const deleteEventoG = (id: string) => pb.collection('eventos_venda').delete(id)

export const getVendasExpanded = () =>
  pb.collection('vendas').getFullList({ expand: 'cliente_id,evento_id', sort: '-data_venda' })

export const getBoletosExpanded = () =>
  pb.collection('boletos').getFullList({
    expand: 'parcela_id,parcela_id.venda_id,parcela_id.venda_id.cliente_id',
    sort: '-data_vencimento',
  })

export const getParcelasSemBoleto = async () => {
  const parcelas = await pb.collection('parcelas_venda').getFullList({
    filter: "status_parcela = 'Pendente' || status_parcela = 'Atrasada'",
    expand: 'venda_id,venda_id.cliente_id',
  })
  const boletos = await pb.collection('boletos').getFullList()
  const boletosParcelaIds = boletos.map((b) => b.parcela_id)
  return parcelas.filter((p) => !boletosParcelaIds.includes(p.id))
}

export const getUsersG = () => pb.collection('users').getFullList()
export const getParceirosG = () => pb.collection('parceiros_negocios').getFullList()
export const getAnimaisDisponiveis = () =>
  pb.collection('animais').getFullList({ filter: "status != 'Vendido'" })

export const createVendaCompleta = async (
  vendaData: any,
  animaisIds: string[],
  parcelas: number,
) => {
  const valorTotal = Number(vendaData.valor_total_venda)
  const venda = await pb.collection('vendas').create({
    ...vendaData,
    quantidade_animais: animaisIds.length,
  })
  const valorUnitario = valorTotal / (animaisIds.length || 1)

  for (const animalId of animaisIds) {
    await pb
      .collection('itens_venda')
      .create({ venda_id: venda.id, animal_id: animalId, valor_unitario: valorUnitario })
    await pb.collection('animais').update(animalId, { status: 'Vendido' })
  }

  if (vendaData.forma_pagamento === 'Parcelado' && parcelas > 0) {
    const valorParcela = valorTotal / parcelas
    for (let i = 1; i <= parcelas; i++) {
      const dt = new Date()
      dt.setDate(dt.getDate() + 30 * i)
      await pb.collection('parcelas_venda').create({
        venda_id: venda.id,
        numero_parcela: i,
        valor_parcela: valorParcela,
        data_vencimento: dt.toISOString(),
        status_parcela: 'Pendente',
      })
    }
  } else {
    await pb.collection('parcelas_venda').create({
      venda_id: venda.id,
      numero_parcela: 1,
      valor_parcela: valorTotal,
      data_vencimento: new Date().toISOString(),
      status_parcela: 'Paga',
      data_pagamento: new Date().toISOString(),
    })
  }
  return venda
}

export const cancelarVenda = (id: string) =>
  pb.collection('vendas').update(id, { status_venda: 'Cancelada' })
export const deletarVenda = (id: string) => pb.collection('vendas').delete(id)

export const gerarBoletoParaParcela = (parcelaId: string, valor: number, vencimento: string) => {
  const num = 'BOL' + Math.floor(Math.random() * 1000000000)
  return pb.collection('boletos').create({
    parcela_id: parcelaId,
    numero_boleto: num,
    data_emissao: new Date().toISOString(),
    data_vencimento: vencimento,
    valor_boleto: valor,
    status_boleto: 'Gerado',
  })
}

export const enviarBoletoEmail = (id: string) =>
  pb.send(`/backend/v1/boletos/${id}/enviar-email`, { method: 'POST' })
