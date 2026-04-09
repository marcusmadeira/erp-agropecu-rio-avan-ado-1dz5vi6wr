routerAdd(
  'POST',
  '/backend/v1/boletos/{id}/historico-cobranca',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body

    const col = $app.findCollectionByNameOrId('historico_cobrancas')
    const record = new Record(col)
    record.set('data', new Date().toISOString())
    record.set('cliente_id', body.cliente_id)
    record.set('boleto_id', id)
    record.set('tipo_cobranca', body.tipo_cobranca)
    record.set('status', body.status || 'Enviado')
    record.set('resultado', body.resultado || '')

    $app.save(record)

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
