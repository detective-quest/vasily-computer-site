import {
  loadDefaultCase,
} from './case-loader'

import type {
  MailCatalog,
} from '../core/types/mail'

import {
  resolvePublicPath,
} from '../core/utilities/public-path'

let mailCatalogPromise:
  | Promise<MailCatalog>
  | null = null

function validateMailCatalog(
  catalog: MailCatalog,
): void {
  if (
    !catalog.id ||
    !catalog.ownerName ||
    !Array.isArray(catalog.folders) ||
    !Array.isArray(catalog.messages)
  ) {
    throw new Error(
      'Файл mail.json имеет неверную структуру.',
    )
  }

  const folderIds =
    new Set(
      catalog.folders.map(
        (folder) =>
          folder.id,
      ),
    )

  if (
    folderIds.size !==
    catalog.folders.length
  ) {
    throw new Error(
      'В mail.json обнаружены повторяющиеся папки.',
    )
  }

  const messageIds =
    new Set(
      catalog.messages.map(
        (message) =>
          message.id,
      ),
    )

  if (
    messageIds.size !==
    catalog.messages.length
  ) {
    throw new Error(
      'В mail.json обнаружены повторяющиеся письма.',
    )
  }

  const hasUnknownFolder =
    catalog.messages.some(
      (message) =>
        !folderIds.has(
          message.folderId,
        ),
    )

  if (hasUnknownFolder) {
    throw new Error(
      'Одно или несколько писем находятся в неизвестной папке.',
    )
  }
}

async function loadMailCatalogFromFiles():
  Promise<MailCatalog> {
  const manifest =
    await loadDefaultCase()

  const requestPath =
    resolvePublicPath(
      `content/${manifest.id}/mail.json`,
    )

  const response =
    await fetch(
      requestPath,
      {
        cache: 'no-store',
      },
    )

  if (!response.ok) {
    throw new Error(
      `Не удалось загрузить ${requestPath}. Код ответа: ${response.status}.`,
    )
  }

  const catalog =
    (await response.json()) as MailCatalog

  validateMailCatalog(catalog)

  return catalog
}

export function loadMailCatalog():
  Promise<MailCatalog> {
  if (!mailCatalogPromise) {
    mailCatalogPromise =
      loadMailCatalogFromFiles().catch(
        (error: unknown) => {
          mailCatalogPromise = null

          throw error
        },
      )
  }

  return mailCatalogPromise
}