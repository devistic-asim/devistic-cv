import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from '@radix-ui/react-tooltip'
import { App } from './App'
import { Toaster } from './components/ui'
import './index.css'

import '@fontsource/source-sans-3/400.css'
import '@fontsource/source-sans-3/400-italic.css'
import '@fontsource/source-sans-3/600.css'
import '@fontsource/source-sans-3/700.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-serif-4/700.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/libre-baskerville/400.css'
import '@fontsource/libre-baskerville/700.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/700.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider delayDuration={300}>
      <App />
      <Toaster />
    </Provider>
  </StrictMode>,
)
