export * from './common'
export * from './Memory'
export * from './Media'

export function memoryRoute(slug: string): string {
  return `/memory/${slug}`
}
