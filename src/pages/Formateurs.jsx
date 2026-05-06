import { usePageTitle } from '../hooks/usePageTitle'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Pencil, Trash2, Mail, Phone, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PhoneInput } from 'react-international-phone'
import Layout from '../components/layout/Layout'
import Pagination from '../components/ui/Pagination'
import { PageLoader, EmptyState } from '../components/ui/Skeleton'
import { formateurService } from '../services/crudService'

const SPECIALISATIONS = [
  "Électricité d'équipements", 'Électrotechnique',
  'Maintenance et Réseaux Informatique + Fibre Optique', 'Froid et Climatisation',
  'Informatique et Réseaux', 'Système de Sécurité', 'Électricité et Énergie Solaire',
]

const COLORS = {
  M: ['bg-trt-100 text-trt-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700'],
  F: ['bg-pink-100 text-pink-700', 'bg-rose-100 text-rose-700'],
}

const EMPTY = { nom: '', prenom: '', email: '', telephone: '', sexe: 'M', specialisation: '' }

export default function Formateurs() {
  usePageTitle('Formateurs')
  const queryClient = useQueryClient()

  const [page, setPage]                   = useState(1)
  const [recherche, setRecherche]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filtreSpec, setFiltreSpec]       = useState('')
  const searchTimeout                     = useRef(null)
  const [showModal, setShowModal]         = useState(false)
  const [editing, setEditing]             = useState(null)
  const [form, setForm]                   = useState(EMPTY)
  const [errors, setErrors]               = useState({})
  const [confirmDel, setConfirmDel]       = useState(null)

  // ─── Query ───────────────────────────────────────────────────────────────
  const { data, isLoading: loading } = useQuery({
    queryKey: ['formateurs', page, debouncedSearch, filtreSpec],
    queryFn:  () => formateurService.getAll(page, debouncedSearch, filtreSpec),
    placeholderData: (prev) => prev,
  })

  const formateurs = data?.data ?? []
  const meta       = data?.total !== undefined ? data : null

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['formateurs'] })

  // ─── Mutations ───────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (d) => formateurService.create(d),
    onSuccess: () => { toast.success('Formateur ajouté'); fermer(); invalidate() },
    onError: (err) => {
      const data = err.response?.data
      if (data?.errors) Object.values(data.errors).forEach((msgs) => msgs.forEach((m) => toast.error(m)))
      else toast.error(data?.message ?? 'Une erreur est survenue')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => formateurService.update(id, d),
    onSuccess: () => { toast.success('Formateur modifié'); fermer(); invalidate() },
    onError: (err) => {
      const data = err.response?.data
      if (data?.errors) Object.values(data.errors).forEach((msgs) => msgs.forEach((m) => toast.error(m)))
      else toast.error(data?.message ?? 'Une erreur est survenue')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => formateurService.remove(id),
    onSuccess: () => { toast.success('Formateur archivé'); setConfirmDel(null); invalidate() },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Suppression impossible'),
  })

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleRecherche = (val) => {
    setRecherche(val)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => { setDebouncedSearch(val); setPage(1) }, 400)
  }

  const handleFiltreSpec = (val) => { setFiltreSpec(val); setPage(1); setRecherche(''); setDebouncedSearch('') }

  const ouvrirCreation = () => { setEditing(null); setForm(EMPTY); setErrors({}); setShowModal(true) }
  const ouvrirEdition  = (f) => {
    setEditing(f)
    setForm({ nom: f.nom, prenom: f.prenom, email: f.email, telephone: f.telephone ?? '', sexe: f.sexe ?? 'M', specialisation: f.specialisation ?? '' })
    setErrors({}); setShowModal(true)
  }
  const fermer = () => { setShowModal(false); setEditing(null); setForm(EMPTY); setErrors({}) }

  const valider = () => {
    const e = {}
    if (!form.nom.trim())     e.nom            = 'Requis'
    if (!form.prenom.trim())  e.prenom         = 'Requis'
    if (!form.email.trim())   e.email          = 'Requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide'
    if (!form.sexe)           e.sexe           = 'Requis'
    if (!form.telephone || form.telephone.replace(/\D/g, '').length < 8) e.telephone = 'Numéro de téléphone obligatoire'
    if (!form.specialisation) e.specialisation = 'Requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!valider()) return
    if (editing) updateMutation.mutate({ id: editing.id, d: form })
    else createMutation.mutate(form)
  }

  const saving    = createMutation.isPending || updateMutation.isPending
  const initiales = (f) => `${f.prenom?.[0] ?? ''}${f.nom?.[0] ?? ''}`.toUpperCase()
  const couleur   = (f) => { const p = COLORS[f.sexe] ?? COLORS.M; return p[f.id % p.length] }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Formateurs</h1>
          <p className="text-xs text-gray-400 mt-0.5">{meta?.total ?? 0} formateur{(meta?.total ?? 0) > 1 ? 's' : ''} enregistré{(meta?.total ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <button onClick={ouvrirCreation}
          className="flex items-center gap-2 bg-trt-500 hover:bg-trt-700 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors">
          <Plus size={13} /> Nouveau formateur
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="text" placeholder="Rechercher un formateur..." value={recherche}
            onChange={(e) => handleRecherche(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 transition-all" />
        </div>
        <select value={filtreSpec} onChange={(e) => handleFiltreSpec(e.target.value)}
          className="text-xs bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500">
          <option value="">Toutes les spécialisations</option>
          {SPECIALISATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(recherche || filtreSpec) && (
          <button onClick={() => { setRecherche(''); setDebouncedSearch(''); setFiltreSpec(''); setPage(1) }}
            className="text-xs text-gray-400 hover:text-gray-600 px-3 py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <X size={12} /> Réinitialiser
          </button>
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : formateurs.length === 0 ? (
        <EmptyState title="Aucun formateur trouvé"
          description={debouncedSearch ? `Aucun résultat pour "${debouncedSearch}"` : 'Ajoutez votre premier formateur'}
          actionLabel={!debouncedSearch ? '+ Nouveau formateur' : undefined}
          onAction={!debouncedSearch ? ouvrirCreation : undefined} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {formateurs.map((f, i) => (
              <motion.div key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ delay: i * 0.03, duration: 0.2 }}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:border-trt-300 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0 ${couleur(f)}`}>{initiales(f)}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{f.prenom} {f.nom}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${f.sexe === 'F' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>{f.sexe === 'F' ? 'F' : 'M'}</span>
                        {f.specialisation && <span className="text-xs text-trt-500 font-medium truncate max-w-[120px]">{f.specialisation}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => ouvrirEdition(f)} className="w-7 h-7 rounded-md hover:bg-trt-100 flex items-center justify-center transition-colors">
                      <Pencil size={12} className="text-gray-400" />
                    </button>
                    <button onClick={() => setConfirmDel(f)} className="w-7 h-7 rounded-md hover:bg-red-50 flex items-center justify-center transition-colors">
                      <Trash2 size={12} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2"><Mail size={12} className="text-gray-300 flex-shrink-0" /><span className="text-xs text-gray-500 truncate">{f.email}</span></div>
                  {f.telephone && <div className="flex items-center gap-2"><Phone size={12} className="text-gray-300 flex-shrink-0" /><span className="text-xs text-gray-500">{f.telephone}</span></div>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Pagination meta={meta} onPageChange={(p) => setPage(p)} />

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 w-full max-w-sm max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">{editing ? 'Modifier le formateur' : 'Nouveau formateur'}</h2>
                <button onClick={fermer} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Prénom *</label>
                    <input type="text" value={form.prenom} onChange={(e) => { setForm({ ...form, prenom: e.target.value }); setErrors({ ...errors, prenom: '' }) }}
                      className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.prenom ? 'border-red-300' : 'border-gray-200'}`} />
                    {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Nom *</label>
                    <input type="text" value={form.nom} onChange={(e) => { setForm({ ...form, nom: e.target.value }); setErrors({ ...errors, nom: '' }) }}
                      className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.nom ? 'border-red-300' : 'border-gray-200'}`} />
                    {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }) }}
                    className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.email ? 'border-red-300' : 'border-gray-200'}`} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Sexe *</label>
                  <select value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Téléphone *</label>
                  <PhoneInput defaultCountry="tg" value={form.telephone}
                    onChange={(phone) => { setForm({ ...form, telephone: phone }); setErrors({ ...errors, telephone: '' }) }}
                    style={{ '--react-international-phone-border-radius': '6px', '--react-international-phone-border-color': errors.telephone ? '#fca5a5' : '#e5e7eb', '--react-international-phone-height': '36px', '--react-international-phone-font-size': '12px', width: '100%' }} />
                  {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Spécialisation *</label>
                  <select value={form.specialisation} onChange={(e) => { setForm({ ...form, specialisation: e.target.value }); setErrors({ ...errors, specialisation: '' }) }}
                    className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.specialisation ? 'border-red-300' : 'border-gray-200'}`}>
                    <option value="">Sélectionner une spécialisation</option>
                    {SPECIALISATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.specialisation && <p className="text-red-500 text-xs mt-1">{errors.specialisation}</p>}
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

      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 w-full max-w-sm overflow-hidden">
              <div className="px-6 pt-6 pb-5">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4"><Trash2 size={18} className="text-red-500" /></div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Archiver le formateur</h2>
                <p className="text-xs text-gray-500 mb-5">Voulez-vous archiver <span className="font-medium text-gray-800">{confirmDel.prenom} {confirmDel.nom}</span> ? L'historique sera préservé.</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDel(null)} className="flex-1 text-xs border border-gray-200 rounded-md py-2.5 text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button onClick={() => deleteMutation.mutate(confirmDel.id)} disabled={deleteMutation.isPending}
                    className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md py-2.5 font-medium transition-colors disabled:opacity-60">
                    {deleteMutation.isPending ? 'Archivage...' : 'Archiver'}
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
