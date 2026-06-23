import * as Dialog from '@radix-ui/react-dialog'
import { X, Database, Receipt, Sparkles } from 'lucide-react'
import { CreditCardOperationsPanel } from './CreditCardOperationsPanel'
import { DataTooltip } from './Tooltip'

interface CardOperationsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CardOperationsDrawer({ open, onOpenChange }: CardOperationsDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col overflow-hidden border-l border-border bg-background shadow-2xl data-[state=open]:animate-slide-up focus:outline-none">
          <DrawerBody onClose={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DrawerBody({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="relative shrink-0 overflow-hidden border-b border-border">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-chart-cyan/30 via-chart-blue/20 to-chart-violet/30" />
        <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-chart-cyan/20 blur-3xl" />
        <div className="relative flex items-start justify-between p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-chart-cyan to-chart-blue shadow-xl">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1.5 pt-1">
              <Dialog.Title asChild>
                <h2 className="font-display text-2xl font-bold leading-tight">Operaciones de Tarjetas</h2>
              </Dialog.Title>
              <Dialog.Description asChild>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <DataTooltip
                    title="Powered by Data Cloud + BFF"
                    description="A diferencia de los otros paneles (que consumen Salesforce directo), este consume Data Cloud vía un proxy MCP — un Cloudflare Worker que se autentica con Client Credentials, hace token exchange a Data Cloud, y ejecuta SQL contra los DLOs Transacciones_Bancarias / Tarjetas_Bancarias."
                    source="Cloudflare Worker → Data Cloud Query API v2"
                    side="bottom"
                  >
                    <span className="inline-flex cursor-help items-center gap-1 rounded-md bg-chart-orange/15 px-2 py-0.5 font-semibold text-chart-orange ring-1 ring-chart-orange/30">
                      <Database className="h-3 w-3" /> BFF · Data Cloud
                    </span>
                  </DataTooltip>
                  <span className="inline-flex items-center gap-1 rounded-md bg-chart-blue/15 px-2 py-0.5 font-medium text-chart-blue">
                    <Sparkles className="h-3 w-3" /> Headless 360
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">RUT 123456778-7</span>
                </div>
              </Dialog.Description>
            </div>
          </div>
          <Dialog.Close asChild>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <CreditCardOperationsPanel />
      </div>
    </>
  )
}
