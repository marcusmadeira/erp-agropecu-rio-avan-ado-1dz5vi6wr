migrate(
  (app) => {
    // Seed estoque_insumos
    try {
      app.findFirstRecordByData('estoque_insumos', 'produto', 'Sal Mineral')
    } catch (_) {
      const colInsumos = app.findCollectionByNameOrId('estoque_insumos')
      const r1 = new Record(colInsumos)
      r1.set('produto', 'Sal Mineral')
      r1.set('quantidade_atual', 500)
      r1.set('unidade_medida', 'kg')
      r1.set('custo_medio_unitario', 2.5)
      r1.set('estoque_minimo_critico', 100)
      r1.set('consumo_medio_diario', 10)
      app.save(r1)

      const r2 = new Record(colInsumos)
      r2.set('produto', 'Milho Moído')
      r2.set('quantidade_atual', 1000)
      r2.set('unidade_medida', 'kg')
      r2.set('custo_medio_unitario', 1.2)
      r2.set('estoque_minimo_critico', 200)
      r2.set('consumo_medio_diario', 50)
      app.save(r2)
    }

    // Seed transacoes_financeiras
    let parceiroId = ''
    try {
      const p = app.findFirstRecordByData(
        'parceiros_negocios',
        'nome_razao_social',
        'Fazenda Bela Vista',
      )
      parceiroId = p.id
    } catch (_) {
      try {
        const colParceiros = app.findCollectionByNameOrId('parceiros_negocios')
        const p = new Record(colParceiros)
        p.set('nome_razao_social', 'Fazenda Bela Vista')
        p.set('categoria_parceiro', 'Cliente')
        p.set('status', 'Ativo')
        app.save(p)
        parceiroId = p.id
      } catch (e) {
        const result = app.findRecordsByFilter('parceiros_negocios', "id != ''", 'created', 1, 0)
        if (result.length > 0) {
          parceiroId = result[0].id
        }
      }
    }

    if (parceiroId) {
      try {
        app.findFirstRecordByData(
          'transacoes_financeiras',
          'descricao_lancamento',
          'Venda de Bezerros',
        )
      } catch (_) {
        const colFin = app.findCollectionByNameOrId('transacoes_financeiras')
        const r1 = new Record(colFin)
        r1.set('data_competencia', '2026-03-01 12:00:00.000Z')
        r1.set('data_vencimento', '2026-03-10 12:00:00.000Z')
        r1.set('data_efetivacao_real', '2026-03-09 12:00:00.000Z')
        r1.set('descricao_lancamento', 'Venda de Bezerros')
        r1.set('parceiro_id', parceiroId)
        r1.set('tipo_movimento', 'Receita')
        r1.set('classificacao_custo', 'VARIÁVEL')
        r1.set('centro_custo', 'CC01')
        r1.set('valor_total', 15000)
        r1.set('status_pagamento', 'Recebido')
        app.save(r1)

        const r2 = new Record(colFin)
        r2.set('data_competencia', '2026-03-05 12:00:00.000Z')
        r2.set('data_vencimento', '2026-03-20 12:00:00.000Z')
        r2.set('descricao_lancamento', 'Compra de Medicamentos')
        r2.set('parceiro_id', parceiroId)
        r2.set('tipo_movimento', 'Despesa')
        r2.set('classificacao_custo', 'VARIÁVEL')
        r2.set('centro_custo', 'CC02')
        r2.set('valor_total', 500)
        r2.set('status_pagamento', 'Pendente')
        app.save(r2)
      }
    }

    // Seed estoque_semen
    try {
      app.findFirstRecordByData('estoque_semen', 'touro_doador', 'Faraó')
    } catch (_) {
      const colSemen = app.findCollectionByNameOrId('estoque_semen')
      const r1 = new Record(colSemen)
      r1.set('touro_doador', 'Faraó')
      r1.set('botijao_armazenado', 'Botijão A')
      r1.set('doses_palhetas_disponiveis', 50)
      app.save(r1)

      const r2 = new Record(colSemen)
      r2.set('touro_doador', 'Bastião')
      r2.set('botijao_armazenado', 'Botijão B')
      r2.set('doses_palhetas_disponiveis', 100)
      app.save(r2)
    }
  },
  (app) => {
    // Revert seeding not strictly necessary
  },
)
