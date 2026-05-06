import { usePageTitle } from '../hooks/usePageTitle'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Calendar } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import { PageLoader, EmptyState } from '../components/ui/Skeleton'
import { presenceService } from '../services/presenceEvaluationService'
import api from '../services/api'

const EMPTY = { date: '', heure_debut: '', heure_fin: '', salle: '' }
const fmt   = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function Seances() {
  usePageTitle('Séances')
  const queryClient = useQueryClient()

  const [idSession, setIdSession] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [errors, setErrors]       = useState({})
  const [confirmDel, setConfirmDel] = useState(null)

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions-actives'],
    queryFn:  () => presenceService.getSessionsActives(),
    staleTime: 5 * 60_000,
  })

  const { data: seances = [], isLoading: loading } = useQuery({
    queryKey: ['seances', idSession],
    queryFn:  () => api.get(`/seances?id_session=${idSession}`).then((r) => r.data),
    enabled:  !!idSession,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['seances', idSession] })

  // ─── Mutations ───────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (d) => api.post('/seances', { ...d, id_session: parseInt(idSession) }).then((r) => r.data),
    onSuccess: () => { toast.success('Séance ajoutée'); fermer(); invalidate() },
    onError: (err) => {
      const d = err.response?.data
      if (d?.errors) Object.values(d.errors).forEach((msgs) => msgs.forEach((m) => toast.error(m)))
      else toast.error(d?.message ?? 'Une erreur est survenue')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => api.put(`/seances/${id}`, { ...d, id_session: parseInt(idSession) }).then((r) => r.data),
    onSuccess: () => { toast.success('Séance modifiée'); fermer(); invalidate() },
    onError: (err) => {
      const d = err.response?.data
      if (d?.errors) Object.values(d.errors).forEach((msgs) => msgs.forEach((m) => toast.error(m)))
      else toast.error(d?.message ?? 'Une erreur est survenue')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/seances/${id}`).then((r) => r.data),
    onSuccess: () => { toast.success('Séance supprimée'); setConfirmDel(null); invalidate() },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Suppression impossible'),
  })

  // ─── Handlers ────────────────────────────────────────────────────────────
  const ouvrirCreation = () => { setEditing(null); setForm(EMPTY); setErrors({}); setShowModal(true) }
  const ouvrirEdition  = (s) => {
    setEditing(s)
    setForm({ date: s.date ?? '', heure_debut: s.heure_debut ?? '', heure_fin: s.heure_fin ?? '', salle: s.salle ?? '' })
    setErrors({}); setShowModal(true)
  }
  const fermer = () => { setShowModal(false); setEditing(null); setForm(EMPTY); setErrors({}) }

  const valider = () => {
    const e = {}
    if (!form.date)        e.date        = 'Requis'
    if (!form.heure_debut) e.heure_debut = 'Requis'
    if (!form.heure_fin)   e.heure_fin   = 'Requis'
    else if (form.heure_fin <= form.heure_debut) e.heure_fin = "Doit être après l'heure de début"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!valider()) return
    if (editing) updateMutation.mutate({ id: editing.id, d: form })
    else createMutation.mutate(form)
  }

  const saving           = createMutation.isPending || updateMutation.isPending
  const sessionChoisie   = sessions.find((s) => s.id === parseInt(idSession))

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Séances</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gérer les séances par session</p>
        </div>
        {idSession && (
          <button onClick={ouvrirCreation}
            className="flex items-center gap-2 bg-trt-500 hover:bg-trt-700 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors">
            <Plus size={13} /> Nouvelle séance
          </button>
        )}
      </div>

      <div className="mb-6 max-w-sm">
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Session</label>
        <select value={idSession} onChange={(e) => setIdSession(e.target.value)}
          className="w-full text-xs bg-white border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500">
          <option value="">Sélectionner une session</option>
          {sessions.map((s) => <option key={s.id} value={s.id}>{s.titre}</option>)}
        </select>
      </div>

      {sessionChoisie && (
        <div className="bg-trt-100 border border-trt-200 rounded-md px-4 py-3 mb-5 flex items-center gap-3">
          <Calendar size={13} className="text-trt-500 flex-shrink-0" />
          <p className="text-xs text-trt-700">
            <span className="font-medium">{sessionChoisie.titre}</span>
            {' — '}{seances.length} séance{seances.length > 1 ? 's' : ''} enregistrée{seances.length > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {!idSession && (
        <EmptyState icon={Calendar} title="Sélectionnez une session" description="Les séances de la session apparaîtront ici" />
      )}

      {idSession && loading && <PageLoader />}

      {idSession && !loading && seances.length === 0 && (
        <EmptyState icon={Calendar} title="Aucune séance"
          description="Ajoutez la première séance de cette session"
          actionLabel="+ Nouvelle séance" onAction={ouvrirCreation} />
      )}

      {idSession && !loading && seances.length > 0 && (
        <div className="overflow-x-auto rounded-lg"><div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-[520px]">
          <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-trt-500">
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[5%]">#</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[22%]">Date</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[18%]">Heure début</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[18%]">Heure fin</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[22%]">Salle</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[15%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {seances.map((s, i) => (
                <tr key={s.id} className={`border-t border-gray-100 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? 'bg-[#F8F9FA]' : 'bg-white'}`}>
                  <td className="px-4 py-3 text-gray-300">{i + 1}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{fmt(s.date)}</td>
                  <td className="px-4 py-3 text-gray-500">{s.heure_debut}</td>
                  <td className="px-4 py-3 text-gray-500">{s.heure_fin}</td>
                  <td className="px-4 py-3 text-gray-400">{s.salle || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => ouvrirEdition(s)} className="text-gray-400 hover:text-trt-600 transition-colors p-1"><Pencil size={12} /></button>
                      <button onClick={() => setConfirmDel(s)} className="text-gray-400 hover:text-red-600 transition-colors p-1"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}

      {/* Modal création / édition */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 w-full max-w-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">{editing ? 'Modifier la séance' : 'Nouvelle séance'}</h2>
                <button onClick={fermer} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Date *</label>
                  <input type="date" value={form.date} onChange={(e) => { setForm({ ...form, date: e.target.value }); setErrors({ ...errors, date: '' }) }}
                    className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.date ? 'border-red-300' : 'border-gray-200'}`} />
                  {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Heure début *</label>
                    <input type="time" value={form.heure_debut} onChange={(e) => { setForm({ ...form, heure_debut: e.target.value }); setErrors({ ...errors, heure_debut: '' }) }}
                      className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.heure_debut ? 'border-red-300' : 'border-gray-200'}`} />
                    {errors.heure_debut && <p className="text-red-500 text-xs mt-1">{errors.heure_debut}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Heure fin *</label>
                    <input type="time" value={form.heure_fin} onChange={(e) => { setForm({ ...form, heure_fin: e.target.value }); setErrors({ ...errors, heure_fin: '' }) }}
                      className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.heure_fin ? 'border-red-300' : 'border-gray-200'}`} />
                    {errors.heure_fin && <p className="text-red-500 text-xs mt-1">{errors.heure_fin}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Salle</label>
                  <input type="text" value={form.salle} placeholder="ex : Salle A, Labo 2..." onChange={(e) => setForm({ ...form, salle: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={fermer} className="flex-1 text-xs border border-gray-200 rounded-md py-2.5 text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-1 text-xs bg-trt-500 hover:bg-trt-700 text-white rounded-md py-2.5 font-medium transition-colors disabled:opacity-60">
                    {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation suppression */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 w-full max-w-sm overflow-hidden">
              <div className="px-6 pt-6 pb-5">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4"><Trash2 size={18} className="text-red-500" /></div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Supprimer la séance</h2>
                <p className="text-xs text-gray-500 mb-5">
                  Séance du <span className="font-medium text-gray-800">{fmt(confirmDel.date)}</span> de {confirmDel.heure_debut} à {confirmDel.heure_fin}. Cette action est irréversible.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDel(null)} className="flex-1 text-xs border border-gray-200 rounded-md py-2.5 text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button onClick={() => deleteMutation.mutate(confirmDel.id)} disabled={deleteMutation.isPending}
                    className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md py-2.5 font-medium transition-colors disabled:opacity-60">
                    {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
