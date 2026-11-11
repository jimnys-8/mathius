import { Suspense, lazy } from 'react'
import App from './App.jsx'

const Gallery = lazy(() => import('./dev/Gallery.jsx'))

/** Shows the visualization gallery for ?gallery in development, otherwise the app. */
export default function Root() {
  const showGallery = import.meta.env.DEV && new URLSearchParams(window.location.search).has('gallery')
  if (showGallery) {
    return (
      <Suspense>
        <Gallery />
      </Suspense>
    )
  }
  return <App />
}
