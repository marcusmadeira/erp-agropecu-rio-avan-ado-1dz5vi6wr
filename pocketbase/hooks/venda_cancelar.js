routerAdd(
  'POST',
  '/backend/v1/vendas/{id}/cancelar',
  (e) => {
    const id = e.request.pathValue('id')

    $app.runInTransaction((txApp) => {
      const venda = txApp.findRecordById('vendas', id)
      if (venda.get('status_venda') === 'Cancelada') {
        throw new BadRequestError('Venda já está cancelada.')
      }

      venda.set('status_venda', 'Cancelada')
      txApp.save(venda)

      const itens = txApp.findRecordsByFilter('itens_venda', `venda_id = '${id}'`, '', 0, 0)
      for (let i = 0; i < itens.length; i++) {
        const item = itens[i]
        if (item.get('tipo_item') === 'Animal' && item.get('animal_id')) {
          try {
            const animal = txApp.findRecordById('animais', item.get('animal_id'))
            animal.set('status', item.get('status_anterior') || 'Ativo')
            if (item.get('lote_id_origem')) animal.set('lote_atual_id', item.get('lote_id_origem'))
            if (item.get('pastagem_id_origem'))
              animal.set('piquete_atual_id', item.get('pastagem_id_origem'))
            txApp.save(animal)
          } catch (_) {}
        } else if (item.get('tipo_item') === 'Lote' && item.get('lote_id')) {
          try {
            const animais = txApp.findRecordsByFilter(
              'animais',
              `lote_atual_id = '${item.get('lote_id')}' && status = 'Vendido'`,
              '',
              0,
              0,
            )
            for (let j = 0; j < animais.length; j++) {
              animais[j].set('status', 'Ativo')
              txApp.save(animais[j])
            }
          } catch (_) {}
        }
      }

      const parcelas = txApp.findRecordsByFilter('parcelas_venda', `venda_id = '${id}'`, '', 0, 0)
      for (let i = 0; i < parcelas.length; i++) {
        if (parcelas[i].get('status_parcela') !== 'Paga') {
          parcelas[i].set('status_parcela', 'Cancelada')
          txApp.save(parcelas[i])
        }
      }

      const boletos = txApp.findRecordsByFilter('boletos', `venda_id = '${id}'`, '', 0, 0)
      for (let i = 0; i < boletos.length; i++) {
        if (boletos[i].get('status_boleto') !== 'Pago') {
          boletos[i].set('status_boleto', 'Cancelado')
          txApp.save(boletos[i])
        }
      }

      const auditCol = txApp.findCollectionByNameOrId('auditoria_movimentacoes')
      const audit = new Record(auditCol)
      audit.set('usuario_id', e.auth.id)
      audit.set('tipo_acao', 'UPDATE')
      audit.set('tabela_afetada', 'vendas')
      audit.set('registro_id', id)
      audit.set('description', 'Venda Cancelada e Animais Restaurados')
      audit.set('status', 'SUCCESS')
      txApp.save(audit)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
