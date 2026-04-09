onRecordAfterUpdateSuccess((e) => {
  const vendaId = e.record.get('venda_id')
  if (vendaId) {
    try {
      const venda = $app.findRecordById('vendas', vendaId)
      const itens = $app.findRecordsByFilter('itens_venda', 'venda_id = {:vendaId}', '', 0, 0, {
        vendaId: vendaId,
      })
      let total = 0
      for (let i = 0; i < itens.length; i++) {
        total += (itens[i].get('valor_unitario') || 0) - (itens[i].get('desconto_aplicado') || 0)
      }
      venda.set('quantidade_animais', itens.length)
      venda.set('valor_total_venda', total)
      $app.save(venda)
    } catch (err) {}
  }
  e.next()
}, 'itens_venda')
