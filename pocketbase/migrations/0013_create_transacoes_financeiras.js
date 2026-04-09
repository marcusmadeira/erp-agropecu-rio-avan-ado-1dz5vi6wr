migrate(
  (app) => {
    const parceiros = app.findCollectionByNameOrId('parceiros_negocios')

    const collection = new Collection({
      name: 'transacoes_financeiras',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)",
      fields: [
        { name: 'data_competencia', type: 'date', required: true },
        { name: 'data_vencimento', type: 'date', required: true },
        { name: 'data_efetivacao_real', type: 'date' },
        { name: 'descricao_lancamento', type: 'text', required: true },
        {
          name: 'parceiro_id',
          type: 'relation',
          required: true,
          collectionId: parceiros.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'tipo_movimento',
          type: 'select',
          required: true,
          values: ['Receita', 'Despesa'],
          maxSelect: 1,
        },
        {
          name: 'classificacao_custo',
          type: 'select',
          required: true,
          values: ['FIXA', 'VARIÁVEL'],
          maxSelect: 1,
        },
        {
          name: 'centro_custo',
          type: 'select',
          required: true,
          values: ['CC01', 'CC02', 'CC03'],
          maxSelect: 1,
        },
        { name: 'valor_total', type: 'number', required: true },
        {
          name: 'status_pagamento',
          type: 'select',
          required: true,
          values: ['Pendente', 'Recebido', 'Atrasado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_transacoes_fin_data_venc ON transacoes_financeiras (data_vencimento)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('transacoes_financeiras')
    app.delete(collection)
  },
)
