import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import PrivateRoute from './routes/PrivateRoute'

// Chargement différé — chaque page n'est chargée que quand l'utilisateur y navigue
const Login               = lazy(() => import('./pages/Login'))
const Dashboard           = lazy(() => import('./pages/Dashboard'))
const Sessions            = lazy(() => import('./pages/Sessions'))
const Inscriptions        = lazy(() => import('./pages/Inscriptions'))
const Presences           = lazy(() => import('./pages/Presences'))
const Evaluations         = lazy(() => import('./pages/Evaluations'))
const Formations          = lazy(() => import('./pages/Formations'))
const Formateurs          = lazy(() => import('./pages/Formateurs'))
const Etudiants           = lazy(() => import('./pages/Etudiants'))
const Profil              = lazy(() => import('./pages/Profil'))
const Seances             = lazy(() => import('./pages/Seances'))
const Activites           = lazy(() => import('./pages/Activites'))
const GestionUtilisateurs = lazy(() => import('./pages/GestionUtilisateurs'))
const ForgotPassword      = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword       = lazy(() => import('./pages/ResetPassword'))
const ChangerMotDePasse   = lazy(() => import('./pages/ChangerMotDePasse'))
const Annees              = lazy(() => import('./pages/Annees'))
const NotFound            = lazy(() => import('./pages/NotFound'))
const ServerError         = lazy(() => import('./pages/ServerError'))
const Forbidden           = lazy(() => import('./pages/Forbidden'))

const Private = ({ children }) => <PrivateRoute>{children}</PrivateRoute>

function DGRoute({ children }) {
  const { responsable, isDG } = useAuth()
  if (!responsable) return <Navigate to="/login" replace />
  if (!isDG()) return <Navigate to="/403" replace />
  return children
}

function SuperAdminRoute({ children }) {
  const { responsable, isSuperAdmin } = useAuth()
  if (!responsable) return <Navigate to="/login" replace />
  if (!isSuperAdmin()) return <Navigate to="/403" replace />
  return children
}

function ResponsableRoute({ children }) {
  const { isDG, isSuperAdmin } = useAuth()
  if (isDG() || isSuperAdmin()) return <Navigate to="/403" replace />
  return <PrivateRoute>{children}</PrivateRoute>
}

// Fallback minimal pendant le chargement d'une page
function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-trt-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login"                element={<Login />} />
            <Route path="/mot-de-passe-oublie"  element={<ForgotPassword />} />
            <Route path="/reset-password"       element={<ResetPassword />} />
            <Route path="/erreur"               element={<ServerError />} />
            <Route path="/403"                  element={<Forbidden />} />
            <Route path="/"              element={<Private><Dashboard /></Private>} />
            <Route path="/sessions"      element={<ResponsableRoute><Sessions /></ResponsableRoute>} />
            <Route path="/inscriptions"  element={<ResponsableRoute><Inscriptions /></ResponsableRoute>} />
            <Route path="/presences"     element={<ResponsableRoute><Presences /></ResponsableRoute>} />
            <Route path="/evaluations"   element={<ResponsableRoute><Evaluations /></ResponsableRoute>} />
            <Route path="/formations"    element={<ResponsableRoute><Formations /></ResponsableRoute>} />
            <Route path="/formateurs"    element={<ResponsableRoute><Formateurs /></ResponsableRoute>} />
            <Route path="/etudiants"     element={<ResponsableRoute><Etudiants /></ResponsableRoute>} />
            <Route path="/profil"        element={<ResponsableRoute><Profil /></ResponsableRoute>} />
            <Route path="/seances"       element={<ResponsableRoute><Seances /></ResponsableRoute>} />
            <Route path="/annees"        element={<ResponsableRoute><Annees /></ResponsableRoute>} />
            <Route path="/activites"     element={<DGRoute><Activites /></DGRoute>} />
            <Route path="/utilisateurs"  element={<SuperAdminRoute><GestionUtilisateurs /></SuperAdminRoute>} />
            <Route path="/changer-mot-de-passe" element={<Private><ChangerMotDePasse /></Private>} />
            <Route path="*"              element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
