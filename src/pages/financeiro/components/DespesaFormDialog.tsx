import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { updateDespesa } from '@/services/despesas'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function DespesaFormDialog({ open, onOpenChange, initialData, onSuccess }: any) {
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openFornecedor, setOpenFornecedor] = useState(false)
  const [fornecedorId, setFornecedorId] = useState('')

  const [qtdParcelas, setQtdParcelas] = useState(1)
  const [valorTotal, setValorTotal] = useState<number | string>('')
  const [vencimentos, setVencimentos] = useState<string[]>([])
  const [dataBase, setDataBase] = useState(new Date().toISOString().split('T')[0])
  const [pagarAgora, setPagarAgora] = useState(false)
  const [formaPagamentoVista, setFormaPagamentoVista] = useState('Dinheiro')

  useEffect(() => {
    if (open) {
      pb.collection('parceiros_negocios')
        .getFullList({ filter: "categoria_parceiro='Fornecedor'" })
        .then(setFornecedores)
        .catch((err) => {
          if (err.status === 0 || err.message === 'Failed to fetch' || err.name === 'TypeError') {
            toast.error('Falha de conexão ao carregar fornecedores.')
          }
        })
    }
  }, [open])

  useEffect(() => {
    if (initialData?.fornecedor_id) setFornecedorId(initialData.fornecedor_id)
    else setFornecedorId('')

    if (initialData) {
      setQtdParcelas(initialData.quantidade_parcelas || 1)
      setValorTotal(initialData.valor_total || initialData.valor || '')
      setDataBase(initialData.data_despesa?.split('T')[0] || new Date().toISOString().split('T')[0])
      setVencimentos(initialData.vencimentos_parcelas || [])
    } else {
      setQtdParcelas(1)
      setValorTotal('')
      setDataBase(new Date().toISOString().split('T')[0])
      setVencimentos([new Date().toISOString().split('T')[0]])
      setPagarAgora(false)
      setFormaPagamentoVista('Dinheiro')
    }
  }, [initialData, open])

  // Recalculate vencimentos when qtdParcelas changes
  useEffect(() => {
    if (qtdParcelas > 0) {
      const newVenc = []
      for (let i = 0; i < qtdParcelas; i++) {
        if (vencimentos[i]) {
          newVenc.push(vencimentos[i])
        } else {
          const d = new Date(dataBase)
          d.setMonth(d.getMonth() + i)
          newVenc.push(d.toISOString().split('T')[0])
        }
      }
      if (JSON.stringify(newVenc) !== JSON.stringify(vencimentos)) {
        setVencimentos(newVenc)
      }
    }
  }, [qtdParcelas, dataBase, vencimentos])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!fornecedorId) {
      toast.error('Selecione um fornecedor.')
      return
    }

    const formData = new FormData(e.currentTarget)

    const tipo_despesa = formData.get('tipo_despesa') as string
    if (!tipo_despesa || !tipo_despesa.trim()) {
      toast.error('O tipo de despesa é obrigatório.')
      return
    }

    if (!valorTotal || Number(valorTotal) <= 0) {
      toast.error('O valor total é obrigatório e deve ser maior que zero.')
      return
    }

    if (!qtdParcelas || qtdParcelas <= 0) {
      toast.error('A quantidade de parcelas deve ser pelo menos 1.')
      return
    }

    setLoading(true)

    const dataObj: any = {
      fornecedor_id: fornecedorId,
      data_despesa: formData.get('data_despesa'),
      tipo_despesa,
      valor_total: Number(valorTotal),
      valor: Number(valorTotal),
      quantidade_parcelas: qtdParcelas,
      valor_parcela: Number((Number(valorTotal) / qtdParcelas).toFixed(2)),
      centro_custo: formData.get('centro_custo'),
      classificacao_custo: formData.get('classificacao_custo'),
      descricao: formData.get('descricao'),
      vencimentos_parcelas: vencimentos,
    }

    try {
      if (initialData) {
        await updateDespesa(initialData.id, dataObj)
        toast.success('Despesa atualizada com sucesso!')
      } else {
        const novaDespesa = await pb.collection('despesas').create(dataObj)

        if (qtdParcelas === 1 && pagarAgora) {
          const boletos = await pb
            .collection('boletos_pagar')
            .getFullList({ filter: `despesa_id='${novaDespesa.id}'` })
          if (boletos.length > 0) {
            const fd = new FormData()
            fd.append('boleto_pagar_id', boletos[0].id)
            fd.append('data_pagamento', dataBase)
            fd.append('valor_pago', String(valorTotal))
            fd.append('forma_pagamento', formaPagamentoVista)
            await pb.collection('pagamentos_realizados').create(fd)
          }
        }

        toast.success('Despesa e parcelas criadas com sucesso!')
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      if (err.status === 0 || err.message === 'Failed to fetch' || err.name === 'TypeError') {
        toast.error('Erro de conexão: Não foi possível salvar a despesa. Verifique sua internet.')
      } else {
        toast.error(getErrorMessage(err) || 'Erro inesperado ao salvar despesa.')
      }
    } finally {
      setLoading(false)
    }
  }

  const valorParcelaPreview = Number(valorTotal)
    ? (Number(valorTotal) / qtdParcelas).toFixed(2)
    : '0.00'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-emerald-900">
              {initialData ? 'Editar Despesa' : 'Nova Despesa'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da despesa e as datas de vencimento das parcelas.
            </DialogDescription>
          </DialogHeader>
        </div>
        <ScrollArea className="flex-1 px-6">
          <form id="despesa-form" onSubmit={onSubmit} className="space-y-4 py-2">
            {initialData && (
              <div className="bg-blue-50 text-blue-900 p-3 rounded-md text-sm border border-blue-200">
                <strong>Informação:</strong> Ao editar o valor total ou quantidade de parcelas, o
                sistema recalculará automaticamente as parcelas pendentes para refletir as mudanças,
                mantendo intactas as parcelas já pagas.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 flex flex-col">
                <Label>
                  Fornecedor <span className="text-red-500">*</span>
                </Label>
                <input type="hidden" name="fornecedor_id" value={fornecedorId} />
                <Popover open={openFornecedor} onOpenChange={setOpenFornecedor}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openFornecedor}
                      className="w-full justify-between font-normal"
                    >
                      {fornecedorId
                        ? fornecedores.find((f) => f.id === fornecedorId)?.nome_razao_social
                        : 'Selecione o fornecedor...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar fornecedor..." />
                      <CommandList>
                        <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                        <CommandGroup>
                          {fornecedores.map((f) => (
                            <CommandItem
                              key={f.id}
                              value={f.nome_razao_social}
                              onSelect={() => {
                                setFornecedorId(f.id)
                                setOpenFornecedor(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  fornecedorId === f.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {f.nome_razao_social}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Data de Emissão / Ref.</Label>
                <Input
                  type="date"
                  name="data_despesa"
                  value={dataBase}
                  onChange={(e) => setDataBase(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Despesa</Label>
                <Input
                  name="tipo_despesa"
                  defaultValue={initialData?.tipo_despesa || ''}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Total (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Quantidade de Parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  max="48"
                  value={qtdParcelas}
                  onChange={(e) => setQtdParcelas(Number(e.target.value) || 1)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Valor por Parcela (R$)</Label>
                <Input type="text" value={valorParcelaPreview} disabled className="bg-gray-50" />
              </div>

              {qtdParcelas === 1 && !initialData && (
                <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-4 p-4 border rounded-md bg-slate-50 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pagarAgora"
                      checked={pagarAgora}
                      onCheckedChange={(c: boolean) => setPagarAgora(c)}
                    />
                    <Label
                      htmlFor="pagarAgora"
                      className="cursor-pointer font-medium text-emerald-800"
                    >
                      Marcar como Pago (À Vista)
                    </Label>
                  </div>
                  {pagarAgora && (
                    <div className="flex-1">
                      <Select value={formaPagamentoVista} onValueChange={setFormaPagamentoVista}>
                        <SelectTrigger className="w-full sm:w-[200px] border-emerald-200">
                          <SelectValue placeholder="Forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="Transferência">Transferência</SelectItem>
                          <SelectItem value="Boleto">Boleto</SelectItem>
                          <SelectItem value="Cartão">Cartão</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Centro de Custo</Label>
                <Input name="centro_custo" defaultValue={initialData?.centro_custo || ''} />
              </div>
              <div className="space-y-2">
                <Label>Classificação</Label>
                <Select
                  name="classificacao_custo"
                  defaultValue={initialData?.classificacao_custo || 'FIXA'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXA">Fixa</SelectItem>
                    <SelectItem value="VARIÁVEL">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {qtdParcelas > 0 && (
              <div className="mt-4 p-4 border rounded-md bg-emerald-50/50">
                <Label className="text-sm font-bold text-emerald-900 mb-3 block">
                  Vencimento das Parcelas
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {vencimentos.map((venc, idx) => (
                    <div key={idx} className="flex flex-col space-y-1">
                      <Label className="text-xs text-emerald-800">Parcela {idx + 1}</Label>
                      <Input
                        type="date"
                        value={venc}
                        onChange={(e) => {
                          const newVenc = [...vencimentos]
                          newVenc[idx] = e.target.value
                          setVencimentos(newVenc)
                        }}
                        className="h-8 text-xs border-emerald-200"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea name="descricao" defaultValue={initialData?.descricao || ''} />
            </div>
          </form>
        </ScrollArea>
        <div className="p-6 pt-4 border-t flex justify-end bg-gray-50/50 rounded-b-lg">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="mr-2"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="despesa-form"
            disabled={loading}
            className="bg-[#094016] text-white hover:bg-[#094016]/90"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
