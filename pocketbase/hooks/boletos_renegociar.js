routerAdd(
  'POST',
  '/backend/v1/boletos/{id}/renegociar',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body

    $app.runInTransaction((txApp) => {
      const boleto = txApp.findRecordById('boletos', id)
      const parcelaId = boleto.get('parcela_id')
      const parcela = txApp.findRecordById('parcelas_venda', parcelaId)
      const vendaId = parcela.get('venda_id')

      const numParcelas = parseInt(body.parcelas) || 1

      if (numParcelas > 1) {
        // Divide original value
        const total = boleto.get('valor_boleto')
        const valorNovaParcela = total / numParcelas

        // Update current
        parcela.set('valor_parcela', valorNovaParcela)
        parcela.set('data_vencimento', body.novo_vencimento)
        parcela.set('status_parcela', 'Pendente')
        txApp.save(parcela)

        boleto.set('valor_boleto', valorNovaParcela)
        boleto.set('data_vencimento', body.novo_vencimento)
        boleto.set('status_boleto', 'Gerado')
        txApp.save(boleto)

        // Create the rest
        const parcelasCol = txApp.findCollectionByNameOrId('parcelas_venda')
        const boletosCol = txApp.findCollectionByNameOrId('boletos')

        for (let i = 1; i < numParcelas; i++) {
          const nextDate = new Date(body.novo_vencimento)
          nextDate.setMonth(nextDate.getMonth() + i)

          const p = new Record(parcelasCol)
          p.set('venda_id', vendaId)
          p.set('numero_parcela', parcela.get('numero_parcela') * 100 + i)
          p.set('valor_parcela', valorNovaParcela)
          p.set('data_vencimento', nextDate.toISOString())
          p.set('status_parcela', 'Pendente')
          txApp.save(p)

          const b = new Record(boletosCol)
          b.set('parcela_id', p.id)
          b.set('numero_boleto', (boleto.get('numero_boleto') || 'BOL') + '-' + (i + 1))
          b.set('valor_boleto', valorNovaParcela)
          b.set('data_vencimento', nextDate.toISOString())
          b.set('status_boleto', 'Gerado')
          txApp.save(b)
        }
      } else {
        parcela.set('data_vencimento', body.novo_vencimento)
        parcela.set('status_parcela', 'Pendente')
        txApp.save(parcela)

        boleto.set('data_vencimento', body.novo_vencimento)
        boleto.set('status_boleto', 'Gerado')
        txApp.save(boleto)
      }

      const auditoriaCol = txApp.findCollectionByNameOrId('auditoria_movimentacoes')
      const auditoria = new Record(auditoriaCol)
      if (e.auth) auditoria.set('usuario_id', e.auth.id)
      auditoria.set('tipo_acao', 'Edição')
      auditoria.set('tabela_afetada', 'boletos')
      auditoria.set('registro_id', id)
      auditoria.set(
        'dados_novos',
        JSON.stringify({
          renegociacao: true,
          novo_vencimento: body.novo_vencimento,
          justificativa: body.justificativa,
          desconto_juros: body.desconto_juros,
          parcelas: numParcelas,
        }),
      )
      txApp.saveNoValidate(auditoria)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
