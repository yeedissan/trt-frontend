import { usePageTitle } from '../hooks/usePageTitle'
import { useEffect, useState } from 'react'
import { UserCheck } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import { EmptyState, PageLoader } from '../components/ui/Skeleton'
import { presenceService } from '../services/presenceEvaluationService'
import { useQuery, useMutation } from '@tanstack/react-query'

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function Presences() {
  usePageTitle('Présences')

  const [idSession, setIdSession] = useState('')
  const [idSeance, setIdSeance]   = useState('')
  const [lignes, setLignes]       = useState([])

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions-actives'],
    queryFn:  () => presenceService.getSessionsActives(),
    staleTime: 5 * 60_000,
  })

  const { data: seances = [], isLoading: loadingSeances } = useQuery({
    queryKey: ['seances-by-session', idSession],
    queryFn:  () => presenceService.getSeancesBySession(idSession),
    enabled:  !!idSession,
  })

  const { data: lignesData, isLoading: loadingLignes } = useQuery({
    queryKey: ['presences', idSeance],
    queryFn:  () => presenceService.getBySeance(idSeance),
    enabled:  !!idSeance,
  })

  // Sync editable local state from query data — dépend de lignesData par référence stable
  useEffect(() => {
    if (lignesData !== undefined) setLignes(lignesData)
  }, [lignesData])
  // Reset séance when session changes
  useEffect(() => { setIdSeance('') }, [idSession])

  // ─── Mutation ────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (rows) => presenceService.saveAll(rows),
    onSuccess: () => toast.success('Présences enregistrées avec succès'),
    onError: ()  => toast.error("Erreur lors de l'enregistrement"),
  })

  // ─── Handlers ────────────────────────────────────────────────────────────
  const togglePresence = (id, val) =>
    setLignes(lignes.map((l) => l.id_inscription === id ? { ...l, present: val } : l))

  const setObservation = (id, val) =>
    setLignes(lignes.map((l) => l.id_inscription === id ? { ...l, observation: val } : l))

  const handleSave = () => {
    saveMutation.mutate(
      lignes.map(({ id_inscription, present, observation }) => ({
        id_inscription,
        id_seance: parseInt(idSeance),
        present,
        observation,
      }))
    )
  }

  const handleExportExcel = () => {
    const rows = lignes.map((l) => ({
      Étudiant:    l.etudiant,
      Matricule:   l.matricule,
      Présence:    l.present ? 'Présent' : 'Absent',
      Observation: l.observation ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Présences')
    const s = seances.find((s) => s.id === parseInt(idSeance))
    const label = s ? `${s.date}-${s.heure_debut}`.replace(/:/g, 'h') : idSeance
    XLSX.writeFile(wb, `presences-${label}.xlsx`)
  }

  const nbPresents    = lignes.filter((l) => l.present).length
  const seanceChoisie = seances.find((s) => s.id === parseInt(idSeance))
  const tauxPresence  = lignes.length > 0 ? Math.round((nbPresents / lignes.length) * 100) : 0
  const badgeCls = nbPresents === lignes.length
    ? 'bg-green-50 border-green-200 text-green-700'
    : nbPresents === 0
      ? 'bg-red-50 border-red-200 text-red-600'
      : 'bg-amber-50 border-amber-200 text-amber-700'

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Présences</h1>
          <p className="text-xs text-gray-400 mt-0.5">Feuilles de présence par séance</p>
        </div>
      </div>

      {/* Sélecteurs */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Session</label>
          <select value={idSession} onChange={(e) => setIdSession(e.target.value)}
            className="w-full text-xs bg-white border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500">
            <option value="">Sélectionner une session</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.titre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Séance</label>
          <select value={idSeance} onChange={(e) => setIdSeance(e.target.value)}
            disabled={!idSession || loadingSeances}
            className="w-full text-xs bg-white border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 disabled:opacity-40">
            <option value="">Sélectionner une séance</option>
            {seances.map((s) => (
              <option key={s.id} value={s.id}>
                {fmt(s.date)} — {s.heure_debut} à {s.heure_fin}{s.salle ? ` (${s.salle})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!idSeance && !loadingLignes && (
        <EmptyState icon={UserCheck}
          title="Sélectionnez une session et une séance"
          description="La feuille de présence apparaîtra ici" />
      )}

      {idSeance && loadingLignes && <PageLoader />}

      {idSeance && !loadingLignes && lignes.length > 0 && (
        <>
          <div className="flex items-center gap-4 mb-3">
            {seanceChoisie && (
              <p className="text-xs text-gray-400">
                {fmt(seanceChoisie.date)} · {seanceChoisie.heure_debut} – {seanceChoisie.heure_fin}
                {seanceChoisie.salle && ` · ${seanceChoisie.salle}`}
              </p>
            )}
            <span className={`text-xs border px-3 py-1 rounded-full font-medium ${badgeCls}`}>
              {nbPresents} / {lignes.length} présents · {tauxPresence}%
            </span>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4 overflow-x-auto">
            <table className="w-full text-xs" style={{ tableLayout: 'fixed', minWidth: '520px' }}>
              <thead>
                <tr className="bg-trt-500">
                  <th className="text-left px-4 py-3 text-white/90 font-medium w-[28%]">Étudiant</th>
                  <th className="text-left px-4 py-3 text-white/90 font-medium w-[20%]">Matricule</th>
                  <th className="text-left px-4 py-3 text-white/90 font-medium w-[22%]">Présence</th>
                  <th className="text-left px-4 py-3 text-white/90 font-medium w-[30%]">Observation</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, i) => (
                  <tr key={l.id_inscription} className={`border-t border-gray-100 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? 'bg-[#F8F9FA]' : 'bg-white'}`}>
                    <td className="px-4 py-3 text-gray-800 font-medium">{l.etudiant}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">{l.matricule}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => togglePresence(l.id_inscription, true)}
                          className={`px-3 py-1 rounded-md text-xs font-medium border transition-all ${
                            l.present
                              ? 'bg-green-50 text-green-700 border-green-300 shadow-sm'
                              : 'bg-white text-gray-300 border-gray-200 hover:border-green-200 hover:text-green-600'
                          }`}>
                          Présent
                        </button>
                        <button onClick={() => togglePresence(l.id_inscription, false)}
                          className={`px-3 py-1 rounded-md text-xs font-medium border transition-all ${
                            !l.present
                              ? 'bg-red-50 text-red-600 border-red-300 shadow-sm'
                              : 'bg-white text-gray-300 border-gray-200 hover:border-red-200 hover:text-red-500'
                          }`}>
                          Absent
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input type="text" value={l.observation}
                        onChange={(e) => setObservation(l.id_inscription, e.target.value)}
                        placeholder="Optionnel..."
                        className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={handleExportExcel}
              className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-md transition-colors">
              Exporter Excel
            </button>
            <button onClick={handleSave} disabled={saveMutation.isPending}
              className="bg-trt-500 hover:bg-trt-700 text-white text-xs font-medium px-6 py-2.5 rounded-md transition-colors disabled:opacity-60">
              {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer les présences'}
            </button>
          </div>
        </>
      )}

      {idSeance && !loadingLignes && lignes.length === 0 && (
        <EmptyState icon={UserCheck}
          title="Aucun étudiant inscrit"
          description="Il n'y a pas d'étudiants validés pour cette session" />
      )}
    </Layout>
  )
}
