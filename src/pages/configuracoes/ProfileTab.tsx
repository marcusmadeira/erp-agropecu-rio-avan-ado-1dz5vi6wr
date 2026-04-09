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
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateUser } from '@/services/users'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { useToast } from '@/hooks/use-toast'
import { Lock, Camera } from 'lucide-react'

export function ProfileTab({ user }: { user: any }) {
  const { toast } = useToast()

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (user && isProfileOpen) {
      setName(user.name || '')
      setEmail(user.email || '')
      setAvatarPreview('')
      setAvatarFile(null)
    }
  }, [user, isProfileOpen])

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0])
      setAvatarPreview(URL.createObjectURL(e.target.files[0]))
    }
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email)
      if (avatarFile) formData.append('avatar', avatarFile)
      await updateUser(user.id, formData)
      toast({ title: 'Perfil atualizado', description: 'Dados salvos com sucesso.' })
      setIsProfileOpen(false)
    } catch (err: unknown) {
      const errors = extractFieldErrors(err)
      toast({
        title: 'Erro',
        description: Object.values(errors)[0] || (err as Error).message,
        variant: 'destructive',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erro', description: 'Senhas não coincidem.', variant: 'destructive' })
      return
    }
    setSavingPassword(true)
    try {
      await updateUser(user.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
      })
      toast({ title: 'Senha atualizada', description: 'Senha alterada com sucesso.' })
      setIsPasswordOpen(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const errors = extractFieldErrors(err)
      toast({
        title: 'Erro',
        description: Object.values(errors)[0] || (err as Error).message,
        variant: 'destructive',
      })
    } finally {
      setSavingPassword(false)
    }
  }

  const avatarUrl = user?.avatar
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/users/${user.id}/${user.avatar}`
    : ''
  const roleName =
    user?.nivel_acesso === 1
      ? 'Administrador'
      : user?.nivel_acesso === 2
        ? 'Gerente'
        : 'Operacional'

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Visualize e atualize os dados da sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-8 items-start">
          <Avatar className="w-32 h-32 border-4 border-slate-50 shadow-sm">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-4xl bg-primary text-white">
              {user?.name?.substring(0, 2).toUpperCase() ||
                user?.email?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome Completo</Label>
              <p className="font-medium text-lg">{user?.name || 'Não informado'}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <p className="font-medium text-lg">{user?.email}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Nível de Acesso</Label>
              <p className="font-medium text-lg">{roleName}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t px-6 py-4 flex gap-3">
          <Button
            onClick={() => setIsProfileOpen(true)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Editar Perfil
          </Button>
          <Button variant="outline" onClick={() => setIsPasswordOpen(true)}>
            <Lock className="w-4 h-4 mr-2" />
            Alterar Senha
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={saveProfile}>
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
              <DialogDescription>Atualize informações pessoais e foto.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="w-24 h-24 border-2 border-slate-100">
                  <AvatarImage src={avatarPreview || avatarUrl} />
                  <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Label
                  htmlFor="avatar-upload"
                  className="cursor-pointer text-sm font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <Camera className="w-4 h-4" /> Alterar foto
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsProfileOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={savePassword}>
            <DialogHeader>
              <DialogTitle>Alterar Senha</DialogTitle>
              <DialogDescription>Crie uma nova senha para acessar o sistema.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Senha Atual</Label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsPasswordOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? 'Salvando...' : 'Alterar Senha'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
