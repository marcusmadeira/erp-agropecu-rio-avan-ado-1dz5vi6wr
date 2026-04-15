import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { cn } from '@/lib/utils'
import { createDespesa, updateDespesa } from '@/services/despesas'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'

export default function DespesaFormDialog({ open, onOpenChange, initialData, onSuccess }: any) {
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openFornecedor, setOpenFornecedor] = useState(false)
  const [fornecedorId, setFornecedorId] = useState('')

  useEffect(() => {
    if (open) {
      pb.collection('parceiros_negocios')
        .getFullList({ filter: "categoria_parceiro='Fornecedor'" })
        .then(setFornecedores)
        .catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (initialData?.fornecedor_id) setFornecedorId(initialData.fornecedor_id)
    else setFornecedorId('')
  }, [initialData, open])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      if (initialData) await updateDespesa(initialData.id, formData)
      else await createDespesa(formData)
      toast.success('Salvo com sucesso!')
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error('Erro ao salvar despesa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col">
              <Label>Fornecedor</Label>
              <input type="hidden" name="fornecedor_id" value={fornecedorId} required />
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
                <PopoverContent className="w-[230px] p-0">
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
              <Label>Data</Label>
              <Input
                type="date"
                name="data_despesa"
                defaultValue={
                  initialData?.data_despesa?.split('T')[0] || new Date().toISOString().split('T')[0]
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Despesa</Label>
              <Input name="tipo_despesa" defaultValue={initialData?.tipo_despesa || ''} required />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                name="valor"
                defaultValue={initialData?.valor || ''}
                required
              />
            </div>
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
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea name="descricao" defaultValue={initialData?.descricao || ''} />
          </div>
          <div className="space-y-2">
            <Label>Comprovante (Arquivo)</Label>
            <Input type="file" name="comprovante_url" />
          </div>
          <div className="flex justify-end pt-4">
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
              disabled={loading}
              className="bg-[#094016] text-white hover:bg-[#094016]/90"
            >
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
