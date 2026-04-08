routerAdd(
  'POST',
  '/backend/v1/ai-assistant',
  (e) => {
    const body = e.requestInfo().body
    const pergunta = body.pergunta
    const userId = e.auth.id

    if (!pergunta) {
      throw new BadRequestError('A pergunta é obrigatória.')
    }

    // Simulate AI Processing grounded on "MANUAL-DO-SISTEMA---GESTAO-PECUARIA-361.pdf"
    let resposta = ''
    const pLower = pergunta.toLowerCase()

    // Adding realistic delay for LLM simulation
    $os.sleep(1200)

    if (pLower.includes('lote') || pLower.includes('animal') || pLower.includes('animais')) {
      resposta =
        'Com base no Manual do Sistema Gestão Pecuária 361:\n\nPara gerenciar lotes e animais, acesse o menu **Rebanho**. Você pode utilizar as funções de *Curral Digital* para pesagem e manejo rápido, ou *Apartação* para transferir animais entre lotes e pastos. Lembre-se que cada animal deve ter um brinco de identificação único no sistema.'
    } else if (
      pLower.includes('financeiro') ||
      pLower.includes('custo') ||
      pLower.includes('pagamento') ||
      pLower.includes('recebimento')
    ) {
      resposta =
        'De acordo com o Manual do Sistema:\n\nOs custos e transações financeiras devem ser registrados no módulo **Financeiro**. Você pode lançar *Transações* (receitas e despesas) e associá-las a centros de custo e categorias. Para compras e vendas de gado, utilize a tela de *Eventos Comerciais* para garantir que o DRE e o custo por arroba produzida sejam calculados corretamente em seus relatórios.'
    } else if (
      pLower.includes('reprodução') ||
      pLower.includes('cio') ||
      pLower.includes('prenhez') ||
      pLower.includes('parto')
    ) {
      resposta =
        'Conforme o Manual Gestão Pecuária 360º:\n\nO controle reprodutivo é realizado através do menu **Reprodução**. Em *Eventos Reprodutivos*, você pode registrar Inseminação Artificial (IATF), Diagnóstico de Gestação (Toque) e Partos. O sistema calculará automaticamente as taxas de prenhez, intervalo entre partos e a previsão de nascimentos baseada nas IATFs registradas.'
    } else if (
      pLower.includes('pasto') ||
      pLower.includes('área') ||
      pLower.includes('estrutura') ||
      pLower.includes('lotação')
    ) {
      resposta =
        'Consultando o Manual do Sistema:\n\nO cadastro de Pastos e Áreas fica no módulo **Estrutura**. Ao cadastrar ou editar um pasto, é fundamental informar a capacidade de suporte ideal (UA/ha) e a área útil. Isso permite que o sistema emita alertas de superlotação no painel e ajude no seu planejamento de rotação de pastagens.'
    } else if (
      pLower.includes('suprimento') ||
      pLower.includes('estoque') ||
      pLower.includes('ração') ||
      pLower.includes('vacina')
    ) {
      resposta =
        'Sobre o gerenciamento de suprimentos no Manual:\n\nAcesse o menu **Suprimentos** para visualizar o *Estoque*. Lá você gerencia medicamentos, vacinas, sal mineral e ração. Utilize a tela de *Manejo* para registrar a aplicação de medicamentos aos lotes, o que dará baixa automática no estoque e apropriará o custo aos animais.'
    } else {
      resposta =
        'Analisando o Manual do Sistema Gestão Pecuária 361...\n\nO sistema é bem abrangente. Posso ajudar detalhando processos sobre Cadastros, Rebanho, Reprodução, Suprimentos, Financeiro ou Operações (como maquinário e clima). Você poderia especificar qual módulo ou rotina gostaria de entender melhor?'
    }

    const collection = $app.findCollectionByNameOrId('conversas_ia')
    const record = new Record(collection)
    record.set('usuario_id', userId)
    record.set('pergunta', pergunta)
    record.set('resposta', resposta)

    $app.save(record)

    return e.json(200, record)
  },
  $apis.requireAuth(),
)
