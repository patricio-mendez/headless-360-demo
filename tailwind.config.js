/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    'bg-chart-blue',
    'bg-chart-orange',
    'bg-chart-mint',
    'bg-chart-coral',
    'bg-chart-cyan',
    'bg-chart-violet',
    'text-chart-blue',
    'text-chart-orange',
    'text-chart-mint',
    'text-chart-coral',
    'text-chart-cyan',
    'text-chart-violet',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        sidebar: 'hsl(var(--sidebar))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          blue: 'hsl(var(--chart-blue))',
          orange: 'hsl(var(--chart-orange))',
          cyan: 'hsl(var(--chart-cyan))',
          coral: 'hsl(var(--chart-coral))',
          violet: 'hsl(var(--chart-violet))',
          mint: 'hsl(var(--chart-mint))',
        },
        soft: {
          blue: 'hsl(var(--soft-blue))',
          pink: 'hsl(var(--soft-pink))',
          mint: 'hsl(var(--soft-mint))',
        },
        sf: {
          blue: '#1B96FF',
          navy: '#0B0E1F',
          orange: '#FF7E40',
          ink: '#0E1124',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        '2xl': 'calc(var(--radius) + 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // Entrada con bounce suave para tiles (escala + slide)
        'tile-pop': {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.92)' },
          '60%': { opacity: '1', transform: 'translateY(-2px) scale(1.02)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Reflejo diagonal que cruza el tile una sola vez al cargar
        'shine-sweep': {
          '0%': { transform: 'translateX(-200%)', opacity: '0', visibility: 'visible' },
          '15%': { opacity: '1' },
          '85%': { opacity: '1' },
          '100%': { transform: 'translateX(400%)', opacity: '0', visibility: 'hidden' },
        },
        // Item de timeline: slide-in desde la izquierda + fade.
        'timeline-in': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        // Marker de timeline: pop-in con bounce.
        'marker-pop': {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '60%': { opacity: '1', transform: 'scale(1.4)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Línea conectora vertical: se "dibuja" de arriba a abajo.
        'line-draw': {
          '0%': { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' },
        },
        // Track horizontal: se "dibuja" de izquierda a derecha.
        'line-draw-x': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        // Ping suave para markers futuros (no infinito como animate-ping de Tailwind).
        'marker-ring': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'tile-pop': 'tile-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'shine-sweep': 'shine-sweep 1.4s ease-out forwards',
        'timeline-in': 'timeline-in 0.4s ease-out both',
        'marker-pop': 'marker-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'line-draw': 'line-draw 0.6s ease-out both',
        'line-draw-x': 'line-draw-x 0.7s ease-out both',
        'marker-ring': 'marker-ring 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
