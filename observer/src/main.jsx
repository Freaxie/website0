import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/global.css'
import './styles/hud.css'
import './styles/sections.css'
import App from './App.jsx'
import { installPointer } from './lib/pointer.js'

installPointer()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
