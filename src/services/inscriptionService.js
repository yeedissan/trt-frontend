import api from './api'

const inscriptionService = {
  getAll: (page = 1, statut = '', search = '', id_session = '') =>
    api.get(`/inscriptions?page=${page}${statut ? `&statut=${statut}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}${id_session ? `&id_session=${id_session}` : ''}`).then((r) => r.data),

  getEtudiants: () =>
    api.get('/etudiants?per_page=all').then((r) => r.data.data ?? r.data),

  getSessions: () =>
    api.get('/sessions?per_page=all').then((r) => r.data.data ?? r.data),

  create: (data) =>
    api.post('/inscriptions', data).then((r) => r.data),

  valider: (id) =>
    api.patch(`/inscriptions/${id}/valider`).then((r) => r.data),

  refuser: (id, motif) =>
    api.patch(`/inscriptions/${id}/refuser`, { motif_refus: motif }).then((r) => r.data),

  annuler: (id) =>
    api.patch(`/inscriptions/${id}/annuler`).then((r) => r.data),

  bulkValider: (ids) =>
    api.post('/inscriptions/bulk-valider', { ids }).then((r) => r.data),

  exportPDF: (id_session) =>
    api.get(`/inscriptions/export/${id_session}`, { responseType: 'blob' }).then((r) => r.data),

  exportExcel: (id_session) =>
    api.get(`/inscriptions/export-excel/${id_session}`, { responseType: 'blob' }).then((r) => r.data),
}

export default inscriptionService
