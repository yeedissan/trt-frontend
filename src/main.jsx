import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster, toast } from 'react-hot-toast'
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import 'react-international-phone/style.css'
import App from './App'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Silencieux pour le polling notifications
      if (query.queryKey[0] === 'notifications') return
      const status = error?.response?.status
      // 401/403 gérés par l'intercepteur axios
      if (status === 401 || status === 403) return
      if (status >= 500) toast.error('Erreur serveur — réessayez dans un instant')
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
    </QueryClientProvider>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          fontSize: '13px',
          borderRadius: '12px',
          border: '0.5px solid #e5e7eb',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
        success: {
          iconTheme: { primary: '#534AB7', secondary: '#fff' },
        },
      }}
    />
  </React.StrictMode>
)