onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const status = record.get('status_venda')
  const eventoId = record.get('evento_id')

  if (eventoId && (status === 'Confirmada' || status === 'Entregue')) {
    try {
      const evento = $app.findRecordById('eventos_venda', eventoId)
      const vendasEvento = $app.findRecordsByFilter(
        'vendas',
        "evento_id = {:eventoId} && (status_venda = 'Confirmada' || status_venda = 'Entregue')",
        '',
        0,
        0,
        { eventoId: eventoId },
      )
      let receita = 0
      for (let i = 0; i < vendasEvento.length; i++) {
        receita += vendasEvento[i].get('valor_total_venda') || 0
      }
      evento.set('receita_total_evento', receita)
      $app.save(evento)
    } catch (err) {}
  }

  if (status === 'Entregue') {
    try {
      const itens = $app.findRecordsByFilter('itens_venda', 'venda_id = {:vendaId}', '', 0, 0, {
        vendaId: record.get('id'),
      })
      for (let i = 0; i < itens.length; i++) {
        const animalId = itens[i].get('animal_id')
        if (animalId) {
          try {
            const animal = $app.findRecordById('animais', animalId)
            if (animal.get('status') !== 'Vendido') {
              animal.set('status', 'Vendido')
              $app.save(animal)
            }
          } catch (err) {}
        }
      }
    } catch (err) {}
  }
  e.next()
}, 'vendas')
