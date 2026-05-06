import { usePageTitle } from '../hooks/usePageTitle'
import { useEffect, useState } from 'react'
import { BarChart2, TrendingUp, Users, Award } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import { EmptyState, PageLoader } from '../components/ui/Skeleton'
import { evaluationService, presenceService } from '../services/presenceEvaluationService'
import { useQuery, useMutation } from '@tanstack/react-query'

const getMention = (note) => {
  const n = parseFloat(note)
  if (isNaN(n) || note === '') return null
  if (n >= 16) return { label: 'Très bien', style: 'bg-green-50 text-green-700 border border-green-200' }
  if (n >= 14) return { label: 'Bien',       style: 'bg-trt-100 text-trt-700 border border-trt-200' }
  if (n >= 10) return { label: 'Passable',   style: 'bg-amber-50 text-amber-800 border border-amber-200' }
  return             { label: 'Insuffisant', style: 'bg-red-50 text-red-700 border border-red-200' }
}

export default function Evaluations() {
  usePageTitle('Évaluations')

  const [idSession, setIdSession] = useState('')
  const [lignes, setLignes]       = useState([])
  const [errors, setErrors]       = useState({})

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions-actives'],
    queryFn:  () => presenceService.getSessionsActives(),
    staleTime: 5 * 60_000,
  })

  const { data: lignesData, isLoading: loadingLignes } = useQuery({
    queryKey: ['evaluations', idSession],
    queryFn:  () => evaluationService.getBySession(idSession),
    enabled:  !!idSession,
  })

  // Sync editable local state from query data — dépend de lignesData par référence stable
  useEffect(() => {
    if (lignesData !== undefined) { setLignes(lignesData); setErrors({}) }
  }, [lignesData])

  // ─── Mutation ────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (rows) => evaluationService.saveAll(rows),
    onSuccess: () => toast.success('Notes enregistrées avec succès'),
    onError:   () => toast.error("Erreur lors de l'enregistrement"),
  })

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleNote = (id, val) => {
    setLignes(lignes.map((l) => l.id_inscription === id ? { ...l, note: val } : l))
    setErrors({ ...errors, [id]: '' })
  }

  const handleCommentaire = (id, val) =>
    setLignes(lignes.map((l) => l.id_inscription === id ? { ...l, commentaire: val } : l))

  const valider = () => {
    const e = {}
    lignes.forEach((l) => {
      if (l.note === '') return
      const n = parseFloat(l.note)
      if (isNaN(n) || n < 0 || n > 20) e[l.id_inscription] = 'Entre 0 et 20'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!valider()) { toast.error('Certaines notes sont invalides'); return }
    saveMutation.mutate(
      lignes
        .filter((l) => l.note !== '')
        .map(({ id_inscription, note, commentaire }) => ({
          id_inscription,
          note: parseFloat(note),
          commentaire,
          date_evaluation: new Date().toISOString().split('T')[0],
        }))
    )
  }

  const handleExportExcel = () => {
    const rows = lignes.map((l) => ({
      Étudiant:    l.etudiant,
      Matricule:   l.matricule,
      'Note / 20': l.note !== '' ? parseFloat(l.note) : '',
      Mention:     getMention(l.note)?.label ?? '',
      Commentaire: l.commentaire ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Évaluations')
    const session = sessions.find((s) => String(s.id) === String(idSession))
    XLSX.writeFile(wb, `evaluations-${session?.titre ?? idSession}.xlsx`)
  }

  const handleRapport = async () => {
    try {
      const blob = await evaluationService.genererRapport(idSession)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `rapport-session-${idSession}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Rapport PDF généré')
    } catch {
      toast.error('Erreur lors de la génération du rapport')
    }
  }

  const notesRenseignées = lignes.filter((l) => l.note !== '')
  const moyenne = notesRenseignées.length
    ? (notesRenseignées.reduce((s, l) => s + parseFloat(l.note), 0) / notesRenseignées.length).toFixed(2)
    : null
  const tauxReussite = notesRenseignées.length
    ? Math.round((notesRenseignées.filter((l) => parseFloat(l.note) >= 10).length / notesRenseignées.length) * 100)
    : null

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Évaluations</h1>
          <p className="text-xs text-gray-400 mt-0.5">Grille de notation par session</p>
        </div>
      </div>

      {/* Sélecteur */}
      <div className="mb-6 max-w-sm">
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Session</label>
        <select value={idSession} onChange={(e) => setIdSession(e.target.value)}
          className="w-full text-xs bg-white border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500">
          <option value="">Sélectionner une session</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>{s.titre}</option>
          ))}
        </select>
      </div>

      {!idSession && (
        <EmptyState icon={BarChart2}
          title="Sélectionnez une session"
          description="La grille de notation apparaîtra ici" />
      )}

      {idSession && loadingLignes && <PageLoader />}

      {idSession && !loadingLignes && lignes.length === 0 && (
        <EmptyState icon={BarChart2}
          title="Aucun étudiant évaluable"
          description="Il n'y a pas d'étudiants validés pour cette session" />
      )}

      {idSession && !loadingLignes && lignes.length > 0 && (
        <>
          {/* Stats */}
          {notesRenseignées.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Moyenne générale', value: moyenne,                                              icon: TrendingUp, color: 'text-trt-600 bg-trt-100'   },
                { label: 'Taux de réussite', value: `${tauxReussite}%`,                                  icon: Award,      color: 'text-green-700 bg-green-100' },
                { label: 'Notes saisies',    value: `${notesRenseignées.length} / ${lignes.length}`,     icon: Users,      color: 'text-amber-700 bg-amber-100' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-xl font-semibold text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grille */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4 overflow-x-auto">
            <table className="w-full text-xs" style={{ tableLayout: 'fixed', minWidth: '560px' }}>
              <thead>
                <tr className="bg-trt-500">
                  <th className="text-left px-4 py-3 text-white/90 font-medium w-[25%]">Étudiant</th>
                  <th className="text-left px-4 py-3 text-white/90 font-medium w-[18%]">Matricule</th>
                  <th className="text-left px-4 py-3 text-white/90 font-medium w-[15%]">Note / 20</th>
                  <th className="text-left px-4 py-3 text-white/90 font-medium w-[14%]">Mention</th>
                  <th className="text-left px-4 py-3 text-white/90 font-medium w-[28%]">Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, i) => {
                  const mention = getMention(l.note)
                  return (
                    <tr key={l.id_inscription} className={`border-t border-gray-100 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? 'bg-[#F8F9FA]' : 'bg-white'}`}>
                      <td className="px-4 py-3 text-gray-800 font-medium">{l.etudiant}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono">{l.matricule}</td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" max="20" step="0.5"
                          value={l.note}
                          onChange={(e) => handleNote(l.id_inscription, e.target.value)}
                          placeholder="—"
                          className={`w-16 text-xs border rounded-md px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 transition-colors ${
                            errors[l.id_inscription] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`} />
                        {errors[l.id_inscription] && (
                          <p className="text-red-400 text-xs mt-0.5">{errors[l.id_inscription]}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {mention ? (
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${mention.style}`}>
                            {mention.label}
                          </span>
                        ) : <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={l.commentaire}
                          onChange={(e) => handleCommentaire(l.id_inscription, e.target.value)}
                          placeholder="Optionnel..."
                          className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button onClick={handleExportExcel}
              className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-md transition-colors">
              Exporter Excel
            </button>
            <button onClick={handleRapport}
              className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-md transition-colors">
              Générer rapport PDF
            </button>
            <button onClick={handleSave} disabled={saveMutation.isPending}
              className="text-xs bg-trt-500 hover:bg-trt-700 text-white font-medium px-6 py-2 rounded-md transition-colors disabled:opacity-60">
              {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer les notes'}
            </button>
          </div>
        </>
      )}
    </Layout>
  )
}
