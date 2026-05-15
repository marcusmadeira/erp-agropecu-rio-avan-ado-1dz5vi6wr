routerAdd(
  'POST',
  '/backend/v1/salvar_nota_fiscal_ocr',
  (e) => {
    const dadosRaw = e.request.formValue('dados')
    let dados
    try {
      dados = JSON.parse(dadosRaw)
    } catch (err) {
      return e.badRequestError('Dados inválidos. ' + err.message)
    }

    const files = e.findUploadedFiles('arquivo')
    const arquivo = files && files.length > 0 ? files[0] : null

    if (dados.produtos && dados.produtos.length > 0) {
      for (const p of dados.produtos) {
        if (p.tipo === 'estoque' && (p.quantidade <= 0 || p.valor_unitario <= 0)) {
          return e.badRequestError(`Produto ${p.nome} possui quantidade ou valor <= 0.`)
        }
      }
    }

    try {
      $app.runInTransaction((txApp) => {
        let parceiroId = null
        let cnpjClean = (dados.fornecedor.cnpj || '').replace(/\D/g, '')
        try {
          const p = txApp.findFirstRecordByData(
            'parceiros_negocios',
            'numero_documento',
            cnpjClean || dados.fornecedor.cnpj,
          )
          parceiroId = p.id
        } catch (_) {}

        if (!parceiroId) {
          const colParceiro = txApp.findCollectionByNameOrId('parceiros_negocios')
          const newP = new Record(colParceiro)
          newP.set('nome_razao_social', dados.fornecedor.nome || 'Fornecedor OCR')
          newP.set('numero_documento', cnpjClean || '00000000000')
          newP.set('tipo_documento', cnpjClean && cnpjClean.length > 11 ? 'CNPJ' : 'CPF')
          newP.set('categoria_parceiro', 'Fornecedor')
          newP.set('status', 'Ativo')
          txApp.save(newP)
          parceiroId = newP.id
        }

        try {
          const existingEstoque = txApp.findRecordsByFilter(
            'estoque_movimentacoes',
            `nota_fiscal = {:nf}`,
            '',
            1,
            0,
            { nf: dados.nota_fiscal },
          )
          if (existingEstoque.length > 0) {
            throw new Error(`Nota fiscal ${dados.nota_fiscal} já foi importada (Estoque).`)
          }
        } catch (err) {
          if (err.message.includes('já foi importada')) throw err
        }

        try {
          const existingDesp = txApp.findRecordsByFilter(
            'despesas',
            `fornecedor_id = {:fid} && descricao ~ {:nf}`,
            '',
            1,
            0,
            { fid: parceiroId, nf: dados.nota_fiscal },
          )
          if (existingDesp.length > 0) {
            throw new Error(`Nota fiscal ${dados.nota_fiscal} já foi importada (Despesa).`)
          }
        } catch (err) {
          if (err.message.includes('já foi importada')) throw err
        }

        let valorDespesa = 0

        if (dados.produtos && dados.produtos.length > 0) {
          for (const p of dados.produtos) {
            if (p.tipo === 'despesa') {
              valorDespesa += p.valor_total
            } else if (p.tipo === 'estoque') {
              let insumoId = null
              try {
                const insumos = txApp.findRecordsByFilter(
                  'estoque_insumos',
                  `produto = {:nome}`,
                  '',
                  1,
                  0,
                  { nome: p.nome },
                )
                if (insumos.length > 0) {
                  const ins = insumos[0]
                  insumoId = ins.id
                  ins.set('quantidade_atual', ins.getFloat('quantidade_atual') + p.quantidade)
                  ins.set('custo_medio_unitario', p.valor_unitario)
                  txApp.save(ins)
                } else {
                  const colInsumo = txApp.findCollectionByNameOrId('estoque_insumos')
                  const newIns = new Record(colInsumo)
                  newIns.set('produto', p.nome)
                  newIns.set('quantidade_atual', p.quantidade)
                  newIns.set('unidade_medida', 'UN')
                  newIns.set('custo_medio_unitario', p.valor_unitario)
                  newIns.set('categoria', 'Outros')
                  txApp.save(newIns)
                  insumoId = newIns.id
                }
              } catch (err) {
                const colInsumo = txApp.findCollectionByNameOrId('estoque_insumos')
                const newIns = new Record(colInsumo)
                newIns.set('produto', p.nome)
                newIns.set('quantidade_atual', p.quantidade)
                newIns.set('unidade_medida', 'UN')
                newIns.set('custo_medio_unitario', p.valor_unitario)
                newIns.set('categoria', 'Outros')
                txApp.save(newIns)
                insumoId = newIns.id
              }

              const colMov = txApp.findCollectionByNameOrId('estoque_movimentacoes')
              const newMov = new Record(colMov)
              newMov.set('tipo', 'ENTRADA_NOTA_FISCAL')
              newMov.set('produto_id', insumoId)
              newMov.set('quantidade', p.quantidade)
              newMov.set('valor_unitario', p.valor_unitario)
              newMov.set('valor_total', p.valor_total)
              newMov.set('fornecedor', dados.fornecedor.nome)
              newMov.set('nota_fiscal', dados.nota_fiscal)
              newMov.set('data', dados.data)
              newMov.set('usuario_id', e.auth.id)
              txApp.save(newMov)
            }
          }
        }

        if (
          valorDespesa > 0 ||
          (dados.valor_total > 0 && (!dados.produtos || dados.produtos.length === 0))
        ) {
          let v = valorDespesa > 0 ? valorDespesa : dados.valor_total
          const colDesp = txApp.findCollectionByNameOrId('despesas')
          const newDesp = new Record(colDesp)
          newDesp.set('fornecedor_id', parceiroId)
          newDesp.set('tipo_despesa', 'Nota Fiscal OCR')
          newDesp.set('descricao', `NF: ${dados.nota_fiscal}`)
          newDesp.set('valor', v)
          newDesp.set('valor_total', v)
          newDesp.set('data_despesa', dados.data)
          newDesp.set('centro_custo', 'Geral')
          newDesp.set('classificacao_custo', 'FIXA')
          txApp.save(newDesp)

          if (dados.data_vencimento) {
            const colBol = txApp.findCollectionByNameOrId('boletos_pagar')
            const newBol = new Record(colBol)
            newBol.set('despesa_id', newDesp.id)
            newBol.set('fornecedor_id', parceiroId)
            newBol.set('valor', v)
            newBol.set('data_vencimento', dados.data_vencimento)
            newBol.set('status', 'Pendente')
            newBol.set('numero_boleto', dados.nota_fiscal)
            txApp.save(newBol)
          }
        }

        const colHist = txApp.findCollectionByNameOrId('historico_importacoes')
        const newHist = new Record(colHist)
        newHist.set('usuario_id', e.auth.id)
        newHist.set('arquivo_nome', arquivo ? arquivo.name : `Nota_${dados.nota_fiscal}.pdf`)
        newHist.set('tipo_de_dado', 'Notas Fiscais')
        newHist.set('quantidade', dados.produtos ? dados.produtos.length : 1)
        newHist.set('status', 'Sucesso')
        if (arquivo) {
          newHist.set('arquivo_upload', arquivo)
        }
        txApp.save(newHist)
      })
      return e.json(200, { success: true })
    } catch (err) {
      try {
        const colHist = $app.findCollectionByNameOrId('historico_importacoes')
        const newHist = new Record(colHist)
        newHist.set('usuario_id', e.auth?.id)
        newHist.set('arquivo_nome', arquivo ? arquivo.name : 'Erro OCR')
        newHist.set('tipo_de_dado', 'Notas Fiscais')
        newHist.set('quantidade', 0)
        newHist.set('status', 'Falha')
        $app.save(newHist)
      } catch (_) {}
      return e.badRequestError(err.message)
    }
  },
  $apis.requireAuth(),
)
