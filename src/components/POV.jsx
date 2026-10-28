import './POV.css'

export default function POV({ pov, onReady, className = '' }) {
    return (
        <div className={`pov ${className}`}>
            <div className="pov-header">
                <img
                    className="avatar"
                    src={`https://mc-api.io/render/FACE/${pov.uuid}?size=32`}
                    alt=""
                />
                <div>
                    {pov.nickname}
                </div>
                <div className="items">
                    {pov.items?.['minecraft:ender_pearl'] && <div>
                        <span>{pov.items['minecraft:ender_pearl']}   </span>
                        <img src="/assets/pearl.webp" alt="Pearls" width="16" height="16" />
                    </div>}
                    {pov.items?.['minecraft:blaze_rod'] && <div>
                        <span>{pov.items['minecraft:blaze_rod']}   </span>
                        <img src="/assets/rod.webp" alt="Rods" width="16" height="16" />
                    </div>}
                </div>
                <div className="pb">
                    <span>PB: {pov.pb || 'N/A'}</span>
                    <span>BTRL: {pov.btrl ? new Date(pov.btrl).toISOString().slice(14, 19): 'N/A'}</span>
                </div>
            </div>

            <iframe
                src={`https://player.twitch.tv/?autoplay=true&channel=${pov.twitch}&parent=${import.meta.env.VITE_DOMAIN}&player=popout&controls=false&muted=true`}
                title={`${pov.nickname} Twitch stream`}
                frameBorder="0"
                scrolling="no"
                onLoad={onReady}
                sandbox="allow-modals allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
            />
        </div>
    )
}