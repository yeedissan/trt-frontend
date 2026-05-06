import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function ChangerMotDePasse() {
  const { clearForceChange } = useAuth()
  const navigate             = useNavigate()

  const [form, setForm]           = useState({ nouveau: '', confirmer: '' })
  const [showNew, setShowNew]     = useState(false)
  const [showConf, setShowConf]   = useState(false)
  const [errors, setErrors]       = useState({})
  const [saving, setSaving]       = useState(false)

  const valider = () => {
    const e = {}
    if (!form.nouveau)                          e.nouveau   = 'Requis'
    else if (form.nouveau.length < 8)           e.nouveau   = 'Minimum 8 caractères'
    if (!form.confirmer)                        e.confirmer = 'Requis'
    else if (form.nouveau !== form.confirmer)   e.confirmer = 'Les mots de passe ne correspondent pas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!valider()) return
    setSaving(true)
    try {
      await api.post('/auth/changer-mdp-force', { nouveau_mot_de_passe: form.nouveau })
      toast.success('Mot de passe mis à jour avec succès')
      clearForceChange()
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        {/* Icône */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-trt-100 rounded-lg flex items-center justify-center">
            <KeyRound size={24} className="text-trt-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 p-7 shadow-sm">
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Changement de mot de passe</h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              Votre mot de passe a été réinitialisé par l'administrateur. Vous devez définir un nouveau mot de passe personnel avant de continuer.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-md px-3 py-2.5 mb-5 flex items-start gap-2">
            <ShieldCheck size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">Choisissez un mot de passe sécurisé d'au moins 8 caractères que vous n'avez jamais utilisé.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nouveau mot de passe *</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={form.nouveau}
                  onChange={(e) => { setForm({ ...form, nouveau: e.target.value }); setErrors({ ...errors, nouveau: '' }) }}
                  placeholder="Minimum 8 caractères"
                  className={`w-full text-xs border rounded-md px-3 py-2.5 pr-9 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.nouveau ? 'border-red-300' : 'border-gray-200'}`}
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {errors.nouveau && <p className="text-red-500 text-xs mt-1">{errors.nouveau}</p>}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Confirmer le mot de passe *</label>
              <div className="relative">
                <input
                  type={showConf ? 'text' : 'password'}
                  value={form.confirmer}
                  onChange={(e) => { setForm({ ...form, confirmer: e.target.value }); setErrors({ ...errors, confirmer: '' }) }}
                  placeholder="Répéter le mot de passe"
                  className={`w-full text-xs border rounded-md px-3 py-2.5 pr-9 focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 ${errors.confirmer ? 'border-red-300' : 'border-gray-200'}`}
                />
                <button type="button" onClick={() => setShowConf(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  {showConf ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {errors.confirmer && <p className="text-red-500 text-xs mt-1">{errors.confirmer}</p>}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full text-xs bg-trt-500 hover:bg-trt-700 text-white rounded-md py-2.5 font-medium transition-colors disabled:opacity-60 mt-2"
            >
              {saving ? 'Enregistrement...' : 'Définir mon mot de passe'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
