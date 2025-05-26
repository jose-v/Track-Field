import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RootProviders } from './app/RootProviders'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootProviders>
      <App />
    </RootProviders>
  </StrictMode>,
)
