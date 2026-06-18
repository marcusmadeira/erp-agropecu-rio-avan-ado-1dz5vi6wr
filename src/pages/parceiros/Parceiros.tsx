import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export default function Parceiros() {
  const [parceiros, setParceiros] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    try {
      const res = await pb.collection('parceiros_negocios').getFullList({ sort: '-created' })
      setParceiros(res)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      await pb.collection('parceiros_negocios').create({
        nome_razao_social: fd.get('nome'),
        tipo_documento: fd.get('tipo_doc'),
        numero_documento: fd.get('doc'),
        email: fd.get('email'),
        contato_whatsapp: fd.get('phone'),
        categoria_parceiro: fd.get('cat'),
        status: 'Ativo',
      })
      toast({ title: 'Parceiro registrado com sucesso!' })
      setOpen(false)
      load()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif text-[#10213d]">CRM Comercial</h1>
          <p className="text-slate-500 mt-1">
            Gestão de Clientes e Parceiros (Módulo Toriba Premium)
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#10213d] text-white hover:bg-[#1a2f4d]">Novo Parceiro</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Cadastrar Parceiro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nome / Razão Social</Label>
                <Input name="nome" required placeholder="Ex: Fazenda Santa Helena" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select name="tipo_doc" defaultValue="CPF">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="CNPJ">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Documento</Label>
                  <Input name="doc" required placeholder="000.000.000-00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" placeholder="contato@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input name="phone" placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria Comercial</Label>
                <Select name="cat" defaultValue="Cliente">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cliente">Cliente (Comprador)</SelectItem>
                    <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                    <SelectItem value="Transportadora">Transportadora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#10213d] text-white mt-4 hover:bg-[#1a2f4d]"
              >
                Confirmar Cadastro
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Nome / Razão Social</TableHead>
                <TableHead className="font-semibold text-slate-700">Categoria</TableHead>
                <TableHead className="font-semibold text-slate-700">Documento</TableHead>
                <TableHead className="font-semibold text-slate-700">Contato</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parceiros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    Nenhum parceiro comercial registrado no sistema.
                  </TableCell>
                </TableRow>
              ) : (
                parceiros.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-[#10213d]">
                      {p.nome_razao_social}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">
                        {p.categoria_parceiro}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">{p.numero_documento}</TableCell>
                    <TableCell className="text-slate-600">
                      {p.contato_whatsapp || p.email}
                    </TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-medium">
                        {p.status || 'Ativo'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
