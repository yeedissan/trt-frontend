import api from './api'

const sessionService = {
  getAll: (page = 1, search = '', statut = '', idAnnee = '') => {
    const params = new URLSearchParams({ page })
    if (search)   params.append('search', search)
    if (statut)   params.append('statut', statut)
    if (idAnnee)  params.append('id_annee', idAnnee)
    return api.get(`/sessions?${params}`).then((r) => r.data)
  },

  getById: (id) =>
    api.get(`/sessions/${id}`).then((r) => r.data),

  getFormations: () =>
    api.get('/formations').then((r) => r.data.data ?? r.data),

  getFormateurs: () =>
    api.get('/formateurs').then((r) => r.data.data ?? r.data),

  getActives: () =>
    api.get('/sessions/actives').then((r) => r.data),

  create: (data) =>
    api.post('/sessions', data).then((r) => r.data),

  update: (id, data) =>
    api.put(`/sessions/${id}`, data).then((r) => r.data),

  annuler: (id) =>
    api.patch(`/sessions/${id}/annuler`).then((r) => r.data),
}

export default sessionService
