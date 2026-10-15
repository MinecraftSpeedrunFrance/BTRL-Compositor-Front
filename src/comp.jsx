import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Composition from './Composition.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Composition />
    </StrictMode>,
)
