import { useEffect } from 'react'
import { bus } from '../lib/bus.js'

// The one thing that happens to those who meet every world: the coda changes.
export default function Secrets() {
  useEffect(
    () =>
      bus.on((type) => {
        if (type === 'all') bus.whisper('all', 'All twenty-four. The coda has changed.', '#0c0c0c')
      }),
    [],
  )
  return null
}
