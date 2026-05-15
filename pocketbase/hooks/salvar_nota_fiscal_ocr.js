routerAdd(
  'POST',
  '/backend/v1/salvar_nota_fiscal_ocr',
  (e) => {
    const files = e.findUploadedFiles('arquivo')
    const bodyStr = e.requestInfo().body.dados

    if (!bodyStr) throw new BadRequestError('Dados ausentes')

    let dados
    try {
      dados = JSON.parse(bodyStr)
    } catch (err) {
      throw new BadRequestError('Dados inválidos (JSON incorreto)')
    }

    const authRecord = e.auth
    if (!authRecord) throw new UnauthorizedError('Não autorizado')

    let fileHash = 'no_file'
    if (files && files.length > 0) {
      fileHash = $security.md5(files[0].name + files[0].size)
    }

    $app.runInTransaction((txApp) => {
      let fornecedorId = null
      let docClean = dados.fornecedor.cnpj.replace(/\D/g, '')

      try {
        const p = txApp.findFirstRecordByData('parceiros_negocios', 'numero_documento', docClean)
        fornecedorId = p.id
      } catch (_) {
        const pCol = txApp.findCollectionByNameOrId('parceiros_negocios')
        const pRec = new Record(pCol)
        pRec.set('nome_razao_social', dados.fornecedor.nome)
        pRec.set('numero_documento', docClean)
        pRec.set('tipo_documento', docClean.length > 11 ? 'CNPJ' : 'CPF')
        pRec.set('categoria_parceiro', 'Fornecedor')
        txApp.save(pRec)
        fornecedorId = pRec.id
      }

      for (const prod of dados.produtos) {
        if (prod.tipo === 'estoque') {
          let insumoId = null
          try {
            const ins = txApp.findFirstRecordByData('estoque_insumos', 'produto', prod.nome)
            insumoId = ins.id
            ins.set('quantidade_atual', Number(ins.get('quantidade_atual')) + prod.quantidade)
            ins.set('custo_medio_unitario', prod.valor_unitario)
            txApp.save(ins)
          } catch (_) {
            const insCol = txApp.findCollectionByNameOrId('estoque_insumos')
            const insRec = new Record(insCol)
            insRec.set('produto', prod.nome)
            insRec.set('quantidade_atual', prod.quantidade)
            insRec.set('unidade_medida', 'UN')
            insRec.set('custo_medio_unitario', prod.valor_unitario)
            insRec.set('categoria', 'Outros')
            txApp.save(insRec)
            insumoId = insRec.id
          }

          const movCol = txApp.findCollectionByNameOrId('estoque_movimentacoes')
          const movRec = new Record(movCol)
          movRec.set('tipo', 'ENTRADA_NOTA_FISCAL')
          movRec.set('produto_id', insumoId)
          movRec.set('quantidade', prod.quantidade)
          movRec.set('valor_unitario', prod.valor_unitario)
          movRec.set('valor_total', prod.valor_total)
          movRec.set('data', dados.data)
          movRec.set('fornecedor', dados.fornecedor.nome)
          movRec.set('nota_fiscal', dados.nota_fiscal)
          movRec.set('usuario_id', authRecord.id)
          txApp.save(movRec)
        } else if (prod.tipo === 'despesa') {
          const despCol = txApp.findCollectionByNameOrId('despesas')
          const despRec = new Record(despCol)
          despRec.set('fornecedor_id', fornecedorId)
          despRec.set('tipo_despesa', prod.nome)
          despRec.set('valor', prod.valor_total)
          despRec.set('valor_total', prod.valor_total)
          despRec.set('data_despesa', dados.data)
          despRec.set('quantidade_parcelas', 1)
          if (dados.data_vencimento) {
            despRec.set('vencimentos_parcelas', [dados.data_vencimento])
          }
          txApp.save(despRec)
        }
      }

      const auditCol = txApp.findCollectionByNameOrId('auditoria_movimentacoes')
      const auditRec = new Record(auditCol)
      auditRec.set('usuario_id', authRecord.id)
      auditRec.set('tipo_acao', 'CREATE')
      auditRec.set('tabela_afetada', 'importacao_ocr')
      auditRec.set('registro_id', dados.nota_fiscal)
      auditRec.set(
        'description',
        `Importação de Nota Fiscal (Hash: ${fileHash}) - ${dados.nota_fiscal}`,
      )
      auditRec.set('status', 'SUCCESS')
      txApp.save(auditRec)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
