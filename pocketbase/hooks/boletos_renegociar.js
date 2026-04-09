routerAdd(
  'POST',
  '/backend/v1/boletos/{id}/renegociar',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body

    $app.runInTransaction((txApp) => {
      const boleto = txApp.findRecordById('boletos', id)
      boleto.set('data_vencimento', body.novo_vencimento)
      boleto.set('status_boleto', 'Gerado')
      txApp.save(boleto)

      const parcelaId = boleto.get('parcela_id')
      const parcela = txApp.findRecordById('parcelas_venda', parcelaId)
      parcela.set('data_vencimento', body.novo_vencimento)
      parcela.set('status_parcela', 'Pendente')
      txApp.save(parcela)

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
        }),
      )
      txApp.saveNoValidate(auditoria)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
