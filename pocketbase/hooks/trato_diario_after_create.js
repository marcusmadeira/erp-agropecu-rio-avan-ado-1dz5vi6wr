onRecordAfterCreateSuccess((e) => {
  const rec = e.record
  const loteId = rec.get('lote_id')
  const custoTotal = rec.get('custo_total_trato')

  if (loteId && custoTotal > 0) {
    try {
      const animais = $app.findRecordsByFilter(
        'animais',
        'lote_atual = {:loteId} || lote_atual_id = {:loteId}',
        '',
        0,
        0,
        { loteId: loteId },
      )

      if (animais.length > 0) {
        const custoPorAnimal = custoTotal / animais.length
        for (let i = 0; i < animais.length; i++) {
          const anim = animais[i]
          const custoVariavel = anim.get('custo_variavel_acumulado') || 0
          anim.set('custo_variavel_acumulado', custoVariavel + custoPorAnimal)
          $app.save(anim)
        }
      }
    } catch (err) {
      console.log('Erro ao atualizar custo animal:', err.message)
    }
  }
  e.next()
}, 'trato_diario_lotes')
