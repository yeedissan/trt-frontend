import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Home, RefreshCw, ServerCrash } from 'lucide-react'

export default function ServerError() {
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
          <ServerCrash size={36} className="text-red-400" />
        </div>

        <h1 className="text-6xl font-medium text-gray-900 mb-2">500</h1>
        <p className="text-base font-medium text-gray-600 mb-2">Erreur serveur</p>
        <p className="text-sm text-gray-400 mb-8">
          Une erreur inattendue s'est produite. L'équipe technique a été notifiée.
        </p>

        <div className="flex gap-3 justify-center">
          <motion.button
            onClick={() => window.location.reload()}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            <RefreshCw size={14} />
            Réessayer
          </motion.button>

          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 bg-trt-500 hover:bg-trt-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            <Home size={14} />
            Accueil
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
