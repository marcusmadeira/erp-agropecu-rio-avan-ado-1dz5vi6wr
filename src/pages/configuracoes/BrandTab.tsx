import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useSystemConfig } from '@/hooks/use-system-config'
import { updateSystemConfig } from '@/services/configuracoes'
import { Loader2, Upload } from 'lucide-react'

export function BrandTab() {
  const { config, logoUrl, reload } = useSystemConfig()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

  const handleSave = async () => {
    if (!file) return
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      await updateSystemConfig(config?.id || null, formData)
      toast({ title: 'Sucesso', description: 'Logo atualizado com sucesso.' })
      await reload()
      setFile(null)
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar logo.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="animate-fade-in-up border-brand hover:border-brand/80 transition-colors">
      <CardHeader>
        <CardTitle>Identidade Visual</CardTitle>
        <CardDescription>Personalize a marca do sistema com o seu logo principal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Logo Atual</Label>
          <div className="p-4 border rounded-md bg-slate-50 flex items-center justify-center border-dashed">
            <img src={preview || logoUrl} alt="Logo da Marca" className="max-h-32 object-contain" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo-upload">Alterar Logo</Label>
            <div className="flex gap-4 items-center">
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="max-w-sm cursor-pointer"
              />
              <Button
                onClick={handleSave}
                disabled={!file || saving}
                className="bg-brand hover:bg-brand/90 text-white"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Recomendado: Imagem PNG ou JPEG (Tamanho máx: 5MB). O logo será usado no cabeçalho,
              PDFs e login.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
