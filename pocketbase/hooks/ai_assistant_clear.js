routerAdd(
  'DELETE',
  '/backend/v1/ai-assistant/clear',
  (e) => {
    const userId = e.auth.id

    // Fetch all conversation records for the logged-in user
    const records = $app.findRecordsByFilter(
      'conversas_ia',
      `usuario_id = '${userId}'`,
      '',
      1000,
      0,
    )

    let deletedCount = 0

    // Perform deletion within a transaction for safety and speed
    $app.runInTransaction((txApp) => {
      for (let i = 0; i < records.length; i++) {
        txApp.delete(records[i])
        deletedCount++
      }
    })

    return e.json(200, { success: true, count: deletedCount })
  },
  $apis.requireAuth(),
)
