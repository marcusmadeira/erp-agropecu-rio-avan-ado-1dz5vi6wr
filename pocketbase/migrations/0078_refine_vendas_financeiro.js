migrate(
  (app) => {
    // 1. Update vendas
    const vendas = app.findCollectionByNameOrId('vendas')
    if (!vendas.fields.getByName('data_vencimento_entrada')) {
      vendas.fields.add(new DateField({ name: 'data_vencimento_entrada', required: false }))
    }
    app.save(vendas)

    // 2. Update parcelas_venda
    const parcelas = app.findCollectionByNameOrId('parcelas_venda')
    if (!parcelas.fields.getByName('forma_pagamento')) {
      parcelas.fields.add(
        new SelectField({
          name: 'forma_pagamento',
          values: ['PIX', 'TED', 'Boleto', 'Dinheiro', 'Cheque', 'Outro'],
          maxSelect: 1,
          required: false,
        }),
      )
    }
    app.save(parcelas)

    // 3. Update recebimentos_vendas
    const recebimentos = app.findCollectionByNameOrId('recebimentos_vendas')
    const boletoField = recebimentos.fields.getByName('boleto_id')
    if (boletoField) {
      boletoField.required = false
    }
    if (!recebimentos.fields.getByName('parcela_id')) {
      recebimentos.fields.add(
        new RelationField({
          name: 'parcela_id',
          collectionId: parcelas.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }
    app.save(recebimentos)
  },
  (app) => {
    const vendas = app.findCollectionByNameOrId('vendas')
    vendas.fields.removeByName('data_vencimento_entrada')
    app.save(vendas)

    const parcelas = app.findCollectionByNameOrId('parcelas_venda')
    parcelas.fields.removeByName('forma_pagamento')
    app.save(parcelas)

    const recebimentos = app.findCollectionByNameOrId('recebimentos_vendas')
    recebimentos.fields.removeByName('parcela_id')
    const boletoField = recebimentos.fields.getByName('boleto_id')
    if (boletoField) {
      boletoField.required = true
    }
    app.save(recebimentos)
  },
)
