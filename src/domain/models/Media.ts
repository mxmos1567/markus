export type MediaKind = 'image' | 'video' | 'document'

export interface MediaAsset {
  id: string
  memoryId: string
  kind: MediaKind
  fileName: string
  mimeType: string
  size: number
  blobKey: string
  width?: number
  height?: number
  order: number
  createdAt: string
}
