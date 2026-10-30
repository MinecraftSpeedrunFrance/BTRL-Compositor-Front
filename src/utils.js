export function getGridColumns(itemCount) {
    if (itemCount <= 0) return 1

    return Math.ceil(Math.sqrt(itemCount))
}

export function getGridRows(itemCount) {
    if (itemCount <= 0) return 1

    return Math.ceil(itemCount / getGridColumns(itemCount))
}

export function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
}
