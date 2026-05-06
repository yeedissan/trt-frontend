import api from './api'

const anneeService = {
  getAll: () =>
    api.get('/annees-scolaires').then((r) => r.data),

  getActive: () =>
    api.get('/annees-scolaires/active').then((r) => r.data),

  create: (data) =>
    api.post('/annees-scolaires', data).then((r) => r.data),

  passation: (anneeId, idNouvelleAnnee) =>
    api.post(`/annees-scolaires/${anneeId}/passation`, { id_nouvelle_annee: idNouvelleAnnee }).then((r) => r.data),
}

export default anneeService
