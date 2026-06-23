import { useState } from 'react'
import { CreditCard, Wallet, ChevronRight, Receipt } from 'lucide-react'
import { PanelEmpty, PanelError, PanelLoading, InlineSpinner } from './PanelStates'
import { CardOperationsDrawer } from './CardOperationsDrawer'
import { useFinancialAccounts } from '@/hooks/useCustomer'
import { formatCurrency } from '@/lib/utils'

export function FinancialAccountsPanel() {
  const { data, isLoading, isError, error, refetch, isFetching } = useFinancialAccounts()
  const accounts = data ?? []
  const [drawerOpen, setDrawerOpen] = useState(false)

  const hasCards = accounts.some((a) => a.FinServ__FinancialAccountType__c === 'Credit Card')

  return (
    <>
      <div className="rounded-2xl border border-border bg-card transition-colors hover:border-border/80">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-orange/15 text-chart-orange">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold">Productos contratados</h3>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                {accounts.length} financial accounts
                {isFetching && !isLoading && <InlineSpinner />}
              </p>
            </div>
          </div>
          <button className="text-xs font-medium text-chart-blue hover:underline">Ver todos →</button>
        </div>

        {isLoading ? (
          <PanelLoading rows={3} />
        ) : isError ? (
          <PanelError message={(error as Error)?.message ?? 'Error desconocido'} onRetry={() => refetch()} />
        ) : accounts.length === 0 ? (
          <PanelEmpty message="Sin productos contratados." icon={CreditCard} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
              {accounts.map((fa) => {
                const balance = fa.FinServ__Balance__c ?? 0
                const isCard = fa.FinServ__FinancialAccountType__c === 'Credit Card'
                return (
                  <div
                    key={fa.Id}
                    className="group relative overflow-hidden rounded-xl border border-border surface-1 p-4 transition-colors hover:border-border/80"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {isCard ? <CreditCard className="h-3.5 w-3.5" /> : <Wallet className="h-3.5 w-3.5" />}
                      {fa.FinServ__FinancialAccountType__c}
                    </div>
                    <div className="mt-3 font-mono text-[11px] tracking-wider text-foreground/80">{fa.Name}</div>
                    <div className={`mt-3 text-lg font-bold ${balance < 0 ? 'text-chart-coral' : 'text-chart-mint'}`}>
                      {formatCurrency(balance)}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-chart-mint" />
                      {fa.FinServ__Status__c}
                    </div>
                  </div>
                )
              })}
            </div>

            {hasCards && (
              <div className="px-5 pb-5">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border surface-1 px-4 py-3 text-sm font-medium transition-all hover:border-chart-cyan/40 hover:bg-chart-cyan/5"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-cyan/15 text-chart-cyan">
                      <Receipt className="h-3.5 w-3.5" />
                    </span>
                    <span>Ver operaciones de tarjetas</span>
                    <span className="hidden text-[10px] font-normal text-muted-foreground sm:inline">
                      Powered by Data Cloud
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-chart-cyan" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <CardOperationsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )
}
