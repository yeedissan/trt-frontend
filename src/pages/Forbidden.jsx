import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Home, ShieldOff } from 'lucide-react'

export default function Forbidden() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-sm"
      >
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <ShieldOff size={36} className="text-red-400" />
        </div>

        <h1 className="text-6xl font-medium text-gray-900 mb-2">403</h1>
        <p className="text-base font-medium text-gray-600 mb-2">Accès refusé</p>
        <p className="text-sm text-gray-400 mb-8">
          Vous n'avez pas les droits nécessaires pour accéder à cette page.
        </p>

        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 bg-trt-500 hover:bg-trt-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
        >
          <Home size={15} />
          Retour au tableau de bord
        </motion.button>
      </motion.div>
    </div>
  )
}
