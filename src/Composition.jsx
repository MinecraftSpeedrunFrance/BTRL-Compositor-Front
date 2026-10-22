import { useCallback, useEffect, useState } from "react"
import POV from "./components/POV"
import './Composition.css'
import { getGridColumns, getGridRows } from "./utils"

const STREAM_SETTLE_TIME = 1000

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export default function Composition() {
    const [composition, setComposition] = useState([])
    const [preloading, setPreloading] = useState([])
    const [compositionErr, setCompositionErr] = useState(null)

    const handleChanges = useCallback((changes) => {
        for (const change of changes) {
            if (change.type === 'replace') {
                preloadReplacement(change)
            } else if (change.type === 'add') {
                preloadAddition(change.pov)
            } else if (change.type === 'remove') {
                removePov(change.pov.uuid)
            }
        }
    }, [])

    useEffect(() => {
        fetch('http://localhost:3000/composition')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to load composition (${res.status})`)
                }

                return res.json()
            })
            .then(setComposition)
            .catch(setCompositionErr)

        const socket = io('http://localhost:3000')

        socket.on('compositionChanged', handleChanges)

        return () => {
            socket.disconnect()
        }
    }, [handleChanges])

    function preloadReplacement(change) {
        const preloadId = `${change.new.uuid}-${Date.now()}`

        setPreloading(current => [
            ...current,
            {
                id: preloadId,
                pov: change.new,
                mode: 'replace',
                oldUuid: change.old.uuid,
                ready: false
            }
        ])
    }

    function preloadAddition(pov) {
        const preloadId = `${pov.uuid}-${Date.now()}`

        setPreloading(current => [
            ...current,
            {
                id: preloadId,
                pov,
                mode: 'add',
                ready: false
            }
        ])
    }

    function handlePreloadReady(preload) {
        if (preload.ready) {
            return
        }

        setPreloading(current =>
            current.map(item =>
                item.id === preload.id
                    ? { ...item, ready: true }
                    : item
            )
        )

        finishPreload({
            ...preload,
            ready: true
        })
    }

    async function finishPreload(preload) {
        await wait(STREAM_SETTLE_TIME)

        setComposition(current => {
            if (preload.mode === 'replace') {
                return current.map(pov =>
                    pov.uuid === preload.oldUuid
                        ? preload.pov
                        : pov
                )
            }

            if (current.some(pov => pov.uuid === preload.pov.uuid)) {
                return current
            }

            return [...current, preload.pov]
        })

        setPreloading(current =>
            current.filter(item => item.id !== preload.id)
        )
    }

    function removePov(uuid) {
        setComposition(current =>
            current.filter(pov => pov.uuid !== uuid)
        )

        setPreloading(current =>
            current.filter(item =>
                item.pov.uuid !== uuid && item.oldUuid !== uuid
            )
        )
    }

    if (compositionErr) {
        return <main>Error: {compositionErr.message}</main>
    }

    return (
        <>
            <main
                style={{
                    '--grid-rows': getGridRows(composition.length),
                    '--grid-columns': getGridColumns(composition.length)
                }}
            >
                {composition.map(pov => (
                    <POV pov={pov} key={pov.uuid} />
                ))}
            </main>

            <div className="pov-preload-layer">
                {preloading.map(item => (
                    <POV
                        key={item.id}
                        pov={item.pov}
                        onReady={() => handlePreloadReady(item)}
                    />
                ))}
            </div>
        </>
    )
}
