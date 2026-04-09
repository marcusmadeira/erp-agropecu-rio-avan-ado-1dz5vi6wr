migrate(
  (app) => {
    const animaisCol = app.findCollectionByNameOrId('animais')
    const usersCol = app.findCollectionByNameOrId('users')

    const pesagens = new Collection({
      name: 'pesagens_diarias',
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
        {
          name: 'animal_id',
          type: 'relation',
          required: true,
          collectionId: animaisCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'data_pesagem', type: 'date', required: true },
        { name: 'peso_kg', type: 'number', required: true },
        { name: 'responsavel_pesagem', type: 'text' },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pesagens_animal_data ON pesagens_diarias (animal_id, data_pesagem)',
      ],
    })
    app.save(pesagens)

    const auditoria = new Collection({
      name: 'auditoria_movimentacoes',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      viewRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      createRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      updateRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      deleteRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'tipo_acao',
          type: 'select',
          required: true,
          values: ['Criação', 'Edição', 'Exclusão'],
          maxSelect: 1,
        },
        { name: 'tabela_afetada', type: 'text', required: true },
        { name: 'registro_id', type: 'text', required: true },
        { name: 'dados_anteriores', type: 'text' },
        { name: 'dados_novos', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_auditoria_usuario_created ON auditoria_movimentacoes (usuario_id, created)',
      ],
    })
    app.save(auditoria)

    const logs = new Collection({
      name: 'logs_sistema',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      viewRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      createRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      updateRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      deleteRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'tipo_evento',
          type: 'select',
          required: true,
          values: ['Login', 'Logout', 'Erro', 'Integração'],
          maxSelect: 1,
        },
        { name: 'descricao_evento', type: 'text', required: true },
        {
          name: 'status_evento',
          type: 'select',
          required: true,
          values: ['Sucesso', 'Falha'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_logs_evento_created ON logs_sistema (tipo_evento, created)'],
    })
    app.save(logs)
  },
  (app) => {
    try {
      const logs = app.findCollectionByNameOrId('logs_sistema')
      app.delete(logs)
    } catch (_) {}

    try {
      const auditoria = app.findCollectionByNameOrId('auditoria_movimentacoes')
      app.delete(auditoria)
    } catch (_) {}

    try {
      const pesagens = app.findCollectionByNameOrId('pesagens_diarias')
      app.delete(pesagens)
    } catch (_) {}
  },
)
