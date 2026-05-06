import api from './api'

const utilisateurService = {
  getAll: () =>
    api.get('/admin/utilisateurs').then((r) => r.data),

  create: (data) =>
    api.post('/admin/utilisateurs', data).then((r) => r.data),

  update: (id, data) =>
    api.put(`/admin/utilisateurs/${id}`, data).then((r) => r.data),

  destroy: (id) =>
    api.delete(`/admin/utilisateurs/${id}`).then((r) => r.data),

  resetPassword: (id, mot_de_passe) =>
    api.post(`/admin/utilisateurs/${id}/reset-password`, { mot_de_passe }).then((r) => r.data),
}

export default utilisateurService
