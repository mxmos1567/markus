import { useRef, useState, type DragEvent } from 'react'

export function Dropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) onFiles(files)
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-sm border border-dashed p-8 text-center transition-colors ${
        dragging ? 'border-gold bg-gold/5' : 'border-line hover:border-gold/50'
      }`}
    >
      <p className="text-sm text-mutedgray">Drag & drop images, videos or documents here, or click to browse.</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,application/pdf,.doc,.docx"
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (files.length > 0) onFiles(files)
          event.target.value = ''
        }}
      />
    </div>
  )
}
