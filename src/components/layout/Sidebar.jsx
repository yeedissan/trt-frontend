import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, ClipboardList,
  UserCheck, BarChart2, BookOpen, Users,
  GraduationCap, LogOut, Settings, Clock, ScrollText, ShieldCheck, X, CalendarRange
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import logoTRT from '../../assets/TRT.jpeg'

const navItemsResponsable = [
  { path: '/',             label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/sessions',     label: 'Sessions',         icon: CalendarDays    },
  { path: '/seances',      label: 'Séances',          icon: Clock           },
  { path: '/inscriptions', label: 'Inscriptions',     icon: ClipboardList   },
  { path: '/presences',    label: 'Présences',        icon: UserCheck       },
  { path: '/evaluations',  label: 'Évaluations',      icon: BarChart2       },
  { path: '/formations',   label: 'Formations',       icon: BookOpen        },
  { path: '/formateurs',   label: 'Formateurs',       icon: Users           },
  { path: '/etudiants',    label: 'Étudiants',        icon: GraduationCap   },
  { path: '/annees',       label: 'Années',           icon: CalendarRange   },
]

const navItemsDG = [
  { path: '/',           label: 'Tableau de bord',      icon: LayoutDashboard },
  { path: '/activites',  label: 'Journal d\'activités', icon: ScrollText      },
]

const navItemsSuperAdmin = [
  { path: '/',             label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/utilisateurs', label: 'Utilisateurs',    icon: ShieldCheck     },
]

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const { responsable, logout, isDG, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const navItems = isSuperAdmin() ? navItemsSuperAdmin : isDG() ? navItemsDG : navItemsResponsable

  const initiales = responsable?.nom
    ? `${responsable.prenom?.[0] ?? ''}${responsable.nom?.[0] ?? ''}`.toUpperCase()
    : 'RX'

  const handleLogout = () => { logout(); navigate('/login') }

  const roleLabel = isSuperAdmin()
    ? 'Super Administrateur'
    : isDG()
      ? 'Direction Générale'
      : 'Responsable'

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-40
      w-56 min-h-screen bg-trt-900 flex flex-col flex-shrink-0
      transition-transform duration-300 ease-in-out
      ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>

      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <img src={logoTRT} alt="Logo TRT"
            className="w-9 h-9 rounded-md object-cover flex-shrink-0 bg-white p-0.5" />
          <div>
            <p className="text-white text-sm font-semibold leading-tight">TRT</p>
            <p className="text-white/40 text-xs mt-0.5">Formations</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === '/'} onClick={onClose}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-trt-500 text-white'
                  : 'text-white/55 hover:bg-white/5 hover:text-white/90'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-sm" />
                )}
                <Icon size={14} className="flex-shrink-0" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profil + Déconnexion */}
      <div className="px-3 py-4 border-t border-white/8">
        {/* Responsable → lien profil */}
        {!isDG() && !isSuperAdmin() && (
          <NavLink to="/profil"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2 py-2 rounded-md mb-2 transition-all ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              }`
            }
          >
            <div className="w-8 h-8 rounded-full bg-trt-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{initiales}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">
                {responsable?.prenom} {responsable?.nom}
              </p>
              <p className="text-white/40 text-xs">Mon profil</p>
            </div>
            <Settings size={11} className="text-white/25 flex-shrink-0" />
          </NavLink>
        )}

        {/* DG */}
        {isDG() && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#BA7517] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{initiales}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">
                {responsable?.prenom} {responsable?.nom}
              </p>
              <p className="text-amber-400/80 text-xs">Directeur Général</p>
            </div>
          </div>
        )}

        {/* Super Admin */}
        {isSuperAdmin() && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-trt-500 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={13} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">
                {responsable?.prenom} {responsable?.nom}
              </p>
              <p className="text-trt-300 text-xs">Super Admin</p>
            </div>
          </div>
        )}

        <button onClick={() => setConfirmLogout(true)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs text-white/40 hover:text-white/80 hover:bg-white/5 transition-all">
          <LogOut size={13} />
          Se déconnecter
        </button>
      </div>

      {/* Modal confirmation déconnexion */}
      <AnimatePresence>
        {confirmLogout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.18 }}
              className="bg-white rounded-xl border border-gray-200 w-full max-w-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Se déconnecter</h2>
                <button onClick={() => setConfirmLogout(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={15} />
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs text-gray-500 mb-4">Êtes-vous sûr de vouloir quitter votre session ?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmLogout(false)}
                    className="flex-1 text-xs border border-gray-200 rounded-md py-2 text-gray-500 hover:bg-gray-50 transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleLogout}
                    className="flex-1 text-xs bg-trt-500 hover:bg-trt-700 text-white rounded-md py-2 font-medium transition-colors">
                    Se déconnecter
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}
