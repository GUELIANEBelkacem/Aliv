import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@aliv/ui/tokens.css'
import '@aliv/ui/accents.css'
import '@aliv/ui/shell.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
