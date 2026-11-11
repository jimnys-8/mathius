import { useEffect, useState } from 'react'
import { loadStore, saveStore } from './store.js'

function browserStorage() {
  try {
    return window.localStorage
  } catch {
    // Accessing localStorage can throw when site data is blocked.
    return undefined
  }
}

/** The app's persistent store, saved to localStorage on every change. */
export function useStore() {
  const [store, setStore] = useState(() => loadStore(browserStorage()))

  useEffect(() => {
    saveStore(browserStorage(), store)
  }, [store])

  return [store, setStore]
}
