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
                    <span>{pov.nickname}</span>
                </div>
                <div className="pb">
                    <span>7:56 PB</span>
                </div>
            </div>

            <iframe
                src={`https://player.twitch.tv/?autoplay=true&channel=${pov.twitch}&parent=localhost&player=popout&controls=false&muted=true`}
                title={`${pov.nickname} Twitch stream`}
                frameBorder="0"
                scrolling="no"
                onLoad={onReady}
                sandbox="allow-modals allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
            />
        </div>
    )
}