migrate(
  (app) => {
    const parcelas = new Collection({
      name: 'parcelas_venda',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      fields: [
        {
          name: 'venda_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('vendas').id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'numero_parcela', type: 'number', required: true },
        { name: 'valor_parcela', type: 'number', required: true },
        { name: 'data_vencimento', type: 'date', required: true },
        { name: 'data_pagamento', type: 'date' },
        {
          name: 'status_parcela',
          type: 'select',
          required: true,
          values: ['Pendente', 'Paga', 'Atrasada', 'Cancelada'],
          maxSelect: 1,
        },
        { name: 'dias_atraso', type: 'number' },
        { name: 'juros_atraso', type: 'number' },
        { name: 'multa_atraso', type: 'number' },
        { name: 'valor_total_com_juros', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_parcelas_venda_venda ON parcelas_venda (venda_id)',
        'CREATE INDEX idx_parcelas_venda_vencimento ON parcelas_venda (data_vencimento)',
      ],
    })
    app.save(parcelas)

    const boletos = new Collection({
      name: 'boletos',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      fields: [
        {
          name: 'parcela_id',
          type: 'relation',
          required: true,
          collectionId: parcelas.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'numero_boleto', type: 'text' },
        { name: 'codigo_barras', type: 'text' },
        { name: 'data_emissao', type: 'date' },
        { name: 'data_vencimento', type: 'date' },
        { name: 'valor_boleto', type: 'number' },
        { name: 'banco_emissor', type: 'text' },
        {
          name: 'status_boleto',
          type: 'select',
          required: true,
          values: ['Gerado', 'Enviado', 'Pago', 'Vencido', 'Cancelado'],
          maxSelect: 1,
        },
        { name: 'data_envio_cliente', type: 'date' },
        { name: 'url_boleto_pdf', type: 'url' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_boletos_numero ON boletos (numero_boleto) WHERE numero_boleto != ''",
        'CREATE INDEX idx_boletos_vencimento ON boletos (data_vencimento)',
        'CREATE INDEX idx_boletos_parcela ON boletos (parcela_id)',
      ],
    })
    app.save(boletos)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('boletos'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('parcelas_venda'))
    } catch (_) {}
  },
)
