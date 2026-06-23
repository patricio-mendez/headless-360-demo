import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { AgentforceChatPanel } from './AgentforceChatPanel'

/**
 * Layout compartido: Sidebar + TopBar + chat de Agentforce flotante.
 * Centraliza la estructura para que las pages solo se preocupen del contenido.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main
          className="flex-1 overflow-y-auto scrollbar-thin bg-background"
          style={{ backgroundImage: 'var(--gradient-app)' }}
        >
          {children}
        </main>
      </div>
      <AgentforceChatPanel />
    </div>
  )
}
