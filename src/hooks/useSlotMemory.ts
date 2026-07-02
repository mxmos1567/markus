import { useEffect, useState } from 'react'
import type { Memory, Shelf, ShelfSlot } from '../domain/models'
import { useServices } from '../context/ServiceContext'

export type SlotViewState =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'empty'; shelf: Shelf; slot: ShelfSlot }
  | { kind: 'memory'; memory: Memory; shelf: Shelf; slot: ShelfSlot }

export function useSlotMemory(shelfSlug: string | undefined, code: string | undefined): SlotViewState {
  const { shelves, slots, memories } = useServices()
  const [state, setState] = useState<SlotViewState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ kind: 'loading' })

    async function load() {
      if (!shelfSlug || !code) {
        setState({ kind: 'not-found' })
        return
      }
      const shelf = await shelves.getBySlug(shelfSlug)
      if (!shelf) {
        if (!cancelled) setState({ kind: 'not-found' })
        return
      }
      const slot = await slots.getByCode(shelfSlug, code.toUpperCase())
      if (!slot) {
        if (!cancelled) setState({ kind: 'not-found' })
        return
      }
      if (!slot.memoryId) {
        if (!cancelled) setState({ kind: 'empty', shelf, slot })
        return
      }
      const memory = await memories.get(slot.memoryId)
      if (!memory) {
        if (!cancelled) setState({ kind: 'empty', shelf, slot })
        return
      }
      if (!cancelled) setState({ kind: 'memory', memory, shelf, slot })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [shelfSlug, code, shelves, slots, memories])

  return state
}
