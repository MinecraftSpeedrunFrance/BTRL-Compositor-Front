import { useCallback, useEffect, useRef, useState } from "react"
import { POVWrapper } from "./components/POV"
import './Composition.css'
import { getGridColumns, getGridRows } from "./utils"

const STREAM_SETTLE_TIME = 3500

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export default function Composition() {
    const [composition, setComposition] = useState([])
    const [compositionErr, setCompositionErr] = useState(null)
    const mounted = useRef(true)

    function handlePreloadReady(preload) {
        if (preload.ready ) return

        finishPreload({
            ...preload,
            ready: true
        })
    }

    async function finishPreload(preload) {
        await wait(STREAM_SETTLE_TIME)
        if (!mounted.current) {
            return
        }

        if (preload.type === 'replace') {
            setComposition(current => {
                for (let i = 0; i < current.length; i++) {
                    if (current[i].phase !== 'preload' || current[i].type !== 'replace') continue
                    if (current[i].new.uuid === preload.new.uuid && current[i].old.uuid === preload.old.uuid) {
                        current[i] = { pov: current[i].new, phase: 'ready', id: current[i].id }
                        break
                    }
                }
                return [...current]
            })
        } else {
            setComposition(current => {
                for (let i = 0; i < current.length; i++) {
                    if (current[i].phase === 'preload' && current[i].type === 'add' && current[i].pov.uuid === preload.pov.uuid) {
                        current[i] = { ...current[i], phase: 'ready' }
                        break
                    }
                }
                return [...current]
            })
        }
    }

    function removePov(uuid) {
        setComposition(current =>
            current.filter(state => state.phase !== 'ready' || state.pov.uuid !== uuid)
        )
    }

    const handleChanges = useCallback((changes) => {
        // todo: shortcut preloads if a new modification comes in before the previous one has finished preloading

        for (const change of changes) {
            change.phase = 'preload'
            if (change.type === 'replace') {
                setComposition(current => {
                    change.id = current.find(state => state.phase === 'ready' && state.pov.uuid === change.old.uuid).id
                    return [...current.filter(state => state.phase !== 'ready' || state.pov.uuid !== change.old.uuid), change]
                })
            } else if (change.type === 'add') {
                change.id = `${change.pov.uuid}-${Date.now()}`
                setComposition(current => [...current, change])
            } else if (change.type === 'remove') {
                removePov(change.pov.uuid)
            }
        }
    }, [])

    useEffect(() => {
        mounted.current = true

        fetch(`${import.meta.env.VITE_API_URL}/composition`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to load composition (${res.status})`)
                }

                return res.json()
            })
            .then(comp => {
                setComposition(comp.map(item => ({
                    phase: 'ready',
                    pov: item,
                    id: `${item.uuid}-${Date.now()}`,
                })))
            })
            .catch(setCompositionErr)

        const socket = io(`${import.meta.env.VITE_SOCKET_URL}`)

        socket.on('compositionChanged', handleChanges)
        socket.on('statsChanged', changes => {
            setComposition(current => {
                for (const change of changes) {
                    for (let i = 0; i < current.length; i++) {
                        if (current[i].phase !== 'ready' || current[i].pov.uuid !== change.uuid) continue

                        current[i] = { ...current[i], pov: { ...current[i].pov, ...change } }
                        if (change.items === 'clear') {
                            current[i].pov.items = {}
                        }
                        break
                    }
                }
                return [...current]
            })
        })

        return () => {
            mounted.current = false
            socket.disconnect()
        }
    }, [handleChanges])

    if (compositionErr) {
        return <main>Error: {compositionErr.message}</main>
    }

    return <>
        <main
            style={{
                '--grid-rows': getGridRows(composition.length),
                '--grid-columns': getGridColumns(composition.length)
            }}
        >{composition.sort((a, b) => a.id.localeCompare(b.id)).map(item => {
            const isPreloading = item.phase === 'preload'
            return <POVWrapper state={item} key={item.id} onReady={isPreloading ? _ => handlePreloadReady(item) : _ => {}}/>
        })}
        </main>
    </>
}
