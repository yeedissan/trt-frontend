import { createContext, useState, useEffect } from 'react'
import api from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [responsable, setResponsable] = useState(
    () => JSON.parse(localStorage.getItem('responsable')) || null
  )

  // Synchroniser le rôle depuis localStorage au démarrage
  useEffect(() => {
    if (responsable?.token && !responsable?.role) {
      api.get('/me').then((res) => {
        const updated = { ...responsable, role: res.data.role }
        localStorage.setItem('responsable', JSON.stringify(updated))
        setResponsable(updated)
      }).catch(() => {})
    }
  }, [])

  const login = (data) => {
    localStorage.setItem('responsable', JSON.stringify(data))
    if (data.role) localStorage.setItem('role', data.role)
    setResponsable(data)
  }

  const logout = () => {
    localStorage.removeItem('responsable')
    localStorage.removeItem('role')
    setResponsable(null)
  }

  // Appelé après le changement forcé de mot de passe
  const clearForceChange = () => {
    const updated = { ...responsable, force_change_password: false }
    localStorage.setItem('responsable', JSON.stringify(updated))
    setResponsable(updated)
  }

  const isDG           = () => responsable?.role === 'dg'
  const isSuperAdmin   = () => responsable?.role === 'superadmin'
  const mustChangePassword = () => !!responsable?.force_change_password

  return (
    <AuthContext.Provider value={{ responsable, login, logout, clearForceChange, isDG, isSuperAdmin, mustChangePassword }}>
      {children}
    </AuthContext.Provider>
  )
}
