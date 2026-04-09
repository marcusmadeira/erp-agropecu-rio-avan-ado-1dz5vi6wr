import React, { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUser } from '@/services/users'
import { useToast } from '@/hooks/use-toast'
import { Mail, Palette, Globe } from 'lucide-react'

export function PreferencesTab({ user }: { user: any }) {
  const { toast } = useToast()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState('pt')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setEmailNotifications(user.email_notifications ?? true)
      setTheme(user.theme || 'light')
      setLanguage(user.language || 'pt')
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await updateUser(user.id, {
        email_notifications: emailNotifications,
        theme,
        language,
      })
      toast({ title: 'Preferências salvas', description: 'Configurações atualizadas com sucesso.' })
    } catch (err: unknown) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Personalização da Conta</CardTitle>
        <CardDescription>Ajuste o comportamento e a aparência do sistema.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Notificações por Email
            </Label>
            <p className="text-sm text-muted-foreground">
              Receba alertas sobre relatórios, backups e novidades.
            </p>
          </div>
          <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
        </div>

        <div className="space-y-3">
          <Label className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            Tema da Interface
          </Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Selecione um tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Escuro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            Idioma
          </Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Selecione um idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">Português (BR)</SelectItem>
              <SelectItem value="en">Inglês (US)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t px-6 py-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-white hover:bg-primary/90"
        >
          {isSaving ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
      </CardFooter>
    </Card>
  )
}
