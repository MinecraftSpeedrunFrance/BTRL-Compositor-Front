import { useState } from 'react'
import './Runner.css'
import { useEffect } from 'react'
import { formatDuration } from '../utils'

export default function Runner(props) {
    const { runner, onClick, selected } = props
    const live = runner.live
    const nickname = runner.nickname ?? runner.uuid
    const split = live ? (runner?.split?.eventId ?? 'Online') : 'Offline'

    const [pb, setPb] = useState(runner.pb || 'N/A')
    const [editing, setEditing] = useState(false)

    useEffect(() => {
        let storedPb = localStorage.getItem(`pb_${runner.uuid}`)
        if (storedPb) setPb(storedPb)
    }, [])

    useEffect(() => {
        if (pb === runner.pb || pb === 'N/A') return
        localStorage.setItem(`pb_${runner.uuid}`, pb)
    }, [pb])

    return <div className={`run ${live ? 'live' : 'offline'}${selected ? ' selected' : ''}`} onClick={onClick}>
        <div className="runner">
            <img className="avatar" src={`https://mc-api.io/render/FACE/${runner.uuid}?size=32`} alt={nickname}/>
            <span className="name">{nickname}</span>
            <div className="pb">
                <span>PB </span>
                {editing ?
                    <input type="text" value={pb}
                        onChange={(e) => setPb(e.target.value)}
                        onBlur={() => setEditing(false)} autoFocus
                    /> :
                    <span onClick={(e) => {
                        e.stopPropagation()
                        setEditing(true)
                    }}>
                        {pb}
                    </span>
                }
            </div>
            <div className="twitch">
            </div>
        </div>
        <div className="split">
            <span>{SPLIT_NAMES[split] || split}</span>
            {runner?.split?.igt &&<span>{formatDuration(runner?.split?.igt)}</span>}
        </div>
    </div>
}

const SPLIT_NAMES = {
    "rsg.enter_nether": "Enter Nether",
    "rsg.enter_fortress": "Enter Fortress",
    "rsg.enter_bastion": "Enter Bastion",
    "rsg.first_portal": "First Portal",
    "rsg.second_portal": "Second Portal",
    "rsg.enter_stronghold": "Enter Stronghold",
    "rsg.enter_end": "Enter End",
    "rsg.credits": "Finish"
}