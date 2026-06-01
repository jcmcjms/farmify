import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Upload01Icon } from '@hugeicons/core-free-icons'
import type { FileWithPreview } from './types'

interface FileUploadFieldProps {
  label: string
  description: string
  accept: string
  error?: string
  currentFile: FileWithPreview | null
  onSelect: (files: FileList | null) => void
  onRemove: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

export function FileUploadField({
  label,
  description,
  accept,
  error,
  currentFile,
  onSelect,
  onRemove,
  inputRef,
}: FileUploadFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <p className="text-xs text-muted-foreground mt-0.5 mb-2">{description}</p>
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      {currentFile ? (
        <div className="flex items-center gap-3 rounded-md border border-border p-3">
          <div className="size-14 shrink-0 overflow-hidden rounded-md border border-border">
            <img
              src={currentFile.preview}
              alt={currentFile.file.name}
              className="size-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentFile.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(currentFile.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            {currentFile.error && (
              <p className="text-xs text-destructive mt-0.5">{currentFile.error}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-dashed border-border py-6 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          <HugeiconsIcon icon={Upload01Icon} className="size-6" />
          <span className="text-sm font-medium">Click to upload</span>
          <span className="text-xs">{accept}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onSelect(e.target.files)}
      />
    </div>
  )
}
