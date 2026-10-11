const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

/** Short, stable, URL-safe identifiers. Collisions are vanishingly unlikely at personal-wiki scale. */
export function newId(prefix = 'r'): string {
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  let s = ''
  for (const b of bytes) s += ALPHABET[b % 36]
  return `${prefix}_${s}`
}

export const nowIso = () => new Date().toISOString()
