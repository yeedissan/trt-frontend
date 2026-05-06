import { usePageTitle } from '../hooks/usePageTitle'
import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ClipboardList, Search, ChevronDown, CheckSquare } from 'lucide-react'
import PrintButton from '../components/ui/PrintButton'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import Pagination from '../components/ui/Pagination'
import { PageLoader, EmptyState } from '../components/ui/Skeleton'
import inscriptionService from '../services/inscriptionService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const BADGE = {
  en_attente: 'bg-amber-50 text-amber-800 border border-amber-200',
  validée:    'bg-trt-100 text-trt-700 border border-trt-200',
  refusée:    'bg-red-50 text-red-700 border border-red-200',
  annulée:    'bg-gray-100 text-gray-500 border border-gray-200',
}

const ONGLETS = [
  { key: 'en_attente', label: 'En attente' },
  { key: 'validée',    label: 'Validées'   },
  { key: 'refusée',    label: 'Refusées'   },
  { key: '',           label: 'Toutes'     },
]

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function Inscriptions() {
  usePageTitle('Inscriptions')
  const queryClient = useQueryClient()

  const [page, setPage]                               = useState(1)
  const [onglet, setOnglet]                           = useState('en_attente')
  const [recherche, setRecherche]                     = useState('')
  const [debouncedSearch, setDebouncedSearch]         = useState('')
  const [filtreSession, setFiltreSession]             = useState('')
  const [showModal, setShowModal]                     = useState(false)
  const [showRefusModal, setShowRefusModal]           = useState(false)
  const [inscriptionARefuser, setInscriptionARefuser] = useState(null)
  const [motifRefus, setMotifRefus]                   = useState('')
  const [form, setForm]                               = useState({ id_etudiant: '', id_session: '' })
  const [errors, setErrors]                           = useState({})
  const [selected, setSelected]                       = useState(new Set())
  const searchTimeout                                 = useRef(null)

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: inscData, isLoading: loading } = useQuery({
    queryKey: ['inscriptions', page, onglet, debouncedSearch, filtreSession],
    queryFn:  () => inscriptionService.getAll(page, onglet, debouncedSearch, filtreSession),
    placeholderData: (prev) => prev,
  })

  const { data: etudiants = [] } = useQuery({
    queryKey: ['etudiants-list'],
    queryFn:  () => inscriptionService.getEtudiants(),
    staleTime: 10 * 60_000,
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions-list'],
    queryFn:  () => inscriptionService.getSessions(),
    staleTime: 5 * 60_000,
  })

  const inscriptions = inscData?.data ?? (Array.isArray(inscData) ? inscData : [])
  const meta         = inscData?.total !== undefined ? inscData : null

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['inscriptions'] })

  // ─── Mutations ───────────────────────────────────────────────────────────
  const validerMutation = useMutation({
    mutationFn: (id) => inscriptionService.valider(id),
    onSuccess: (_, id) => {
      toast.success('Inscription validée')
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })

  const bulkValiderMutation = useMutation({
    mutationFn: (ids) => inscriptionService.bulkValider(ids),
    onSuccess: (res) => {
      toast.success(res.message)
      setSelected(new Set())
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })

  const refuserMutation = useMutation({
    mutationFn: ({ id, motif }) => inscriptionService.refuser(id, motif),
    onSuccess: () => {
      toast.error('Inscription refusée')
      setShowRefusModal(false); setInscriptionARefuser(null)
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })

  const createMutation = useMutation({
    mutationFn: (d) => inscriptionService.create(d),
    onSuccess: () => {
      toast.success('Étudiant inscrit avec succès')
      setShowModal(false); setForm({ id_etudiant: '', id_session: '' }); setErrors({})
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Une erreur est survenue'),
  })

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleRecherche = (val) => {
    setRecherche(val)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => { setPage(1); setDebouncedSearch(val) }, 400)
  }

  const handleOnglet = (key) => {
    setOnglet(key); setPage(1); setRecherche(''); setDebouncedSearch(''); setSelected(new Set())
  }

  const handleFiltreSession = (val) => {
    setFiltreSession(val); setPage(1)
  }

  const enAttenteListe = inscriptions.filter((i) => i.statut === 'en_attente')
  const allSelected    = enAttenteListe.length > 0 && enAttenteListe.every((i) => selected.has(i.id))
  const someSelected   = enAttenteListe.some((i) => selected.has(i.id))

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => { const next = new Set(prev); enAttenteListe.forEach((i) => next.delete(i.id)); return next })
    } else {
      setSelected((prev) => { const next = new Set(prev); enAttenteListe.forEach((i) => next.add(i.id)); return next })
    }
  }

  const ouvrirRefus = (inscription) => { setInscriptionARefuser(inscription); setMotifRefus(''); setShowRefusModal(true) }

  const handleSubmit = (e) => {
    e.preventDefault()
    const err = {}
    if (!form.id_etudiant) err.id_etudiant = 'Requis'
    if (!form.id_session)  err.id_session  = 'Requis'
    if (Object.keys(err).length) { setErrors(err); return }
    createMutation.mutate(form)
  }

  const savingId    = validerMutation.isPending ? validerMutation.variables : null
  const bulkSaving  = bulkValiderMutation.isPending
  const saving      = createMutation.isPending
  const sessionSelectionnee = sessions.find((s) => String(s.id) === String(filtreSession))

  return (
    <Layout>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Inscriptions</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {meta?.total ?? inscriptions.length} inscription{(meta?.total ?? inscriptions.length) > 1 ? 's' : ''}
            {sessionSelectionnee ? ` · ${sessionSelectionnee.titre}` : ''}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <PrintButton />
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-trt-500 hover:bg-trt-700 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors">
            <Plus size={13} /> Inscrire un étudiant
          </button>
        </div>
      </div>

      {/* Filtre session */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-3">
        <span className="text-xs text-gray-400 font-medium flex-shrink-0">Filtrer par session</span>
        <div className="relative flex-1 max-w-xs">
          <select value={filtreSession} onChange={(e) => handleFiltreSession(e.target.value)}
            className="w-full appearance-none text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-2 pr-7 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 text-gray-700">
            <option value="">Toutes les sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.titre}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        {filtreSession && (
          <button onClick={() => handleFiltreSession('')}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Onglets + recherche */}
      <div className="flex items-center justify-between border-b border-gray-100 mb-5">
        <div className="flex gap-0">
          {ONGLETS.map(({ key, label }) => (
            <button key={key} onClick={() => handleOnglet(key)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${onglet === key ? 'border-trt-500 text-trt-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative mb-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="text" placeholder="Rechercher par nom, matricule..." value={recherche}
            onChange={(e) => handleRecherche(e.target.value)}
            className="pl-8 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 w-52" />
        </div>
      </div>

      {/* Barre de sélection bulk */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
            className="flex items-center gap-3 bg-trt-50 border border-trt-200 rounded-lg px-4 py-2.5 mb-3">
            <CheckSquare size={14} className="text-trt-600 flex-shrink-0" />
            <span className="text-xs text-trt-700 font-medium">{selected.size} sélectionnée{selected.size > 1 ? 's' : ''}</span>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => setSelected(new Set())}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-md">
                Désélectionner
              </button>
              <button onClick={() => bulkValiderMutation.mutate(Array.from(selected))} disabled={bulkSaving}
                className="text-xs bg-trt-500 hover:bg-trt-700 text-white font-medium px-4 py-1.5 rounded-md transition-colors disabled:opacity-60">
                {bulkSaving ? 'Validation...' : `Valider les ${selected.size} inscriptions`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <PageLoader />
      ) : inscriptions.length === 0 ? (
        <EmptyState icon={ClipboardList}
          title={recherche ? 'Aucun résultat' : onglet === 'en_attente' ? 'Aucune inscription en attente' : 'Aucune inscription'}
          description={recherche ? `Aucune inscription pour "${recherche}"` : 'Les inscriptions apparaîtront ici'}
          actionLabel={!recherche && onglet === 'en_attente' ? '+ Inscrire un étudiant' : undefined}
          onAction={!recherche && onglet === 'en_attente' ? () => setShowModal(true) : undefined} />
      ) : (
        <div className="overflow-x-auto rounded-lg">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-[640px]">
            <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="bg-trt-500">
                  {onglet === 'en_attente' && (
                    <th className="px-4 py-3 w-[4%]">
                      <input type="checkbox" checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                        onChange={toggleAll}
                        className="w-3.5 h-3.5 accent-white cursor-pointer" />
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-white/90 font-medium w-[20%]">Étudiant</th>
                  <th className="text-left px-4 py-3 text-white/90 font-medium w-[15%]">Matricule</th>
                  {!filtreSession && (
                    <th className="text-left px-4 py-3 text-white/90 font-medium w-[22%]">Session</th>
                  )}
                  <th className="text-left px-4 py-3 text-white/90 font-medium w-[12%]">Date</th>
                  <th className="text-left px-4 py-3 text-white/90 font-medium w-[10%]">Statut</th>
                  <th className="text-left px-4 py-3 text-white/90 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inscriptions.map((i, idx) => (
                  <tr key={i.id} className={`border-t border-gray-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-[#F8F9FA]' : 'bg-white'}`}>
                    {onglet === 'en_attente' && (
                      <td className="px-4 py-3">
                        {i.statut === 'en_attente' && (
                          <input type="checkbox" checked={selected.has(i.id)}
                            onChange={() => toggleSelect(i.id)}
                            className="w-3.5 h-3.5 accent-trt-500 cursor-pointer" />
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-800 font-medium truncate">{i.etudiant}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono">{i.matricule}</td>
                    {!filtreSession && (
                      <td className="px-4 py-3 text-gray-500 truncate">{i.session}</td>
                    )}
                    <td className="px-4 py-3 text-gray-400">{fmt(i.date_inscription)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${BADGE[i.statut]}`}>{i.statut}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 items-center">
                        {i.statut === 'en_attente' && (
                          <>
                            <button onClick={() => validerMutation.mutate(i.id)} disabled={savingId === i.id}
                              className="px-2.5 py-1 rounded-md bg-trt-100 text-trt-700 border border-trt-200 hover:bg-trt-500 hover:text-white hover:border-trt-500 text-xs font-medium transition-colors disabled:opacity-50">
                              {savingId === i.id ? '...' : 'Valider'}
                            </button>
                            <button onClick={() => ouvrirRefus(i)}
                              className="px-2.5 py-1 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 text-xs font-medium transition-colors">
                              Refuser
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination meta={meta} onPageChange={(p) => setPage(p)} />

      {/* Modal inscription */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 w-full max-w-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Inscrire un étudiant</h2>
                <button onClick={() => { setShowModal(false); setErrors({}) }} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Étudiant *</label>
                  <select value={form.id_etudiant}
                    onChange={(e) => { setForm({ ...form, id_etudiant: e.target.value }); setErrors({ ...errors, id_etudiant: '' }) }}
                    className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.id_etudiant ? 'border-red-300' : 'border-gray-200'}`}>
                    <option value="">Sélectionner un étudiant</option>
                    {etudiants.map((e) => <option key={e.id} value={e.id}>{e.prenom} {e.nom} — {e.matricule}</option>)}
                  </select>
                  {errors.id_etudiant && <p className="text-red-500 text-xs mt-1">{errors.id_etudiant}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Session *</label>
                  <select value={form.id_session}
                    onChange={(e) => { setForm({ ...form, id_session: e.target.value }); setErrors({ ...errors, id_session: '' }) }}
                    className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.id_session ? 'border-red-300' : 'border-gray-200'}`}>
                    <option value="">Sélectionner une session</option>
                    {sessions.map((s) => <option key={s.id} value={s.id}>{s.titre}</option>)}
                  </select>
                  {errors.id_session && <p className="text-red-500 text-xs mt-1">{errors.id_session}</p>}
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => { setShowModal(false); setErrors({}) }}
                    className="flex-1 text-xs border border-gray-200 rounded-md py-2.5 text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 text-xs bg-trt-500 hover:bg-trt-700 text-white rounded-md py-2.5 font-medium transition-colors disabled:opacity-60">
                    {saving ? 'Inscription...' : 'Inscrire'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal refus */}
      <AnimatePresence>
        {showRefusModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 w-full max-w-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Refuser l'inscription</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{inscriptionARefuser?.etudiant} — {inscriptionARefuser?.session}</p>
                </div>
                <button onClick={() => setShowRefusModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Motif de refus *</label>
                  <textarea value={motifRefus} onChange={(e) => setMotifRefus(e.target.value)}
                    placeholder="Expliquez la raison du refus..." rows={3}
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowRefusModal(false)}
                    className="flex-1 text-xs border border-gray-200 rounded-md py-2.5 text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button onClick={() => refuserMutation.mutate({ id: inscriptionARefuser.id, motif: motifRefus })}
                    disabled={!motifRefus.trim() || refuserMutation.isPending}
                    className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md py-2.5 font-medium transition-colors disabled:opacity-40">
                    {refuserMutation.isPending ? 'Refus...' : 'Confirmer le refus'}
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
