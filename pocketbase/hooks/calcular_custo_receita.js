onRecordCreate((e) => {
  let custoTotal = 0
  const ingredientes = e.record.get('ingredientes') || []

  if (Array.isArray(ingredientes)) {
    for (const ing of ingredientes) {
      try {
        const insumo = $app.findRecordById('estoque_insumos', ing.id_produto)
        const custo = insumo.get('custo_medio_unitario') || 0
        const prop = Number(ing.proporcao_percentual) || 0
        custoTotal += (prop / 100) * custo
      } catch (err) {
        // Skip if insumo not found
      }
    }
  }

  e.record.set('custo_kg_produzido', custoTotal)
  e.next()
}, 'formulacoes_racao')

onRecordUpdate((e) => {
  let custoTotal = 0
  const ingredientes = e.record.get('ingredientes') || []

  if (Array.isArray(ingredientes)) {
    for (const ing of ingredientes) {
      try {
        const insumo = $app.findRecordById('estoque_insumos', ing.id_produto)
        const custo = insumo.get('custo_medio_unitario') || 0
        const prop = Number(ing.proporcao_percentual) || 0
        custoTotal += (prop / 100) * custo
      } catch (err) {
        // Skip if insumo not found
      }
    }
  }

  e.record.set('custo_kg_produzido', custoTotal)
  e.next()
}, 'formulacoes_racao')
