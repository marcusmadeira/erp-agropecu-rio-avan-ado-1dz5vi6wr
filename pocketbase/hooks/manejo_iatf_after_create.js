onRecordAfterCreateSuccess((e) => {
  const touroId = e.record.get('touro_utilizado_id')
  if (touroId) {
    try {
      const estoques = $app.findRecordsByFilter(
        'estoque_semen',
        'touro_id = {:touroId}',
        '-created',
        1,
        0,
        { touroId: touroId },
      )
      if (estoques.length > 0) {
        const estoque = estoques[0]
        const disp = estoque.get('doses_palhetas_disponiveis') || 0
        if (disp > 0) {
          estoque.set('doses_palhetas_disponiveis', disp - 1)
          $app.save(estoque)
        }
      }
    } catch (err) {
      console.log('Error updating semen inventory', err.message)
    }
  }
  e.next()
}, 'manejo_iatf_curral')
