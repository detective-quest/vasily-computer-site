import {
  loadDefaultCase,
} from './case-loader'

import type {
  DocumentCatalog,
  VirtualDocumentItem,
} from '../core/types/document'

import {
  resolvePublicPath,
} from '../core/utilities/public-path'

let documentCatalogPromise:
  | Promise<DocumentCatalog>
  | null = null

function isValidItem(
  item: VirtualDocumentItem,
): boolean {
  if (
    !item.fileId ||
    !item.title
  ) {
    return false
  }

  if (
    item.view === 'document'
  ) {
    return Array.isArray(
      item.sections,
    )
  }

  if (
    item.view === 'spreadsheet'
  ) {
    return (
      Array.isArray(item.columns) &&
      Array.isArray(item.rows)
    )
  }

  if (
    item.view === 'text'
  ) {
    return Array.isArray(
      item.lines,
    )
  }

  return false
}

function validateCatalog(
  catalog: DocumentCatalog,
): void {
  if (
    !catalog.id ||
    !Array.isArray(catalog.items)
  ) {
    throw new Error(
      'Файл documents.json имеет неверную структуру.',
    )
  }

  if (
    !catalog.items.every(isValidItem)
  ) {
    throw new Error(
      'Один или несколько документов имеют неверную структуру.',
    )
  }

  const uniqueIds =
    new Set(
      catalog.items.map(
        (item) =>
          item.fileId,
      ),
    )

  if (
    uniqueIds.size !==
    catalog.items.length
  ) {
    throw new Error(
      'В documents.json обнаружены повторяющиеся fileId.',
    )
  }
}

async function loadCatalogFromFiles():
  Promise<DocumentCatalog> {
  const manifest =
    await loadDefaultCase()

  const requestPath =
    resolvePublicPath(
      `content/${manifest.id}/documents.json`,
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
    (await response.json()) as DocumentCatalog

  validateCatalog(catalog)

  return catalog
}

export function loadDocumentCatalog():
  Promise<DocumentCatalog> {
  if (!documentCatalogPromise) {
    documentCatalogPromise =
      loadCatalogFromFiles().catch(
        (error: unknown) => {
          documentCatalogPromise =
            null

          throw error
        },
      )
  }

  return documentCatalogPromise
}