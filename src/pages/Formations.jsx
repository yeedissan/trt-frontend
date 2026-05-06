import { usePageTitle } from '../hooks/usePageTitle'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Pencil, Trash2, Clock, X, BookOpen } from 'lucide-react'
import PrintButton from '../components/ui/PrintButton'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import { PageLoader, EmptyState } from '../components/ui/Skeleton'
import { formationService } from '../services/crudService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const TYPE_STYLES = {
  'BT':        { active: 'bg-trt-500 text-white',   inactive: 'text-trt-600 hover:bg-trt-50',    dot: 'bg-trt-500'   },
  'CAP':       { active: 'bg-green-600 text-white', inactive: 'text-green-600 hover:bg-green-50', dot: 'bg-green-500' },
  'Modulaire': { active: 'bg-amber-500 text-white', inactive: 'text-amber-600 hover:bg-amber-50', dot: 'bg-amber-500' },
}

const EMPTY = { titre: '', duree: '', description: '', id_type: '' }

export default function Formations() {
  usePageTitle('Formations')
  const queryClient = useQueryClient()

  const [ongletActif, setOngletActif] = useState(null)
  const [recherche, setRecherche]     = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [editing, setEditing]         = useState(null)
  const [form, setForm]               = useState(EMPTY)
  const [errors, setErrors]           = useState({})
  const [confirmDel, setConfirmDel]   = useState(null)

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: types = [] } = useQuery({
    queryKey: ['formation-types'],
    queryFn:  () => formationService.getTypes(),
    staleTime: 10 * 60_000,
  })

  const { data: formationsData, isLoading: loading } = useQuery({
    queryKey: ['formations'],
    queryFn:  () => formationService.getAll(1),
    staleTime: 30 * 60_000,
    placeholderData: (prev) => prev,
  })

  const formations = formationsData?.data ?? []
  const meta = formationsData?.total !== undefined ? formationsData : null

  // Init onglet on first load
  useEffect(() => {
    if (types.length && !ongletActif) setOngletActif(types[0].id)
  }, [types])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['formations'] })

  // ─── Mutations ───────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (d) => formationService.create(d),
    onSuccess: () => { toast.success('Formation créée'); fermer(); invalidate() },
    onError: (err) => {
      const d = err.response?.data
      if (d?.errors) Object.values(d.errors).forEach((msgs) => msgs.forEach((m) => toast.error(m)))
      else toast.error(d?.message ?? 'Une erreur est survenue')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => formationService.update(id, d),
    onSuccess: () => { toast.success('Formation modifiée'); fermer(); invalidate() },
    onError: (err) => {
      const d = err.response?.data
      if (d?.errors) Object.values(d.errors).forEach((msgs) => msgs.forEach((m) => toast.error(m)))
      else toast.error(d?.message ?? 'Une erreur est survenue')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => formationService.remove(id),
    onSuccess: () => { toast.success('Formation supprimée'); setConfirmDel(null); invalidate() },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Suppression impossible'),
  })

  // ─── Handlers ────────────────────────────────────────────────────────────
  const ouvrirCreation = (id_type = '') => {
    setEditing(null)
    setForm({ ...EMPTY, id_type: id_type ? id_type.toString() : (ongletActif?.toString() ?? '') })
    setErrors({}); setShowModal(true)
  }

  const ouvrirEdition = (f) => {
    setEditing(f)
    setForm({ titre: f.titre, duree: f.duree ?? '', description: f.description ?? '', id_type: f.id_type.toString() })
    setErrors({}); setShowModal(true)
  }

  const fermer = () => { setShowModal(false); setEditing(null); setForm(EMPTY); setErrors({}) }

  const valider = () => {
    const e = {}
    if (!form.titre.trim()) e.titre   = 'Requis'
    if (!form.id_type)      e.id_type = 'Requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!valider()) return
    const payload = {
      titre: form.titre,
      duree: form.duree ? parseInt(form.duree) : 0,
      description: form.description || null,
      id_type: parseInt(form.id_type),
    }
    if (editing) updateMutation.mutate({ id: editing.id, d: payload })
    else createMutation.mutate(payload)
  }

  const saving = createMutation.isPending || updateMutation.isPending

  const typeActif = types.find((t) => t.id === ongletActif)
  const formationsFiltrées = formations.filter((f) => {
    const matchType      = f.id_type === ongletActif || f.type === typeActif?.libelle
    const matchRecherche = f.titre.toLowerCase().includes(recherche.toLowerCase())
    return matchType && matchRecherche
  })

  const style = (libelle) => TYPE_STYLES[libelle] ?? { active: 'bg-gray-600 text-white', inactive: 'text-gray-600 hover:bg-gray-50', dot: 'bg-gray-500' }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Formations</h1>
          <p className="text-xs text-gray-400 mt-0.5">{meta?.total ?? 0} formation{(meta?.total ?? 0) > 1 ? 's' : ''} au catalogue</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <button onClick={() => ouvrirCreation()}
            className="flex items-center gap-2 bg-trt-500 hover:bg-trt-700 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors">
            <Plus size={13} /> Nouvelle formation
          </button>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <>
          {/* Onglets par type */}
          <div className="flex items-center gap-2 mb-5">
            {types.map((type) => {
              const s = style(type.libelle)
              const count = formations.filter((f) => f.id_type === type.id || f.type === type.libelle).length
              const isActive = ongletActif === type.id
              return (
                <button key={type.id} onClick={() => { setOngletActif(type.id); setRecherche('') }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive ? s.active : `bg-white border border-gray-200 ${s.inactive}`
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : s.dot}`} />
                  {type.libelle}
                  <span className={`px-1.5 py-0.5 rounded text-[11px] ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Barre de recherche + bouton ajouter */}
          <div className="flex items-center justify-between mb-4">
            <div className="relative max-w-sm flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" placeholder={`Rechercher dans ${typeActif?.libelle ?? ''}...`}
                value={recherche} onChange={(e) => setRecherche(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 transition-all" />
            </div>
            {typeActif && (
              <button onClick={() => ouvrirCreation(ongletActif)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md border border-gray-200 transition-colors ml-3 ${style(typeActif.libelle).inactive}`}>
                <Plus size={12} /> Ajouter dans {typeActif.libelle}
              </button>
            )}
          </div>

          {/* Liste des formations */}
          <AnimatePresence mode="wait">
            {formationsFiltrées.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-white rounded-lg border border-gray-200 flex items-center justify-center"
                style={{ minHeight: 'calc(100vh - 300px)' }}>
                <EmptyState icon={BookOpen}
                  title={recherche ? `Aucun résultat pour "${recherche}"` : `Aucune formation en ${typeActif?.libelle}`}
                  description={!recherche ? 'Cliquez sur "Ajouter" pour créer la première' : undefined}
                  actionLabel={!recherche ? `+ Ajouter dans ${typeActif?.libelle}` : undefined}
                  onAction={!recherche ? () => ouvrirCreation(ongletActif) : undefined} />
              </motion.div>
            ) : (
              <motion.div key={ongletActif} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                style={{ minHeight: 'calc(100vh - 300px)' }}>
                <div className="divide-y divide-gray-50">
                  {formationsFiltrées.map((f, i) => (
                    <div key={f.id}
                      className={`flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group ${i % 2 === 1 ? 'bg-[#F8F9FA]' : 'bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                          <BookOpen size={13} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800">{f.titre}</p>
                          {f.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{f.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {f.duree > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={11} /> {f.duree}h
                          </div>
                        )}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => ouvrirEdition(f)}
                            className="w-7 h-7 rounded-md hover:bg-trt-100 flex items-center justify-center transition-colors">
                            <Pencil size={11} className="text-gray-400" />
                          </button>
                          <button onClick={() => setConfirmDel(f)}
                            className="w-7 h-7 rounded-md hover:bg-red-50 flex items-center justify-center transition-colors">
                            <Trash2 size={11} className="text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
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
                <h2 className="text-sm font-semibold text-gray-900">{editing ? 'Modifier la formation' : 'Nouvelle formation'}</h2>
                <button onClick={fermer} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Titre *</label>
                  <input type="text" value={form.titre}
                    onChange={(e) => { setForm({ ...form, titre: e.target.value }); setErrors({ ...errors, titre: '' }) }}
                    placeholder="ex : Électrotechnique"
                    className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.titre ? 'border-red-300' : 'border-gray-200'}`} />
                  {errors.titre && <p className="text-red-500 text-xs mt-1">{errors.titre}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Type *</label>
                    <select value={form.id_type}
                      onChange={(e) => { setForm({ ...form, id_type: e.target.value }); setErrors({ ...errors, id_type: '' }) }}
                      className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.id_type ? 'border-red-300' : 'border-gray-200'}`}>
                      <option value="">Sélectionner</option>
                      {types.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
                    </select>
                    {errors.id_type && <p className="text-red-500 text-xs mt-1">{errors.id_type}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Durée (heures)</label>
                    <input type="number" min="0" value={form.duree}
                      onChange={(e) => setForm({ ...form, duree: e.target.value })}
                      placeholder="ex : 40"
                      className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea value={form.description} rows={3}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Description de la formation..."
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 resize-none" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={fermer} className="flex-1 text-xs border border-gray-200 rounded-md py-2.5 text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-1 text-xs bg-trt-500 hover:bg-trt-700 text-white rounded-md py-2.5 font-medium transition-colors disabled:opacity-60">
                    {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Créer'}
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
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4">
                  <Trash2 size={18} className="text-red-500" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Supprimer la formation</h2>
                <p className="text-xs text-gray-500 mb-5">
                  Voulez-vous supprimer <span className="font-medium text-gray-800">{confirmDel.titre}</span> ? Cette action est irréversible.
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
