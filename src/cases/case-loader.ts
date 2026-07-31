import type {
  CaseCatalog,
  CaseManifest,
} from '../core/types/case'

import {
  resolvePublicPath,
} from '../core/utilities/public-path'

let defaultCasePromise:
  Promise<CaseManifest> | null = null

async function fetchJson<T>(
  path: string,
): Promise<T> {
  const requestPath =
    resolvePublicPath(path)

  const response = await fetch(
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

  return (await response.json()) as T
}

function validateCatalog(
  catalog: CaseCatalog,
): void {
  if (
    !catalog.defaultCaseId ||
    !Array.isArray(catalog.cases)
  ) {
    throw new Error(
      'Файл cases.json имеет неверную структуру.',
    )
  }
}

function validateManifest(
  manifest: CaseManifest,
): void {
  if (
    !manifest.id ||
    !manifest.driveLabel ||
    !Array.isArray(manifest.folders) ||
    !Array.isArray(manifest.files)
  ) {
    throw new Error(
      'Файл manifest.json имеет неверную структуру.',
    )
  }
}

function resolveManifestPaths(
  manifest: CaseManifest,
): CaseManifest {
  return {
    ...manifest,

    files: manifest.files.map(
      (file) => ({
        ...file,

        source: {
          ...file.source,

          previewPath:
            file.source.previewPath
              ? resolvePublicPath(
                  file.source.previewPath,
                )
              : undefined,

          downloadPath:
            file.source.downloadPath
              ? resolvePublicPath(
                  file.source.downloadPath,
                )
              : undefined,

          transcriptPath:
            file.source.transcriptPath
              ? resolvePublicPath(
                  file.source.transcriptPath,
                )
              : undefined,
        },
      }),
    ),
  }
}

async function loadDefaultCaseFromFiles():
  Promise<CaseManifest> {
  const catalog =
    await fetchJson<CaseCatalog>(
      'content/cases.json',
    )

  validateCatalog(catalog)

  const defaultCase =
    catalog.cases.find(
      (caseEntry) =>
        caseEntry.id ===
          catalog.defaultCaseId &&
        caseEntry.enabled,
    )

  if (!defaultCase) {
    throw new Error(
      'Расследование по умолчанию не найдено или отключено.',
    )
  }

  const manifest =
    await fetchJson<CaseManifest>(
      defaultCase.manifestPath,
    )

  validateManifest(manifest)

  return resolveManifestPaths(manifest)
}

export function loadDefaultCase():
  Promise<CaseManifest> {
  if (!defaultCasePromise) {
    defaultCasePromise =
      loadDefaultCaseFromFiles().catch(
        (error: unknown) => {
          defaultCasePromise = null

          throw error
        },
      )
  }

  return defaultCasePromise
}