import { useRef, useState } from 'react'
import api from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Eye, Pencil, X, CalendarDays, Ban, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PrintButton from '../components/ui/PrintButton'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import Pagination from '../components/ui/Pagination'
import { PageLoader, EmptyState } from '../components/ui/Skeleton'
import sessionService from '../services/sessionService'
import anneeService   from '../services/anneeService'
import { usePageTitle } from '../hooks/usePageTitle'

const BADGE = {
  planifiée: 'bg-amber-50 text-amber-800 border border-amber-200',
  en_cours:  'bg-trt-100 text-trt-700 border border-trt-200',
  terminée:  'bg-gray-100 text-gray-600 border border-gray-200',
  annulée:   'bg-red-50 text-red-700 border border-red-200',
}
const BADGE_DOT = {
  planifiée: '#BA7517',
  en_cours:  '#4338ca',
  terminée:  '#6b7280',
  annulée:   '#ef4444',
}

const STATUTS    = ['planifiée', 'en_cours', 'terminée', 'annulée']
const EMPTY_FORM = { id_formation: '', id_formateur: '', date_debut: '', date_fin: '', nb_places: '', lieu: '' }
const fmt        = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const calculerDateFin = (type, date_debut) => {
  if (!type || !date_debut) return ''
  const debut = new Date(date_debut)
  if (type === 'Modulaire') debut.setMonth(debut.getMonth() + 3)
  else debut.setFullYear(debut.getFullYear() + 3)
  return debut.toISOString().split('T')[0]
}

function CalendarView({ sessions, onSelect }) {
  const [mois, setMois] = useState(() => {
    const d = new Date(); d.setDate(1); return d
  })

  const naviguer = (delta) => {
    setMois((m) => {
      const n = new Date(m); n.setMonth(n.getMonth() + delta); return n
    })
  }

  const year  = mois.getFullYear()
  const month = mois.getMonth()

  // jours du mois
  const premierJour = new Date(year, month, 1)
  const dernierJour = new Date(year, month + 1, 0)
  // on part du lundi (0=lundi … 6=dimanche)
  const offset = (premierJour.getDay() + 6) % 7
  const totalCases = Math.ceil((offset + dernierJour.getDate()) / 7) * 7

  const sessionsDuMois = sessions.filter((s) => {
    if (!s.date_debut) return false
    const d = new Date(s.date_debut)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const sessionsParJour = {}
  sessionsDuMois.forEach((s) => {
    const d = new Date(s.date_debut).getDate()
    if (!sessionsParJour[d]) sessionsParJour[d] = []
    sessionsParJour[d].push(s)
  })

  const today = new Date()

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={() => naviguer(-1)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-medium text-gray-800">{MOIS[month]} {year}</span>
        <button onClick={() => naviguer(1)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7">
        {JOURS.map((j) => (
          <div key={j} className="text-center text-[10px] font-medium text-gray-400 py-2 border-b border-gray-100">
            {j}
          </div>
        ))}
        {Array.from({ length: totalCases }).map((_, i) => {
          const dayNum = i - offset + 1
          const isValid = dayNum >= 1 && dayNum <= dernierJour.getDate()
          const isToday = isValid && today.getDate() === dayNum && today.getMonth() === month && today.getFullYear() === year
          const daySessions = isValid ? (sessionsParJour[dayNum] ?? []) : []

          return (
            <div key={i} className={`min-h-[72px] p-1.5 border-b border-r border-gray-100 last:border-r-0 ${!isValid ? 'bg-gray-50/50' : ''}`}>
              {isValid && (
                <>
                  <span className={`text-[11px] font-medium inline-flex items-center justify-center w-5 h-5 rounded-full mb-1 ${
                    isToday ? 'bg-trt-500 text-white' : 'text-gray-400'
                  }`}>
                    {dayNum}
                  </span>
                  <div className="space-y-0.5">
                    {daySessions.slice(0, 2).map((s) => (
                      <button key={s.id} onClick={() => onSelect(s)}
                        className="w-full text-left truncate text-[10px] px-1.5 py-0.5 rounded font-medium transition-opacity hover:opacity-80"
                        style={{ background: `${BADGE_DOT[s.statut] ?? '#6b7280'}18`, color: BADGE_DOT[s.statut] ?? '#6b7280' }}>
                        {s.titre}
                      </button>
                    ))}
                    {daySessions.length > 2 && (
                      <span className="text-[10px] text-gray-400 px-1">+{daySessions.length - 2}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Sessions() {
  usePageTitle('Sessions de formation')
  const queryClient = useQueryClient()

  const [page, setPage]                               = useState(1)
  const [filtreStatut, setFiltreStatut]               = useState('planifiée')
  const [filtreFormateur, setFiltreFormateur]         = useState('')
  const [filtreAnnee, setFiltreAnnee]                 = useState('')
  const [recherche, setRecherche]                     = useState('')
  const [viewMode, setViewMode]                       = useState('table')
  const [showModal, setShowModal]                     = useState(false)
  const [showDetail, setShowDetail]                   = useState(false)
  const [showModif, setShowModif]                     = useState(false)
  const [showAnnuler, setShowAnnuler]                 = useState(false)
  const [sessionSelectée, setSessionSelectée]         = useState(null)
  const [detail, setDetail]                           = useState(null)
  const [form, setForm]                               = useState(EMPTY_FORM)
  const [formModif, setFormModif]                     = useState({ date_debut: '', date_fin: '', nb_places: '', lieu: '', id_formateur: '' })
  const [errors, setErrors]                           = useState({})
  const debounceRef                                   = useRef(null)

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data, isLoading: loading } = useQuery({
    queryKey: ['sessions', page, recherche, filtreStatut, filtreAnnee],
    queryFn:  () => sessionService.getAll(page, recherche, filtreStatut, filtreAnnee),
    placeholderData: (prev) => prev,
  })

  const { data: allSessions = [] } = useQuery({
    queryKey: ['sessions-calendar'],
    queryFn:  () =>
      api.get('/sessions?per_page=all').then((r) => {
        const list = r.data?.data ?? r.data
        return Array.isArray(list) ? list : []
      }),
    enabled:   viewMode === 'calendar',
    staleTime: 60_000,
  })

  const { data: formations = [] } = useQuery({
    queryKey: ['formations-list'],
    queryFn:  () => sessionService.getFormations(),
    staleTime: 5 * 60_000,
  })

  const { data: formateurs = [] } = useQuery({
    queryKey: ['formateurs-list'],
    queryFn:  () => sessionService.getFormateurs(),
    staleTime: 5 * 60_000,
  })

  const { data: annees = [] } = useQuery({
    queryKey: ['annees'],
    queryFn:  anneeService.getAll,
    staleTime: 5 * 60_000,
  })

  const sessions = data?.data ?? (Array.isArray(data) ? data : [])
  const meta     = data?.total !== undefined ? data : null

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
    queryClient.invalidateQueries({ queryKey: ['sessions-all'] })
  }

  const createMutation = useMutation({
    mutationFn: (data) => sessionService.create(data),
    onSuccess:  () => { toast.success('Session créée'); fermer(); invalidate() },
    onError:    (err) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => sessionService.update(id, data),
    onSuccess:  () => { toast.success('Session modifiée'); setShowModif(false); invalidate() },
    onError:    (err) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })

  const annulerMutation = useMutation({
    mutationFn: (id) => sessionService.annuler(id),
    onSuccess:  () => { toast.success('Session annulée'); setShowAnnuler(false); invalidate() },
    onError:    (err) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleRecherche = (val) => {
    setRecherche(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(1) }, 300)
  }

  const voirDetail = async (session) => {
    setSessionSelectée(session); setDetail(null); setShowDetail(true)
    try { const data = await sessionService.getById(session.id); setDetail(data) }
    catch { setDetail(session) }
  }

  const ouvrirModif = (session) => {
    setSessionSelectée(session)
    setFormModif({ date_debut: session.date_debut ?? '', date_fin: session.date_fin ?? '', nb_places: session.nb_places ?? '', lieu: session.lieu ?? '', id_formateur: session.id_formateur ?? '' })
    setShowModif(true)
  }

  const valider = () => {
    const e = {}
    if (!form.id_formation) e.id_formation = 'Requis'
    if (!form.id_formateur) e.id_formateur = 'Requis'
    if (!form.date_debut)   e.date_debut   = 'Requis'
    if (!form.date_fin)     e.date_fin     = 'Requis'
    if (!form.nb_places)    e.nb_places    = 'Requis'
    if (form.date_fin && form.date_debut && form.date_fin <= form.date_debut) e.date_fin = 'Doit être après la date de début'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!valider()) return
    createMutation.mutate(form)
  }

  const fermer = () => { setShowModal(false); setForm(EMPTY_FORM); setErrors({}) }

  const sessionsFiltrees = filtreFormateur
    ? sessions.filter((s) => String(s.id_formateur) === filtreFormateur)
    : sessions

  const hasFiltre = recherche || filtreStatut || filtreFormateur || filtreAnnee
  const resetFiltres = () => { setRecherche(''); setFiltreStatut(''); setFiltreFormateur(''); setFiltreAnnee(''); setPage(1) }

  const calendarSessions = filtreFormateur
    ? allSessions.filter((s) => String(s.id_formateur) === filtreFormateur)
    : allSessions

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Sessions de formation</h1>
          <p className="text-xs text-gray-400 mt-0.5">{meta?.total ?? sessionsFiltrees.length} session{(meta?.total ?? sessionsFiltrees.length) > 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex gap-2">
          {/* Toggle vue */}
          <div className="flex rounded-md border border-gray-200 overflow-hidden">
            <button onClick={() => setViewMode('table')}
              className={`px-3 py-2 transition-colors ${viewMode === 'table' ? 'bg-trt-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
              title="Vue tableau">
              <List size={14} />
            </button>
            <button onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 border-l border-gray-200 transition-colors ${viewMode === 'calendar' ? 'bg-trt-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
              title="Vue calendrier">
              <CalendarDays size={14} />
            </button>
          </div>
          <PrintButton />
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-trt-500 hover:bg-trt-700 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors">
            <Plus size={13} /> Nouvelle session
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="text" placeholder="Rechercher..." value={recherche}
            onChange={(e) => handleRecherche(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 w-52" />
        </div>
        <select value={filtreStatut} onChange={(e) => { setFiltreStatut(e.target.value); setPage(1) }}
          className="text-xs bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500">
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filtreFormateur} onChange={(e) => setFiltreFormateur(e.target.value)}
          className="text-xs bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500">
          <option value="">Tous les formateurs</option>
          {formateurs.map((f) => <option key={f.id} value={String(f.id)}>{f.prenom} {f.nom}</option>)}
        </select>
        <select value={filtreAnnee} onChange={(e) => { setFiltreAnnee(e.target.value); setPage(1) }}
          className="text-xs bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500">
          <option value="">Toutes les années</option>
          {annees.map((a) => <option key={a.id} value={String(a.id)}>{a.libelle}{a.statut === 'active' ? ' ★' : ''}</option>)}
        </select>
        {hasFiltre && (
          <button onClick={resetFiltres}
            className="text-xs text-gray-400 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Vue calendrier */}
      {viewMode === 'calendar' ? (
        <CalendarView sessions={calendarSessions} onSelect={voirDetail} />
      ) : loading ? (
        <PageLoader />
      ) : sessionsFiltrees.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Aucune session trouvée"
          description={hasFiltre ? 'Aucun résultat pour ces filtres' : 'Créez votre première session de formation'}
          actionLabel={!hasFiltre ? '+ Nouvelle session' : undefined}
          onAction={!hasFiltre ? () => setShowModal(true) : undefined} />
      ) : (
        <div className="overflow-x-auto rounded-lg"><div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-[640px]">
          <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-trt-500">
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[24%]">Formation</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[16%]">Formateur</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[11%]">Début</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[11%]">Fin</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[10%]">Places</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[10%]">Statut</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[18%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessionsFiltrees.map((s, i) => (
                <tr key={s.id} className={`transition-colors hover:bg-slate-50 ${i % 2 === 1 ? 'bg-[#F8F9FA]' : 'bg-white'}`}>
                  <td className="px-4 py-3 text-gray-800 font-medium truncate">{s.titre}</td>
                  <td className="px-4 py-3 text-gray-500 truncate">{s.formateur}</td>
                  <td className="px-4 py-3 text-gray-500">{fmt(s.date_debut)}</td>
                  <td className="px-4 py-3 text-gray-500">{fmt(s.date_fin)}</td>
                  <td className="px-4 py-3 text-gray-500">{s.nb_places - s.places_restantes}/{s.nb_places}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${BADGE[s.statut] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                      {s.statut?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => voirDetail(s)} title="Détail"
                        className="text-gray-400 hover:text-trt-600 transition-colors p-1">
                        <Eye size={13} />
                      </button>
                      {s.statut !== 'annulée' && s.statut !== 'terminée' && (
                        <button onClick={() => ouvrirModif(s)} title="Modifier"
                          className="text-gray-400 hover:text-trt-600 transition-colors p-1">
                          <Pencil size={13} />
                        </button>
                      )}
                      {s.statut !== 'annulée' && s.statut !== 'terminée' && (
                        <button onClick={() => { setSessionSelectée(s); setShowAnnuler(true) }} title="Annuler"
                          className="text-gray-400 hover:text-red-500 transition-colors p-1">
                          <Ban size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}

      {viewMode === 'table' && (
        <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
      )}

      {/* Modal Création */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
            onClick={(e) => { if (e.target === e.currentTarget) fermer() }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.18 }}
              className="bg-white rounded-xl border border-gray-200 w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Nouvelle session</h2>
                <button onClick={fermer} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
              </div>
              <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Formation *</label>
                  <select value={form.id_formation}
                    onChange={(e) => {
                      const idFormation = e.target.value
                      const formation = formations.find((f) => f.id === parseInt(idFormation))
                      const date_fin = calculerDateFin(formation?.type, form.date_debut)
                      setForm({ ...form, id_formation: idFormation, date_fin })
                      setErrors({ ...errors, id_formation: '' })
                    }}
                    className={`w-full text-xs border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.id_formation ? 'border-red-300' : 'border-gray-200'}`}>
                    <option value="">Sélectionner une formation</option>
                    {formations.map((f) => <option key={f.id} value={f.id}>{f.titre} {f.type ? `(${f.type})` : ''}</option>)}
                  </select>
                  {errors.id_formation && <p className="text-red-500 text-xs mt-1">{errors.id_formation}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Formateur *</label>
                  <select value={form.id_formateur} onChange={(e) => { setForm({ ...form, id_formateur: e.target.value }); setErrors({ ...errors, id_formateur: '' }) }}
                    className={`w-full text-xs border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.id_formateur ? 'border-red-300' : 'border-gray-200'}`}>
                    <option value="">Sélectionner un formateur</option>
                    {formateurs.map((f) => <option key={f.id} value={f.id}>{f.prenom} {f.nom}</option>)}
                  </select>
                  {errors.id_formateur && <p className="text-red-500 text-xs mt-1">{errors.id_formateur}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date début *</label>
                    <input type="date" value={form.date_debut}
                      onChange={(e) => {
                        const date_debut = e.target.value
                        const formation = formations.find((f) => f.id === parseInt(form.id_formation))
                        const date_fin = calculerDateFin(formation?.type, date_debut)
                        setForm({ ...form, date_debut, date_fin })
                        setErrors({ ...errors, date_debut: '' })
                      }}
                      className={`w-full text-xs border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.date_debut ? 'border-red-300' : 'border-gray-200'}`} />
                    {errors.date_debut && <p className="text-red-500 text-xs mt-1">{errors.date_debut}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date fin *</label>
                    <input type="date" value={form.date_fin} onChange={(e) => { setForm({ ...form, date_fin: e.target.value }); setErrors({ ...errors, date_fin: '' }) }}
                      className={`w-full text-xs border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.date_fin ? 'border-red-300' : 'border-gray-200'}`} />
                    {errors.date_fin && <p className="text-red-500 text-xs mt-1">{errors.date_fin}</p>}
                    {form.date_fin && form.id_formation && (
                      <p className="text-trt-500 text-xs mt-1">
                        {formations.find((f) => f.id === parseInt(form.id_formation))?.type === 'Modulaire' ? '3 mois' : '3 ans'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nb places *</label>
                    <input type="number" min="1" value={form.nb_places} placeholder="ex : 20" onChange={(e) => { setForm({ ...form, nb_places: e.target.value }); setErrors({ ...errors, nb_places: '' }) }}
                      className={`w-full text-xs border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.nb_places ? 'border-red-300' : 'border-gray-200'}`} />
                    {errors.nb_places && <p className="text-red-500 text-xs mt-1">{errors.nb_places}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Lieu</label>
                    <input type="text" value={form.lieu} placeholder="ex : Salle A" onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                      className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={fermer} className="flex-1 text-xs border border-gray-200 rounded-md py-2 text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" disabled={createMutation.isPending} className="flex-1 text-xs bg-trt-500 hover:bg-trt-700 text-white rounded-md py-2 font-medium transition-colors disabled:opacity-60">
                    {createMutation.isPending ? 'Création...' : 'Créer la session'}
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Détail */}
      <AnimatePresence>
        {showDetail && sessionSelectée && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowDetail(false) }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.18 }}
              className="bg-white rounded-xl border border-gray-200 w-full max-w-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">{sessionSelectée.titre}</h2>
                <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
              </div>
              <div className="p-6">
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { label: 'Formateur', value: sessionSelectée.formateur },
                  { label: 'Début',     value: fmt(sessionSelectée.date_debut) },
                  { label: 'Fin',       value: fmt(sessionSelectée.date_fin) },
                  { label: 'Places',    value: `${sessionSelectée.places_restantes} / ${sessionSelectée.nb_places}` },
                  { label: 'Lieu',      value: sessionSelectée.lieu || '—' },
                  { label: 'Statut',    value: sessionSelectée.statut },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#F8F9FA] rounded-md p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold text-gray-700 mb-2">
                Étudiants inscrits {detail?.inscriptions && `(${detail.inscriptions.length})`}
              </p>
              {!detail ? <p className="text-xs text-gray-300 text-center py-4">Chargement...</p>
              : detail.inscriptions?.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">Aucun inscrit</p>
              : (
                <div className="border border-gray-200 rounded-md overflow-hidden max-h-48 overflow-y-auto">
                  {detail.inscriptions?.map((i) => (
                    <div key={i.id} className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-0">
                      <span className="text-xs text-gray-700">{i.etudiant?.prenom} {i.etudiant?.nom}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        i.statut === 'validée'    ? 'bg-trt-100 text-trt-700' :
                        i.statut === 'en_attente' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>{i.statut}</span>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Modifier */}
      <AnimatePresence>
        {showModif && sessionSelectée && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModif(false) }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.18 }}
              className="bg-white rounded-xl border border-gray-200 w-full max-w-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Modifier la session</h2>
                <button onClick={() => setShowModif(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
              </div>
              <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: sessionSelectée.id, data: formModif }) }} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Formateur</label>
                  <select value={formModif.id_formateur} onChange={(e) => setFormModif({ ...formModif, id_formateur: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500">
                    <option value="">Garder le même ({sessionSelectée.formateur})</option>
                    {formateurs.map((f) => <option key={f.id} value={f.id}>{f.prenom} {f.nom}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date début</label>
                    <input type="date" value={formModif.date_debut} onChange={(e) => setFormModif({ ...formModif, date_debut: e.target.value })}
                      className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date fin</label>
                    <input type="date" value={formModif.date_fin} onChange={(e) => setFormModif({ ...formModif, date_fin: e.target.value })}
                      className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nb places</label>
                    <input type="number" min="1" value={formModif.nb_places} onChange={(e) => setFormModif({ ...formModif, nb_places: e.target.value })}
                      className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Lieu</label>
                    <input type="text" value={formModif.lieu} onChange={(e) => setFormModif({ ...formModif, lieu: e.target.value })}
                      className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowModif(false)} className="flex-1 text-xs border border-gray-200 rounded-md py-2 text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" disabled={updateMutation.isPending} className="flex-1 text-xs bg-trt-500 hover:bg-trt-700 text-white rounded-md py-2 font-medium transition-colors disabled:opacity-60">
                    {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Annuler */}
      <AnimatePresence>
        {showAnnuler && sessionSelectée && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAnnuler(false) }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.18 }}
              className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4">
                <Ban size={18} className="text-red-500" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Annuler la session</h2>
              <p className="text-xs text-gray-500 mb-5">
                Voulez-vous annuler <span className="font-semibold text-gray-800">{sessionSelectée.titre}</span> ?
                Toutes les inscriptions seront automatiquement annulées.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowAnnuler(false)} className="flex-1 text-xs border border-gray-200 rounded-md py-2 text-gray-500 hover:bg-gray-50 transition-colors">Retour</button>
                <button onClick={() => annulerMutation.mutate(sessionSelectée.id)} disabled={annulerMutation.isPending}
                  className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md py-2 font-medium transition-colors disabled:opacity-60">
                  {annulerMutation.isPending ? 'Annulation...' : "Confirmer l'annulation"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
