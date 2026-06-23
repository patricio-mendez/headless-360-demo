import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import { completeLogin } from '@/lib/oauth'
import { fetchIdentity, useAuthStore } from '@/store/auth'

type Phase = 'exchanging' | 'identity' | 'done' | 'error'

export function CallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('exchanging')
  const [error, setError] = useState<string | null>(null)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const code = params.get('code')
    const state = params.get('state')
    const oauthError = params.get('error')
    const oauthErrorDesc = params.get('error_description')

    if (oauthError) {
      setError(`${oauthError}: ${oauthErrorDesc ?? 'sin descripción'}`)
      setPhase('error')
      return
    }
    if (!code || !state) {
      setError('No se recibió el authorization code de Salesforce.')
      setPhase('error')
      return
    }

    completeLogin(code, state)
      .then(async (tokens) => {
        useAuthStore.getState().setTokens(tokens)
        setPhase('identity')
        try {
          const identity = await fetchIdentity(tokens)
          useAuthStore.getState().setIdentity(identity)
        } catch {
          // identity es nice-to-have
        }
        setPhase('done')
        setTimeout(() => navigate('/home', { replace: true }), 400)
      })
      .catch((err: Error) => {
        setError(err.message)
        setPhase('error')
      })
  }, [params, navigate])

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-card p-8 shadow-2xl">
        {phase === 'error' ? (
          <ErrorView error={error ?? 'Error desconocido'} onRetry={() => navigate('/')} />
        ) : (
          <ProgressView phase={phase} />
        )}
      </div>
    </div>
  )
}

function ProgressView({ phase }: { phase: Exclude<Phase, 'error'> }) {
  const labels: Record<Exclude<Phase, 'error'>, string> = {
    exchanging: 'Intercambiando authorization code…',
    identity: 'Obteniendo identidad del usuario…',
    done: '¡Listo! Redirigiendo al dashboard…',
  }
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-chart-blue/15 text-chart-blue">
        {phase === 'done' ? (
          <ShieldCheck className="h-6 w-6" />
        ) : (
          <Loader2 className="h-6 w-6 animate-spin" />
        )}
      </div>
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold">Autenticando con Salesforce</h2>
        <p className="text-sm text-muted-foreground">{labels[phase]}</p>
      </div>
      <div className="space-y-2">
        <Step active={phase === 'exchanging'} done={phase !== 'exchanging'} label="Authorization code → Token" />
        <Step active={phase === 'identity'} done={phase === 'done'} label="Identity endpoint" />
        <Step active={false} done={phase === 'done'} label="Listo para acceder al dashboard" />
      </div>
    </div>
  )
}

function Step({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left text-sm">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full ${
          done ? 'bg-chart-mint/20 text-chart-mint' : active ? 'bg-chart-blue/20 text-chart-blue' : 'bg-white/[0.05] text-muted-foreground'
        }`}
      >
        {done ? '✓' : active ? <Loader2 className="h-3 w-3 animate-spin" /> : '·'}
      </div>
      <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </div>
  )
}

function ErrorView({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-chart-coral/15 text-chart-coral">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold">Login fallido</h2>
        <p className="break-words rounded-lg border border-chart-coral/20 bg-chart-coral/5 p-3 text-left font-mono text-xs text-chart-coral">
          {error}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="w-full rounded-xl bg-chart-blue px-6 py-3 text-sm font-medium text-white shadow-lg shadow-chart-blue/30 hover:bg-chart-blue/90"
      >
        Volver al inicio
      </button>
    </div>
  )
}
