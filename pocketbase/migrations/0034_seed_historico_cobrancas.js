migrate((app) => {
  const boletos = app.findRecordsByFilter('boletos', "status_boleto != 'Pago'", '-created', 5, 0)
  if (boletos.length === 0) return

  const col = app.findCollectionByNameOrId('historico_cobrancas')

  for (let i = 0; i < boletos.length; i++) {
    const boleto = boletos[i]
    const parcela = app.findRecordById('parcelas_venda', boleto.get('parcela_id'))
    const venda = app.findRecordById('vendas', parcela.get('venda_id'))

    const rec = new Record(col)
    rec.set('data', new Date().toISOString())
    rec.set('cliente_id', venda.get('cliente_id'))
    rec.set('boleto_id', boleto.id)
    rec.set('tipo_cobranca', 'Email')
    rec.set('status', 'Enviado')
    rec.set('resultado', 'Lembrete automático de envio')
    app.saveNoValidate(rec)
  }
})
