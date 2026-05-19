import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ShieldCheck, Briefcase, Landmark, Tractor, ArrowLeft, Key } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSystemConfig } from '@/hooks/use-system-config'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<
    'Administração' | 'Gerente' | 'Financeiro' | 'Operacional' | 'Outro' | null
  >(null)
  const [masterKey, setMasterKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { logoUrl } = useSystemConfig()

  useEffect(() => {
    if (location.state && typeof location.state === 'object' && 'message' in location.state) {
      toast({
        title: 'Sucesso',
        description: (location.state as { message: string }).message,
      })
      window.history.replaceState({}, document.title)
    }
  }, [location.state, toast])

  const handleRoleSelect = (
    role: 'Administração' | 'Gerente' | 'Financeiro' | 'Operacional' | 'Outro',
  ) => {
    setSelectedRole(role)
    setMasterKey('')
    setCustomEmail('')
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let email = ''
    if (selectedRole === 'Administração') email = 'admin@toriba.com'
    else if (selectedRole === 'Gerente') email = 'gerente@toriba.com'
    else if (selectedRole === 'Financeiro') email = 'financeiro@toriba.com'
    else if (selectedRole === 'Operacional') email = 'operacional@toriba.com'
    else if (selectedRole === 'Outro') email = customEmail

    if (!email) {
      toast({
        title: 'Acesso Negado',
        description: 'E-mail não informado.',
        variant: 'destructive',
      })
      return
    }

    await authenticate(email, masterKey)
  }

  const authenticate = async (email: string, pass: string) => {
    setIsLoading(true)
    const { error } = await signIn(email, pass)
    setIsLoading(false)

    if (error) {
      const isAuthError = error?.status === 400 || error?.status === 401
      const isServerError = error?.status === 0 || error?.status === 500

      let description = getErrorMessage(error) || 'E-mail ou senha incorretos.'
      if (isAuthError) description = 'E-mail ou senha incorretos.'
      if (isServerError)
        description = 'Erro de conexão com o servidor. Tente novamente em instantes.'

      toast({
        title: 'Erro de autenticação',
        description,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Acesso Liberado',
        description: 'Bem-vindo ao sistema.',
      })
      if (email === 'operacional@toriba.com') {
        navigate('/animais', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    }
  }

  const profiles = [
    { id: 'Gerente', title: 'Gerente', icon: Briefcase, color: 'bg-blue-500' },
    { id: 'Financeiro', title: 'Financeiro', icon: Landmark, color: 'bg-emerald-600' },
    { id: 'Administração', title: 'Administração', icon: ShieldCheck, color: 'bg-purple-600' },
    { id: 'Operacional', title: 'Operacional', icon: Tractor, color: 'bg-amber-600' },
    { id: 'Outro', title: 'Outro Acesso', icon: Key, color: 'bg-slate-600' },
  ] as const

  const [customEmail, setCustomEmail] = useState('')

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-50 p-4"
      style={{ fontFamily: '"Montserrat", "Roboto", sans-serif' }}
    >
      <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-brand animate-fade-in-up bg-white">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 flex justify-center">
            <img
              src={logoUrl || 'https://img.usecurling.com/i?q=toriba&color=solid-black&shape=fill'}
              alt="Toriba Agropecuária Logo"
              style={{ width: '100px', height: '100px' }}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Portal de Acesso
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Selecione seu perfil para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedRole ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleRoleSelect(profile.id)}
                  disabled={isLoading}
                  className="group relative flex flex-col items-center justify-center p-6 bg-white border-2 border-slate-100 rounded-xl hover:border-brand hover:shadow-md transition-all duration-200"
                >
                  <div
                    className={cn(
                      'p-4 rounded-full text-white mb-4 shadow-sm group-hover:scale-110 transition-transform duration-200',
                      profile.color,
                    )}
                  >
                    <profile.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 group-hover:text-brand">
                    {profile.title}
                  </h3>
                  {profile.id === 'Operacional' && (
                    <span className="absolute top-3 right-3 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="max-w-sm mx-auto space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Acesso: {selectedRole}</h3>
                <p className="text-slate-500 text-sm">Insira sua senha para continuar.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <fieldset disabled={isLoading} className="space-y-4 border-0 p-0 m-0 min-w-0">
                  {selectedRole === 'Outro' && (
                    <div className="space-y-2 text-left animate-fade-in-down">
                      <Label htmlFor="customEmail" className="font-bold text-slate-700">
                        E-mail ou Login
                      </Label>
                      <Input
                        id="customEmail"
                        type="text"
                        placeholder="email@exemplo.com ou login"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                  )}

                  <div className="space-y-2 text-left">
                    <Label htmlFor="masterKey" className="font-bold text-slate-700">
                      Senha
                    </Label>
                    <Input
                      id="masterKey"
                      type="password"
                      placeholder="***"
                      value={masterKey}
                      onChange={(e) => setMasterKey(e.target.value)}
                      autoFocus={selectedRole !== 'Outro'}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedRole(null)}
                      disabled={isLoading}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-brand hover:bg-brand/90 text-white font-bold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Autenticando...
                        </>
                      ) : (
                        'Entrar'
                      )}
                    </Button>
                  </div>
                </fieldset>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
