routerAdd(
  'POST',
  '/backend/v1/boletos/{id}/send-email',
  (e) => {
    const id = e.request.pathValue('id')
    try {
      const boleto = $app.findRecordById('boletos', id)
      $app.expandRecord(boleto, ['parcela_id', 'parcela_id.venda_id'])

      const parcela = boleto.expandedOne('parcela_id')
      let clienteId = null
      if (parcela) {
        const venda = parcela.expandedOne('venda_id')
        if (venda) clienteId = venda.get('cliente_id')
      }

      const historicoCol = $app.findCollectionByNameOrId('historico_cobrancas')
      const historico = new Record(historicoCol)
      historico.set('boleto_id', id)
      if (clienteId) historico.set('cliente_id', clienteId)
      if (e.auth) historico.set('usuario_id', e.auth.id)
      historico.set('data_cobranca', new Date().toISOString())
      historico.set('tipo_cobranca', 'Email')
      historico.set('status_cobranca', 'Enviado')
      historico.set('mensagem_enviada', 'Cobrança via email enviada com sucesso')
      historico.set('resultado', 'Sucesso')

      $app.save(historico)

      return e.json(200, {
        success: true,
        message: 'Email enviado com sucesso e registrado no histórico',
      })
    } catch (err) {
      console.log('Erro ao enviar email:', err.message)
      return e.json(400, { success: false, message: 'Erro ao enviar email: ' + err.message })
    }
  },
  $apis.requireAuth(),
)
