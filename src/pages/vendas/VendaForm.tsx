import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function VendaForm() {
  const [clientes, setClientes] = useState<any[]>([])
  const [lotes, setLotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([
      pb
        .collection('parceiros_negocios')
        .getFullList({ filter: "categoria_parceiro='Cliente' || categoria_parceiro='Outro'" }),
      pb.collection('lotes').getFullList({ filter: "status='Ativo'" }),
    ]).then(([c, l]) => {
      setClientes(c)
      setLotes(l)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)

    try {
      const venda = await pb.collection('vendas').create({
        cliente_id: fd.get('cliente_id'),
        data_venda: fd.get('data_venda'),
        tipo_gado: fd.get('tipo_gado'),
        quantidade_animais: Number(fd.get('quantidade_animais')),
        valor_total_venda: Number(fd.get('valor_total')),
        valor_entrada: Number(fd.get('valor_entrada') || 0),
        forma_pagamento: fd.get('forma_pagamento'),
        numero_parcelas: Number(fd.get('numero_parcelas') || 1),
        tipo_venda: 'Avulsa',
        status_venda: 'Confirmada',
      })

      await pb.collection('itens_venda').create({
        venda_id: venda.id,
        tipo_item: 'Lote',
        lote_id: fd.get('lote_id'),
        quantidade: Number(fd.get('quantidade_animais')),
        valor_unitario: Number(fd.get('valor_total')) / Number(fd.get('quantidade_animais')),
        valor_total: Number(fd.get('valor_total')),
      })

      toast({
        title: 'Venda registrada com sucesso!',
        description: 'As parcelas financeiras foram geradas automaticamente.',
      })
      navigate('/dashboard')
    } catch (err: any) {
      toast({ title: 'Erro ao salvar venda', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      <div>
        <h1 className="text-4xl font-serif text-[#10213d]">Nova Venda Comercial</h1>
        <p className="text-slate-500 mt-1">
          Registrar venda de animais e gerar faturamento automático.
        </p>
      </div>

      <Card className="shadow-sm border-t-4 border-t-[#10213d]">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-lg font-serif">Dados da Operação</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Cliente / Comprador</Label>
                <Select name="cliente_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome_razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data do Faturamento</Label>
                <Input
                  name="data_venda"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Lote Vendido</Label>
                <Select name="lote_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o lote..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lotes.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.nome_lote}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Qtd. de Cabeças</Label>
                <Input
                  name="quantidade_animais"
                  type="number"
                  required
                  min={1}
                  placeholder="Ex: 50"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Gado</Label>
                <Select name="tipo_gado" defaultValue="Comercial">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Comercial">Comercial TIP</SelectItem>
                    <SelectItem value="PO">Nelore PO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-2">
                <Label className="text-slate-700">Valor Total (R$)</Label>
                <Input
                  name="valor_total"
                  type="number"
                  step="0.01"
                  required
                  min={1}
                  className="font-medium text-emerald-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Entrada (R$)</Label>
                <Input name="valor_entrada" type="number" step="0.01" defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Formato</Label>
                <Select name="forma_pagamento" defaultValue="Parcelado">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVista">À Vista</SelectItem>
                    <SelectItem value="Parcelado">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Parcelas</Label>
                <Input name="numero_parcelas" type="number" required min={1} defaultValue={1} />
              </div>
              <div className="col-span-full pt-2">
                <p className="text-xs text-slate-500 font-medium bg-white p-2 rounded border inline-block">
                  <span className="text-blue-600 mr-1">ℹ️</span> O sistema gerará automaticamente as
                  parcelas financeiras no módulo de Contas a Receber, baseadas no valor financiado.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg bg-[#10213d] text-white hover:bg-[#1a2f4d] shadow-md"
            >
              Confirmar Operação de Venda
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
