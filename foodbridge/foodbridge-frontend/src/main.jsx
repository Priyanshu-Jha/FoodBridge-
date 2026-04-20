import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './polyfills'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
