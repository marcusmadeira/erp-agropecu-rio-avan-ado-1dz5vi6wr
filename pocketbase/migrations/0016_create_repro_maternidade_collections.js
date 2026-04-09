migrate(
  (app) => {
    const animaisCollectionId = app.findCollectionByNameOrId('animais').id

    const planejamento = new Collection({
      name: 'planejamento_acasalamento',
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
          name: 'matriz_id',
          type: 'relation',
          required: true,
          collectionId: animaisCollectionId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'touro_opcao_1_id',
          type: 'relation',
          required: false,
          collectionId: animaisCollectionId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'touro_opcao_2_id',
          type: 'relation',
          required: false,
          collectionId: animaisCollectionId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_planejamento_matriz ON planejamento_acasalamento (matriz_id)'],
    })
    app.save(planejamento)

    const iatf = new Collection({
      name: 'manejo_iatf_curral',
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
          name: 'matriz_id',
          type: 'relation',
          required: true,
          collectionId: animaisCollectionId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'data_iatf', type: 'date', required: true },
        {
          name: 'touro_utilizado_id',
          type: 'relation',
          required: false,
          collectionId: animaisCollectionId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'resultado_dg',
          type: 'select',
          required: false,
          values: ['Prenhe', 'Vazia'],
          maxSelect: 1,
        },
        { name: 'data_provavel_parto_dpp', type: 'date', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_iatf_matriz ON manejo_iatf_curral (matriz_id)'],
    })
    app.save(iatf)

    const nascimentos = new Collection({
      name: 'nascimentos_e_desmama',
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
          name: 'matriz_mae_id',
          type: 'relation',
          required: true,
          collectionId: animaisCollectionId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'data_nascimento', type: 'date', required: true },
        { name: 'sexo', type: 'select', required: false, values: ['Macho', 'Fêmea'], maxSelect: 1 },
        { name: 'peso_nascer', type: 'number', required: false },
        { name: 'status_cria', type: 'text', required: false },
        { name: 'rgn_provisorio_abcz', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_nascimentos_mae ON nascimentos_e_desmama (matriz_mae_id)'],
    })
    app.save(nascimentos)
  },
  (app) => {
    try {
      const p = app.findCollectionByNameOrId('planejamento_acasalamento')
      app.delete(p)
    } catch (_) {}
    try {
      const i = app.findCollectionByNameOrId('manejo_iatf_curral')
      app.delete(i)
    } catch (_) {}
    try {
      const n = app.findCollectionByNameOrId('nascimentos_e_desmama')
      app.delete(n)
    } catch (_) {}
  },
)
