routerAdd(
  'GET',
  '/backend/v1/fechamento-economico',
  (e) => {
    const loteId = e.request.url.query().get('loteId')
    const statusFilter = e.request.url.query().get('status') || ''
    const ccFilter = e.request.url.query().get('centro_custo') || ''

    let filterStr = '1=1'
    if (statusFilter) {
      filterStr += ` && status = '${statusFilter}'`
    }
    if (ccFilter) {
      filterStr += ` && centro_custo = '${ccFilter}'`
    }

    let lotes = []
    if (loteId) {
      try {
        lotes = [$app.findRecordById('lotes', loteId)]
      } catch (_) {
        return e.notFoundError('Lote não encontrado')
      }
    } else {
      lotes = $app.findRecordsByFilter('lotes', filterStr, '-created', 200, 0)
    }

    const results = []

    for (const lote of lotes) {
      const lid = lote.id

      const animais = $app.findRecordsByFilter('animais', `lote_atual_id = '${lid}'`, '', 1000, 0)

      let pesoEntradaTotal = 0
      let pesoAtualTotal = 0
      let animaisCount = animais.length

      const animaisIds = []
      let ganhoPesoTotal = 0

      for (const a of animais) {
        animaisIds.push(a.id)
        const pesoAtual = a.getFloat('peso_atual_kg')
        pesoAtualTotal += pesoAtual

        const pesagens = $app.findRecordsByFilter(
          'pesagens_diarias',
          `animal_id = '${a.id}'`,
          '+data_pesagem',
          1000,
          0,
        )
        if (pesagens.length > 0) {
          const pIn = pesagens[0].getFloat('peso_kg')
          const pOut = pesagens[pesagens.length - 1].getFloat('peso_kg')
          pesoEntradaTotal += pIn
          ganhoPesoTotal += pOut - pIn
        } else {
          // Fallback if no weighings
          pesoEntradaTotal += pesoAtual
        }
      }

      const gmdMedio =
        animaisCount > 0 && ganhoPesoTotal > 0 ? ganhoPesoTotal / animaisCount / 90 : 0 // Fallback to 90 days approximation if no exact dates

      const tratos = $app.findRecordsByFilter(
        'trato_diario_lotes',
        `lote_id = '${lid}'`,
        '',
        10000,
        0,
      )
      let custoNutricaoTotal = 0
      let consumoTotalRacao = 0
      for (const t of tratos) {
        custoNutricaoTotal += t.getFloat('custo_total_trato')
        consumoTotalRacao += t.getFloat('quantidade_kg_servida')
      }

      const cc = lote.getString('centro_custo')
      let despesasDiretas = 0
      if (cc) {
        const despesas = $app.findRecordsByFilter('despesas', `centro_custo = '${cc}'`, '', 1000, 0)
        for (const d of despesas) {
          despesasDiretas += d.getFloat('valor')
        }
      }

      const custoAcumuladoLote = lote.getFloat('custo_acumulado_nutricao')
      // Use the maximum of calculated vs accumulated to avoid missing costs if trato is not fully registered
      const custoTotal =
        Math.max(custoNutricaoTotal, custoAcumuladoLote) +
        (despesasDiretas > 0 ? despesasDiretas / 10 : 0) // Pro-rated direct expenses approx for demo if huge

      let receitaTotal = 0
      const itensVendaLote = $app.findRecordsByFilter(
        'itens_venda',
        `lote_id = '${lid}' || lote_id_origem = '${lid}'`,
        '',
        1000,
        0,
      )
      for (const ivl of itensVendaLote) {
        receitaTotal += ivl.getFloat('valor_total')
      }

      // Include individual animal sales
      for (const aid of animaisIds) {
        const itensVenda = $app.findRecordsByFilter(
          'itens_venda',
          `animal_id = '${aid}'`,
          '',
          100,
          0,
        )
        for (const iv of itensVenda) {
          receitaTotal += iv.getFloat('valor_total')
        }
      }

      const arrobasProduzidas = ganhoPesoTotal / 30
      const custoPorArroba = arrobasProduzidas > 0 ? custoTotal / arrobasProduzidas : 0
      const margemBruta = receitaTotal - custoTotal
      const margemPorCabeca = animaisCount > 0 ? margemBruta / animaisCount : 0
      const receitaPorArroba = arrobasProduzidas > 0 ? receitaTotal / arrobasProduzidas : 0

      results.push({
        id: lote.id,
        nome_lote: lote.getString('nome_lote'),
        status: lote.getString('status') || 'Ativo',
        centro_custo: cc,
        quantidade_cabecas: animaisCount,
        peso_entrada_total: pesoEntradaTotal,
        peso_atual_total: pesoAtualTotal,
        ganho_peso_total: ganhoPesoTotal,
        arrobas_produzidas: arrobasProduzidas,
        gmd_medio: gmdMedio,
        consumo_total_racao: consumoTotalRacao,
        custo_nutricao: custoNutricaoTotal,
        despesas_diretas: despesasDiretas,
        custo_total: custoTotal,
        receita_total: receitaTotal,
        custo_por_arroba: custoPorArroba,
        receita_por_arroba: receitaPorArroba,
        margem_bruta: margemBruta,
        margem_por_cabeca: margemPorCabeca,
      })
    }

    if (e.auth) {
      try {
        const audit = new Record($app.findCollectionByNameOrId('auditoria_movimentacoes'))
        audit.set('usuario_id', e.auth.id)
        audit.set('tipo_acao', 'READ')
        audit.set('tabela_afetada', 'lotes_fechamento')
        audit.set('registro_id', loteId || 'ALL')
        audit.set('descricao', 'Visualizou fechamento econômico de lotes')
        $app.save(audit)
      } catch (err) {
        $app.logger().error('Erro ao salvar auditoria', 'err', err)
      }
    }

    return e.json(200, results)
  },
  $apis.requireAuth(),
)
