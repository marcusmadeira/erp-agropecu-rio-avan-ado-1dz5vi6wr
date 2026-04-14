import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getFormulacoes, deleteFormulacao, FormulacaoRacao } from '@/services/formulacoes_racao'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function ReceitasRacao() {
  const [formulacoes, setFormulacoes] = useState<FormulacaoRacao[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getFormulacoes()
      setFormulacoes(data)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as receitas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('formulacoes_racao', () => loadData())

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta receita?')) return
    try {
      await deleteFormulacao(id)
      toast({ title: 'Sucesso', description: 'Receita deletada com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao deletar receita.', variant: 'destructive' })
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Receitas de Ração</h2>
        <div className="flex items-center space-x-2">
          <Link to="/receitas-racao/nova">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nova Receita
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Formulações Manuais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto w-full">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome da Receita</th>
                  <th className="px-4 py-3 font-medium">Categoria Animal</th>
                  <th className="px-4 py-3 font-medium text-right">Custo / Kg</th>
                  <th className="px-4 py-3 font-medium">Data de Criação</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center">
                      Carregando...
                    </td>
                  </tr>
                ) : formulacoes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">
                      Nenhuma receita cadastrada.
                    </td>
                  </tr>
                ) : (
                  formulacoes.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{item.nome_formulacao}</td>
                      <td className="px-4 py-3">{item.categoria_animal || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {item.custo_kg_produzido
                          ? new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(item.custo_kg_produzido)
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(item.created).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Link to={`/receitas-racao/editar/${item.id}`}>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
