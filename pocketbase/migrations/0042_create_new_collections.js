migrate(
  (app) => {
    const animaisId = app.findCollectionByNameOrId('animais').id
    const lotesId = app.findCollectionByNameOrId('lotes').id
    const parceirosId = app.findCollectionByNameOrId('parceiros_negocios').id

    const colReclassificacao = new Collection({
      name: 'reclassificacao_descarte',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      fields: [
        { name: 'data', type: 'date', required: true },
        {
          name: 'animal_id',
          type: 'relation',
          required: true,
          collectionId: animaisId,
          maxSelect: 1,
        },
        { name: 'nova_categoria', type: 'text', required: true },
        { name: 'novo_lote_destino_id', type: 'relation', collectionId: lotesId, maxSelect: 1 },
        { name: 'motivo', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(colReclassificacao)

    const colRepasse = new Collection({
      name: 'repasse_monta_natural',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      fields: [
        {
          name: 'lote_vinculado_id',
          type: 'relation',
          required: true,
          collectionId: lotesId,
          maxSelect: 1,
        },
        {
          name: 'touro_repasse_id',
          type: 'relation',
          required: true,
          collectionId: animaisId,
          maxSelect: 1,
        },
        { name: 'data_entrada', type: 'date', required: true },
        { name: 'data_retirada', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(colRepasse)

    const colEstacao = new Collection({
      name: 'estacao_monta',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'data_inicio', type: 'date', required: true },
        { name: 'data_fim', type: 'date', required: true },
        { name: 'status', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(colEstacao)

    const colRegistroNasc = new Collection({
      name: 'registro_nascimento',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      fields: [
        {
          name: 'vaca_mae_id',
          type: 'relation',
          required: true,
          collectionId: animaisId,
          maxSelect: 1,
        },
        { name: 'data_nascimento', type: 'date', required: true },
        { name: 'sexo', type: 'select', values: ['Macho', 'Fêmea'], maxSelect: 1 },
        { name: 'peso_nascer', type: 'number' },
        { name: 'numero_tatuagem', type: 'text' },
        { name: 'status_rgn', type: 'text' },
        { name: 'rgn_abcz', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(colRegistroNasc)

    const colDespesas = new Collection({
      name: 'despesas',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      fields: [
        { name: 'fornecedor_id', type: 'relation', collectionId: parceirosId, maxSelect: 1 },
        { name: 'tipo_despesa', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'valor', type: 'number', required: true },
        { name: 'data_despesa', type: 'date', required: true },
        { name: 'centro_custo', type: 'text' },
        { name: 'classificacao_custo', type: 'text' },
        { name: 'comprovante_url', type: 'file', maxSelect: 1, maxSize: 52428800 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(colDespesas)

    const despesasId = app.findCollectionByNameOrId('despesas').id

    const colBoletosPagar = new Collection({
      name: 'boletos_pagar',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      fields: [
        { name: 'despesa_id', type: 'relation', collectionId: despesasId, maxSelect: 1 },
        { name: 'fornecedor_id', type: 'relation', collectionId: parceirosId, maxSelect: 1 },
        { name: 'valor', type: 'number', required: true },
        { name: 'data_vencimento', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['Pendente', 'Pago', 'Atrasado', 'Cancelado'],
          maxSelect: 1,
          required: true,
        },
        { name: 'numero_boleto', type: 'text' },
        { name: 'data_pagamento', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(colBoletosPagar)

    const boletosPagarId = app.findCollectionByNameOrId('boletos_pagar').id

    const colPagamentosRealizados = new Collection({
      name: 'pagamentos_realizados',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      fields: [
        { name: 'boleto_pagar_id', type: 'relation', collectionId: boletosPagarId, maxSelect: 1 },
        { name: 'data_pagamento', type: 'date', required: true },
        { name: 'valor_pago', type: 'number', required: true },
        { name: 'forma_pagamento', type: 'text' },
        { name: 'comprovante_url', type: 'file', maxSelect: 1, maxSize: 52428800 },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(colPagamentosRealizados)

    const colRegistroChuvas = new Collection({
      name: 'registro_chuvas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '3')",
      fields: [
        { name: 'data_chuva', type: 'date', required: true },
        { name: 'quantidade_mm', type: 'number', required: true },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(colRegistroChuvas)

    const colPrecosMercado = new Collection({
      name: 'precos_mercado',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Financeiro' || @request.auth.nivel_acesso = '1' || @request.auth.nivel_acesso = '2')",
      fields: [
        { name: 'data_registro', type: 'date', required: true },
        { name: 'preco_arroba', type: 'number' },
        { name: 'preco_milho', type: 'number' },
        { name: 'preco_farelo_soja', type: 'number' },
        { name: 'fonte', type: 'text' },
        { name: 'regiao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(colPrecosMercado)

    const colMetas = new Collection({
      name: 'metas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = '1')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = '1')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = '1')",
      fields: [
        { name: 'tipo_meta', type: 'text', required: true },
        { name: 'valor_meta', type: 'number', required: true },
        { name: 'periodo', type: 'text' },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_fim', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(colMetas)

    const colSimulacoes = new Collection({
      name: 'simulacoes_cenarios',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = '1')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = '1')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = '1')",
      fields: [
        { name: 'tipo_operacao', type: 'text', required: true },
        { name: 'quantidade_animais', type: 'number', required: true },
        { name: 'peso_entrada', type: 'number', required: true },
        { name: 'preco_compra', type: 'number' },
        { name: 'custo_acao', type: 'number' },
        { name: 'custo_mao_obra', type: 'number' },
        { name: 'custo_adicionais', type: 'number' },
        { name: 'gmd_estimado', type: 'number' },
        { name: 'peso_final', type: 'number' },
        { name: 'dias_duracao', type: 'number' },
        { name: 'custo_total', type: 'number' },
        { name: 'arrobas_produzidas', type: 'number' },
        { name: 'custo_arroba', type: 'number' },
        { name: 'preco_venda', type: 'number' },
        { name: 'receita_total', type: 'number' },
        { name: 'lucro_bruto', type: 'number' },
        { name: 'margem_lucro', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(colSimulacoes)
  },
  (app) => {
    const collections = [
      'reclassificacao_descarte',
      'repasse_monta_natural',
      'estacao_monta',
      'registro_nascimento',
      'despesas',
      'boletos_pagar',
      'pagamentos_realizados',
      'registro_chuvas',
      'precos_mercado',
      'metas',
      'simulacoes_cenarios',
    ]
    collections.forEach((name) => {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    })
  },
)
