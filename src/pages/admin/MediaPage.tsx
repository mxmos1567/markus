import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import type { MediaAsset } from '../../domain/models'

interface Row {
  asset: MediaAsset
  url: string
  memoryTitle: string
  memoryId: string
}

export function MediaPage() {
  const { memories, media } = useServices()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const allMemories = await memories.list()
      const result: Row[] = []
      for (const memory of allMemories) {
        const assets = await media.list(memory.id)
        for (const asset of assets) {
          result.push({ asset, url: await media.getUrl(asset), memoryTitle: memory.title, memoryId: memory.id })
        }
      }
      if (!cancelled) {
        setRows(result)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [memories, media])

  return (
    <div className="space-y-6">
      <SerifHeading className="text-3xl">Media Library</SerifHeading>
      <p className="text-sm text-mutedgray">
        {rows.length} file{rows.length === 1 ? '' : 's'} across all memories. Manage individual files from each
        memory's edit page.
      </p>

      {loading ? (
        <p className="text-mutedgray">Loading…</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {rows.map((row) => (
            <Link
              key={row.asset.id}
              to={`/admin/memories/${row.memoryId}`}
              className="group relative aspect-square overflow-hidden rounded-sm border border-line"
              title={`${row.asset.fileName} — ${row.memoryTitle}`}
            >
              {row.asset.kind === 'image' ? (
                <img src={row.url} alt={row.asset.fileName} loading="lazy" className="h-full w-full object-cover" />
              ) : row.asset.kind === 'video' ? (
                <video src={row.url} className="h-full w-full object-cover" muted />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">📄</div>
              )}
              <span className="absolute inset-x-0 bottom-0 truncate bg-void-deep/80 px-1 py-0.5 text-[9px] text-mutedgray opacity-0 group-hover:opacity-100">
                {row.memoryTitle}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
