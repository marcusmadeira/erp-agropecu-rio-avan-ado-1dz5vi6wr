onRecordAfterCreateSuccess((e) => {
  const touroId = e.record.get('touro_utilizado_id')
  if (touroId) {
    try {
      let filter = 'touro_id = {:touroId}'
      let params = { touroId: touroId }

      const canecaId = e.record.get('caneca_id')
      if (canecaId) {
        filter += ' && caneca_id = {:canecaId}'
        params.canecaId = canecaId
      }

      const estoques = $app.findRecordsByFilter('estoque_semen', filter, '-created', 1, 0, params)
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
