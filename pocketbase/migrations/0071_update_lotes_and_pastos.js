migrate(
  (app) => {
    // 1. Update RBAC on lotes to allow 'Financeiro' to create, update and delete
    const lotesCol = app.findCollectionByNameOrId('lotes')
    lotesCol.createRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = 'Financeiro')"
    lotesCol.updateRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = 'Financeiro')"
    lotesCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional' || @request.auth.nivel_acesso = 'Financeiro')"
    app.save(lotesCol)

    // 2. Add missing fields to pastos_e_piquetes to fully support the dynamic pasture module
    const pastosCol = app.findCollectionByNameOrId('pastos_e_piquetes')
    if (!pastosCol.fields.getByName('altura_capim_cm')) {
      pastosCol.fields.add(new NumberField({ name: 'altura_capim_cm' }))
    }
    if (!pastosCol.fields.getByName('taxa_lotacao_atual')) {
      pastosCol.fields.add(new NumberField({ name: 'taxa_lotacao_atual' }))
    }
    if (!pastosCol.fields.getByName('altura_ideal_entrada_cm')) {
      pastosCol.fields.add(new NumberField({ name: 'altura_ideal_entrada_cm' }))
    }
    if (!pastosCol.fields.getByName('altura_minima_saida_cm')) {
      pastosCol.fields.add(new NumberField({ name: 'altura_minima_saida_cm' }))
    }
    app.save(pastosCol)
  },
  (app) => {
    // Revert lotes RBAC
    const lotesCol = app.findCollectionByNameOrId('lotes')
    lotesCol.createRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional')"
    lotesCol.updateRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional')"
    lotesCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = 'Operacional')"
    app.save(lotesCol)

    // Revert pastos schema
    const pastosCol = app.findCollectionByNameOrId('pastos_e_piquetes')
    pastosCol.fields.removeByName('altura_capim_cm')
    pastosCol.fields.removeByName('taxa_lotacao_atual')
    pastosCol.fields.removeByName('altura_ideal_entrada_cm')
    pastosCol.fields.removeByName('altura_minima_saida_cm')
    app.save(pastosCol)
  },
)
