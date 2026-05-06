import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})
api.interceptors.request.use((config) => {
  const responsable = JSON.parse(localStorage.getItem('responsable'))
  if (responsable?.token) {
    config.headers.Authorization = `Bearer ${responsable.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('responsable')
        toast.error('Session expirée — veuillez vous reconnecter.')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    if (status === 403) {
      toast.error('Accès non autorisé')
      return Promise.reject(error)
    }

    if (status === 404) {
      return Promise.reject(error)
    }

    if (status >= 500) {
      toast.error('Erreur serveur — veuillez réessayer.')
      return Promise.reject(error)
    }

    if (!error.response) {
      toast.error('Impossible de joindre le serveur. Vérifiez votre connexion.')
    }

    return Promise.reject(error)
  }
)

export default api
