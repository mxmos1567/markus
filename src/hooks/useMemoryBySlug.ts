import { useEffect, useState } from 'react'
import type { Memory } from '../domain/models'
import { useServices } from '../context/ServiceContext'

export type MemoryViewState = { kind: 'loading' } | { kind: 'not-found' } | { kind: 'found'; memory: Memory }

export function useMemoryBySlug(slug: string | undefined): MemoryViewState {
  const { memories } = useServices()
  const [state, setState] = useState<MemoryViewState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ kind: 'loading' })

    if (!slug) {
      setState({ kind: 'not-found' })
      return
    }

    memories.getBySlug(slug).then((memory) => {
      if (cancelled) return
      setState(memory ? { kind: 'found', memory } : { kind: 'not-found' })
    })

    return () => {
      cancelled = true
    }
  }, [slug, memories])

  return state
}
