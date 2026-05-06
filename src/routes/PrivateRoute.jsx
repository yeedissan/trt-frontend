import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function PrivateRoute({ children }) {
  const { responsable, mustChangePassword } = useAuth()
  const { pathname } = useLocation()

  if (!responsable) return <Navigate to="/login" replace />

  if (mustChangePassword() && pathname !== '/changer-mot-de-passe') {
    return <Navigate to="/changer-mot-de-passe" replace />
  }

  return children
}
