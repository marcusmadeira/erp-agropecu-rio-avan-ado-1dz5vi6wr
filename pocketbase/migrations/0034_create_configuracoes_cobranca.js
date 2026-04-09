migrate(
  (app) => {
    const collection = new Collection({
      name: 'configuracoes_cobranca',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: '@request.auth.nivel_acesso = 1',
      updateRule: '@request.auth.nivel_acesso = 1',
      deleteRule: '@request.auth.nivel_acesso = 1',
      fields: [
        { name: 'taxa_juros_diaria', type: 'number', required: false },
        { name: 'percentual_multa', type: 'number', required: false },
        { name: 'dias_notificacao_antes', type: 'number', required: false },
        { name: 'dias_notificacao_atraso', type: 'number', required: false },
        { name: 'intervalo_notificacao_atraso', type: 'number', required: false },
        { name: 'ativar_juros_automaticos', type: 'bool', required: false },
        { name: 'ativar_multa_automatica', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('configuracoes_cobranca')
    app.delete(collection)
  },
)
