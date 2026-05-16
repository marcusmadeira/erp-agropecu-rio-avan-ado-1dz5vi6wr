migrate(
  (app) => {
    const formCol = app.findCollectionByNameOrId('formulacoes_racao')
    formCol.fields.add(new SelectField({ name: 'status', values: ['Ativo', 'Inativo'] }))
    app.save(formCol)

    const tratoCol = app.findCollectionByNameOrId('trato_diario_lotes')
    tratoCol.fields.add(new TextField({ name: 'observacoes' }))
    app.save(tratoCol)

    const movCol = app.findCollectionByNameOrId('estoque_movimentacoes')
    movCol.fields.add(new TextField({ name: 'motivo_ajuste' }))
    const tipoField = movCol.fields.getByName('tipo')
    if (tipoField) {
      tipoField.values = [
        'ENTRADA_NOTA_FISCAL',
        'ENTRADA_MANUAL',
        'SAIDA_RACAO',
        'PRODUCAO_RACAO',
        'SAIDA_MANUAL',
      ]
    }
    app.save(movCol)
  },
  (app) => {
    const formCol = app.findCollectionByNameOrId('formulacoes_racao')
    formCol.fields.removeByName('status')
    app.save(formCol)

    const tratoCol = app.findCollectionByNameOrId('trato_diario_lotes')
    tratoCol.fields.removeByName('observacoes')
    app.save(tratoCol)

    const movCol = app.findCollectionByNameOrId('estoque_movimentacoes')
    movCol.fields.removeByName('motivo_ajuste')
    const tipoField = movCol.fields.getByName('tipo')
    if (tipoField) {
      tipoField.values = ['ENTRADA_NOTA_FISCAL', 'ENTRADA_MANUAL', 'SAIDA_RACAO', 'PRODUCAO_RACAO']
    }
    app.save(movCol)
  },
)
