import { useEffect } from 'react'

export const usePageClass = (className: string) => {
  useEffect(() => {
    document.body.classList.add(className)
    return () => {
      document.body.classList.remove(className)
    }
  }, [className])
}

export default usePageClass 