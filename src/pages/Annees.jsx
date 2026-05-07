import { usePageTitle } from '../hooks/usePageTitle'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, CalendarCheck, ArrowRightLeft, CheckCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import { PageLoader } from '../components/ui/Skeleton'
import anneeService from '../services/anneeService'

const EMPTY_FORM = { date_debut: '', date_fin: '' }

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function Annees() {
  usePageTitle('Années scolaires')
  const queryClient = useQueryClient()

  const [showModal,     setShowModal]     = useState(false)
  const [showPassation, setShowPassation] = useState(false)
  const [form,          setForm]          = useState(EMPTY_FORM)
  const [errors,        setErrors]        = useState({})
  const [idNouvelle,    setIdNouvelle]    = useState('')

  // ─── Query ─────────────────────────────────────────────────────────────────
  const { data: annees = [], isLoading } = useQuery({
    queryKey: ['annees'],
    queryFn:  anneeService.getAll,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['annees'] })

  const handleError = (err) => {
    const d = err.response?.data
    if (d?.errors) Object.values(d.errors).forEach((msgs) => msgs.forEach((m) => toast.error(m)))
    else toast.error(d?.message ?? 'Une erreur est survenue')
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: anneeService.create,
    onSuccess: () => { toast.success('Année créée'); fermer(); invalidate() },
    onError: handleError,
  })

  const passationMutation = useMutation({
    mutationFn: ({ anneeActiveId, idNouvelleAnnee }) =>
      anneeService.passation(anneeActiveId, idNouvelleAnnee),
    onSuccess: (res) => { toast.success(res.message); fermerPassation(); invalidate() },
    onError: handleError,
  })

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const fermer = () => { setShowModal(false); setForm(EMPTY_FORM); setErrors({}) }

  const valider = (f) => {
  const e = {}
  if (!f.date_debut) e.date_debut = 'Requis'
  if (!f.date_fin)   e.date_fin   = 'Requis'
  else if (f.date_debut && f.date_fin <= f.date_debut)
    e.date_fin = 'Doit être après la date de début'
  setErrors(e)
  return Object.keys(e).length === 0
}
  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!valider(form)) return
    createMutation.mutate(form)
  }

  const fermerPassation = () => { setShowPassation(false); setIdNouvelle(''); setErrors({}) }

  const handlePassation = (ev) => {
    ev.preventDefault()
    if (!idNouvelle) { setErrors({ id_nouvelle: 'Veuillez sélectionner la nouvelle année' }); return }
    passationMutation.mutate({ anneeActiveId: anneeActive.id, idNouvelleAnnee: idNouvelle })
  }

  // ─── Computed ──────────────────────────────────────────────────────────────
  const anneeActive   = annees.find((a) => a.statut === 'active')
  const anneesClotures = annees.filter((a) => a.statut === 'cloturee')

  const inputCls = (err) =>
    `w-full px-3 py-2 text-xs border rounded-md focus:outline-none focus:ring-1 transition-all ${
      err ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-trt-500 focus:border-trt-500'
    }`

  return (
    <Layout>
      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Années scolaires</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {annees.length} année{annees.length > 1 ? 's' : ''} enregistrée{annees.length > 1 ? 's' : ''}
            {anneeActive && (
              <span className="ml-2 inline-flex items-center gap-1 text-trt-600 font-medium">
                <CheckCircle size={11} /> Active : {anneeActive.libelle}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {anneeActive && anneesClotures.length > 0 && (
            <button onClick={() => setShowPassation(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors">
              <ArrowRightLeft size={13} /> Passation d'année
            </button>
          )}
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-trt-500 hover:bg-trt-700 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors">
            <Plus size={13} /> Nouvelle année
          </button>
        </div>
      </div>

      {/* ── Liste ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <PageLoader />
      ) : annees.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarCheck size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune année scolaire enregistrée.</p>
          <button onClick={() => setShowModal(true)}
            className="mt-3 text-xs text-trt-500 hover:underline">
            Créer la première année
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {annees.map((annee) => (
              <motion.div key={annee.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-shadow hover:shadow-sm ${
                  annee.statut === 'active'
                    ? 'border-trt-300 ring-1 ring-trt-200'
                    : 'border-gray-100'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    annee.statut === 'active'
                      ? 'bg-trt-100 text-trt-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    <CalendarCheck size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {annee.libelle}
                      {annee.statut === 'active' && (
                        <span className="text-[10px] bg-trt-100 text-trt-700 px-2 py-0.5 rounded-full font-semibold">
                          Active
                        </span>
                      )}
                      {annee.statut === 'cloturee' && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          Clôturée
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Du {fmt(annee.date_debut)} au {fmt(annee.date_fin)}
                      {annee.nb_sessions !== undefined && (
                        <span className="ml-2 text-gray-300">· {annee.nb_sessions} session{annee.nb_sessions > 1 ? 's' : ''}</span>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Modal Nouvelle année ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-gray-900">Nouvelle année scolaire</h2>
                <button onClick={fermer} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
               
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date de début</label>
                  <input type="date"
                    value={form.date_debut}
                    onChange={(e) => setForm((p) => ({ ...p, date_debut: e.target.value }))}
                    className={inputCls(errors.date_debut)} />
                  {errors.date_debut && <p className="text-[11px] text-red-500 mt-0.5">{errors.date_debut}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date de fin</label>
                  <input type="date"
                    value={form.date_fin}
                    onChange={(e) => setForm((p) => ({ ...p, date_fin: e.target.value }))}
                    className={inputCls(errors.date_fin)} />
                  {errors.date_fin && <p className="text-[11px] text-red-500 mt-0.5">{errors.date_fin}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={fermer}
                    className="px-4 py-2 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50">
                    Annuler
                  </button>
                  <button type="submit" disabled={createMutation.isPending}
                    className="px-4 py-2 text-xs bg-trt-500 hover:bg-trt-700 text-white rounded-md disabled:opacity-60">
                    {createMutation.isPending ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Passation ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPassation && anneeActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <ArrowRightLeft size={15} className="text-amber-500" /> Passation d'année
                </h2>
                <button onClick={fermerPassation} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
              <div className="text-[11px] text-gray-600 mb-4 bg-amber-50 border border-amber-200 rounded-md p-3 space-y-1">
                <p>L'année <strong>{anneeActive.libelle}</strong> sera clôturée.</p>
                <p>Les sessions en cours ou planifiées seront transférées vers la nouvelle année active.</p>
              </div>
              <form onSubmit={handlePassation} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nouvelle année à activer</label>
                  <select
                    value={idNouvelle}
                    onChange={(e) => { setIdNouvelle(e.target.value); setErrors({}) }}
                    className={inputCls(errors.id_nouvelle)}>
                    <option value="">Sélectionner une année clôturée</option>
                    {anneesClotures.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.libelle} ({fmt(a.date_debut)} → {fmt(a.date_fin)})
                      </option>
                    ))}
                  </select>
                  {errors.id_nouvelle && <p className="text-[11px] text-red-500 mt-0.5">{errors.id_nouvelle}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={fermerPassation}
                    className="px-4 py-2 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50">
                    Annuler
                  </button>
                  <button type="submit" disabled={passationMutation.isPending}
                    className="px-4 py-2 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-md disabled:opacity-60">
                    {passationMutation.isPending ? 'En cours...' : 'Confirmer la passation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
