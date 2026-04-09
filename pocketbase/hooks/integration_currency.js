routerAdd(
  'GET',
  '/backend/v1/integrations/currency',
  (e) => {
    const data = {
      USD: { cotacao: 5.15, variacao: -0.2 },
      EUR: { cotacao: 5.58, variacao: 0.1 },
      last_updated: new Date().toISOString(),
    }
    return e.json(200, data)
  },
  $apis.requireAuth(),
)
