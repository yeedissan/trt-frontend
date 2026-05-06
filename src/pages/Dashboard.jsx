import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, AlertCircle, CheckCircle2, Users, BookOpen, TrendingUp, Award } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import api from '../services/api'
import sessionService from '../services/sessionService'
import { usePageTitle } from '../hooks/usePageTitle'
import { useAuth } from '../hooks/useAuth'

const BADGE = {
  planifiée: { cls: 'bg-amber-100 text-amber-800',  label: 'Planifiée' },
  en_cours:  { cls: 'bg-trt-100 text-trt-700',      label: 'En cours'  },
  terminée:  { cls: 'bg-gray-100 text-gray-600',    label: 'Terminée'  },
  annulée:   { cls: 'bg-red-50 text-red-700',       label: 'Annulée'   },
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'

function AnimatedNumber({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!value) return
    const start = Date.now()
    const tick = () => {
      const elapsed  = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <span>{display}</span>
}

function DonutChart({ data, size = 96 }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return null
  let offset = 0
  const radius        = 45
  const circumference = 2 * Math.PI * radius
  const segments = data.map((d) => {
    const dash = (d.value / total) * circumference
    const gap  = circumference - dash
    const seg  = { ...d, dash, gap, offset }
    offset += dash
    return seg
  })
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
      {segments.map((s, i) => (
        <circle key={i} cx="50" cy="50" r={radius} fill="none"
          stroke={s.color} strokeWidth="10"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      ))}
      <text x="50" y="47" textAnchor="middle" fontSize="15" fontWeight="600" fill="#111827">{total}</text>
      <text x="50" y="60" textAnchor="middle" fontSize="8" fill="#9ca3af">total</text>
    </svg>
  )
}

function BarChart({ data, height = 96 }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / max) * (height - 24)}px` }}
            transition={{ delay: i * 0.06, duration: 0.45, ease: 'easeOut' }}
            className="w-full rounded-t-sm"
            style={{ background: d.color ?? '#4338ca', minHeight: d.value ? 3 : 0 }} />
          <span className="text-[10px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  usePageTitle('Tableau de bord')
  const { isDG, responsable } = useAuth()

  const [date, setDate] = useState('')
  useEffect(() => {
    setDate(new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }))
  }, [])

  // ─── React Query ─────────────────────────────────────────────────────────
  const { data: stats, isLoading: loadingStats, isError: errorStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn:  () => api.get('/dashboard/stats').then((r) => r.data),
    staleTime: 60_000,
    retry: 1,
  })

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions-recent'],
    queryFn:  () => sessionService.getAll(),
    staleTime: 30_000,
    retry: 1,
  })

  const loading  = loadingStats || loadingSessions
  const sessions = ((sessionsData?.data ?? sessionsData) ?? []).slice(0, 5)

  const statCards = stats ? [
    { label: 'Sessions',     value: stats.sessions,     sub: `${stats.enCours} en cours`    },
    { label: 'Inscriptions', value: stats.inscriptions, sub: `${stats.enAttente} en attente` },
    { label: 'Formations',   value: stats.formations,   sub: `${stats.typesFormations ?? 0} type${(stats.typesFormations ?? 0) > 1 ? 's' : ''}` },
    { label: 'Étudiants',    value: stats.etudiants,    sub: 'actifs'                        },
  ] : []

  const donutData = stats ? [
    { label: 'En cours',   value: stats.enCours,   color: '#4338ca' },
    { label: 'En attente', value: stats.enAttente, color: '#BA7517' },
    { label: 'Autres',     value: Math.max(0, stats.sessions - stats.enCours - stats.enAttente), color: '#e5e7eb' },
  ] : []

  const barData = stats?.activite?.map((d) => ({
    ...d,
    color: ['Sam', 'Dim'].includes(d.label) ? '#6366f1' : '#4338ca',
  })) ?? []

  return (
    <Layout>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Bonjour, {responsable?.prenom ?? 'Responsable'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{date}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-trt-500" />
          <span className="text-xs text-gray-400">Système opérationnel</span>
        </div>
      </div>

      {/* Bande de statistiques */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-5 animate-pulse">
                <div className="h-8 bg-gray-100 rounded w-14 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-24 mb-1" />
                <div className="h-2.5 bg-gray-100 rounded w-16" />
              </div>
            ))
          ) : errorStats ? (
            <div className="col-span-2 lg:col-span-4 px-6 py-5 flex items-center gap-3 text-sm text-red-600">
              <AlertCircle size={15} className="flex-shrink-0" />
              Impossible de charger les statistiques. Vérifiez que le serveur est démarré.
            </div>
          ) : statCards.map(({ label, value, sub }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
              className="px-6 py-5">
              <p className="text-3xl font-semibold text-gray-900 tabular-nums mb-1">
                <AnimatedNumber value={value} />
              </p>
              <p className="text-sm text-gray-600">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Ligne principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Sessions récentes</h2>
            <a href="/sessions" className="text-xs text-trt-500 hover:text-trt-700 hover:underline transition-colors">
              Voir tout →
            </a>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map((i) => <div key={i} className="h-11 bg-gray-50 rounded-md animate-pulse" />)}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-gray-300 text-center py-8">Aucune session</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {sessions.map((s) => {
                const b = BADGE[s.statut] ?? BADGE.planifiée
                return (
                  <div key={s.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <CalendarDays size={13} className="text-trt-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{s.titre}</p>
                        <p className="text-xs text-gray-400">{fmt(s.date_debut)} → {fmt(s.date_fin)}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-3 ${b.cls}`}>
                      {b.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        <div className="flex flex-col gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="bg-white rounded-lg border border-gray-200 p-5 flex-1">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Répartition sessions</h2>
            {!loading && (
              <div className="flex items-center gap-4">
                <DonutChart data={donutData} size={96} />
                <div className="space-y-2">
                  {donutData.filter((d) => d.value > 0).map((d) => (
                    <div key={d.label} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-gray-500">{d.label}</span>
                      <span className="text-xs font-semibold text-gray-700 ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {loading && <div className="h-24 bg-gray-50 rounded-md animate-pulse" />}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44 }}
            className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Alertes</h2>
            <div className="space-y-2">
              {stats?.enAttente > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                  <AlertCircle size={12} className="text-amber-500 flex-shrink-0" />
                  <span className="text-xs text-amber-700">
                    {stats.enAttente} inscription{stats.enAttente > 1 ? 's' : ''} en attente
                  </span>
                </div>
              )}
              {stats?.enCours > 0 && (
                <div className="flex items-center gap-2 bg-trt-100 border border-trt-100 rounded-md px-3 py-2">
                  <CheckCircle2 size={12} className="text-trt-500 flex-shrink-0" />
                  <span className="text-xs text-trt-700">
                    {stats.enCours} session{stats.enCours > 1 ? 's' : ''} en cours
                  </span>
                </div>
              )}
              {!stats?.enAttente && !stats?.enCours && !loading && (
                <p className="text-xs text-gray-400 text-center py-2">Aucune alerte</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Ligne du bas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Activité</h2>
            <span className="text-xs text-gray-400">7 derniers jours</span>
          </div>
          <BarChart data={barData} height={96} />
        </motion.div>

        {!isDG() ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.56 }}
            className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Actions rapides</h2>
            <div className="space-y-2">
              {[
                { label: 'Nouvelle session',     href: '/sessions',     primary: true  },
                { label: 'Inscrire un étudiant', href: '/inscriptions', primary: true  },
                { label: 'Saisir les présences', href: '/presences',    primary: false },
                { label: 'Saisir les notes',     href: '/evaluations',  primary: false },
              ].map(({ label, href, primary }) => (
                <a key={label} href={href}
                  className={`block w-full text-center text-xs font-medium px-3 py-2 rounded-md transition-colors ${
                    primary
                      ? 'bg-trt-500 hover:bg-trt-700 text-white'
                      : 'border border-trt-500 text-trt-600 hover:bg-trt-50'
                  }`}>
                  {label}
                </a>
              ))}
            </div>
          </motion.div>
        ) : (
          /* DG — KPIs management */
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.56 }}
            className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Indicateurs clés</h2>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => <div key={i} className="h-8 bg-gray-50 rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  {
                    icon: Users, color: 'bg-trt-100 text-trt-700',
                    label: 'Taux de remplissage',
                    value: stats?.placesTotales > 0
                      ? `${Math.min(100, Math.round((stats.inscriptionsValidees / stats.placesTotales) * 100))}%`
                      : '—',
                  },
                  {
                    icon: Award, color: 'bg-amber-50 text-amber-700',
                    label: 'Taux de présence',
                    value: stats?.tauxPresence != null ? `${stats.tauxPresence}%` : '—',
                  },
                  {
                    icon: TrendingUp, color: 'bg-green-50 text-green-700',
                    label: 'Inscriptions validées',
                    value: stats?.inscriptionsValidees ?? '—',
                  },
                  {
                    icon: BookOpen, color: 'bg-gray-100 text-gray-600',
                    label: 'Formations actives',
                    value: stats?.formations ?? '—',
                  },
                ].map(({ icon: Icon, color, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon size={13} />
                    </div>
                    <span className="text-xs text-gray-500 flex-1">{label}</span>
                    <span className="text-xs font-semibold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62 }}
          className="bg-trt-900 rounded-lg p-5">
          <p className="text-white/50 text-xs mb-0.5">TRT Formations</p>
          <p className="text-white text-sm font-semibold mb-4">Résumé global</p>
          <div className="space-y-3">
            {[
              { label: 'Taux de remplissage',  value: stats?.placesTotales > 0 ? `${Math.min(100, Math.round((stats.inscriptionsValidees / stats.placesTotales) * 100))}%` : '—' },
              { label: 'Taux de présence',      value: stats?.tauxPresence != null ? `${stats.tauxPresence}%` : '—' },
              { label: 'Inscriptions validées', value: stats?.inscriptionsValidees ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center border-b border-white/8 pb-2.5 last:border-0 last:pb-0">
                <span className="text-white/50 text-xs">{label}</span>
                <span className="text-white text-xs font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Taux de réussite par formation — visible pour tous */}
      {stats?.statsFormations?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.68 }}
          className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Taux de réussite par formation</h2>
          <div className="space-y-3">
            {stats.statsFormations.map((f) => (
              <div key={f.formation} className="flex items-center gap-3">
                <p className="text-xs text-gray-600 w-32 sm:w-48 truncate flex-shrink-0">{f.formation}</p>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${f.taux_reussite}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      f.taux_reussite >= 70 ? 'bg-trt-500' :
                      f.taux_reussite >= 50 ? 'bg-amber-500' : 'bg-red-400'
                    }`}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-10 text-right flex-shrink-0">
                  {f.taux_reussite}%
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  ({f.total_evalues} évalué{f.total_evalues > 1 ? 's' : ''})
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Section DG exclusive — vue d'ensemble management */}
      {isDG() && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.74 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Formateurs */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Ressources humaines</h2>
            <div className="space-y-3">
              {[
                { label: 'Formateurs',  value: stats?.formateurs ?? '—',  icon: Users,     color: 'bg-trt-100 text-trt-700' },
                { label: 'Étudiants',   value: stats?.etudiants  ?? '—',  icon: Users,     color: 'bg-amber-50 text-amber-700' },
                { label: 'Responsables',value: stats?.responsables ?? '—', icon: Users,    color: 'bg-gray-100 text-gray-600' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${color}`}>
                      <Icon size={11} />
                    </div>
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Accès rapide DG */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Accès rapide</h2>
            <div className="space-y-2">
              {[
                { label: 'Journal d\'activités', href: '/activites', primary: true  },
                { label: 'Toutes les sessions',  href: '/sessions',  primary: false },
                { label: 'Toutes les inscriptions', href: '/inscriptions', primary: false },
              ].map(({ label, href, primary }) => (
                <a key={label} href={href}
                  className={`block w-full text-center text-xs font-medium px-3 py-2 rounded-md transition-colors ${
                    primary
                      ? 'bg-trt-500 hover:bg-trt-700 text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Santé système */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Santé du système</h2>
            <div className="space-y-2.5">
              {[
                { label: 'Données actives',    ok: true  },
                { label: 'Inscriptions ouvertes', ok: (stats?.enAttente ?? 0) < 20 },
                { label: 'Sessions planifiées',   ok: (stats?.sessions ?? 0) > 0  },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ok ? 'bg-trt-500' : 'bg-amber-400'}`} />
                  <span className="text-xs text-gray-500 flex-1">{label}</span>
                  <span className={`text-[10px] font-medium ${ok ? 'text-trt-600' : 'text-amber-600'}`}>
                    {ok ? 'OK' : 'Attention'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </Layout>
  )
}
