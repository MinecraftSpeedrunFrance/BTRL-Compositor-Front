import { useEffect, useState } from "react"
import useSWR from 'swr'
import Runner from "./components/Runner"
import './Compositor.css'
import { getGridColumns } from "./utils"

const fetcher = (...args) => fetch(...args).then(res => res.json())
function Compositor() {
    const [event, setEvent] = useState('none')
    const [maxPovCount, setMaxPovCount] = useState(6)
    const [eventsData, setEventsData] = useState([])
    const [eventsError, setEventsError] = useState(null)
    const [composition, setComposition] = useState([])
    const { data: runnersData, error: runnersError } = useSWR(`${import.meta.env.VITE_API_URL}/runners?event=${event}`, fetcher, { refreshInterval: 5000})

    useEffect(_ => {
        let isActive = true

        fetch(`${import.meta.env.VITE_API_URL}/events`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load data.json (${response.status})`)
                }
                return response.json()
            })
            .then(json => {
                if (isActive) {
                    setEventsData(json)
                    let cachedEvent = localStorage.getItem('event')
                    if (json.some(event => event._id === cachedEvent)) {
                        setEvent(cachedEvent)
                    }
                }
            })
            .catch(error => {
                if (isActive) setEventsError(error.message)
            })
    }, [])

    useEffect(() => {
        if (event !== 'none') localStorage.setItem('event', event)
    }, [event])

    return <>
        <header>
            <h1>BTRL Compositor</h1>
            <div className="controls">
                <select name="event" value={event} onChange={e => setEvent(e.target.value)}>
                    <option value="none">Choose an event</option>
                    {eventsData.map((event) => (
                        <option key={event._id} value={event._id}>{event.name}</option>
                    ))}
                </select>
                <span>
                    <label htmlFor="runCount">Max POV Count: </label>
                    <input type="number" name="runCount" value={maxPovCount} onChange={e => setMaxPovCount(+e.target.value)} min="1" max="100" />
                </span>
            </div>
            <div><a href={`/composition`} target="_blank" rel="noopener noreferrer">
                View Composition
            </a></div>
            {eventsError && <span className="error">Error loading events: {eventsError}</span>}
        </header>
        <main>
            <div className="section">
                <div className="section-header">
                    <h1>Next Composition</h1>
                    <span>{composition.length}/{maxPovCount}</span>
                </div>
                {runnersError && <span className="error">Error loading splits: {runnersError}</span>}
                {runnersData && <div
                    className="runs-list"
                    style={{
                        '--grid-columns': getGridColumns(runnersData.length)
                    }}
                >
                    {runnersData.sort(sortPovs).map((runner) => (
                        <Runner key={runner.uuid} runner={runner} onClick={() => {
                            if (composition.some(r => r.uuid === runner.uuid)) {
                                setComposition(composition.filter(r => r.uuid !== runner.uuid))
                            } else if (/*runner.live &&*/maxPovCount > composition.length) {
                                setComposition([...composition, {uuid: runner.uuid, twitch: runner.twitch, nickname: runner.nickname, items: runner.items}])
                            }
                        }} selected={composition.some(r => r.uuid === runner.uuid)} />
                    ))}
                </div>}
                <div className="controls">
                    <button onClick={postComposition}>Push Composition</button>
                </div>
            </div>
            {/* <div className="section">
                <h1>Current Composition</h1>
                {runnersData && <div
                    className="runs-list"
                    style={{
                        '--grid-columns': getGridColumns(runnersData.length)
                    }}
                >
                    {runnersData.map((runner) => (
                        <Runner key={runner.uuid} runner={runner} onClick={() => {}} selected={true} />
                    ))}
                </div>}
            </div> */}
        </main>
    </>

    function postComposition() {
        fetch(`${import.meta.env.VITE_API_URL}/composition`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(composition) })
    }
}

function sortPovs(a, b) {
    if (a.live && !b.live) return -1
    if (!a.live && b.live) return 1
    if (a.live && b.live) {
        if (a.split?.eventId && !b.split?.eventId) return -1
        if (!a.split?.eventId && b.split?.eventId) return 1
        if (a.split?.eventId && b.split?.eventId) {
            if (a.nickname.toLowerCase() < b.nickname.toLowerCase()) return -1
            if (a.nickname.toLowerCase() > b.nickname.toLowerCase()) return 1
        }
    }
    if (a.nickname.toLowerCase() < b.nickname.toLowerCase()) return -1
    if (a.nickname.toLowerCase() > b.nickname.toLowerCase()) return 1
    return 0
}

export default Compositor
