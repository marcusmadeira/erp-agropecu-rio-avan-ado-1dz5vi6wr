migrate(
  (app) => {
    const hist = app.findCollectionByNameOrId('historico_cobrancas')
    const boletoField = hist.fields.getByName('boleto_id')
    if (boletoField) {
      boletoField.required = false
    }
    if (!hist.fields.getByName('parcela_id')) {
      hist.fields.add(
        new RelationField({
          name: 'parcela_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('parcelas_venda').id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }
    app.save(hist)

    const parcela = app.findCollectionByNameOrId('parcelas_venda')
    if (!parcela.fields.getByName('data_proxima_tentativa')) {
      parcela.fields.add(
        new DateField({
          name: 'data_proxima_tentativa',
          required: false,
        }),
      )
    }
    app.save(parcela)

    const recebimentos = app.findCollectionByNameOrId('recebimentos_vendas')
    const formaField = recebimentos.fields.getByName('forma_recebimento')
    if (formaField) {
      formaField.values = ['Dinheiro', 'Transferencia', 'Cheque', 'Outro', 'PIX', 'TED', 'Boleto']
    }
    app.save(recebimentos)
  },
  (app) => {
    const hist = app.findCollectionByNameOrId('historico_cobrancas')
    const boletoField = hist.fields.getByName('boleto_id')
    if (boletoField) {
      boletoField.required = true
    }
    hist.fields.removeByName('parcela_id')
    app.save(hist)

    const parcela = app.findCollectionByNameOrId('parcelas_venda')
    parcela.fields.removeByName('data_proxima_tentativa')
    app.save(parcela)

    const recebimentos = app.findCollectionByNameOrId('recebimentos_vendas')
    const formaField = recebimentos.fields.getByName('forma_recebimento')
    if (formaField) {
      formaField.values = ['Dinheiro', 'Transferencia', 'Cheque', 'Outro']
    }
    app.save(recebimentos)
  },
)
