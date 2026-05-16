export interface ThemeManifest {
  id: string
  name: string
  version?: string
  author?: string
  description?: string
  preview?: string
  cssPath: string
  tags?: string[]
  isBuiltIn: boolean
}
