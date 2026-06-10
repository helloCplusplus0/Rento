type NumberLikeObject = {
  toNumber: () => number
}

function isNumberLikeObject(value: unknown): value is NumberLikeObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as NumberLikeObject).toNumber === 'function'
  )
}

export function toNullableFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const normalized = value.trim()
    if (!normalized) {
      return null
    }

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (isNumberLikeObject(value)) {
    const parsed = value.toNumber()
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}
