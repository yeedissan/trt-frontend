import api from './api'

const activiteService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams()
    if (params.page)   query.append('page',   params.page)
    if (params.action) query.append('action', params.action)
    if (params.model)  query.append('model',  params.model)
    return api.get(`/activites?${query}`).then((r) => r.data)
  },
}

export default activiteService
