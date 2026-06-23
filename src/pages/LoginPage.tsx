import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ShieldCheck, Loader2 } from 'lucide-react'
import { startLogin } from '@/lib/oauth'
import { useAuthStore } from '@/store/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/home', { replace: true })
  }, [isAuthenticated, navigate])

  async function handleLogin() {
    setLoading(true)
    try {
      await startLogin()
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 [background:radial-gradient(circle_at_15%_20%,hsl(213_95%_55%/0.18),transparent_45%),radial-gradient(circle_at_85%_75%,hsl(20_96%_62%/0.15),transparent_45%)]" />
      <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
        <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-chart-blue/30 bg-chart-blue/10 px-4 py-1.5 text-xs font-medium text-chart-blue">
              <Sparkles className="h-3.5 w-3.5" />
              Salesforce Headless 360 Demo
            </div>
            <div className="space-y-5">
              <h1 className="text-5xl font-bold leading-[1.05] lg:text-[64px]">
                Salesforce
                <br />
                <span className="gradient-text">en cualquier UI.</span>
              </h1>
              <p className="max-w-lg text-lg text-muted-foreground">
                Una experiencia 360° del cliente, construida con React, consumida vía
                API directa, con Agentforce embebido. Toda la lógica, los datos y los
                permisos viajan con la plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FeatureCard
                emoji="🤖"
                title="Construí con cualquier coding agent"
                desc="Agentforce Vibes, Claude Code, Cursor"
                tone="blue"
              />
              <FeatureCard
                emoji="</>"
                title="Desplegá en cualquier surface"
                desc="React, Slack, Teams, ChatGPT"
                tone="cyan"
              />
              <FeatureCard
                emoji="🛡️"
                title="Governance nativa heredada"
                desc="OAuth + permisos del banker"
                tone="orange"
              />
              <FeatureCard
                emoji="✨"
                title="Agentes Inteligentes nativos"
                desc="Chat con contexto y acción end-to-end"
                tone="violet"
              />
            </div>
          </div>

          <div className="relative animate-slide-up [animation-delay:120ms]">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-chart-blue/20 to-chart-orange/20 blur-2xl" />
            <div className="relative rounded-3xl border border-white/[0.08] bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Bienvenido de vuelta</h2>
                  <p className="text-sm text-muted-foreground">
                    Iniciá sesión con tu cuenta Salesforce para acceder al
                    dashboard del cliente. Tus permisos viajan con la sesión.
                  </p>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-chart-blue to-chart-cyan px-6 py-4 text-base font-semibold text-white shadow-lg shadow-chart-blue/30 transition-all hover:shadow-xl hover:shadow-chart-blue/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CloudIcon />}
                    {loading ? 'Redirigiendo a Salesforce…' : 'Iniciar sesión con Salesforce'}
                  </span>
                </button>

                <div className="flex items-center gap-3 rounded-xl border border-chart-orange/25 bg-chart-orange/10 p-3 text-xs text-chart-orange">
                  <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                  <span>OAuth 2.0 Web Server Flow + PKCE — sin secretos en el browser</span>
                </div>

                <div className="border-t border-white/5 pt-4 text-center text-xs text-muted-foreground">
                  Demo interna · Org <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">sdo-disputes</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  emoji,
  title,
  desc,
  tone,
}: {
  emoji: string
  title: string
  desc: string
  tone: 'blue' | 'orange' | 'cyan' | 'violet'
}) {
  const tones = {
    blue: 'bg-chart-blue/10 text-chart-blue border-chart-blue/20',
    orange: 'bg-chart-orange/10 text-chart-orange border-chart-orange/20',
    cyan: 'bg-chart-cyan/10 text-chart-cyan border-chart-cyan/20',
    violet: 'bg-chart-violet/10 text-chart-violet border-chart-violet/20',
  }
  return (
    <div className="rounded-2xl border border-white/5 bg-card/40 p-4 backdrop-blur-sm">
      <div
        className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border text-lg ${tones[tone]}`}
      >
        {emoji}
      </div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </div>
  )
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12.5 4.5C9.5 4.5 7 6.5 6.3 9.2 4.4 9.7 3 11.5 3 13.6c0 2.4 2 4.4 4.4 4.4h11.4c2.6 0 4.7-2.1 4.7-4.7 0-2.4-1.8-4.4-4.2-4.7C18.4 6.5 15.7 4.5 12.5 4.5z" />
    </svg>
  )
}
