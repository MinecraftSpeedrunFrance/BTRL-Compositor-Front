import { useCallback, useEffect, useRef, useState } from "react"
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
    const transitionGeneration = useRef(0)
    const completedPreloads = useRef(new Set())
    const mounted = useRef(true)

    function preloadReplacement(change, generation) {
        const preloadId = `${change.new.uuid}-${Date.now()}`

        setPreloading(current => [
            ...current,
            {
                id: preloadId,
                pov: change.new,
                mode: 'replace',
                oldUuid: change.old.uuid,
                ready: false,
                generation
            }
        ])
    }

    function preloadAddition(pov, generation) {
        const preloadId = `${pov.uuid}-${Date.now()}`

        setPreloading(current => [
            ...current,
            {
                id: preloadId,
                pov,
                mode: 'add',
                ready: false,
                generation
            }
        ])
    }

    function handlePreloadReady(preload) {
        if (
            preload.ready ||
            completedPreloads.current.has(preload.id) ||
            preload.generation !== transitionGeneration.current
        ) {
            return
        }

        completedPreloads.current.add(preload.id)
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

        if (
            !mounted.current ||
            preload.generation !== transitionGeneration.current
        ) {
            return
        }

        setComposition(current => {
            if (preload.mode === 'replace') {
                // Do not let an outdated replacement reintroduce a POV that a
                // newer update has already removed.
                if (!current.some(pov => pov.uuid === preload.oldUuid)) {
                    return current
                }

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
        completedPreloads.current.delete(preload.id)
    }

    function removePov(uuid, generation) {
        setComposition(current =>
            current.filter(pov => pov.uuid !== uuid)
        )

        setPreloading(current =>
            current.filter(item =>
                item.generation === generation &&
                item.pov.uuid !== uuid &&
                item.oldUuid !== uuid
            )
        )
    }

    const handleChanges = useCallback((changes) => {
        const generation = ++transitionGeneration.current
        completedPreloads.current.clear()

        // A newer server update supersedes transitions that have not committed.
        setPreloading(current =>
            current.filter(item => item.generation === generation)
        )

        for (const change of changes) {
            if (change.type === 'replace') {
                preloadReplacement(change, generation)
            } else if (change.type === 'add') {
                preloadAddition(change.pov, generation)
            } else if (change.type === 'remove') {
                removePov(change.pov.uuid, generation)
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
            .then(setComposition)
            .catch(setCompositionErr)

        const socket = io(`${import.meta.env.VITE_API_URL}`)

        socket.on('compositionChanged', handleChanges)

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
}
