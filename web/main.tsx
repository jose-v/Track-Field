import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './src/index.css'
import './src/styles/button-overrides.css'
import { RootProviders } from './src/app/RootProviders'
import App from './src/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootProviders>
      <App />
    </RootProviders>
  </StrictMode>,
)
