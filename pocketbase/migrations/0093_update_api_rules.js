migrate(
  (app) => {
    const collections = [
      'animais',
      'vendas',
      'transacoes_financeiras',
      'parcelas_venda',
      'auditoria_movimentacoes',
      'boletos',
      'despesas',
      'boletos_pagar',
    ]

    collections.forEach((name) => {
      try {
        const col = app.findCollectionByNameOrId(name)
        col.listRule = "@request.auth.id != ''"
        col.viewRule = "@request.auth.id != ''"
        app.save(col)
      } catch (e) {}
    })
  },
  (app) => {},
)
