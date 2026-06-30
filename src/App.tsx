import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { BankerHomePage } from '@/pages/BankerHomePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CallbackPage } from '@/pages/CallbackPage'
import { CustomersListPage } from '@/pages/CustomersListPage'
import { OpportunitiesListPage } from '@/pages/OpportunitiesListPage'
import { CasesListPage } from '@/pages/CasesListPage'
import { ActivitiesPage } from '@/pages/ActivitiesPage'
import { PoliciesListPage } from '@/pages/PoliciesListPage'
import { ClaimsListPage } from '@/pages/ClaimsListPage'
import { ToastViewport } from '@/components/Toast'
import { useAuthStore } from '@/store/auth'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  if (!isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/oauth/callback" element={<CallbackPage />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <BankerHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/:accountId"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <CustomersListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/oportunidades"
          element={
            <ProtectedRoute>
              <OpportunitiesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/casos"
          element={
            <ProtectedRoute>
              <CasesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/actividades"
          element={
            <ProtectedRoute>
              <ActivitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/polizas"
          element={
            <ProtectedRoute>
              <PoliciesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/claims"
          element={
            <ProtectedRoute>
              <ClaimsListPage />
            </ProtectedRoute>
          }
        />
        {/* Backwards compat — vieja ruta /dashboard redirige a Patricio */}
        <Route
          path="/dashboard"
          element={<Navigate to={`/customer/001g700000J01sUAAR`} replace />}
        />
      </Routes>
      <ToastViewport />
    </div>
  )
}
