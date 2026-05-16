routerAdd(
  'POST',
  '/backend/v1/ajuste-estoque',
  (e) => {
    const body = e.requestInfo().body
    const { insumo_id, tipo, quantidade, motivo } = body

    if (!insumo_id || !tipo || !quantidade || !motivo) {
      throw new BadRequestError('Campos obrigatórios ausentes.')
    }

    const authRecord = e.auth
    if (!authRecord) throw new UnauthorizedError('Não autorizado.')

    $app.runInTransaction((txApp) => {
      const insumo = txApp.findRecordById('estoque_insumos', insumo_id)
      const atual = Number(insumo.get('quantidade_atual')) || 0
      const qty = Number(quantidade)

      if (tipo === 'SAIDA_MANUAL' && atual < qty) {
        throw new BadRequestError(`Estoque insuficiente. Atual: ${atual}`)
      }

      const novaQtd = tipo === 'ENTRADA_MANUAL' ? atual + qty : atual - qty
      insumo.set('quantidade_atual', novaQtd)
      txApp.save(insumo)

      const mov = new Record(txApp.findCollectionByNameOrId('estoque_movimentacoes'))
      mov.set('tipo', tipo)
      mov.set('produto_id', insumo_id)
      mov.set('quantidade', qty)
      mov.set('valor_unitario', Number(insumo.get('custo_medio_unitario')) || 0)
      mov.set('valor_total', (Number(insumo.get('custo_medio_unitario')) || 0) * qty)
      mov.set('data', new Date().toISOString())
      mov.set('usuario_id', authRecord.id)
      mov.set('motivo_ajuste', motivo)
      txApp.save(mov)

      const audit = new Record(txApp.findCollectionByNameOrId('auditoria_movimentacoes'))
      audit.set('usuario_id', authRecord.id)
      audit.set('tipo_acao', 'CREATE')
      audit.set('tabela_afetada', 'estoque_movimentacoes')
      audit.set('registro_id', mov.id)
      audit.set(
        'description',
        `Ajuste de Estoque (${tipo}): ${qty} unidades do insumo ${insumo.get('produto')}. Motivo: ${motivo}`,
      )
      audit.set('status', 'SUCCESS')
      txApp.save(audit)
    })

    return e.json(200, { sucesso: true })
  },
  $apis.requireAuth(),
)
