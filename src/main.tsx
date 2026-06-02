import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { initSentry } from './lib/sentry'
import App from './App.tsx'

// Initialize Sentry error tracking (only activates if VITE_SENTRY_DSN is set)
initSentry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
