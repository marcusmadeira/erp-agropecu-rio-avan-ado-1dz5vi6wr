export const MACRO_CONTAS = [
  '1. RECEITAS',
  '2. AGRICULTURA E SILVICULTURA (Produção de Milho/Cana da Fazenda)',
  '3. INVESTIMENTOS',
  '4. MÃO DE OBRA PERMANENTE',
  '5. PECUÁRIA (Custos Diretos)',
  '6. SUPORTE PRODUÇÃO (Custos Indiretos)',
  '7. OUTROS CRÉDITOS/DÉBITOS',
]

export const CATEGORIAS: Record<string, string[]> = {
  '1. RECEITAS': ['Receitas Pecuárias', 'Receitas Agrícolas'],
  '3. INVESTIMENTOS': ['Bovinos', 'Infraestrutura', 'Máquinas', 'Pastagens'],
  '4. MÃO DE OBRA PERMANENTE': ['Salários e Encargos', 'Prêmios', 'Rescisões'],
  '5. PECUÁRIA (Custos Diretos)': [
    'Forrageiras/Cocho',
    'Pastagens',
    'Insumos Rebanho Comercial',
    'Insumos Rebanho Genética',
  ],
  '6. SUPORTE PRODUÇÃO (Custos Indiretos)': [
    'Administração',
    'Manutenção Infraestrutura',
    'Parque de Máquinas',
    'Taxas e Impostos',
  ],
}

export const SUBCATEGORIAS: Record<string, string[]> = {
  'Insumos Rebanho Comercial': ['Vacinas', 'Vermífugos', 'Sêmen', 'Ração', 'Sal Mineral'],
  'Insumos Rebanho Genética': ['Vacinas', 'Vermífugos', 'Sêmen', 'Ração', 'Sal Mineral'],
  'Receitas Pecuárias': ['Machos Abate', 'Machos Reprodução', 'Fêmeas Descarte'],
}

export const CENTROS_CUSTO = ['CC01-Nelore PO', 'CC02-Comercial TIP', 'CC03-Estrutural/Rateio']
