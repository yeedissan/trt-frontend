import api from './api'

const authService = {
  login: async (credentials) => {
    const data = await api.post('/auth/login', credentials).then((res) => res.data)
    // Stocker le rôle séparément pour accès rapide
    if (data.role) localStorage.setItem('role', data.role)
    return data
  },

  logout: () => {
    localStorage.removeItem('role')
    return api.post('/auth/logout').then((res) => res.data)
  },

  profil: () =>
    api.get('/auth/me').then((res) => res.data),

  getRole: () =>
    localStorage.getItem('role') ?? null,

  isDG: () =>
    localStorage.getItem('role') === 'dg',
}

export default authService
