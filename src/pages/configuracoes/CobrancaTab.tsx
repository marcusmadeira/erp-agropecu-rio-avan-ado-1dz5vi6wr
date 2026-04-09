import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export function CobrancaTab() {
  const { toast } = useToast()
  const [configId, setConfigId] = useState('')
  const [formData, setFormData] = useState({
    taxa_juros_diaria: 0.005,
    percentual_multa: 0.02,
    ativar_juros_automaticos: true,
    ativar_multa_automatica: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    pb.collection('configuracoes_cobranca')
      .getFirstListItem('')
      .then((res) => {
        setConfigId(res.id)
        setFormData({
          taxa_juros_diaria: res.taxa_juros_diaria,
          percentual_multa: res.percentual_multa,
          ativar_juros_automaticos: res.ativar_juros_automaticos,
          ativar_multa_automatica: res.ativar_multa_automatica,
        })
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (configId) {
        await pb.collection('configuracoes_cobranca').update(configId, formData)
      } else {
        const res = await pb.collection('configuracoes_cobranca').create(formData)
        setConfigId(res.id)
      }
      toast({ title: 'Configurações de cobrança atualizadas!' })
    } catch (err) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regras Financeiras de Cobrança</CardTitle>
        <CardDescription>
          Gerencie globalmente os juros e multas aplicados automaticamente em boletos atrasados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Juros Automáticos</Label>
              <p className="text-sm text-muted-foreground">Aplica juros diários sobre atrasos.</p>
            </div>
            <Switch
              checked={formData.ativar_juros_automaticos}
              onCheckedChange={(c) => setFormData({ ...formData, ativar_juros_automaticos: c })}
            />
          </div>

          <div className="space-y-2">
            <Label>Taxa de Juros Diária (%)</Label>
            <Input
              type="number"
              step="0.001"
              value={formData.taxa_juros_diaria * 100}
              onChange={(e) =>
                setFormData({ ...formData, taxa_juros_diaria: Number(e.target.value) / 100 })
              }
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label>Ativar Multa Automática</Label>
              <p className="text-sm text-muted-foreground">Aplica multa única por atraso.</p>
            </div>
            <Switch
              checked={formData.ativar_multa_automatica}
              onCheckedChange={(c) => setFormData({ ...formData, ativar_multa_automatica: c })}
            />
          </div>

          <div className="space-y-2">
            <Label>Percentual de Multa (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.percentual_multa * 100}
              onChange={(e) =>
                setFormData({ ...formData, percentual_multa: Number(e.target.value) / 100 })
              }
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
