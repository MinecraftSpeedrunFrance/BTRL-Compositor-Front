import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Compositor from './Compositor.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Compositor />
    </StrictMode>,
)
