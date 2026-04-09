routerAdd(
  'GET',
  '/backend/v1/integrations/weather',
  (e) => {
    const data = {
      temperatura: 28,
      condicao: 'Ensolarado',
      probabilidade_chuva: 10,
      umidade: 45,
      cidade: 'Uberaba, MG',
      last_updated: new Date().toISOString(),
    }
    return e.json(200, data)
  },
  $apis.requireAuth(),
)
