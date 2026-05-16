routerAdd(
  'POST',
  '/backend/v1/fechamento-economico',
  (e) => {
    const body = e.requestInfo().body
    if (!body || !Array.isArray(body.lotes)) {
      return e.badRequestError("O campo 'lotes' deve ser um array de IDs")
    }

    const loteIds = body.lotes
    const resultados = []
    let user = e.auth

    for (const loteId of loteIds) {
      try {
        const lote = $app.findRecordById('lotes', loteId)

        let animais = []
        try {
          animais = $app.findRecordsByFilter('animais', `lote_atual_id = '${loteId}'`, '', 0, 0)
        } catch (_) {}

        let pesoInicial = 0
        let pesoAtualTotal = 0
        let custoAnimais = 0
        let sumGmd = 0
        let gmdCount = 0

        for (const a of animais) {
          const pAt = a.getFloat('peso_atual_kg')
          pesoAtualTotal += pAt
          custoAnimais += a.getFloat('custo_variavel_acumulado')

          try {
            const pesagens = $app.findRecordsByFilter(
              'pesagens_diarias',
              `animal_id = '${a.id}'`,
              'data_pesagem ASC',
              0,
              0,
            )
            if (pesagens.length > 0) {
              pesoInicial += pesagens[0].getFloat('peso_kg')
            } else {
              pesoInicial += pAt
            }
          } catch (_) {
            pesoInicial += pAt
          }

          try {
            const pesagens = $app.findRecordsByFilter(
              'pesagens_diarias',
              `animal_id = '${a.id}'`,
              'data_pesagem DESC',
              0,
              0,
            )
            if (pesagens.length > 0) {
              const gmd = pesagens[0].getFloat('gmd_calculado')
              if (gmd > 0) {
                sumGmd += gmd
                gmdCount++
              }
            }
          } catch (_) {}
        }

        let custoTratos = 0
        try {
          const tratos = $app.findRecordsByFilter(
            'trato_diario_lotes',
            `lote_id = '${loteId}'`,
            '',
            0,
            0,
          )
          for (const t of tratos) {
            custoTratos += t.getFloat('custo_total_trato')
          }
        } catch (_) {}

        let receitaTotal = 0
        let animaisVendidos = 0
        try {
          const itensVenda = $app.findRecordsByFilter(
            'itens_venda',
            `lote_id = '${loteId}'`,
            '',
            0,
            0,
          )
          for (const item of itensVenda) {
            receitaTotal += item.getFloat('valor_total')
            animaisVendidos += item.getInt('quantidade') || 1
          }
        } catch (_) {}

        for (const a of animais) {
          try {
            const itensAnimal = $app.findRecordsByFilter(
              'itens_venda',
              `animal_id = '${a.id}'`,
              '',
              0,
              0,
            )
            for (const item of itensAnimal) {
              receitaTotal += item.getFloat('valor_total')
              animaisVendidos += 1
            }
          } catch (_) {}
        }

        const ganhoTotal = pesoAtualTotal - pesoInicial
        const arrobasProduzidas = ganhoTotal > 0 ? ganhoTotal / 30 : 0
        const custoTotal = custoAnimais + custoTratos + lote.getFloat('custo_acumulado_nutricao')

        const custoPorArroba = arrobasProduzidas > 0 ? custoTotal / arrobasProduzidas : 0
        const numAnimais =
          animais.length > 0 ? animais.length : lote.getInt('quantidade_cabecas') || 1
        const margemPorCabeca = (receitaTotal - custoTotal) / numAnimais

        resultados.push({
          lote: {
            id: lote.id,
            nome: lote.getString('nome_lote'),
            quantidade_cabecas: numAnimais,
            centro_custo: lote.getString('centro_custo'),
            status: animais.length > 0 ? 'Ativo' : 'Finalizado',
          },
          animais_qtd: numAnimais,
          peso_inicial: pesoInicial,
          peso_final: pesoAtualTotal,
          ganho_total: ganhoTotal,
          gmd_medio: gmdCount > 0 ? sumGmd / gmdCount : 0,
          custo_total: custoTotal,
          custo_tratos: custoTratos,
          receita_total: receitaTotal,
          animais_vendidos: animaisVendidos,
          arrobas_produzidas: arrobasProduzidas,
          custo_por_arroba: custoPorArroba,
          margem_por_cabeca: margemPorCabeca,
          margem_total: receitaTotal - custoTotal,
        })

        if (user) {
          try {
            const auditCol = $app.findCollectionByNameOrId('auditoria_movimentacoes')
            const audit = new Record(auditCol)
            audit.set('usuario_id', user.id)
            audit.set('tipo_acao', 'READ')
            audit.set('tabela_afetada', 'lotes')
            audit.set('registro_id', loteId)
            audit.set('descricao', 'Gerou relatório de fechamento econômico do lote')
            audit.set('status', 'SUCCESS')
            audit.set('user_email', user.getString('email'))
            $app.save(audit)
          } catch (err) {
            $app.logger().error('Erro ao registrar auditoria de fechamento', err)
          }
        }
      } catch (eErr) {
        $app.logger().error('Erro no fechamento do lote', loteId, eErr)
      }
    }

    return e.json(200, resultados)
  },
  $apis.requireAuth(),
)
