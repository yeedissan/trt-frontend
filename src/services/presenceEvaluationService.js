import api from './api'

export const presenceService = {
  getSessionsActives: () =>
    api.get('/sessions/actives').then((r) => r.data),

  getSeancesBySession: (id_session) =>
    api.get(`/seances?id_session=${id_session}`).then((r) => r.data),

  getBySeance: (id_seance) =>
    api.get(`/presences?id_seance=${id_seance}`).then((r) => r.data),

  saveAll: (presences) =>
    api.post('/presences/batch', { presences }).then((r) => r.data),
}

export const evaluationService = {
  getBySession: (id_session) =>
    api.get(`/evaluations?id_session=${id_session}`).then((r) => r.data),

  saveAll: (evaluations) =>
    api.post('/evaluations/batch', { evaluations }).then((r) => r.data),

  genererRapport: (id_session) =>
    api.get(`/evaluations/rapport/${id_session}`, { responseType: 'blob' }).then((r) => r.data),
}
