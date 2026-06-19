import { FileText, File } from 'lucide-react'

/** Get file icon by file type — shared between document-card and document-list-item */
export function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'md':
    case 'html':
      return <FileText className="size-5 text-muted-foreground" />
    default:
      return <File className="size-5 text-muted-foreground" />
  }
}
