export interface DocumentMetadataItem {
  label: string
  value: string
}

export interface DocumentSection {
  heading?: string
  paragraphs?: string[]
  bullets?: string[]
}

export interface VirtualDocument {
  fileId: string
  view: 'document'
  title: string
  subtitle?: string
  metadata?: DocumentMetadataItem[]
  sections: DocumentSection[]
}

export interface VirtualSpreadsheet {
  fileId: string
  view: 'spreadsheet'
  title: string
  subtitle?: string
  columns: string[]
  rows: string[][]
  note?: string
}

export interface VirtualTextDocument {
  fileId: string
  view: 'text'
  title: string
  subtitle?: string
  lines: string[]
}

export type VirtualDocumentItem =
  | VirtualDocument
  | VirtualSpreadsheet
  | VirtualTextDocument

export interface DocumentCatalog {
  id: string
  items: VirtualDocumentItem[]
}