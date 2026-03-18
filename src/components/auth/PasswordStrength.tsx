import { cn } from '@/lib/utils'

export function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    if (!password) return { value: 0, label: '', color: 'bg-slate-200' }
    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    if (score <= 2) return { value: 33, label: 'Fraca', color: 'bg-rose-500' }
    if (score <= 4) return { value: 66, label: 'Média', color: 'bg-amber-500' }
    return { value: 100, label: 'Forte', color: 'bg-emerald-500' }
  }

  const strength = getStrength()

  if (!password) return null

  return (
    <div className="space-y-1 mt-2 animate-fade-in">
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
        <div
          className={cn('h-full transition-all duration-300', strength.color)}
          style={{ width: `${strength.value}%` }}
        />
      </div>
      <p
        className={cn(
          'text-xs text-right font-medium',
          strength.value <= 33
            ? 'text-rose-600'
            : strength.value <= 66
              ? 'text-amber-600'
              : 'text-emerald-600',
        )}
      >
        Nível de Segurança: {strength.label}
      </p>
    </div>
  )
}
