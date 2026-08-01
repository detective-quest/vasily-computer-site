export type MailFolderKind =
  | 'inbox'
  | 'sent'
  | 'drafts'
  | 'spam'
  | 'trash'

export interface MailFolder {
  id: string
  name: string
  kind: MailFolderKind
  order: number
}

export interface MailAddress {
  name: string
  email: string
}

export interface MailAttachment {
  id: string
  name: string
  fileId?: string
}

export interface MailMessage {
  id: string
  folderId: string
  from: MailAddress
  to: MailAddress[]
  subject: string
  preview: string
  sentAt: string
  unread: boolean
  body: string[]
  attachments?: MailAttachment[]
}

export interface MailCatalog {
  id: string
  ownerName: string
  accountAddress: string
  folders: MailFolder[]
  messages: MailMessage[]
}