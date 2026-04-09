migrate(
  (app) => {
    const eventosCol = app.findCollectionByNameOrId('eventos_venda')

    try {
      app.findFirstRecordByData('eventos_venda', 'nome_evento', 'Leilão Anual Nelore Elite')
      return
    } catch (_) {
      const r1 = new Record(eventosCol)
      r1.set('nome_evento', 'Leilão Anual Nelore Elite')
      r1.set('tipo_evento', 'Leilão')
      r1.set('data_evento', '2026-08-20 12:00:00.000Z')
      r1.set('local', 'Recinto de Leilões')
      r1.set('responsavel_evento', 'Marcos Silva')
      r1.set('status', 'Planejado')
      r1.set('custo_total_evento', 5000)
      r1.set('receita_total_evento', 0)
      app.save(r1)

      const custosCol = app.findCollectionByNameOrId('custos_evento')
      const c1 = new Record(custosCol)
      c1.set('evento_id', r1.id)
      c1.set('descricao_custo', 'Taxa de Inscrição')
      c1.set('valor_custo', 5000)
      c1.set('data_custo', '2026-08-01 12:00:00.000Z')
      app.save(c1)
    }
  },
  (app) => {
    try {
      const r = app.findFirstRecordByData(
        'eventos_venda',
        'nome_evento',
        'Leilão Anual Nelore Elite',
      )
      app.delete(r)
    } catch (_) {}
  },
)
