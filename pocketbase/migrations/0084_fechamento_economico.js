migrate(
  (app) => {
    const audit = app.findCollectionByNameOrId('auditoria_movimentacoes')
    if (audit) {
      app.logger().info('Migration 0084: Auditoria table verified for fechamento_economico.')
    }
  },
  (app) => {},
)
