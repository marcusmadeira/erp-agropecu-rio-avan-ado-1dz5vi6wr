onRecordAfterCreateSuccess((e) => {
  const formulacaoId = e.record.get('formulacao_id')
  const qtdeProduzida = e.record.get('quantidade_kg_produzida') || 0

  if (formulacaoId && qtdeProduzida > 0) {
    try {
      const itens = $app.findRecordsByFilter(
        'itens_formulacao',
        'formulacao_id = {:id}',
        '',
        0,
        0,
        { id: formulacaoId },
      )
      for (let i = 0; i < itens.length; i++) {
        const item = itens[i]
        const insumoId = item.get('insumo_id')
        const qtdeInclusao = item.get('quantidade_kg') || 0

        const consumoTotal = qtdeInclusao * qtdeProduzida

        if (insumoId) {
          try {
            const insumo = $app.findRecordById('estoque_insumos', insumoId)
            const estoqueAtual = insumo.get('quantidade_atual') || 0
            insumo.set('quantidade_atual', estoqueAtual - consumoTotal)
            $app.save(insumo)
          } catch (err) {
            console.log('Error saving insumo', err.message)
          }
        }
      }
    } catch (err) {
      console.log('Error updating insumos inventory', err.message)
    }
  }
  e.next()
}, 'producao_diaria_racao')
