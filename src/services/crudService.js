import api from './api'

export const formationService = {
  getAll:   (page = 1, search = '') =>
    api.get(`/formations?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`).then((r) => r.data),
  getTypes: () => api.get('/type-formations').then((r) => r.data),
  create:   (data)    => api.post('/formations', data).then((r) => r.data),
  update:   (id, d)   => api.put(`/formations/${id}`, d).then((r) => r.data),
  remove:   (id)      => api.delete(`/formations/${id}`).then((r) => r.data),
}

export const formateurService = {
  getAll:  (page = 1, search = '', specialisation = '') =>
    api.get(`/formateurs?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}${specialisation ? `&specialisation=${encodeURIComponent(specialisation)}` : ''}`).then((r) => r.data),
  create:  (data)   => api.post('/formateurs', data).then((r) => r.data),
  update:  (id, d)  => api.put(`/formateurs/${id}`, d).then((r) => r.data),
  remove:  (id)     => api.delete(`/formateurs/${id}`).then((r) => r.data),
}

export const etudiantService = {
  getAll:  (page = 1, search = '', sexe = '') =>
    api.get(`/etudiants?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}${sexe ? `&sexe=${sexe}` : ''}`).then((r) => r.data),
  create:  (data)   => api.post('/etudiants', data).then((r) => r.data),
  update:  (id, d)  => api.put(`/etudiants/${id}`, d).then((r) => r.data),
  remove:  (id)     => api.delete(`/etudiants/${id}`).then((r) => r.data),
}
