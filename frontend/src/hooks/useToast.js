import { useState, useCallback } from 'react'

let toastIdCounter = 0
let toastListeners = []

export function toast({ title, description, variant = 'default', duration = 4000 }) {
  const id = ++toastIdCounter
  const newToast = { id, title, description, variant, duration }
  toastListeners.forEach((listener) => listener(newToast))
}

export function useToastState() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((newToast) => {
    setToasts((prev) => [...prev, newToast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
    }, newToast.duration)
  }, [])

  // Register listener
  if (!toastListeners.includes(addToast)) {
    toastListeners.push(addToast)
  }

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, dismiss }
}
