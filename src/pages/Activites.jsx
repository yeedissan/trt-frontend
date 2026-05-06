import { usePageTitle } from '../hooks/usePageTitle'
import { useState } from 'react'
import { ScrollText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import PrintButton from '../components/ui/PrintButton'
import Layout from '../components/layout/Layout'
import Pagination from '../components/ui/Pagination'
import { PageLoader, EmptyState } from '../components/ui/Skeleton'
import activiteService from '../services/activiteService'

const BADGE = {
  'validé une inscription':  { cls: 'bg-trt-100 text-trt-700 border border-trt-200',     label: 'Validation'    },
  'refusé une inscription':  { cls: 'bg-red-50 text-red-700 border border-red-200',       label: 'Refus'          },
  'annulé une inscription':  { cls: 'bg-gray-100 text-gray-500 border border-gray-200',   label: 'Annulation'     },
  'créé une session':        { cls: 'bg-trt-100 text-trt-700 border border-trt-200',      label: 'Création'       },
  'modifié une session':     { cls: 'bg-amber-50 text-amber-800 border border-amber-200', label: 'Modification'   },
  'supprimé une session':    { cls: 'bg-red-50 text-red-700 border border-red-200',       label: 'Suppression'    },
  'ajouté un formateur':     { cls: 'bg-trt-100 text-trt-700 border border-trt-200',      label: 'Création'       },
  'modifié un formateur':    { cls: 'bg-amber-50 text-amber-800 border border-amber-200', label: 'Modification'   },
  'archivé un formateur':    { cls: 'bg-gray-100 text-gray-500 border border-gray-200',   label: 'Archivage'      },
  'ajouté un étudiant':      { cls: 'bg-trt-100 text-trt-700 border border-trt-200',      label: 'Création'       },
  'modifié un étudiant':     { cls: 'bg-amber-50 text-amber-800 border border-amber-200', label: 'Modification'   },
  'archivé un étudiant':     { cls: 'bg-gray-100 text-gray-500 border border-gray-200',   label: 'Archivage'      },
}

const ACTIONS = [
  'validé une inscription', 'refusé une inscription', 'annulé une inscription',
  'créé une session', 'modifié une session', 'supprimé une session',
  'ajouté un formateur', 'modifié un formateur', 'archivé un formateur',
  'ajouté un étudiant', 'modifié un étudiant', 'archivé un étudiant',
]

const MODELS = ['Inscription', 'Session', 'Formateur', 'Etudiant']

export default function Activites() {
  usePageTitle('Journal d\'activités')

  const [page, setPage]                 = useState(1)
  const [filtreAction, setFiltreAction] = useState('')
  const [filtreModel, setFiltreModel]   = useState('')

  const { data, isLoading: loading } = useQuery({
    queryKey: ['activites', page, filtreAction, filtreModel],
    queryFn:  () => activiteService.getAll({ page, action: filtreAction, model: filtreModel }),
    placeholderData: (prev) => prev,
  })

  const activites = data?.data ?? []
  const meta      = data?.total !== undefined ? data : null

  const badge = (action) => BADGE[action] ?? { cls: 'bg-trt-100 text-trt-700 border border-trt-200', label: action }

  const detailsText = (details) => {
    if (!details) return null
    return Object.entries(details)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k} : ${v}`)
      .join(' · ')
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Journal d'activités</h1>
          <p className="text-xs text-gray-400 mt-0.5">{meta?.total ?? activites.length} entrée{(meta?.total ?? activites.length) > 1 ? 's' : ''}</p>
        </div>
        <PrintButton />
      </div>

      <div className="flex gap-3 mb-5">
        <select value={filtreAction} onChange={(e) => { setFiltreAction(e.target.value); setPage(1) }}
          className="text-xs bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 min-w-[200px]">
          <option value="">Toutes les actions</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filtreModel} onChange={(e) => { setFiltreModel(e.target.value); setPage(1) }}
          className="text-xs bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500">
          <option value="">Tous les éléments</option>
          {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        {(filtreAction || filtreModel) && (
          <button onClick={() => { setFiltreAction(''); setFiltreModel(''); setPage(1) }}
            className="text-xs text-gray-400 hover:text-gray-600 px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            Réinitialiser
          </button>
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : activites.length === 0 ? (
        <EmptyState icon={ScrollText} title="Aucune activité enregistrée"
          description="Les actions des responsables apparaîtront ici" />
      ) : (
        <div className="overflow-x-auto rounded-lg"><div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-[580px]">
          <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-trt-500">
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[18%]">Date / Heure</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[16%]">Responsable</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[14%]">Type</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[20%]">Action</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[12%]">Élément</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[20%]">Détails</th>
              </tr>
            </thead>
            <tbody>
              {activites.map((a, idx) => {
                const b = badge(a.action)
                return (
                  <tr key={a.id} className={`border-t border-gray-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-[#F8F9FA]' : 'bg-white'}`}>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{a.created_at}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium truncate">{a.responsable}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${b.cls}`}>{b.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 truncate">{a.action}</td>
                    <td className="px-4 py-3 text-gray-400">{a.model}</td>
                    <td className="px-4 py-3 text-gray-400 truncate">{detailsText(a.details) ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div></div>
      )}

      <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
    </Layout>
  )
}
