import { usePageTitle } from '../hooks/usePageTitle'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Users, Pencil, Trash2, Eye, EyeOff, ShieldCheck, User, KeyRound } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import { PageLoader, EmptyState } from '../components/ui/Skeleton'
import utilisateurService from '../services/utilisateurService'

const ROLE_BADGE = {
  responsable: { cls: 'bg-trt-100 text-trt-700 border border-trt-200',     label: 'Responsable'  },
  dg:          { cls: 'bg-amber-50 text-amber-800 border border-amber-200', label: 'Dir. Général' },
}

const initForm = { nom: '', prenom: '', email: '', login: '', mot_de_passe: '', telephone: '', role: 'responsable' }

export default function GestionUtilisateurs() {
  usePageTitle('Gestion des utilisateurs')
  const queryClient = useQueryClient()

  const [showModal, setShowModal]       = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [form, setForm]                 = useState(initForm)
  const [errors, setErrors]             = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [confirmDelete, setConfirmDelete]   = useState(null)
  const [resetTarget, setResetTarget]       = useState(null)
  const [resetPwd, setResetPwd]             = useState('')
  const [showResetPwd, setShowResetPwd]     = useState(false)
  const [resetError, setResetError]         = useState('')

  // ─── Query ───────────────────────────────────────────────────────────────
  const { data: utilisateurs = [], isLoading: loading } = useQuery({
    queryKey: ['utilisateurs'],
    queryFn:  () => utilisateurService.getAll(),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['utilisateurs'] })

  // ─── Mutations ───────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (d) => utilisateurService.create(d),
    onSuccess: () => { toast.success('Utilisateur créé'); setShowModal(false); invalidate() },
    onError: (err) => {
      const validationErrors = err.response?.data?.errors
      if (validationErrors) {
        const mapped = {}
        Object.entries(validationErrors).forEach(([k, v]) => { mapped[k] = v[0] })
        setErrors(mapped)
      } else toast.error(err.response?.data?.message ?? 'Une erreur est survenue')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => utilisateurService.update(id, d),
    onSuccess: () => { toast.success('Utilisateur modifié'); setShowModal(false); invalidate() },
    onError: (err) => {
      const validationErrors = err.response?.data?.errors
      if (validationErrors) {
        const mapped = {}
        Object.entries(validationErrors).forEach(([k, v]) => { mapped[k] = v[0] })
        setErrors(mapped)
      } else toast.error(err.response?.data?.message ?? 'Une erreur est survenue')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => utilisateurService.destroy(id),
    onSuccess: () => { toast.success('Utilisateur supprimé'); setConfirmDelete(null); invalidate() },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const resetMutation = useMutation({
    mutationFn: ({ id, pwd }) => utilisateurService.resetPassword(id, pwd),
    onSuccess: () => {
      toast.success(`Mot de passe réinitialisé pour ${resetTarget.prenom} ${resetTarget.nom}`)
      setResetTarget(null)
    },
    onError: () => toast.error('Erreur lors de la réinitialisation'),
  })

  // ─── Handlers ────────────────────────────────────────────────────────────
  const ouvrirCreation = () => {
    setEditTarget(null); setForm(initForm); setErrors({}); setShowPassword(false); setShowModal(true)
  }

  const ouvrirEdition = (u) => {
    setEditTarget(u)
    setForm({ nom: u.nom, prenom: u.prenom, email: u.email, login: u.login, mot_de_passe: '', telephone: u.telephone ?? '', role: u.role })
    setErrors({}); setShowPassword(false); setShowModal(true)
  }

  const validerForm = () => {
    const err = {}
    if (!form.nom.trim())    err.nom    = 'Requis'
    if (!form.prenom.trim()) err.prenom = 'Requis'
    if (!form.email.trim())  err.email  = 'Requis'
    if (!form.login.trim())  err.login  = 'Requis'
    if (!editTarget && !form.mot_de_passe) err.mot_de_passe = 'Requis pour la création'
    if (form.mot_de_passe && form.mot_de_passe.length < 8) err.mot_de_passe = 'Minimum 8 caractères'
    return err
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const err = validerForm()
    if (Object.keys(err).length) { setErrors(err); return }
    if (editTarget) updateMutation.mutate({ id: editTarget.id, d: form })
    else createMutation.mutate(form)
  }

  const ouvrirReset = (u) => { setResetTarget(u); setResetPwd(''); setResetError(''); setShowResetPwd(false) }

  const handleReset = () => {
    if (!resetPwd) { setResetError('Requis'); return }
    if (resetPwd.length < 8) { setResetError('Minimum 8 caractères'); return }
    resetMutation.mutate({ id: resetTarget.id, pwd: resetPwd })
  }

  const saving = createMutation.isPending || updateMutation.isPending
  const field  = (key) => ({
    value: form[key],
    onChange: (e) => { setForm({ ...form, [key]: e.target.value }); setErrors({ ...errors, [key]: '' }) },
  })

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {utilisateurs.length} utilisateur{utilisateurs.length > 1 ? 's' : ''} actif{utilisateurs.length > 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={ouvrirCreation}
          className="flex items-center gap-2 bg-trt-500 hover:bg-trt-700 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors">
          <Plus size={13} /> Nouvel utilisateur
        </button>
      </div>

      {loading ? <PageLoader /> : utilisateurs.length === 0 ? (
        <EmptyState icon={Users} title="Aucun utilisateur"
          description="Créez le premier responsable ou directeur général"
          actionLabel="+ Nouvel utilisateur" onAction={ouvrirCreation} />
      ) : (
        <div className="overflow-x-auto rounded-lg"><div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-[560px]">
          <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-trt-500">
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[22%]">Nom</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[22%]">Email</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[14%]">Login</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[16%]">Téléphone</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[13%]">Rôle</th>
                <th className="text-left px-4 py-3 text-white/90 font-medium w-[13%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u, idx) => {
                const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.responsable
                return (
                  <tr key={u.id} className={`border-t border-gray-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-[#F8F9FA]' : 'bg-white'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-medium ${u.role === 'dg' ? 'bg-amber-100 text-amber-700' : 'bg-trt-100 text-trt-600'}`}>
                          {u.prenom?.[0]}{u.nom?.[0]}
                        </div>
                        <span className="font-medium text-gray-800 truncate">{u.prenom} {u.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate">{u.email}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono">{u.login}</td>
                    <td className="px-4 py-3 text-gray-400">{u.telephone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => ouvrirEdition(u)} title="Modifier" className="text-gray-400 hover:text-trt-600 transition-colors p-1"><Pencil size={12} /></button>
                        <button onClick={() => ouvrirReset(u)} title="Réinitialiser le mot de passe" className="text-gray-400 hover:text-amber-600 transition-colors p-1"><KeyRound size={12} /></button>
                        <button onClick={() => setConfirmDelete(u)} title="Supprimer" className="text-gray-400 hover:text-red-600 transition-colors p-1"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div></div>
      )}

      {/* Modal créer / modifier */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">{editTarget ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Prénom *</label>
                    <input type="text" {...field('prenom')} placeholder="Koffi"
                      className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.prenom ? 'border-red-300' : 'border-gray-200'}`} />
                    {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Nom *</label>
                    <input type="text" {...field('nom')} placeholder="Agbeko"
                      className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.nom ? 'border-red-300' : 'border-gray-200'}`} />
                    {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Email *</label>
                  <input type="email" {...field('email')} placeholder="k.agbeko@trt.tg"
                    className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.email ? 'border-red-300' : 'border-gray-200'}`} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Identifiant (login) *</label>
                    <input type="text" {...field('login')} placeholder="k.agbeko"
                      className={`w-full text-xs border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.login ? 'border-red-300' : 'border-gray-200'}`} />
                    {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Téléphone</label>
                    <input type="text" {...field('telephone')} placeholder="+228 90 00 00 00"
                      className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Rôle *</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'responsable', label: 'Responsable',     icon: User       },
                      { value: 'dg',          label: 'Directeur Général', icon: ShieldCheck },
                    ].map(({ value, label, icon: Icon }) => (
                      <button type="button" key={value}
                        onClick={() => setForm({ ...form, role: value })}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border text-xs font-medium transition-all ${form.role === value ? 'border-trt-500 bg-trt-50 text-trt-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Mot de passe {editTarget ? '(laisser vide pour ne pas changer)' : '*'}
                  </label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} {...field('mot_de_passe')}
                      placeholder={editTarget ? '••••••••' : 'Minimum 8 caractères'}
                      className={`w-full text-xs border rounded-md px-3 py-2.5 pr-9 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.mot_de_passe ? 'border-red-300' : 'border-gray-200'}`} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  {errors.mot_de_passe && <p className="text-red-500 text-xs mt-1">{errors.mot_de_passe}</p>}
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 text-xs border border-gray-200 rounded-md py-2.5 text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 text-xs bg-trt-500 hover:bg-trt-700 text-white rounded-md py-2.5 font-medium transition-colors disabled:opacity-60">
                    {saving ? 'Enregistrement...' : (editTarget ? 'Modifier' : 'Créer')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal réinitialisation mot de passe */}
      <AnimatePresence>
        {resetTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 w-full max-w-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <KeyRound size={15} className="text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Réinitialiser le mot de passe</h2>
                    <p className="text-xs text-gray-400">{resetTarget.prenom} {resetTarget.nom}</p>
                  </div>
                </div>
                <button onClick={() => setResetTarget(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5">
                  <p className="text-xs text-amber-700">L'utilisateur sera déconnecté et devra changer ce mot de passe temporaire à sa prochaine connexion.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Mot de passe temporaire *</label>
                  <div className="relative">
                    <input type={showResetPwd ? 'text' : 'password'} value={resetPwd}
                      onChange={(e) => { setResetPwd(e.target.value); setResetError('') }}
                      placeholder="Minimum 8 caractères"
                      className={`w-full text-xs border rounded-md px-3 py-2.5 pr-9 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${resetError ? 'border-red-300' : 'border-gray-200'}`} />
                    <button type="button" onClick={() => setShowResetPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                      {showResetPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  {resetError && <p className="text-red-500 text-xs mt-1">{resetError}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setResetTarget(null)}
                    className="flex-1 text-xs border border-gray-200 rounded-md py-2.5 text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button onClick={handleReset} disabled={resetMutation.isPending}
                    className="flex-1 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-md py-2.5 font-medium transition-colors disabled:opacity-60">
                    {resetMutation.isPending ? 'Réinitialisation...' : 'Réinitialiser'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal confirmation suppression */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 w-full max-w-sm overflow-hidden">
              <div className="px-6 pt-6 pb-5">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4"><Trash2 size={18} className="text-red-500" /></div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Supprimer l'utilisateur</h2>
                <p className="text-xs text-gray-500 mb-5">Voulez-vous supprimer <strong>{confirmDelete.prenom} {confirmDelete.nom}</strong> ? Cette action est irréversible.</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(null)}
                    className="flex-1 text-xs border border-gray-200 rounded-md py-2.5 text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button onClick={() => deleteMutation.mutate(confirmDelete.id)} disabled={deleteMutation.isPending}
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
