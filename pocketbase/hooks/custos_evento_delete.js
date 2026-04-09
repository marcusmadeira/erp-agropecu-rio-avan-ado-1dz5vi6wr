onRecordAfterDeleteSuccess((e) => {
  const eventoId = e.record.get('evento_id')
  const custos = $app.findRecordsByFilter('custos_evento', `evento_id = '${eventoId}'`, '', 0, 0)
  let total = 0
  for (let i = 0; i < custos.length; i++) {
    total += custos[i].get('valor_custo')
  }
  const evento = $app.findRecordById('eventos_venda', eventoId)
  evento.set('custo_total_evento', total)
  $app.saveNoValidate(evento)
  e.next()
}, 'custos_evento')
