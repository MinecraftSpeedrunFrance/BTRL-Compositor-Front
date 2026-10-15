import { useEffect, useState } from "react"
import POV from "./components/POV"
import './Composition.css'
import { getGridColumns, getGridRows } from "./utils"


export default function Composition() {
    const [composition, setComposition] = useState([])
    const [compositionErr, setCompositionErr] = useState(null)

    useEffect(() => {
        fetch('http://localhost:3000/composition')
            .then(res => res.json())
            .then(data => {
                setComposition(data)
            })
            .catch(err => {
                setCompositionErr(err)
            })
        const socket = io('ws://localhost:3000')
        socket.on('compositionChanged', (changes) => {
            console.log(changes)
        })
        return () => {
            socket.disconnect()
        }
    }, [])

    if (compositionErr) {
        return <main>Error: {compositionErr.message}</main>
    }

    return <main style={{
        '--grid-rows': getGridRows(composition.length),
        '--grid-columns': getGridColumns(composition.length)
    }}>{composition.length > 0 && !compositionErr && composition.map(pov => 
        <POV pov={pov} key={pov.uuid} />
    )}</main>
}
