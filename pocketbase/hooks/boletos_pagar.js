routerAdd(
  'POST',
  '/backend/v1/boletos/{id}/pagar',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body
    const valorPago = body.valor_pago
    const dataPagamento = body.data_pagamento || new Date().toISOString()
    const formaPagamento = body.forma_pagamento || 'Pix'

    try {
      $app.runInTransaction((txApp) => {
        const boleto = txApp.findRecordById('boletos', id)
        boleto.set('status_boleto', 'Pago')
        txApp.save(boleto)

        const parcelaId = boleto.get('parcela_id')
        const parcela = txApp.findRecordById('parcelas_venda', parcelaId)
        parcela.set('status_parcela', 'Paga')
        parcela.set('data_pagamento', dataPagamento)
        txApp.save(parcela)

        const vendaId = parcela.get('venda_id')
        const venda = txApp.findRecordById('vendas', vendaId)
        const clienteId = venda.get('cliente_id')

        // A transação original foi criada durante vendas_after_create
        // Mantemos a coerência apenas registrando a quitação nas entidades filhas e trilha de auditoria

        const auditoriaCol = txApp.findCollectionByNameOrId('auditoria_movimentacoes')
        const auditoria = new Record(auditoriaCol)
        if (e.auth) auditoria.set('usuario_id', e.auth.id)
        auditoria.set('tipo_acao', 'Edição')
        auditoria.set('tabela_afetada', 'boletos')
        auditoria.set('registro_id', id)
        auditoria.set(
          'dados_novos',
          JSON.stringify({
            status_boleto: 'Pago',
            data_pagamento: dataPagamento,
            valor_pago: valorPago,
            forma_pagamento: formaPagamento,
          }),
        )
        txApp.saveNoValidate(auditoria)
      })

      return e.json(200, { success: true })
    } catch (error) {
      console.log('Erro ao processar pagamento:', error.message)
      return e.json(400, {
        success: false,
        message: 'Erro ao processar pagamento: ' + error.message,
      })
    }
  },
  $apis.requireAuth(),
)
