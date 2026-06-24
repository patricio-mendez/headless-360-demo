import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { ComponentType } from 'react'

interface StatTileProps {
  label: string
  value: string
  hint?: string
  icon: ComponentType<{ className?: string }>
  tone: 'blue' | 'orange' | 'coral' | 'cyan' | 'mint' | 'violet'
  /** Posición del tile en su grupo. Se usa para escalonar la animación de entrada. */
  index?: number
  /** Si se pasa, el tile se vuelve clickable y navega a esa ruta. */
  to?: string
}

/**
 * Count-up del primer número que aparezca en `value`, conservando el formato.
 *
 * Solo se anima la PRIMERA vez que el value cambia o aparece. Para evitar
 * loops por re-render, evitamos depender de `match` (que es un objeto nuevo
 * en cada llamada).
 */
function useCountUp(value: string, durationMs = 800, delayMs = 0): string {
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const match = value.match(/-?[\d.,]+/)
    if (!match) {
      setDisplay(value)
      return
    }
    const numStr = match[0]
    const target = parseFloat(numStr.replace(/\./g, '').replace(/,/g, '.'))
    if (!Number.isFinite(target)) {
      setDisplay(value)
      return
    }

    setDisplay(value.replace(numStr, '0'))
    let raf = 0
    let startTs = 0
    let cancelled = false

    const tick = (ts: number) => {
      if (cancelled) return
      if (!startTs) startTs = ts
      const elapsed = ts - startTs - delayMs
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick)
        return
      }
      const progress = Math.min(1, elapsed / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      const current = target * eased
      const formatted = Math.round(current).toLocaleString('es-AR').replace(/,/g, '.')
      setDisplay(value.replace(numStr, formatted))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setDisplay(value)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [value, durationMs, delayMs])

  return display
}

/**
 * StatTile premium con tres efectos:
 *  1. Reflejo "glass shine" que cruza diagonalmente en hover (shimmer).
 *  2. Tilt 3D sutil siguiendo la posición del mouse (perspective + rotate).
 *  3. Spotlight radial que sigue el cursor (CSS variables --mx/--my).
 *
 * Todo CSS puro + transform en GPU — sin librería de animación.
 */
export function StatTile({ label, value, hint, icon: Icon, tone, index = 0, to }: StatTileProps) {
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  // Cada tile entra escalonado: 0ms, 100ms, 200ms, 300ms, ...
  const enterDelayMs = index * 100
  // El count-up arranca cuando el tile ya está visible (después del pop).
  const animatedValue = useCountUp(value, 800, enterDelayMs + 200)
  const isClickable = !!to

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const px = (x / rect.width) * 100
    const py = (y / rect.height) * 100
    // Tilt: -6° a 6° sobre Y (mouse horizontal), 6° a -6° sobre X (mouse vertical).
    const rx = ((y / rect.height) - 0.5) * -8
    const ry = ((x / rect.width) - 0.5) * 8
    el.style.setProperty('--mx', `${px}%`)
    el.style.setProperty('--my', `${py}%`)
    el.style.setProperty('--rx', `${rx}deg`)
    el.style.setProperty('--ry', `${ry}deg`)
  }

  const handleLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--mx', '50%')
    el.style.setProperty('--my', '50%')
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  const map = {
    blue: 'stat-tile-blue',
    orange: 'stat-tile-orange',
    coral: 'stat-tile-coral',
    cyan: 'stat-tile-cyan',
    mint: 'stat-tile-mint',
    violet: 'stat-tile-violet',
  }
  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={isClickable ? () => navigate(to!) : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(to!)
              }
            }
          : undefined
      }
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cn(
        'stat-tile group relative overflow-hidden animate-tile-pop transition-shadow duration-300 ease-out',
        'hover:shadow-2xl',
        isClickable &&
          'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        map[tone],
      )}
      style={{
        transform: 'perspective(800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
        transformStyle: 'preserve-3d',
        animationDelay: `${enterDelayMs}ms`,
      }}
    >
      {/* Spotlight que sigue el cursor (solo hover) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.25), transparent 45%)',
        }}
      />

      {/* Glass shine automático al cargar — cruza diagonalmente una sola vez.
          `invisible` por default; el keyframe lo hace `visible` durante la animación
          y vuelve a `hidden` al final, evitando que quede una franja en el tile. */}
      <div
        aria-hidden
        className="pointer-events-none invisible absolute inset-y-0 left-0 w-1/3 animate-shine-sweep"
        style={{
          background:
            'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
          animationDelay: `${enterDelayMs + 250}ms`,
          animationFillMode: 'forwards',
        }}
      />

      {/* Glass shine en hover — separado del de carga */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 ease-out group-hover:translate-x-full group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)',
        }}
      />

      {/* Orb principal */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:bg-white/20" />
      {/* Orb secundario */}
      <div className="absolute -bottom-6 -left-2 h-20 w-20 rounded-full bg-white/5 blur-2xl transition-all duration-500 group-hover:scale-110" />

      {/* Icon container con reflejo de luz superior */}
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm ring-1 ring-white/20 transition-all duration-300 group-hover:bg-white/25 group-hover:ring-white/30">
        <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/30 to-transparent"
        />
      </div>

      <div
        className="relative mt-4 text-3xl font-bold tracking-tight tabular-nums"
        style={{ transform: 'translateZ(20px)' }}
      >
        {animatedValue}
      </div>
      <div className="relative mt-1 text-sm font-medium text-white/80">{label}</div>
      {hint && <div className="relative mt-2 text-xs text-white/70">{hint}</div>}
    </div>
  )
}
