export function getGridColumns(itemCount) {
    if (itemCount <= 0) return 1

    return Math.ceil(Math.sqrt(itemCount))
}

export function getGridRows(itemCount) {
    if (itemCount <= 0) return 1

    return Math.ceil(itemCount / getGridColumns(itemCount))
}
