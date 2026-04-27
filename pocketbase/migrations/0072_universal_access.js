migrate(
  (app) => {
    const collectionNames = [
      '_pb_users_auth_',
      'conversas_ia',
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
      'notificacoes',
      'formulacoes_racao',
      'itens_formulacao',
      'producao_diaria_racao',
      'trato_diario_lotes',
      'pastos_e_piquetes',
      'historico_importacoes',
      'eventos_venda',
      'custos_evento',
      'vendas',
      'itens_venda',
      'parcelas_venda',
      'boletos',
      'historico_cobrancas',
      'configuracoes_cobranca',
      'configuracoes_sistema',
      'reclassificacao_descarte',
      'repasse_monta_natural',
      'estacao_monta',
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
      'rebanhos',
      'apartacao_dinamica',
      'inventario_pecuario_geral',
      'estoque_peso_fazenda',
      'canecas_semen',
      'lotes_evento',
      'animais_evento',
      'recebimentos_vendas',
    ]

    for (const name of collectionNames) {
      try {
        const col = app.findCollectionByNameOrId(name)
        col.listRule = "@request.auth.id != ''"
        col.viewRule = "@request.auth.id != ''"
        if (name === '_pb_users_auth_') {
          col.createRule = ''
        } else {
          col.createRule = "@request.auth.id != ''"
        }
        col.updateRule = "@request.auth.id != ''"
        col.deleteRule = "@request.auth.id != ''"
        app.save(col)
      } catch (e) {
        console.log('Collection not found: ' + name)
      }
    }
  },
  (app) => {
    // Revert implementation skipped intentionally to maintain universal access
  },
)
