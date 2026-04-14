migrate(
  (app) => {
    // 1. Data Migration for Animais (lote_atual -> lote_atual_id)
    try {
      app
        .db()
        .newQuery(
          "UPDATE animais SET lote_atual_id = lote_atual WHERE (lote_atual_id = '' OR lote_atual_id IS NULL) AND lote_atual != ''",
        )
        .execute()
    } catch (e) {
      console.log('Error updating animais lote_atual_id:', e)
    }

    // 2. Data Migration for Lotes (piquete_id -> piquete_atual_id)
    try {
      app
        .db()
        .newQuery(
          "UPDATE lotes SET piquete_atual_id = piquete_id WHERE (piquete_atual_id = '' OR piquete_atual_id IS NULL) AND piquete_id != ''",
        )
        .execute()
    } catch (e) {
      console.log('Error updating lotes piquete_atual_id:', e)
    }

    // 3. Remove Redundant Fields
    try {
      const colAnimais = app.findCollectionByNameOrId('animais')
      if (colAnimais.fields.getByName('lote_atual')) {
        colAnimais.fields.removeByName('lote_atual')
        app.save(colAnimais)
      }
    } catch (e) {}

    try {
      const colLotes = app.findCollectionByNameOrId('lotes')
      if (colLotes.fields.getByName('piquete_id')) {
        colLotes.fields.removeByName('piquete_id')
        app.save(colLotes)
      }
    } catch (e) {}

    // 4. Update RBAC Rules (string-based)
    const colsToUpdate = [
      'parceiros_negocios',
      'lotes',
      'animais',
      'estoque_insumos',
      'transacoes_financeiras',
      'estoque_semen',
      'planejamento_acasalamento',
      'manejo_iatf_curral',
      'nascimentos_e_desmama',
      'pesagens_diarias',
      'auditoria_movimentacoes',
      'logs_sistema',
      'formulacoes_racao',
      'itens_formulacao',
      'producao_diaria_racao',
      'eventos_venda',
      'custos_evento',
      'vendas',
      'itens_venda',
      'parcelas_venda',
      'boletos',
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
      'diagnostico_inicial',
      'estoque_movimentacoes',
      'racao_formulada',
      'trato_diario_lotes',
    ]

    for (const name of colsToUpdate) {
      try {
        const col = app.findCollectionByNameOrId(name)
        let updated = false

        const fixRule = (rule) => {
          if (!rule) return rule
          const newRule = rule
            .replace(
              /@request\.auth\.nivel_acesso\s*=\s*1/g,
              "@request.auth.nivel_acesso = 'Gerente'",
            )
            .replace(
              /@request\.auth\.nivel_acesso\s*=\s*2/g,
              "@request.auth.nivel_acesso = 'Financeiro'",
            )
            .replace(
              /@request\.auth\.nivel_acesso\s*=\s*3/g,
              "@request.auth.nivel_acesso = 'Operacional'",
            )
            .replace(
              /@request\.auth\.nivel_acesso\s*=\s*'1'/g,
              "@request.auth.nivel_acesso = 'Gerente'",
            )
            .replace(
              /@request\.auth\.nivel_acesso\s*=\s*'2'/g,
              "@request.auth.nivel_acesso = 'Financeiro'",
            )
            .replace(
              /@request\.auth\.nivel_acesso\s*=\s*'3'/g,
              "@request.auth.nivel_acesso = 'Operacional'",
            )

          if (newRule !== rule) updated = true
          return newRule
        }

        col.listRule = fixRule(col.listRule)
        col.viewRule = fixRule(col.viewRule)
        col.createRule = fixRule(col.createRule)
        col.updateRule = fixRule(col.updateRule)
        col.deleteRule = fixRule(col.deleteRule)

        if (updated) {
          app.save(col)
        }
      } catch (e) {
        console.log('Could not update collection rules for:', name)
      }
    }
  },
  (app) => {},
)
