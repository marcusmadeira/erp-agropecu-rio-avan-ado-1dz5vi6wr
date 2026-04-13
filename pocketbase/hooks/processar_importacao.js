routerAdd(
  'POST',
  '/backend/v1/processar-importacao',
  (e) => {
    const body = e.requestInfo().body
    const tipo_dado = body.tipo_dado
    const registros = body.registros || []
    const arquivo_nome = body.arquivo_nome || 'import.csv'
    const estrategia = body.estrategia || 'apenas_validos'
    const usuario_id = e.auth?.id

    if (!usuario_id) throw new UnauthorizedError('Não autorizado')
    if (registros.length === 0) throw new BadRequestError('Nenhum registro para importar.')

    let inseridos = []
    let erros = []

    try {
      $app.runInTransaction((txApp) => {
        for (let i = 0; i < registros.length; i++) {
          const reg = registros[i]
          try {
            if (tipo_dado === 'animais') {
              if (!reg.id_manejo_brinco) throw new Error('Brinco obrigatório')
              try {
                txApp.findFirstRecordByData('animais', 'id_manejo_brinco', reg.id_manejo_brinco)
                throw new Error(`Brinco ${reg.id_manejo_brinco} já existe`)
              } catch (err) {
                if (err.message.includes('já existe')) throw err
              }
              const col = txApp.findCollectionByNameOrId('animais')
              const record = new Record(col)
              record.set('id_manejo_brinco', reg.id_manejo_brinco)
              record.set('nome', reg.nome || '')
              record.set('categoria', reg.categoria || 'Bezerro')
              record.set('peso_atual_kg', Number(reg.peso_atual_kg) || 0)
              record.set('status', 'Ativo')
              txApp.save(record)
              inseridos.push(record.id)
            } else if (tipo_dado === 'parceiros') {
              if (!reg.numero_documento) throw new Error('Documento obrigatório')
              try {
                txApp.findFirstRecordByData(
                  'parceiros_negocios',
                  'numero_documento',
                  reg.numero_documento,
                )
                throw new Error(`Documento ${reg.numero_documento} já existe`)
              } catch (err) {
                if (err.message.includes('já existe')) throw err
              }
              const col = txApp.findCollectionByNameOrId('parceiros_negocios')
              const record = new Record(col)
              record.set('nome_razao_social', reg.nome_razao_social || 'Desconhecido')
              record.set('numero_documento', reg.numero_documento)
              record.set('tipo_documento', reg.tipo_documento || 'CPF')
              record.set('categoria_parceiro', reg.categoria_parceiro || 'Cliente')
              record.set('status', reg.status || 'Ativo')
              record.set('contato_whatsapp_cobranca', reg.contato_whatsapp_cobranca || '')
              record.set('email_cobranca', reg.email_cobranca || '')
              if (reg.origem_importacao) {
                record.set('origem_importacao', reg.origem_importacao)
              }
              txApp.save(record)
              inseridos.push(record.id)
            } else if (tipo_dado === 'transacoes') {
              if (!reg.descricao_lancamento) throw new Error('Descrição obrigatória')
              const col = txApp.findCollectionByNameOrId('transacoes_financeiras')
              const record = new Record(col)
              record.set('descricao_lancamento', reg.descricao_lancamento)
              record.set('valor_total', Number(reg.valor_total) || 0)
              record.set('tipo_movimento', reg.tipo_movimento || 'Despesa')

              const dataComp = reg.data_competencia ? new Date(reg.data_competencia) : new Date()
              const dataVenc = reg.data_vencimento ? new Date(reg.data_vencimento) : new Date()

              record.set('data_competencia', dataComp.toISOString())
              record.set('data_vencimento', dataVenc.toISOString())
              record.set('status_pagamento', reg.status_pagamento || 'Pendente')
              record.set('classificacao_custo', 'FIXA')
              record.set('centro_custo', 'CC01')

              if (reg.parceiro_documento) {
                try {
                  const p = txApp.findFirstRecordByData(
                    'parceiros_negocios',
                    'numero_documento',
                    reg.parceiro_documento,
                  )
                  record.set('parceiro_id', p.id)
                } catch (_) {}
              }

              if (!record.get('parceiro_id')) {
                const partners = txApp.findRecordsByFilter('parceiros_negocios', '1=1', '', 1, 0)
                if (partners.length > 0) {
                  record.set('parceiro_id', partners[0].id)
                } else {
                  throw new Error('Nenhum parceiro encontrado e parceiro_id é obrigatório')
                }
              }

              txApp.save(record)
              inseridos.push(record.id)
            }
          } catch (rowErr) {
            erros.push(`Linha ${i + 1}: ${rowErr.message}`)
            if (estrategia === 'parar_falha') {
              throw new Error(`Abortado na linha ${i + 1}: ${rowErr.message}`)
            }
          }
        }

        const histCol = txApp.findCollectionByNameOrId('historico_importacoes')
        const histRecord = new Record(histCol)
        histRecord.set('usuario_id', usuario_id)
        histRecord.set('arquivo_nome', arquivo_nome)
        histRecord.set('tipo_de_dado', tipo_dado)
        histRecord.set('quantidade', inseridos.length)
        histRecord.set(
          'status',
          erros.length > 0 ? (inseridos.length > 0 ? 'Parcial' : 'Falha') : 'Sucesso',
        )
        histRecord.set('registros_ids', inseridos)
        txApp.save(histRecord)
      })
    } catch (err) {
      try {
        const histCol = $app.findCollectionByNameOrId('historico_importacoes')
        const histRecord = new Record(histCol)
        histRecord.set('usuario_id', usuario_id)
        histRecord.set('arquivo_nome', arquivo_nome)
        histRecord.set('tipo_de_dado', tipo_dado)
        histRecord.set('quantidade', 0)
        histRecord.set('status', 'Falha')
        histRecord.set('registros_ids', [])
        $app.save(histRecord)
      } catch (_) {}

      throw new BadRequestError(err.message)
    }

    return e.json(200, { success: true, inseridos: inseridos.length, erros })
  },
  $apis.requireAuth(),
)
