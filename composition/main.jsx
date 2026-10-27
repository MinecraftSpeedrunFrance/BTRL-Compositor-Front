import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/index.css'
import Composition from '../src/Composition.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Composition />
    </StrictMode>,
)
