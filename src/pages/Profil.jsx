import { usePageTitle } from '../hooks/usePageTitle'
import { useState } from 'react'
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { PhoneInput } from 'react-international-phone'

export default function Profil() {
  usePageTitle('Mon profil')
  const { responsable, login } = useAuth()

  const [formProfil, setFormProfil] = useState({
    nom:       responsable?.nom       ?? '',
    prenom:    responsable?.prenom    ?? '',
    email:     responsable?.email     ?? '',
    telephone: responsable?.telephone ?? '',
  })
  const [formMdp, setFormMdp] = useState({
    ancien_mdp:   '',
    nouveau_mdp:  '',
    confirmation: '',
  })

  const [showMdp, setShowMdp]           = useState(false)
  const [savingProfil, setSavingProfil] = useState(false)
  const [savingMdp, setSavingMdp]       = useState(false)
  const [errorsMdp, setErrorsMdp]       = useState({})

  const handleSaveProfil = async (e) => {
    e.preventDefault()
    setSavingProfil(true)
    try {
      const { data } = await api.put('/auth/profil', formProfil)
      login({ ...responsable, ...data })
      toast.success('Profil mis à jour')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la mise à jour')
    } finally {
      setSavingProfil(false)
    }
  }

  const validerMdp = () => {
    const e = {}
    if (!formMdp.ancien_mdp)   e.ancien_mdp   = 'Requis'
    if (!formMdp.nouveau_mdp)  e.nouveau_mdp  = 'Requis'
    else if (formMdp.nouveau_mdp.length < 8)
      e.nouveau_mdp = 'Minimum 8 caractères'
    if (!formMdp.confirmation) e.confirmation = 'Requis'
    else if (formMdp.nouveau_mdp !== formMdp.confirmation)
      e.confirmation = 'Les mots de passe ne correspondent pas'
    setErrorsMdp(e)
    return Object.keys(e).length === 0
  }

  const handleSaveMdp = async (e) => {
    e.preventDefault()
    if (!validerMdp()) return
    setSavingMdp(true)
    try {
      await api.put('/auth/mot-de-passe', {
        ancien_mot_de_passe: formMdp.ancien_mdp,
        nouveau_mot_de_passe: formMdp.nouveau_mdp,
      })
      toast.success('Mot de passe modifié avec succès')
      setFormMdp({ ancien_mdp: '', nouveau_mdp: '', confirmation: '' })
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Ancien mot de passe incorrect'
      toast.error(msg)
    } finally {
      setSavingMdp(false)
    }
  }

  const initiales = responsable?.nom
    ? `${responsable.prenom?.[0] ?? ''}${responsable.nom?.[0] ?? ''}`.toUpperCase()
    : 'RX'

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Mon profil</h1>
        <p className="text-xs text-gray-400 mt-0.5">Gérez vos informations personnelles</p>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* Colonne gauche — Avatar */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-lg bg-trt-500 flex items-center justify-center mb-4">
            <span className="text-white text-xl font-medium">{initiales}</span>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {responsable?.prenom} {responsable?.nom}
          </p>
          <p className="text-xs text-gray-400 mt-1">Responsable TRT</p>
          <div className="mt-4 w-full border-t border-gray-100 pt-4 space-y-2 text-left">
            <div className="flex items-center gap-2">
              <User size={12} className="text-gray-300" />
              <span className="text-xs text-gray-500 truncate">{responsable?.login ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock size={12} className="text-gray-300" />
              <span className="text-xs text-gray-400">••••••••</span>
            </div>
          </div>
        </div>

        {/* Colonne droite — Formulaires */}
        <div className="col-span-2 space-y-4">

          {/* Informations personnelles */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <User size={14} className="text-trt-500" />
              <h2 className="text-sm font-medium text-gray-900">Informations personnelles</h2>
            </div>
            <form onSubmit={handleSaveProfil} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Prénom</label>
                  <input type="text" value={formProfil.prenom}
                    onChange={(e) => setFormProfil({ ...formProfil, prenom: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Nom</label>
                  <input type="text" value={formProfil.nom}
                    onChange={(e) => setFormProfil({ ...formProfil, nom: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={formProfil.email}
                  onChange={(e) => setFormProfil({ ...formProfil, email: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Téléphone</label>
                <PhoneInput
                  defaultCountry="tg"
                  value={formProfil.telephone}
                  onChange={(phone) => setFormProfil({ ...formProfil, telephone: phone })}
                  style={{
                    '--react-international-phone-border-radius': '6px',
                    '--react-international-phone-border-color': '#e5e7eb',
                    '--react-international-phone-height': '36px',
                    '--react-international-phone-font-size': '12px',
                    width: '100%',
                  }}
                />
              </div>
              <div className="flex justify-end pt-1">
                <button type="submit" disabled={savingProfil}
                  className="flex items-center gap-2 bg-trt-500 hover:bg-trt-700 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-60">
                  <Save size={13} />
                  {savingProfil ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>

          {/* Changer le mot de passe */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lock size={14} className="text-trt-500" />
              <h2 className="text-sm font-medium text-gray-900">Changer le mot de passe</h2>
            </div>
            <form onSubmit={handleSaveMdp} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Ancien mot de passe *</label>
                <div className="relative">
                  <input type={showMdp ? 'text' : 'password'} value={formMdp.ancien_mdp}
                    onChange={(e) => { setFormMdp({ ...formMdp, ancien_mdp: e.target.value }); setErrorsMdp({ ...errorsMdp, ancien_mdp: '' }) }}
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 pr-9 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500" />
                  <button type="button" onClick={() => setShowMdp(!showMdp)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                    {showMdp ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {errorsMdp.ancien_mdp && <p className="text-red-500 text-xs mt-1">{errorsMdp.ancien_mdp}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Nouveau mot de passe *</label>
                  <input type={showMdp ? 'text' : 'password'} value={formMdp.nouveau_mdp}
                    onChange={(e) => { setFormMdp({ ...formMdp, nouveau_mdp: e.target.value }); setErrorsMdp({ ...errorsMdp, nouveau_mdp: '' }) }}
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500" />
                  {errorsMdp.nouveau_mdp && <p className="text-red-500 text-xs mt-1">{errorsMdp.nouveau_mdp}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirmation *</label>
                  <input type={showMdp ? 'text' : 'password'} value={formMdp.confirmation}
                    onChange={(e) => { setFormMdp({ ...formMdp, confirmation: e.target.value }); setErrorsMdp({ ...errorsMdp, confirmation: '' }) }}
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500" />
                  {errorsMdp.confirmation && <p className="text-red-500 text-xs mt-1">{errorsMdp.confirmation}</p>}
                </div>
              </div>

              {/* Indicateur force mot de passe */}
              {formMdp.nouveau_mdp && (
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
                        formMdp.nouveau_mdp.length >= i * 2
                          ? i <= 1 ? 'bg-red-400'
                          : i <= 2 ? 'bg-amber-400'
                          : i <= 3 ? 'bg-trt-400'
                          : 'bg-green-500'
                          : 'bg-gray-100'
                      }`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {formMdp.nouveau_mdp.length < 4 ? 'Très faible'
                      : formMdp.nouveau_mdp.length < 6 ? 'Faible'
                      : formMdp.nouveau_mdp.length < 8 ? 'Moyen'
                      : 'Fort'}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button type="submit" disabled={savingMdp}
                  className="flex items-center gap-2 bg-trt-500 hover:bg-trt-700 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-60">
                  <Lock size={13} />
                  {savingMdp ? 'Modification...' : 'Changer le mot de passe'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </Layout>
  )
}
