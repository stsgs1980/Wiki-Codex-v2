/**
 * Type augmentation: input attributes for directory upload.
 * webkitdirectory / directory are non-standard but widely supported attributes
 * that tell the browser file dialog to accept a folder and expose all files
 * (recursively) via File.webkitRelativePath.
 */
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string
    directory?: string
  }
}

export {}
