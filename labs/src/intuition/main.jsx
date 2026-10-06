import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@shared/styles/fonts.css'
import '@shared/styles/base.css'
import '@shared/styles/hud.css'
import './styles/opening.css'
import './styles/sections.css'
import App from './App.jsx'
import { installPointer } from '@shared/lib/pointer.js'

installPointer()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
