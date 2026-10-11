import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RecordInit } from '../domain/factory'
import type { Kind } from '../domain/types'
import { useStore } from '../store/store'

/** Create a record and open it in edit mode. */
export function useCreate() {
  const navigate = useNavigate()
  return useCallback(
    <K extends Kind>(kind: K, init?: RecordInit<K>) => {
      const r = useStore.getState().create(kind, init)
      navigate(`/r/${r.id}?edit=1`)
      return r
    },
    [navigate],
  )
}
