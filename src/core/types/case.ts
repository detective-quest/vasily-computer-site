export type FileKind =
  | 'pdf'
  | 'spreadsheet'
  | 'audio'
  | 'image'
  | 'video'
  | 'text'
  | 'archive'
  | 'unknown'

export type FileStatus =
  | 'normal'
  | 'hidden'
  | 'corrupted'

export type StorageProvider =
  | 'pages'
  | 'r2'
  | 'virtual'

export interface CaseCatalogEntry {
  id: string
  manifestPath: string
  enabled: boolean
}

export interface CaseCatalog {
  defaultCaseId: string
  cases: CaseCatalogEntry[]
}

export interface CaseFolder {
  id: string
  name: string
  parentId?: string
}

export interface CaseFileSource {
  provider: StorageProvider
  previewPath?: string
  downloadPath?: string
  transcriptPath?: string
}

export interface CaseFile {
  id: string
  folderId: string
  name: string
  kind: FileKind
  mimeType: string
  sizeLabel: string
  createdAt: string
  modifiedAt: string
  status: FileStatus
  description?: string
  source: CaseFileSource
}

export interface CaseManifest {
  id: string
  driveLabel: string
  driveLetter: string
  systemName: string
  snapshotDate: string
  snapshotTime: string
  capacityLabel: string
  freeSpaceLabel: string
  folders: CaseFolder[]
  files: CaseFile[]
}