import { scryptSync, timingSafeEqual } from 'node:crypto'

const DEFAULT_ADMIN_USERNAME = 'admin'

function getAdminUsername() {
  return process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME
}

function getConfiguredPasswordHash() {
  const hash = process.env.ADMIN_PASSWORD_HASH

  if (!hash) {
    throw new Error(
      'authentication configuration missing: ADMIN_PASSWORD_HASH'
    )
  }

  return hash
}

function parseHash(hash: string) {
  const [algorithm, salt, derivedKey] = hash.split(':')

  if (algorithm !== 'scrypt' || !salt || !derivedKey) {
    throw new Error(
      'authentication configuration invalid: ADMIN_PASSWORD_HASH'
    )
  }

  return { salt, derivedKey }
}

export function verifyPassword(password: string, hash: string) {
  const { salt, derivedKey } = parseHash(hash)
  const expected = Buffer.from(derivedKey, 'hex')
  const actual = scryptSync(password, salt, expected.length)

  return timingSafeEqual(expected, actual)
}

export function verifyAdminCredentials(username: string, password: string) {
  return (
    username === getAdminUsername() &&
    verifyPassword(password, getConfiguredPasswordHash())
  )
}
