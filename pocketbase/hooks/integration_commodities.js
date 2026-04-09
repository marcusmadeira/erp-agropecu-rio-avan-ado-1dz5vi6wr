routerAdd(
  'GET',
  '/backend/v1/integrations/commodities',
  (e) => {
    const data = {
      boi_gordo: { preco: 235.5, variacao: 1.2 },
      milho: { preco: 58.2, variacao: -0.5 },
      soja: { preco: 125.0, variacao: 0.8 },
      last_updated: new Date().toISOString(),
    }
    return e.json(200, data)
  },
  $apis.requireAuth(),
)
