import { useEffect } from 'react'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | TRT Formations` : 'TRT Formations'
    return () => { document.title = 'TRT Formations' }
  }, [title])
}
